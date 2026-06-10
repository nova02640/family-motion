package com.familymotion.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.familymotion.app.data.model.*
import com.familymotion.app.data.repository.StandardActionRepository
import com.familymotion.app.domain.service.ActionScoringEngine
import com.familymotion.app.domain.service.PoseDetectionService
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * 运动状态
 */
data class ExerciseState(
    val plan: ExercisePlan? = null,
    val currentExerciseIndex: Int = 0,
    val isCountingDown: Boolean = false,
    val countdown: Int = 3,
    val isPlaying: Boolean = false,
    val currentScore: ScoreResult? = null,
    val repCount: Int = 0,
    val maxReps: Int = 0,
    val totalScore: Int = 0,
    val exerciseScores: List<Int> = emptyList(),
    val isCompleted: Boolean = false,
    val poseData: PoseData? = null
) {
    val currentExercise: Exercise?
        get() = plan?.exercises?.getOrNull(currentExerciseIndex)
}

/**
 * 运动 ViewModel
 */
class ExerciseViewModel(
    private val poseDetectionService: PoseDetectionService? = null
) : ViewModel() {

    private val _state = MutableStateFlow(ExerciseState())
    val state: StateFlow<ExerciseState> = _state.asStateFlow()

    private val scoringEngine = ActionScoringEngine()
    private var previousPoseData: PoseData? = null
    private var scoringJob: Job? = null

    /**
     * 初始化运动
     */
    fun initExercise(plan: ExercisePlan) {
        scoringEngine.reset()
        _state.value = ExerciseState(
            plan = plan,
            currentExerciseIndex = 0,
            maxReps = plan.exercises.firstOrNull()?.reps ?: 0
        )
    }

    /**
     * 开始倒计时
     */
    fun startCountdown() {
        _state.value = _state.value.copy(isCountingDown = true, countdown = 3)

        viewModelScope.launch {
            for (i in 3 downTo 1) {
                _state.value = _state.value.copy(countdown = i)
                delay(1000)
            }
            _state.value = _state.value.copy(isCountingDown = false)
            startExercise()
        }
    }

    /**
     * 开始运动
     */
    private fun startExercise() {
        _state.value = _state.value.copy(isPlaying = true)
        scoringJob = viewModelScope.launch {
            while (_state.value.isPlaying) {
                delay(500) // 每500ms评分一次

                val poseData = _state.value.poseData
                val exercise = _state.value.currentExercise

                if (poseData != null && exercise != null) {
                    // 评分
                    val scoreResult = scoringEngine.scoreAction(poseData, exercise)
                    _state.value = _state.value.copy(
                        currentScore = scoreResult,
                        repCount = scoreResult.repCount
                    )

                    // 检测动作完成
                    if (scoringEngine.detectRepCompletion(poseData, previousPoseData, exercise)) {
                        handleRepCompleted()
                    }

                    previousPoseData = poseData
                }
            }
        }
    }

    /**
     * 处理动作完成
     */
    private fun handleRepCompleted() {
        val currentState = _state.value
        val newRepCount = currentState.repCount + 1

        _state.value = currentState.copy(repCount = newRepCount)

        // 检查是否完成当前动作
        if (newRepCount >= currentState.maxReps) {
            completeCurrentExercise()
        }
    }

    /**
     * 完成当前动作
     */
    fun completeCurrentExercise() {
        scoringJob?.cancel()
        _state.value = _state.value.copy(isPlaying = false)

        val score = _state.value.currentScore?.totalScore ?: 0
        val scores = _state.value.exerciseScores + score
        val totalScore = _state.value.totalScore + score

        _state.value = _state.value.copy(
            exerciseScores = scores,
            totalScore = totalScore
        )
    }

    /**
     * 继续下一个动作
     */
    fun nextExercise() {
        val plan = _state.value.plan ?: return
        val nextIndex = _state.value.currentExerciseIndex + 1

        if (nextIndex >= plan.exercises.size) {
            // 计划完成
            _state.value = _state.value.copy(isCompleted = true)
        } else {
            // 下一个动作
            scoringEngine.reset()
            _state.value = _state.value.copy(
                currentExerciseIndex = nextIndex,
                currentScore = null,
                repCount = 0,
                maxReps = plan.exercises[nextIndex].reps,
                isPlaying = false
            )
        }
    }

    /**
     * 更新骨骼数据
     */
    fun updatePoseData(poseData: PoseData) {
        _state.value = _state.value.copy(poseData = poseData)
    }

    /**
     * 暂停运动
     */
    fun pauseExercise() {
        _state.value = _state.value.copy(isPlaying = false)
        scoringJob?.cancel()
    }

    /**
     * 恢复运动
     */
    fun resumeExercise() {
        if (_state.value.currentExercise != null) {
            startExercise()
        }
    }

    /**
     * 重置运动
     */
    fun resetExercise() {
        scoringJob?.cancel()
        scoringEngine.reset()
        previousPoseData = null
        _state.value = ExerciseState()
    }

    override fun onCleared() {
        super.onCleared()
        scoringJob?.cancel()
    }
}
