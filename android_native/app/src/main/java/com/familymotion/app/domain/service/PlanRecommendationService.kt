package com.familymotion.app.domain.service

import com.familymotion.app.data.model.*
import com.familymotion.app.data.repository.StandardActionRepository

/**
 * 智能计划推荐服务
 * 根据用户档案、历史数据和时间生成个性化运动计划
 */
class PlanRecommendationService {

    /**
     * 生成个性化运动计划
     */
    fun generatePersonalizedPlan(
        userProfile: UserProfile,
        streakDays: Int,
        weekMinutes: Int
    ): ExercisePlan {
        // 计算难度等级
        val difficulty = calculateDifficulty(userProfile.age, streakDays, weekMinutes)

        // 选择适合的动作
        val exercises = selectExercises(difficulty, userProfile.age)

        // 生成计划标题
        val title = generatePlanTitle(difficulty, exercises)

        // 计算总时长
        val totalDuration = exercises.sumOf {
            if (it.duration > 0) it.duration else it.reps * 3
        } / 60

        return ExercisePlan(
            id = "plan_${System.currentTimeMillis()}",
            title = title,
            description = getPlanDescription(difficulty),
            duration = totalDuration,
            difficulty = difficulty,
            exercises = exercises,
            isCompleted = false
        )
    }

    /**
     * 计算难度等级
     */
    private fun calculateDifficulty(
        age: Int,
        streakDays: Int,
        weekMinutes: Int
    ): Difficulty {
        // 基础难度：基于年龄
        val ageDifficulty = when {
            age <= 6 -> 0.0
            age <= 9 -> 0.5
            age <= 12 -> 1.0
            else -> 1.5
        }

        // 连续运动奖励
        val streakBonus = when {
            streakDays >= 14 -> 1.0
            streakDays >= 7 -> 0.5
            streakDays >= 3 -> 0.25
            else -> 0.0
        }

        // 周运动量调整
        val weekBonus = when {
            weekMinutes >= 180 -> 0.5
            weekMinutes >= 120 -> 0.25
            weekMinutes >= 60 -> 0.0
            else -> -0.25  // 运动不足，适当降低难度
        }

        val totalScore = ageDifficulty + streakBonus + weekBonus

        return when {
            totalScore < 0.5 -> Difficulty.EASY
            totalScore < 1.5 -> Difficulty.MEDIUM
            else -> Difficulty.HARD
        }
    }

    /**
     * 选择适合的运动动作
     */
    private fun selectExercises(difficulty: Difficulty, age: Int): List<Exercise> {
        val exercises = mutableListOf<Exercise>()

        // 添加热身动作（1-2个）
        exercises.addAll(
            StandardActionRepository.getWarmUpExercises().take(
                if (age <= 6) 1 else 2
            )
        )

        // 根据难度添加主要动作
        val mainExercises = when (difficulty) {
            Difficulty.EASY -> {
                StandardActionRepository.standardActions.filter {
                    it.difficulty == Difficulty.EASY &&
                    it.type != ExerciseType.WARM_UP &&
                    it.type != ExerciseType.STRETCH
                }
            }
            Difficulty.MEDIUM -> {
                StandardActionRepository.standardActions.filter {
                    it.difficulty in listOf(Difficulty.EASY, Difficulty.MEDIUM) &&
                    it.type != ExerciseType.WARM_UP &&
                    it.type != ExerciseType.STRETCH
                }
            }
            Difficulty.HARD -> {
                StandardActionRepository.standardActions.filter {
                    it.type != ExerciseType.WARM_UP &&
                    it.type != ExerciseType.STRETCH
                }
            }
        }

        // 随机选择 2-4 个主要动作
        exercises.addAll(mainExercises.shuffled().take(
            when (difficulty) {
                Difficulty.EASY -> 2
                Difficulty.MEDIUM -> 3
                Difficulty.HARD -> 4
            }
        ))

        // 添加拉伸动作（1-2个）
        exercises.addAll(
            StandardActionRepository.getStretchExercises().take(
                if (age <= 6) 1 else 2
            )
        )

        return exercises.shuffled()
    }

    /**
     * 生成计划标题
     */
    private fun generatePlanTitle(difficulty: Difficulty, exercises: List<Exercise>): String {
        val mainCount = exercises.count {
            it.type !in listOf(ExerciseType.WARM_UP, ExerciseType.STRETCH)
        }

        return when (difficulty) {
            Difficulty.EASY -> "轻松活力 ${mainCount}项运动"
            Difficulty.MEDIUM -> "燃脂挑战 ${mainCount}项运动"
            Difficulty.HARD -> "力量突破 ${mainCount}项运动"
        }
    }

    /**
     * 获取计划描述
     */
    private fun getPlanDescription(difficulty: Difficulty): String {
        return when (difficulty) {
            Difficulty.EASY -> "适合儿童的轻松运动组合，帮助建立运动习惯"
            Difficulty.MEDIUM -> "适中难度的运动计划，提升体能和协调性"
            Difficulty.HARD -> "挑战性的运动组合，全面提升身体素质"
        }
    }

    /**
     * 生成快速场景计划
     */
    fun generateScenePlan(sceneMode: SceneMode): ExercisePlan {
        return ExercisePlan(
            id = "scene_${sceneMode.id}",
            title = sceneMode.name,
            description = sceneMode.description,
            duration = sceneMode.exercises.sumOf { it.duration } / 60,
            difficulty = Difficulty.EASY,
            exercises = sceneMode.exercises,
            isCompleted = false
        )
    }

    /**
     * 评估用户体能水平
     */
    fun assessFitnessLevel(scores: Map<AssessmentType, Int>): String {
        val avgScore = scores.values.average()

        return when {
            avgScore >= 85 -> "运动达人"
            avgScore >= 70 -> "运动健将"
            avgScore >= 55 -> "运动新星"
            avgScore >= 40 -> "潜力无限"
            else -> "运动起步"
        }
    }
}
