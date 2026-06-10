package com.familymotion.app.domain.service

import com.familymotion.app.data.model.*
import kotlin.math.*

/**
 * 动作评分引擎
 * 基于骨骼关键点角度计算，实现实时动作评分
 */
class ActionScoringEngine {

    companion object {
        // 评分权重
        private const val ACCURACY_WEIGHT = 0.4f      // 准确度权重 40%
        private const val COMPLETION_WEIGHT = 0.3f    // 完成度权重 30%
        private const val SMOOTHNESS_WEIGHT = 0.3f    // 流畅度权重 30%
    }

    private var previousPoseData: PoseData? = null
    private val poseHistory = mutableListOf<PoseData>()

    /**
     * 重置评分引擎状态
     */
    fun reset() {
        previousPoseData = null
        poseHistory.clear()
    }

    /**
     * 评分动作
     */
    fun scoreAction(
        currentPose: PoseData,
        targetExercise: Exercise
    ): ScoreResult {
        // 计算准确度分数
        val accuracyScore = calculateAccuracy(currentPose, targetExercise)

        // 计算完成度分数
        val completionScore = calculateCompletion(currentPose, targetExercise)

        // 计算流畅度分数
        val smoothnessScore = calculateSmoothness()

        // 计算总分
        val totalScore = (
            accuracyScore * ACCURACY_WEIGHT +
            completionScore * COMPLETION_WEIGHT +
            smoothnessScore * SMOOTHNESS_WEIGHT
        ).toInt().coerceIn(0, 100)

        // 生成反馈
        val feedback = generateFeedback(accuracyScore, completionScore, smoothnessScore, targetExercise)

        // 更新历史数据
        updateHistory(currentPose)

        return ScoreResult(
            totalScore = totalScore,
            accuracyScore = accuracyScore,
            completionScore = completionScore,
            smoothnessScore = smoothnessScore,
            feedback = feedback,
            isPerfect = totalScore >= 95,
            repCount = 0
        )
    }

    /**
     * 计算准确度分数
     * 基于关节角度约束满足程度
     */
    private fun calculateAccuracy(poseData: PoseData, exercise: Exercise): Int {
        if (exercise.targetJointAngles.isEmpty()) {
            return 100  // 无约束的动作，默认满分
        }

        var totalAccuracy = 0f
        var constraintsChecked = 0

        exercise.targetJointAngles.forEach { constraint ->
            val currentAngle = calculateJointAngle(poseData, constraint.joint)
            if (currentAngle != null) {
                val accuracy = calculateAngleAccuracy(currentAngle, constraint.minAngle, constraint.maxAngle)
                totalAccuracy += accuracy
                constraintsChecked++
            }
        }

        return if (constraintsChecked > 0) {
            (totalAccuracy / constraintsChecked).toInt().coerceIn(0, 100)
        } else {
            100
        }
    }

    /**
     * 计算关节角度
     */
    private fun calculateJointAngle(poseData: PoseData, jointType: JointType): Float? {
        val landmarks = poseData.landmarks.associateBy { it.type }

        val (pointA, pointB, pointC) = when (jointType) {
            JointType.LEFT_KNEE -> Triple(
                landmarks[LandmarkType.LEFT_HIP],
                landmarks[LandmarkType.LEFT_KNEE],
                landmarks[LandmarkType.LEFT_ANKLE]
            )
            JointType.RIGHT_KNEE -> Triple(
                landmarks[LandmarkType.RIGHT_HIP],
                landmarks[LandmarkType.RIGHT_KNEE],
                landmarks[LandmarkType.RIGHT_ANKLE]
            )
            JointType.LEFT_SHOULDER -> Triple(
                landmarks[LandmarkType.LEFT_ELBOW],
                landmarks[LandmarkType.LEFT_SHOULDER],
                landmarks[LandmarkType.RIGHT_SHOULDER]
            )
            JointType.RIGHT_SHOULDER -> Triple(
                landmarks[LandmarkType.RIGHT_ELBOW],
                landmarks[LandmarkType.RIGHT_SHOULDER],
                landmarks[LandmarkType.LEFT_SHOULDER]
            )
            JointType.LEFT_ELBOW -> Triple(
                landmarks[LandmarkType.LEFT_SHOULDER],
                landmarks[LandmarkType.LEFT_ELBOW],
                landmarks[LandmarkType.LEFT_WRIST]
            )
            JointType.RIGHT_ELBOW -> Triple(
                landmarks[LandmarkType.RIGHT_SHOULDER],
                landmarks[LandmarkType.RIGHT_ELBOW],
                landmarks[LandmarkType.RIGHT_WRIST]
            )
            JointType.WAIST -> Triple(
                landmarks[LandmarkType.LEFT_SHOULDER],
                landmarks[LandmarkType.LEFT_HIP],
                landmarks[LandmarkType.LEFT_KNEE]
            )
            else -> return null
        }

        if (pointA == null || pointB == null || pointC == null) return null

        return calculateThreePointAngle(pointA, pointB, pointC)
    }

