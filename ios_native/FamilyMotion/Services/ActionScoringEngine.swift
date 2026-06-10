//
//  ActionScoringEngine.swift
//  FamilyMotion
//
//  Created by FamilyMotion on 2026/06/10.
//

import Foundation
import CoreGraphics

// MARK: - 动作评分引擎
@MainActor
final class ActionScoringEngine: ObservableObject {

    // 评分权重
    private let accuracyWeight: Float = 0.4
    private let completionWeight: Float = 0.3
    private let smoothnessWeight: Float = 0.3

    // 历史数据
    private var previousPose: PoseData? = nil
    private var poseHistory: [PoseData] = []

    // 平滑度历史帧窗口
    private let historyWindowSize = 10

    // MARK: - 重置状态
    func reset() {
        previousPose = nil
        poseHistory.removeAll()
    }

    // MARK: - 评分主入口
    func scoreAction(currentPose: PoseData, targetExercise: Exercise) -> ScoreResult {

        // 1. 准确度评分
        let accuracyScore = calculateAccuracy(pose: currentPose, exercise: targetExercise)

        // 2. 完成度评分
        let completionScore = calculateCompletion(pose: currentPose, exercise: targetExercise)

        // 3. 流畅度评分
        let smoothnessScore = calculateSmoothness()

        // 4. 总分（加权平均）
        let totalScore = Int(
            Float(accuracyScore) * accuracyWeight +
            Float(completionScore) * completionWeight +
            Float(smoothnessScore) * smoothnessWeight
        )

        let clampedTotal = max(0, min(100, totalScore))

        // 5. 生成反馈
        let feedback = generateFeedback(
            accuracy: accuracyScore,
            completion: completionScore,
            smoothness: smoothnessScore,
            exercise: targetExercise
        )

        // 6. 更新历史
        updateHistory(with: currentPose)

        return ScoreResult(
            totalScore: clampedTotal,
            accuracyScore: accuracyScore,
            completionScore: completionScore,
            smoothnessScore: smoothnessScore,
            feedback: feedback,
            isPerfect: clampedTotal >= 95,
            repCount: 0
        )
    }

    // MARK: - 准确度计算
    /// 基于关节角度约束计算准确度（0-100 分）
    private func calculateAccuracy(pose: PoseData, exercise: Exercise) -> Int {

        guard !exercise.targetJointAngles.isEmpty else {
            return 100  // 无约束，默认为满分
        }

        var totalAccuracy: Float = 0.0
        var checkedConstraints = 0

        for constraint in exercise.targetJointAngles {
            if let currentAngle = calculateJointAngle(pose: pose, joint: constraint.joint) {
                let accuracy = calculateAngleAccuracy(
                    current: currentAngle,
                    min: constraint.minAngle,
                    max: constraint.maxAngle
                )
                totalAccuracy += accuracy
                checkedConstraints += 1
            }
        }

        guard checkedConstraints > 0 else { return 100 }

        return Int(totalAccuracy / Float(checkedConstraints))
    }

    // MARK: - 完成度计算
    /// 基于动作幅度和标准动作的接近程度计算完成度（0-100 分）
    private func calculateCompletion(pose: PoseData, exercise: Exercise) -> Int {

        switch exercise.type {
        case .stretch:
            return Int(calculateStretchAmount(pose: pose))

        case .strength:
            return Int(calculateStrengthAmount(pose: pose))

        case .cardio:
            return Int(calculateCardioAmount(pose: pose))

        default:
            // 其他动作：基于平均置信度
            if pose.landmarks.isEmpty { return 0 }
            let avgConfidence = pose.landmarks.map { $0.confidence }.reduce(0, +) / Float(pose.landmarks.count)
            return Int(avgConfidence * 100)
        }
    }

    // MARK: - 流畅度计算
    /// 基于动作历史数据的平滑程度计算流畅度（0-100 分）
    private func calculateSmoothness() -> Int {

        guard poseHistory.count >= 2 else { return 85 }

        var totalJitter: Float = 0.0
        let historyCount = min(poseHistory.count - 1, historyWindowSize - 1)

        for i in 0..<historyCount {
            let previous = poseHistory[poseHistory.count - 2 - i]
            let current = poseHistory[poseHistory.count - 1 - i]

            var frameJitter: Float = 0.0
            for landmark in current.landmarks {
                if let prevLandmark = previous.landmarks.first(where: { $0.type == landmark.type }) {
                    let dx = landmark.x - prevLandmark.x
                    let dy = landmark.y - prevLandmark.y
                    frameJitter += sqrt(dx * dx + dy * dy)
                }
            }
            totalJitter += frameJitter
        }

        // 抖动越小，流畅度越高
        let avgJitter = totalJitter / Float(max(historyCount, 1))
        let smoothness = max(0.0, 100.0 - avgJitter * 10.0)

        return Int(smoothness)
    }

