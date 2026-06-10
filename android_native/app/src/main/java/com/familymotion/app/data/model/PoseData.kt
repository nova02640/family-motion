package com.familymotion.app.data.model

import com.google.mlkit.vision.pose.Pose
import com.google.mlkit.vision.pose.PoseLandmark

/**
 * 骨骼关键点数据
 */
data class PoseData(
    val landmarks: List<PoseLandmarkData>,
    val timestamp: Long = System.currentTimeMillis()
) {
    companion object {
        fun fromPose(pose: Pose): PoseData {
            val landmarks = pose.allPoseLandmarks.map { landmark ->
                PoseLandmarkData(
                    type = mapLandmarkType(landmark.landmarkType),
                    x = landmark.position.x,
                    y = landmark.position.y,
                    z = landmark.position3D.z,
                    inFrameLikelihood = landmark.inFrameLikelihood
                )
            }
            return PoseData(landmarks = landmarks)
        }

        private fun mapLandmarkType(type: Int): LandmarkType {
            return when (type) {
                PoseLandmark.NOSE -> LandmarkType.NOSE
                PoseLandmark.LEFT_EYE_INNER -> LandmarkType.LEFT_EYE_INNER
                PoseLandmark.LEFT_EYE -> LandmarkType.LEFT_EYE
                PoseLandmark.LEFT_EYE_OUTER -> LandmarkType.LEFT_EYE_OUTER
                PoseLandmark.RIGHT_EYE_INNER -> LandmarkType.RIGHT_EYE_INNER
                PoseLandmark.RIGHT_EYE -> LandmarkType.RIGHT_EYE
                PoseLandmark.RIGHT_EYE_OUTER -> LandmarkType.RIGHT_EYE_OUTER
                PoseLandmark.LEFT_EAR -> LandmarkType.LEFT_EAR
                PoseLandmark.RIGHT_EAR -> LandmarkType.RIGHT_EAR
                PoseLandmark.LEFT_MOUTH -> LandmarkType.LEFT_MOUTH
                PoseLandmark.RIGHT_MOUTH -> LandmarkType.RIGHT_MOUTH
                PoseLandmark.LEFT_SHOULDER -> LandmarkType.LEFT_SHOULDER
                PoseLandmark.RIGHT_SHOULDER -> LandmarkType.RIGHT_SHOULDER
                PoseLandmark.LEFT_ELBOW -> LandmarkType.LEFT_ELBOW
                PoseLandmark.RIGHT_ELBOW -> LandmarkType.RIGHT_ELBOW
                PoseLandmark.LEFT_WRIST -> LandmarkType.LEFT_WRIST
                PoseLandmark.RIGHT_WRIST -> LandmarkType.RIGHT_WRIST
                PoseLandmark.LEFT_PINKY -> LandmarkType.LEFT_PINKY
                PoseLandmark.RIGHT_PINKY -> LandmarkType.RIGHT_PINKY
                PoseLandmark.LEFT_INDEX -> LandmarkType.LEFT_INDEX
                PoseLandmark.RIGHT_INDEX -> LandmarkType.RIGHT_INDEX
                PoseLandmark.LEFT_THUMB -> LandmarkType.LEFT_THUMB
                PoseLandmark.RIGHT_THUMB -> LandmarkType.RIGHT_THUMB
                PoseLandmark.LEFT_HIP -> LandmarkType.LEFT_HIP
                PoseLandmark.RIGHT_HIP -> LandmarkType.RIGHT_HIP
                PoseLandmark.LEFT_KNEE -> LandmarkType.LEFT_KNEE
                PoseLandmark.RIGHT_KNEE -> LandmarkType.RIGHT_KNEE
                PoseLandmark.LEFT_ANKLE -> LandmarkType.LEFT_ANKLE
                PoseLandmark.RIGHT_ANKLE -> LandmarkType.RIGHT_ANKLE
                PoseLandmark.LEFT_HEEL -> LandmarkType.LEFT_HEEL
                PoseLandmark.RIGHT_HEEL -> LandmarkType.RIGHT_HEEL
                PoseLandmark.LEFT_FOOT_INDEX -> LandmarkType.LEFT_FOOT_INDEX
                PoseLandmark.RIGHT_FOOT_INDEX -> LandmarkType.RIGHT_FOOT_INDEX
                else -> LandmarkType.NOSE
            }
        }
    }
}

/**
 * 单个骨骼关键点
 */
data class PoseLandmarkData(
    val type: LandmarkType,
    val x: Float,
    val y: Float,
    val z: Float = 0f,
    val inFrameLikelihood: Float = 0f
)

/**
 * ML Kit 骨骼关键点类型映射
 */
enum class LandmarkType {
    NOSE,
    LEFT_EYE_INNER, LEFT_EYE, LEFT_EYE_OUTER,
    RIGHT_EYE_INNER, RIGHT_EYE, RIGHT_EYE_OUTER,
    LEFT_EAR, RIGHT_EAR,
    LEFT_MOUTH, RIGHT_MOUTH,
    LEFT_SHOULDER, RIGHT_SHOULDER,
    LEFT_ELBOW, RIGHT_ELBOW,
    LEFT_WRIST, RIGHT_WRIST,
    LEFT_PINKY, RIGHT_PINKY,
    LEFT_INDEX, RIGHT_INDEX,
    LEFT_THUMB, RIGHT_THUMB,
    LEFT_HIP, RIGHT_HIP,
    LEFT_KNEE, RIGHT_KNEE,
    LEFT_ANKLE, RIGHT_ANKLE,
    LEFT_HEEL, RIGHT_HEEL,
    LEFT_FOOT_INDEX, RIGHT_FOOT_INDEX
}

/**
 * 骨骼关键点索引常量
 */
object LandmarkIndices {
    const val NOSE = 0
    const val LEFT_SHOULDER = 11
    const val RIGHT_SHOULDER = 12
    const val LEFT_ELBOW = 13
    const val RIGHT_ELBOW = 14
    const val LEFT_WRIST = 15
    const val RIGHT_WRIST = 16
    const val LEFT_HIP = 23
    const val RIGHT_HIP = 24
    const val LEFT_KNEE = 25
    const val RIGHT_KNEE = 26
    const val LEFT_ANKLE = 27
    const val RIGHT_ANKLE = 28
}