    /**
     * 计算三点形成的角度
     */
    private fun calculateThreePointAngle(
        a: PoseLandmarkData,
        b: PoseLandmarkData,
        c: PoseLandmarkData
    ): Float {
        val abX = a.x - b.x
        val abY = a.y - b.y
        val cbX = c.x - b.x
        val cbY = c.y - b.y

        val dotProduct = abX * cbX + abY * cbY
        val magnitudeAB = sqrt(abX * abX + abY * abY)
        val magnitudeCB = sqrt(cbX * cbX + cbY * cbY)

        if (magnitudeAB == 0f || magnitudeCB == 0f) return 180f

        val cosAngle = (dotProduct / (magnitudeAB * magnitudeCB)).coerceIn(-1f, 1f)
        return (acos(cosAngle) * 180f / PI.toFloat())
    }

    /**
     * 计算角度准确度
     */
    private fun calculateAngleAccuracy(current: Float, min: Float, max: Float): Float {
        return when {
            current >= min && current <= max -> 100f  // 完全符合
            current < min -> {
                val error = (min - current) / (max - min) * 100f
                (100f - error).coerceAtLeast(0f)
            }
            else -> {
                val error = (current - max) / (max - min) * 100f
                (100f - error).coerceAtLeast(0f)
            }
        }
    }

    /**
     * 计算完成度分数
     * 基于动作幅度与标准动作的接近程度
     */
    private fun calculateCompletion(poseData: PoseData, exercise: Exercise): Int {
        // 计算身体中心点位置（用于判断动作幅度）
        val hipCenter = getHipCenter(poseData)
        val shoulderCenter = getShoulderCenter(poseData)

        // 基于动作类型计算完成度
        return when {
            exercise.type == ExerciseType.STRETCH -> {
                // 拉伸动作：根据伸展幅度评分
                val stretchAmount = calculateStretchAmount(poseData)
                stretchAmount.toInt().coerceIn(0, 100)
            }
            exercise.type == ExerciseType.STRENGTH -> {
                // 力量动作：根据身体位置评分
                val strengthAmount = calculateStrengthAmount(poseData)
                strengthAmount.toInt().coerceIn(0, 100)
            }
            exercise.type == ExerciseType.CARDIO -> {
                // 有氧动作：根据动作幅度评分
                val cardioAmount = calculateCardioAmount(poseData)
                cardioAmount.toInt().coerceIn(0, 100)
            }
            else -> {
                // 其他动作：基于置信度评分
                (poseData.landmarks.map { it.inFrameLikelihood }.average() * 100).toInt()
            }
        }
    }

    /**
     * 获取髋部中心
     */
    private fun getHipCenter(poseData: PoseData): Pair<Float, Float>? {
        val landmarks = poseData.landmarks.associateBy { it.type }
        val leftHip = landmarks[LandmarkType.LEFT_HIP] ?: return null
        val rightHip = landmarks[LandmarkType.RIGHT_HIP] ?: return null

        return Pair(
            (leftHip.x + rightHip.x) / 2f,
            (leftHip.y + rightHip.y) / 2f
        )
    }

    /**
     * 获取肩部中心
     */
    private fun getShoulderCenter(poseData: PoseData): Pair<Float, Float>? {
        val landmarks = poseData.landmarks.associateBy { it.type }
        val leftShoulder = landmarks[LandmarkType.LEFT_SHOULDER] ?: return null
        val rightShoulder = landmarks[LandmarkType.RIGHT_SHOULDER] ?: return null

        return Pair(
            (leftShoulder.x + rightShoulder.x) / 2f,
            (leftShoulder.y + rightShoulder.y) / 2f
        )
    }

    /**
     * 计算拉伸幅度
     */
    private fun calculateStretchAmount(poseData: PoseData): Float {
        val landmarks = poseData.landmarks.associateBy { it.type }
        val leftWrist = landmarks[LandmarkType.LEFT_WRIST] ?: return 0f
        val rightWrist = landmarks[LandmarkType.RIGHT_WRIST] ?: return 0f

        // 拉伸幅度 = 手腕到肩膀的平均距离
        val leftShoulder = landmarks[LandmarkType.LEFT_SHOULDER]
        val rightShoulder = landmarks[LandmarkType.RIGHT_SHOULDER]

        if (leftShoulder == null || rightShoulder == null) return 0f

        val leftDist = sqrt(
            (leftWrist.x - leftShoulder.x).pow(2) +
            (leftWrist.y - leftShoulder.y).pow(2)
        )
        val rightDist = sqrt(
            (rightWrist.x - rightShoulder.x).pow(2) +
            (rightWrist.y - rightShoulder.y).pow(2)
        )

        // 标准化到 0-100
        val avgDist = (leftDist + rightDist) / 2f
        return (avgDist / 200f * 100f).coerceAtMost(100f)
    }

