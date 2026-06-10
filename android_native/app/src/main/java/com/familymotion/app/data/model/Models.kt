package com.familymotion.app.data.model

import kotlinx.serialization.Serializable

/**
 * 用户档案
 */
@Serializable
data class UserProfile(
    val id: String = "",
    val name: String = "",
    val age: Int = 0,
    val gender: String = "",
    val height: Float = 0f,  // cm
    val weight: Float = 0f,  // kg
    val avatarEmoji: String = "👦",
    val level: Int = 1,
    val experience: Int = 0,
    val streakDays: Int = 0,
    val totalExerciseMinutes: Int = 0,
    val bmi: Float = 0f
) {
    companion object {
        fun calculateBMI(height: Float, weight: Float): Float {
            if (height <= 0) return 0f
            val heightInMeters = height / 100f
            return weight / (heightInMeters * heightInMeters)
        }
    }
}

/**
 * 运动计划
 */
@Serializable
data class ExercisePlan(
    val id: String = "",
    val title: String = "",
    val description: String = "",
    val duration: Int = 0,  // 分钟
    val difficulty: Difficulty = Difficulty.EASY,
    val exercises: List<Exercise> = emptyList(),
    val isCompleted: Boolean = false,
    val completedAt: Long? = null
)

/**
 * 单个运动项目
 */
@Serializable
data class Exercise(
    val id: String = "",
    val name: String = "",
    val description: String = "",
    val icon: String = "",
    val reps: Int = 10,
    val duration: Int = 0,  // 秒
    val difficulty: Difficulty = Difficulty.EASY,
    val type: ExerciseType = ExerciseType.NORMAL,
    val targetJointAngles: List<JointAngle> = emptyList()
)

/**
 * 关节角度约束
 */
@Serializable
data class JointAngle(
    val joint: JointType,
    val minAngle: Float,
    val maxAngle: Float,
    val description: String = ""
)

/**
 * 关节类型
 */
@Serializable
enum class JointType {
    LEFT_KNEE, RIGHT_KNEE,
    LEFT_HIP, RIGHT_HIP,
    LEFT_SHOULDER, RIGHT_SHOULDER,
    LEFT_ELBOW, RIGHT_ELBOW,
    WAIST, SHOULDER
}

/**
 * 难度等级
 */
@Serializable
enum class Difficulty {
    EASY, MEDIUM, HARD
}

/**
 * 运动类型
 */
@Serializable
enum class ExerciseType {
    NORMAL,         // 普通运动
    WARM_UP,        // 热身
    STRETCH,       // 拉伸
    CARDIO,         // 有氧
    STRENGTH,       // 力量
    BALANCE         // 平衡
}

/**
 * 运动评分结果
 */
@Serializable
data class ScoreResult(
    val totalScore: Int = 0,
    val accuracyScore: Int = 0,      // 准确度得分
    val completionScore: Int = 0,     // 完成度得分
    val smoothnessScore: Int = 0,     // 流畅度得分
    val feedback: List<String> = emptyList(),
    val isPerfect: Boolean = false,
    val repCount: Int = 0
)

/**
 * 体能测评结果
 */
@Serializable
data class AssessmentResult(
    val id: String = "",
    val timestamp: Long = System.currentTimeMillis(),
    val scores: Map<AssessmentType, Int> = emptyMap(),
    val overallScore: Int = 0,
    val grade: String = ""
) {
    companion object {
        fun calculateGrade(score: Int): String = when {
            score >= 90 -> "优秀"
            score >= 80 -> "良好"
            score >= 70 -> "中等"
            score >= 60 -> "及格"
            else -> "需要加油"
        }
    }
}

/**
 * 测评类型
 */
@Serializable
enum class AssessmentType {
    REACTION,      // 反应速度
    ACCURACY,      // 动作准确度
    POWER,         // 爆发力
    ENDURANCE,     // 下肢力量
    BALANCE,       // 平衡力
    COORDINATION   // 协调性
}

/**
 * 场景模式
 */
@Serializable
data class SceneMode(
    val id: String = "",
    val name: String = "",
    val icon: String = "",
    val description: String = "",
    val recommendedTime: String = "",
    val exercises: List<Exercise> = emptyList()
)

/**
 * 对战模式
 */
@Serializable
enum class DuelMode {
    RACE,           // 竞速模式
    ACCURACY,       // 准确度模式
    COOPERATION     // 合作模式
}

/**
 * 成就徽章
 */
@Serializable
data class Achievement(
    val id: String = "",
    val name: String = "",
    val description: String = "",
    val icon: String = "",
    val unlocked: Boolean = false,
    val unlockedAt: Long? = null
)
