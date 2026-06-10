package com.familymotion.app.data.repository

import com.familymotion.app.data.model.*

/**
 * 场景模式数据仓库
 */
object SceneModeRepository {

    val sceneModes: List<SceneMode> = listOf(
        SceneMode(
            id = "scene_morning",
            name = "起床唤醒",
            icon = "🌅",
            description = "轻松热身，唤醒身体活力",
            recommendedTime = "07:00 - 09:00",
            exercises = StandardActionRepository.standardActions.filter {
                it.type == ExerciseType.WARM_UP
            }.take(2)
        ),
        SceneMode(
            id = "scene_meal",
            name = "饭后消食",
            icon = "🍽️",
            description = "轻度运动，帮助消化",
            recommendedTime = "12:00 - 13:00 / 19:00 - 20:00",
            exercises = StandardActionRepository.standardActions.filter {
                it.type == ExerciseType.WALK || it.difficulty == Difficulty.EASY
            }.take(2)
        ),
        SceneMode(
            id = "scene_bedtime",
            name = "睡前放松",
            icon = "🌙",
            description = "舒缓拉伸，帮助入睡",
            recommendedTime = "21:00 - 22:00",
            exercises = StandardActionRepository.standardActions.filter {
                it.type == ExerciseType.STRETCH
            }.take(3)
        ),
        SceneMode(
            id = "scene_weekend",
            name = "周末活力",
            icon = "🎉",
            description = "全面锻炼，消耗卡路里",
            recommendedTime = "周末全天",
            exercises = StandardActionRepository.standardActions.take(5)
        ),
        SceneMode(
            id = "scene_rainy",
            name = "雨天室内",
            icon = "🌧️",
            description = "室内运动，不受天气影响",
            recommendedTime = "任何时间",
            exercises = StandardActionRepository.standardActions.filter {
                it.type != ExerciseType.WALK
            }.take(4)
        )
    )

    fun getSceneModeById(id: String): SceneMode? {
        return sceneModes.find { it.id == id }
    }

    /**
     * 根据当前时间推荐场景
     */
    fun getRecommendedSceneByTime(): SceneMode {
        val hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
        return when (hour) {
            in 7..9 -> sceneModes[0]  // 起床唤醒
            in 12..13, in 19..20 -> sceneModes[1]  // 饭后消食
            in 21..22 -> sceneModes[2]  // 睡前放松
            else -> sceneModes[3]  // 周末活力
        }
    }
}