    /**
     * 计算力量动作完成度
     */
    private fun calculateStrengthAmount(poseData: PoseData): Float {
        val hipCenter = getHipCenter(poseData) ?: return 0f
        val shoulderCenter = getShoulderCenter(poseData) ?: return 0f

        // 计算身体倾斜角度（用于平板支撑等）
        val bodyAngle = atan2(
            shoulderCenter.second - hipCenter.second,
            shoulderCenter.first - hipCenter.first
        ) * 180f / PI.toFloat()

        // 标准平板支撑角度接近 90 度
        val idealAngle = 90f
        val angleDiff = abs(bodyAngle - idealAngle)

        return when {
            angleDiff <= 10 -> 100f
            angleDiff <= 20 -> 80f
            angleDiff <= 30 -> 60f
            else -> 40f
        }
    }

    /**
     * 计算有氧动作完成度
     */
    private fun calculateCardioAmount(poseData: PoseData): Float {
        val landmarks = poseData.landmarks.associateBy { it.type }

        val leftKnee = landmarks[LandmarkType.LEFT_KNEE] ?: return 0f
        val rightKnee = landmarks[LandmarkType.RIGHT_KNEE] ?: return 0f
        val leftHip = landmarks[LandmarkType.LEFT_HIP] ?: return 0f
        val rightHip = landmarks[LandmarkType.RIGHT_HIP] ?: return 0f

        // 计算膝盖高度相对于髋部的高度差
        val leftKneeHeight = leftHip.y - leftKnee.y
        val rightKneeHeight = rightHip.y - rightKnee.y
        val avgHeightDiff = (abs(leftKneeHeight) + abs(rightKneeHeight)) / 2f

        // 标准化（有氧动作要求膝盖抬到较高位置）
        return (avgHeightDiff / 100f * 100f).coerceAtMost(100f)
    }

    /**
     * 计算流畅度分数
     * 基于动作历史数据的平滑程度
     */
    private fun calculateSmoothness(): Int {
        if (poseHistory.size < 2) return 85

        var totalJitter = 0f
        for (i in 1 until poseHistory.size) {
            val prev = poseHistory[i - 1]
            val curr = poseHistory[i]

            // 计算相邻帧之间的关键点位移
            var frameJitter = 0f
            for (landmark in curr.landmarks) {
                val prevLandmark = prev.landmarks.find { it.type == landmark.type }
                if (prevLandmark != null) {
                    val dx = landmark.x - prevLandmark.x
                    val dy = landmark.y - prevLandmark.y
                    frameJitter += sqrt(dx * dx + dy * dy)
                }
            }
            totalJitter += frameJitter
        }

        // 抖动越小，流畅度越高
        val avgJitter = totalJitter / (poseHistory.size - 1)
        val smoothness = (100f - avgJitter * 10f).coerceIn(50f, 100f)

        return smoothness.toInt()
    }

    /**
     * 生成动作反馈
     */
    private fun generateFeedback(
        accuracy: Int,
        completion: Int,
        smoothness: Int,
        exercise: Exercise
    ): List<String> {
        val feedback = mutableListOf<String>()

        // 准确度反馈
        when {
            accuracy >= 95 -> feedback.add("动作非常标准！")
            accuracy >= 85 -> feedback.add("动作很棒，继续保持！")
            accuracy >= 70 -> {
                feedback.add("基本正确，可以更标准一些")
                exercise.targetJointAngles.firstOrNull()?.let {
                    feedback.add(it.description)
                }
            }
            accuracy >= 50 -> {
                feedback.add("需要调整动作")
                exercise.targetJointAngles.forEach {
                    feedback.add(it.description)
                }
            }
            else -> feedback.add("请按照动作示范进行")
        }

        // 完成度反馈
        if (completion < 70) {
            feedback.add("动作幅度可以再大一些")
        }

        // 流畅度反馈
        if (smoothness < 70) {
            feedback.add("动作可以更流畅一些")
        }

        return feedback.distinct()
    }

    /**
     * 更新动作历史
     */
    private fun updateHistory(currentPose: PoseData) {
        poseHistory.add(currentPose)
        if (poseHistory.size > 10) {
            poseHistory.removeAt(0)
        }
        previousPoseData = currentPose
    }

    /**
     * 检测动作是否完成一次
     * 用于计数
     */
    fun detectRepCompletion(
        currentPose: PoseData,
        previousPose: PoseData?,
        exercise: Exercise
    ): Boolean {
        if (previousPose == null) return false

        val currentAngle = calculateJointAngle(currentPose, JointType.LEFT_KNEE) ?: return false
        val previousAngle = calculateJointAngle(previousPose, JointType.LEFT_KNEE) ?: return false

        return when (exercise.id) {
            "strength_1" -> {  // 深蹲
                // 从站立到下蹲再到站立
                val wasStanding = previousAngle < 150
                val isStanding = currentAngle > 160
                wasStanding && isStanding
            }
            "strength_3" -> {  // 俯卧撑
                // 从伸直到弯曲再到伸直
                val wasExtended = previousAngle > 150
                val isBent = currentAngle < 100
                wasExtended && isBent
            }
            else -> {
                // 其他动作：基于角度变化检测
                abs(currentAngle - previousAngle) > 30
            }
        }
    }
}
