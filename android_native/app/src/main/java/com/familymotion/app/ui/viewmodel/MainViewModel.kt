package com.familymotion.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.familymotion.app.data.model.*
import com.familymotion.app.data.repository.SceneModeRepository
import com.familymotion.app.data.repository.StandardActionRepository
import com.familymotion.app.domain.service.PlanRecommendationService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * 应用状态
 */
data class AppState(
    val userProfile: UserProfile = UserProfile(
        id = "user_1",
        name = "小明",
        age = 8,
        gender = "男",
        height = 130f,
        weight = 30f,
        avatarEmoji = "👦",
        level = 5,
        experience = 250,
        streakDays = 7,
        totalExerciseMinutes = 450
    ),
    val todayPlan: ExercisePlan? = null,
    val currentExerciseIndex: Int = 0,
    val isExerciseInProgress: Boolean = false,
    val currentScore: ScoreResult? = null,
    val assessmentResults: List<AssessmentResult> = emptyList(),
    val achievements: List<Achievement> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

/**
 * 主 ViewModel
 */
class MainViewModel : ViewModel() {

    private val _state = MutableStateFlow(AppState())
    val state: StateFlow<AppState> = _state.asStateFlow()

    private val planService = PlanRecommendationService()

    init {
        generateTodayPlan()
        loadAchievements()
    }

    /**
     * 生成今日计划
     */
    fun generateTodayPlan() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)

            val userProfile = _state.value.userProfile
            val plan = planService.generatePersonalizedPlan(
                userProfile = userProfile,
                streakDays = userProfile.streakDays,
                weekMinutes = userProfile.totalExerciseMinutes / 7
            )

            _state.value = _state.value.copy(
                todayPlan = plan,
                isLoading = false
            )
        }
    }

    /**
     * 加载成就
     */
    private fun loadAchievements() {
        val achievements = listOf(
            Achievement(
                id = "ach_1",
                name = "初次运动",
                description = "完成第一次运动",
                icon = "🎯",
                unlocked = true,
                unlockedAt = System.currentTimeMillis() - 86400000 * 5
            ),
            Achievement(
                id = "ach_2",
                name = "连续3天",
                description = "连续运动3天",
                icon = "🔥",
                unlocked = true,
                unlockedAt = System.currentTimeMillis() - 86400000 * 3
            ),
            Achievement(
                id = "ach_3",
                name = "连续7天",
                description = "连续运动7天",
                icon = "⭐",
                unlocked = true,
                unlockedAt = System.currentTimeMillis() - 86400000
            ),
            Achievement(
                id = "ach_4",
                name = "运动达人",
                description = "累计运动100分钟",
                icon = "🏆",
                unlocked = false
            ),
            Achievement(
                id = "ach_5",
                name = "完美动作",
                description = "获得一次95分以上的评分",
                icon = "✨",
                unlocked = true,
                unlockedAt = System.currentTimeMillis() - 86400000 * 2
            ),
            Achievement(
                id = "ach_6",
                name = "体能达人",
                description = "完成体能测评",
                icon = "💪",
                unlocked = false
            )
        )

        _state.value = _state.value.copy(achievements = achievements)
    }

    /**
     * 开始运动
     */
    fun startExercise(planId: String, exerciseIndex: Int) {
        _state.value = _state.value.copy(
            currentExerciseIndex = exerciseIndex,
            isExerciseInProgress = true
        )
    }

    /**
     * 更新当前分数
     */
    fun updateScore(score: ScoreResult) {
        _state.value = _state.value.copy(currentScore = score)
    }

    /**
     * 完成当前动作
     */
    fun completeExercise() {
        val currentPlan = _state.value.todayPlan ?: return
        val nextIndex = _state.value.currentExerciseIndex + 1

        if (nextIndex >= currentPlan.exercises.size) {
            // 计划完成
            _state.value = _state.value.copy(
                todayPlan = currentPlan.copy(isCompleted = true),
                isExerciseInProgress = false,
                currentExerciseIndex = 0
            )
        } else {
            _state.value = _state.value.copy(
                currentExerciseIndex = nextIndex
            )
        }
    }

    /**
     * 结束运动
     */
    fun finishExercise() {
        _state.value = _state.value.copy(
            isExerciseInProgress = false,
            currentExerciseIndex = 0,
            currentScore = null
        )
    }

    /**
     * 保存测评结果
     */
    fun saveAssessmentResult(result: AssessmentResult) {
        val results = _state.value.assessmentResults.toMutableList()
        results.add(result)
        _state.value = _state.value.copy(assessmentResults = results)
    }

    /**
     * 获取场景模式列表
     */
    fun getSceneModes(): List<SceneMode> = SceneModeRepository.sceneModes

    /**
     * 获取推荐动作
     */
    fun getRecommendedExercises(): List<Exercise> =
        StandardActionRepository.standardActions.shuffled().take(6)
}