    // MARK: - 关节角度计算

    /// 根据骨骼点计算指定关节的角度（度）
    private func calculateJointAngle(pose: PoseData, joint: JointType) -> Float? {

        let landmarks = Dictionary(uniqueKeysWithValues: pose.landmarks.map { ($0.type, $0) })

        // 定义每个关节的三点组合 (A-关节点-B)
        var pointA: PoseLandmark? = nil
        var pointB: PoseLandmark? = nil
        var pointC: PoseLandmark? = nil

        switch joint {
        case .leftKnee:
            pointA = landmarks[.leftHip]
            pointB = landmarks[.leftKnee]
            pointC = landmarks[.leftAnkle]

        case .rightKnee:
            pointA = landmarks[.rightHip]
            pointB = landmarks[.rightKnee]
            pointC = landmarks[.rightAnkle]

        case .leftShoulder:
            pointA = landmarks[.leftElbow]
            pointB = landmarks[.leftShoulder]
            pointC = landmarks[.rightShoulder]

        case .rightShoulder:
            pointA = landmarks[.rightElbow]
            pointB = landmarks[.rightShoulder]
            pointC = landmarks[.leftShoulder]

        case .leftElbow:
            pointA = landmarks[.leftShoulder]
            pointB = landmarks[.leftElbow]
            pointC = landmarks[.leftWrist]

        case .rightElbow:
            pointA = landmarks[.rightShoulder]
            pointB = landmarks[.rightElbow]
            pointC = landmarks[.rightWrist]

        case .waist:
            pointA = landmarks[.leftShoulder]
            pointB = landmarks[.leftHip]
            pointC = landmarks[.leftKnee]

        default:
            return nil
        }

        guard let a = pointA, let b = pointB, let c = pointC else {
            return nil
        }

        return calculateThreePointAngle(a: a, b: b, c: c)
    }

    /// 使用三点法计算关节角度（度）
    private func calculateThreePointAngle(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark) -> Float {

        // 向量 BA
        let baX = a.x - b.x
        let baY = a.y - b.y

        // 向量 BC
        let bcX = c.x - b.x
        let bcY = c.y - b.y

        // 点积
        let dotProduct = baX * bcX + baY * bcY

        // 向量模
        let magnitudeBA = sqrt(baX * baX + baY * baY)
        let magnitudeBC = sqrt(bcX * bcX + bcY * bcY)

        guard magnitudeBA > 0 && magnitudeBC > 0 else { return 180.0 }

        // 夹角余弦
        var cosAngle = dotProduct / (magnitudeBA * magnitudeBC)
        cosAngle = max(-1.0, min(1.0, cosAngle))

        // 转为角度
        return (acos(cosAngle) * 180.0) / Float.pi
    }

    /// 计算角度符合度
    private func calculateAngleAccuracy(current: Float, min: Float, max: Float) -> Float {

        // 在范围内 => 满分
        if current >= min && current <= max {
            return 100.0
        }

        // 计算偏差分数
        let target = (min + max) / 2.0
        let tolerance = (max - min) / 2.0

        let deviation = abs(current - target) - tolerance
        let normalizedError = deviation / tolerance
        let score = 100.0 - (normalizedError * 100.0)

        return max(0, score)
    }

    // MARK: - 动作幅度计算

    /// 计算拉伸动作幅度
    private func calculateStretchAmount(pose: PoseData) -> Float {
        let landmarks = Dictionary(uniqueKeysWithValues: pose.landmarks.map { ($0.type, $0) })

        guard
            let leftWrist = landmarks[.leftWrist],
            let leftShoulder = landmarks[.leftShoulder],
            let rightWrist = landmarks[.rightWrist],
            let rightShoulder = landmarks[.rightShoulder]
        else {
            return 50.0
        }

        // 计算手腕到肩膀的平均距离
        let leftDistance = sqrt(
            pow(leftWrist.x - leftShoulder.x, 2) +
            pow(leftWrist.y - leftShoulder.y, 2)
        )
        let rightDistance = sqrt(
            pow(rightWrist.x - rightShoulder.x, 2) +
            pow(rightWrist.y - rightShoulder.y, 2)
        )

        let avgDistance = (leftDistance + rightDistance) / 2.0
        return min(100.0, avgDistance * 200.0)
    }

