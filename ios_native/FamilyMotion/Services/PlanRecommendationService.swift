//
//  PlanRecommendationService.swift
//  FamilyMotion
//
//  Created by FamilyMotion on 2026/06/10.
//

import Foundation

// MARK: - 计划推荐服务
@MainActor
final class PlanRecommendationService: ObservableObject {

    static let shared = PlanRecommendationService()

    private let standardActionRepository = StandardActionRepository.shared

    // MARK: - 个性化推荐
    /// 根据用户档案、连续运动天数和周运动时长推荐个性化计划
    func generatePersonalizedPlan(
        userProfile: UserProfile,
        streakDays: Int,
        weekMinutes: Int
    ) -> ExercisePlan {

        // 1. 计算难度等级
        let difficulty = calculateDifficulty(
            age: userProfile.age,
            streakDays: streakDays,
            weekMinutes: weekMinutes
        )

        // 2. 选择动作
        let exercises = selectExercises(
            difficulty: difficulty,
            age: userProfile.age
        )

        // 3. 生成计划标题
        let title = generatePlanTitle(
            difficulty: difficulty,
            exercises: exercises
        )

        // 4. 计算总时长（秒转分钟）
        let totalDuration = exercises.reduce(0) { (sum, exercise) -> Int in
            let duration = exercise.duration > 0
                ? exercise.duration
                : exercise.reps * 3  // 每次动作约 3 秒
            return sum + duration
        } / 60

        return ExercisePlan(
            id: "plan_\(UUID().uuidString.prefix(8))",
            title: title,
            planDescription: getPlanDescription(difficulty: difficulty),
            duration: max(5, totalDuration),
            difficulty: difficulty,
            exercises: exercises
        )
    }

    // MARK: - 难度计算

    /// 根据年龄、连续运动天数、周运动时长计算难度
    private func calculateDifficulty(age: Int, streakDays: Int, weekMinutes: Int) -> Difficulty {

        var score: Float = 0.0

        // 年龄因素（基础分）
        switch age {
        case 0..<7:
            score += 0.0
        case 7..<10:
            score += 0.5
        case 10..<14:
            score += 1.0
        default:
            score += 1.5
        }

        // 连续运动天数奖励
        switch streakDays {
        case 14...:
            score += 1.0
        case 7..<14:
            score += 0.5
        case 3..<7:
            score += 0.25
        default:
            score += 0.0
        }

        // 周运动量调整
        switch weekMinutes {
        case 180...:
            score += 0.5
        case 120..<180:
            score += 0.25
        case 60..<120:
            score += 0.0
        default:
            score -= 0.25  // 运动不足，适当降低难度
        }

        if score < 0.5 {
            return .easy
        } else if score < 1.5 {
            return .medium
        } else {
            return .hard
        }
    }

    // MARK: - 动作选择

    /// 根据难度和年龄选择适合的动作
    private func selectExercises(difficulty: Difficulty, age: Int) -> [Exercise] {

        let allActions = standardActionRepository.standardActions

        // 1. 热身动作（1-2 个，根据年龄）
        let warmUpCount = age <= 6 ? 1 : 2
        let warmUps = Array(allActions.filter { $0.type == .warmUp }.prefix(warmUpCount))

        // 2. 主动作（2-4 个，根据难度）
        let mainCount: Int
        var mainPool: [Exercise]

        switch difficulty {
        case .easy:
            mainCount = 2
            mainPool = allActions.filter {
                $0.difficulty == .easy &&
                $0.type != .warmUp &&
                $0.type != .stretch
            }

        case .medium:
            mainCount = 3
            mainPool = allActions.filter {
                ($0.difficulty == .easy || $0.difficulty == .medium) &&
                $0.type != .warmUp &&
                $0.type != .stretch
            }

        case .hard:
            mainCount = 4
            mainPool = allActions.filter {
                $0.type != .warmUp &&
                $0.type != .stretch
            }
        }

        // 打乱后选择
        let mainExercises = Array(mainPool.shuffled().prefix(mainCount))

        // 3. 拉伸动作（1-2 个，根据年龄）
        let stretchCount = age <= 6 ? 1 : 2
        let stretches = Array(allActions.filter { $0.type == .stretch }.prefix(stretchCount))

        // 组合并打乱
        return warmUps + mainExercises + stretches
    }

    // MARK: - 标题生成

    private func generatePlanTitle(difficulty: Difficulty, exercises: [Exercise]) -> String {

        let mainCount = exercises.filter {
            $0.type != .warmUp && $0.type != .stretch
        }.count

        switch difficulty {
        case .easy:
            return "轻松活力 \(mainCount) 项运动"
        case .medium:
            return "燃脂挑战 \(mainCount) 项运动"
        case .hard:
            return "力量突破 \(mainCount) 项运动"
        }
    }

    // MARK: - 描述生成

    private func getPlanDescription(difficulty: Difficulty) -> String {
        switch difficulty {
        case .easy:
            return "适合儿童的轻松运动组合，帮助建立运动习惯"
        case .medium:
            return "适中难度的运动计划，提升体能和协调性"
        case .hard:
            return "挑战性的运动组合，全面提升身体素质"
        }
    }

    // MARK: - 场景计划生成

    /// 根据场景模式生成计划
    func generateScenePlan(sceneMode: SceneMode) -> ExercisePlan {

        let totalDuration = sceneMode.exercises.reduce(0) { sum, exercise -> Int in
            let duration = exercise.duration > 0
                ? exercise.duration
                : exercise.reps * 3
            return sum + duration
        } / 60

        return ExercisePlan(
            id: "scene_\(sceneMode.id)",
            title: sceneMode.name,
            planDescription: sceneMode.description,
            duration: max(5, totalDuration),
            difficulty: .easy,
            exercises: sceneMode.exercises
        )
    }

    // MARK: - 体能水平评估

    /// 评估用户体能水平
    func assessFitnessLevel(scores: [AssessmentType: Int]) -> String {

        let values = scores.values
        guard !values.isEmpty else { return "运动起步" }

        let avgScore = Double(values.reduce(0, +)) / Double(values.count)

        switch avgScore {
        case 85...:
            return "运动达人"
        case 70..<85:
            return "运动健将"
        case 55..<70:
            return "运动新星"
        case 40..<55:
            return "潜力无限"
        default:
            return "运动起步"
        }
    }
}
