package com.familymotion.app.data.repository

import com.familymotion.app.data.model.*

/**
 * 标准动作库
 */
object StandardActionRepository {

    val standardActions: List<Exercise> = listOf(
        // 热身动作
        Exercise(
            id = "warm_up_1",
            name = "原地高抬腿",
            description = "快速抬膝至腰部高度",
            icon = "🏃",
            reps = 20,
            duration = 30,
            difficulty = Difficulty.EASY,
            type = ExerciseType.WARM_UP,
            targetJointAngles = listOf(
                JointAngle(JointType.LEFT_KNEE, 70f, 110f, "抬腿高度不够"),
                JointAngle(JointType.RIGHT_KNEE, 70f, 110f, "抬腿高度不够")
            )
        ),
        Exercise(
            id = "warm_up_2",
            name = "开合跳",
            description = "双手双脚同时打开和并拢",
            icon = "⭐",
            reps = 15,
            duration = 20,
            difficulty = Difficulty.EASY,
            type = ExerciseType.WARM_UP,
            targetJointAngles = listOf(
                JointAngle(JointType.LEFT_SHOULDER, 30f, 90f, "手臂打开不够"),
                JointAngle(JointType.RIGHT_SHOULDER, 30f, 90f, "手臂打开不够")
            )
        ),

        // 核心力量
        Exercise(
            id = "strength_1",
            name = "深蹲",
            description = "屈膝下蹲，膝盖不超过脚尖",
            icon = "🦵",
            reps = 12,
            duration = 0,
            difficulty = Difficulty.MEDIUM,
            type = ExerciseType.STRENGTH,
            targetJointAngles = listOf(
                JointAngle(JointType.LEFT_KNEE, 70f, 110f, "膝盖角度不对"),
                JointAngle(JointType.RIGHT_KNEE, 70f, 110f, "膝盖角度不对"),
                JointAngle(JointType.WAIST, 70f, 100f, "腰部保持直立")
            )
        ),
        Exercise(
            id = "strength_2",
            name = "平板支撑",
            description = "身体保持一条直线",
            icon = "🧘",
            reps = 1,
            duration = 30,
            difficulty = Difficulty.MEDIUM,
            type = ExerciseType.STRENGTH,
            targetJointAngles = listOf(
                JointAngle(JointType.LEFT_SHOULDER, 80f, 100f, "身体下沉了"),
                JointAngle(JointType.RIGHT_SHOULDER, 80f, 100f, "身体下沉了"),
                JointAngle(JointType.WAIST, 160f, 180f, "臀部太高了")
            )
        ),
        Exercise(
            id = "strength_3",
            name = "俯卧撑",
            description = "屈臂下降，推起身体",
            icon = "💪",
            reps = 10,
            duration = 0,
            difficulty = Difficulty.HARD,
            type = ExerciseType.STRENGTH,
            targetJointAngles = listOf(
                JointAngle(JointType.LEFT_ELBOW, 80f, 100f, "手臂弯曲不够"),
                JointAngle(JointType.RIGHT_ELBOW, 80f, 100f, "手臂弯曲不够"),
                JointAngle(JointType.WAIST, 160f, 180f, "身体要保持平直")
            )
        ),

        // 有氧运动
        Exercise(
            id = "cardio_1",
            name = "波比跳",
            description = "蹲下撑地-跳起-站立",
            icon = "🔥",
            reps = 8,
            duration = 0,
            difficulty = Difficulty.HARD,
            type = ExerciseType.CARDIO,
            targetJointAngles = listOf(
                JointAngle(JointType.LEFT_KNEE, 80f, 120f, "膝盖弯曲不够"),
                JointAngle(JointType.RIGHT_KNEE, 80f, 120f, "膝盖弯曲不够")
            )
        ),
        Exercise(
            id = "cardio_2",
            name = "登山跑",
            description = "俯卧撑姿势交替提膝",
            icon = "⛰️",
            reps = 20,
            duration = 0,
            difficulty = Difficulty.MEDIUM,
            type = ExerciseType.CARDIO,
            targetJointAngles = listOf(
                JointAngle(JointType.LEFT_KNEE, 80f, 120f, "膝盖抬高一些"),
                JointAngle(JointType.RIGHT_KNEE, 80f, 120f, "膝盖抬高一些")
            )
        ),

        // 拉伸动作
        Exercise(
            id = "stretch_1",
            name = "弓步拉伸",
            description = "前后弓步压腿",
            icon = "🙆",
            reps = 5,
            duration = 30,
            difficulty = Difficulty.EASY,
            type = ExerciseType.STRETCH,
            targetJointAngles = listOf(
                JointAngle(JointType.LEFT_KNEE, 80f, 120f, "腿部伸直"),
                JointAngle(JointType.RIGHT_KNEE, 80f, 120f, "腿部伸直")
            )
        ),
        Exercise(
            id = "stretch_2",
            name = "侧身拉伸",
            description = "单手向上伸展并侧弯",
            icon = "🌴",
            reps = 5,
            duration = 20,
            difficulty = Difficulty.EASY,
            type = ExerciseType.STRETCH,
            targetJointAngles = listOf(
                JointAngle(JointType.LEFT_SHOULDER, 150f, 180f, "手臂伸直"),
                JointAngle(JointType.RIGHT_SHOULDER, 150f, 180f, "手臂伸直")
            )
        ),

        // 平衡动作
        Exercise(
            id = "balance_1",
            name = "单脚站立",
            description = "单腿站立保持平衡",
            icon = "🦈",
            reps = 1,
            duration = 30,
            difficulty = Difficulty.MEDIUM,
            type = ExerciseType.BALANCE,
            targetJointAngles = emptyList()
        ),
        Exercise(
            id = "balance_2",
            name = "燕式平衡",
            description = "单腿站立，另一腿后伸",
            icon = "🦅",
            reps = 1,
            duration = 20,
            difficulty = Difficulty.HARD,
            type = ExerciseType.BALANCE,
            targetJointAngles = listOf(
                JointAngle(JointType.LEFT_HIP, 150f, 180f, "后腿抬更高"),
                JointAngle(JointType.RIGHT_HIP, 150f, 180f, "后腿抬更高")
            )
        )
    )

    fun getExerciseById(id: String): Exercise? {
        return standardActions.find { it.id == id }
    }

    fun getExercisesByType(type: ExerciseType): List<Exercise> {
        return standardActions.filter { it.type == type }
    }

    fun getExercisesByDifficulty(difficulty: Difficulty): List<Exercise> {
        return standardActions.filter { it.difficulty == difficulty }
    }

    fun getWarmUpExercises(): List<Exercise> {
        return standardActions.filter { it.type == ExerciseType.WARM_UP }
    }

    fun getStretchExercises(): List<Exercise> {
        return standardActions.filter { it.type == ExerciseType.STRETCH }
    }
}