    /// 计算力量动作幅度
    private func calculateStrengthAmount(pose: PoseData) -> Float {
        let landmarks = Dictionary(uniqueKeysWithValues: pose.landmarks.map { ($0.type, $0) })

        guard
            let shoulder = landmarks[.leftShoulder] ?? landmarks[.rightShoulder],
            let hip = landmarks[.leftHip] ?? landmarks[.rightHip]
        else {
            return 50.0
        }

        // 计算肩部/髋部高度差，判断身体倾斜角度
        let bodyAngle = atan2(
            hip.y - shoulder.y,
            hip.x - shoulder.x
        ) * 180.0 / Float.pi

        // 理想角度约为 90 度
        let idealAngle: Float = 90.0
        let angleDiff = abs(bodyAngle - idealAngle)

        return angleDiff <= 10 ? 100 :
               angleDiff <= 20 ? 80 :
               angleDiff <= 30 ? 60 : 40
    }

    /// 计算有氧动作幅度
    private func calculateCardioAmount(pose: PoseData) -> Float {
        let landmarks = Dictionary(uniqueKeysWithValues: pose.landmarks.map { ($0.type, $0) })

        guard
            let leftKnee = landmarks[.leftKnee],
            let rightKnee = landmarks[.rightKnee],
            let leftHip = landmarks[.leftHip],
            let rightHip = landmarks[.rightHip]
        else {
            return 50.0
        }

        // 计算膝盖高度（相对于髋部）
        let leftKneeHeight = leftHip.y - leftKnee.y
        let rightKneeHeight = rightHip.y - rightKnee.y
        let avgHeightDiff = (abs(leftKneeHeight) + abs(rightKneeHeight)) / 2.0

        return min(100.0, avgHeightDiff * 100.0)
    }

    // MARK: - 反馈生成

    private func generateFeedback(
        accuracy: Int,
        completion: Int,
        smoothness: Int,
        exercise: Exercise
    ) -> [String] {

        var feedback: [String] = []

        // 准确度反馈
        switch accuracy {
        case 90...100:
            feedback.append("动作非常标准！")

        case 80..<90:
            feedback.append("动作很棒，继续保持！")

        case 70..<80:
            feedback.append("基本正确，可以更标准一些")
            if let firstConstraint = exercise.targetJointAngles.first {
                feedback.append(firstConstraint.description)
            }

        case 50..<70:
            feedback.append("需要调整动作")
            for constraint in exercise.targetJointAngles.prefix(2) {
                feedback.append(constraint.description)
            }

        default:
            feedback.append("请按照动作示范进行")
        }

        // 完成度反馈
        if completion < 70 {
            feedback.append("动作幅度可以再大一些")
        }

        // 流畅度反馈
        if smoothness < 70 {
            feedback.append("动作可以更流畅一些")
        }

        return feedback
    }

    // MARK: - 历史更新

    private func updateHistory(with pose: PoseData) {
        poseHistory.append(pose)
        if poseHistory.count > historyWindowSize {
            poseHistory.removeFirst()
        }
        previousPose = pose
    }

    // MARK: - 动作次数检测（可选扩展）

    /// 检测动作是否完成一次（用于计数）
    func detectRepCompletion(
        currentPose: PoseData,
        previousPose: PoseData?,
        exercise: Exercise
    ) -> Bool {

        guard let previous = previousPose else { return false }

        // 获取关键关节角度
        let currentAngle = calculateJointAngle(pose: currentPose, joint: .leftKnee) ?? 0
        let previousAngle = calculateJointAngle(pose: previous, joint: .leftKnee) ?? 0

        switch exercise.id {
        case "strength_1":  // 深蹲
            // 从站立到下蹲再到站立
            let wasStanding = previousAngle < 150
            let isStanding = currentAngle > 160
            return wasStanding && isStanding

        case "strength_3":  // 俯卧撑
            let wasExtended = previousAngle > 150
            let isBent = currentAngle < 100
            return wasExtended && isBent

        default:
            // 通用检测：基于角度变化
            return abs(currentAngle - previousAngle) > 30
        }
    }
}
