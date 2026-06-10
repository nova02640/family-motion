//
//  PoseData.swift
//  FamilyMotion
//
//  Created by FamilyMotion on 2026/06/10.
//

import Foundation
import CoreGraphics
import Vision

// MARK: - PoseData 骨骼数据
struct PoseData: Identifiable, Codable, Hashable {
    var id: UUID = UUID()
    var landmarks: [PoseLandmark] = []
    var timestamp: Date = Date()
    var confidence: Float = 0.0

    func landmark(for type: LandmarkType) -> PoseLandmark? {
        return landmarks.first { $0.type == type }
    }
}

// MARK: - PoseLandmark 单个骨骼点
struct PoseLandmark: Codable, Hashable {
    var type: LandmarkType
    var x: Float
    var y: Float
    var z: Float = 0.0
    var confidence: Float = 0.0

    var point: CGPoint {
        return CGPoint(x: CGFloat(x), y: CGFloat(y))
    }
}

// MARK: - LandmarkType 骨骼点类型
enum LandmarkType: String, Codable, CaseIterable, Hashable {
    case nose = "鼻子"
    case leftEyeInner = "左眼内侧"
    case leftEye = "左眼"
    case leftEyeOuter = "左眼外侧"
    case rightEyeInner = "右眼内侧"
    case rightEye = "右眼"
    case rightEyeOuter = "右眼外侧"
    case leftEar = "左耳"
    case rightEar = "右耳"
    case leftMouth = "左嘴角"
    case rightMouth = "右嘴角"
    case leftShoulder = "左肩"
    case rightShoulder = "右肩"
    case leftElbow = "左肘"
    case rightElbow = "右肘"
    case leftWrist = "左腕"
    case rightWrist = "右腕"
    case leftPinky = "左小指"
    case rightPinky = "右小指"
    case leftIndex = "左食指"
    case rightIndex = "右食指"
    case leftThumb = "左拇指"
    case rightThumb = "右拇指"
    case leftHip = "左髋"
    case rightHip = "右髋"
    case leftKnee = "左膝"
    case rightKnee = "右膝"
    case leftAnkle = "左踝"
    case rightAnkle = "右踝"
    case leftHeel = "左脚跟"
    case rightHeel = "右脚跟"
    case leftFootIndex = "左脚尖"
    case rightFootIndex = "右脚尖"
}

// MARK: - PoseData 的工厂方法
extension PoseData {

    /// 从 Apple Vision 的 VNHumanBodyPoseObservation 转换为 PoseData
    static func fromHumanBodyPose(
        _ observation: VNHumanBodyPoseObservation,
        imageSize: CGSize
    ) -> PoseData? {

        var landmarks: [PoseLandmark] = []
        var totalConfidence: Float = 0.0
        var detectedCount = 0

        // 定义关节点映射（VNPointKey 到 LandmarkType）
        let jointMapping: [VNHumanBodyPoseObservation.JointName: LandmarkType] = [
            .nose: .nose,
            .leftEye: .leftEye,
            .rightEye: .rightEye,
            .leftEar: .leftEar,
            .rightEar: .rightEar,
            .leftShoulder: .leftShoulder,
            .rightShoulder: .rightShoulder,
            .leftElbow: .leftElbow,
            .rightElbow: .rightElbow,
            .leftWrist: .leftWrist,
            .rightWrist: .rightWrist,
            .leftHip: .leftHip,
            .rightHip: .rightHip,
            .leftKnee: .leftKnee,
            .rightKnee: .rightKnee,
            .leftAnkle: .leftAnkle,
            .rightAnkle: .rightAnkle
        ]

        for (jointName, landmarkType) in jointMapping {
            do {
                let point = try observation.recognizedPoint(jointName)
                if point.confidence > 0.3 {
                    // Vision 的坐标是归一化的 (0-1)，并且 y 轴从上到下
                    // 这里需要翻转 y 以匹配常规屏幕坐标
                    let x = point.location.x
                    let y = 1.0 - point.location.y

                    let landmark = PoseLandmark(
                        type: landmarkType,
                        x: Float(x),
                        y: Float(y),
                        z: 0.0,
                        confidence: Float(point.confidence)
                    )
                    landmarks.append(landmark)
                    totalConfidence += Float(point.confidence)
                    detectedCount += 1
                }
            } catch {
                continue
            }
        }

        guard detectedCount > 0 else { return nil }

        let averageConfidence = totalConfidence / Float(detectedCount)

        return PoseData(
            landmarks: landmarks,
            timestamp: Date(),
            confidence: averageConfidence
        )
    }
}
