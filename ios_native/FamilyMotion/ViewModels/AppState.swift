//
//  AppState.swift
//  FamilyMotion
//
//  Created by FamilyMotion on 2026/06/10.
//

import Foundation
import SwiftUI
import Combine

// MARK: - AppState 应用全局状态
@MainActor
final class AppState: ObservableObject {

    // MARK: 应用状态
    @Published var userProfile: UserProfile
    @Published var todayPlan: ExercisePlan?
    @Published var currentExerciseIndex: Int = 0
    @Published var currentScore: ScoreResult?
    @Published var assessmentResults: [AssessmentResult] = []
    @Published var achievements: [Achievement] = []
    @Published var isExerciseInProgress: Bool = false
    @Published var currentTab: AppTab = .home

    // MARK: 导航
    enum AppTab: String, CaseIterable, Hashable {
        case home = "首页"
        case exercise = "运动"
        case assessment = "测评"
        case profile = "我的"
    }

    // MARK: 初始化
    init() {
        // 示例用户档案
        self.userProfile = UserProfile(
            id: "user_1",
            name: "小明",
            age: 8,
            gender: "男",
            height: 130,
            weight: 30,
            avatarEmoji: "👦",
            level: 5,
            experience: 250,
            streakDays: 7,
            totalExerciseMinutes: 450
        )

        // 示例成就列表
        self.achievements = [
            Achievement(
                id: "ach_1",
                name: "初次运动",
                achievementDescription: "完成第一次运动",
                icon: "🎯",
                unlocked: true
            ),
            Achievement(
                id: "ach_2",
                name: "连续3天",
                achievementDescription: "连续运动3天",
                icon: "🔥",
                unlocked: true
            ),
            Achievement(
                id: "ach_3",
                name: "连续7天",
                achievementDescription: "连续运动7天",
                icon: "⭐",
                unlocked: true
            ),
            Achievement(
                id: "ach_4",
                name: "运动达人",
                achievementDescription: "累计运动100分钟",
                icon: "🏆",
                unlocked: false
            ),
            Achievement(
                id: "ach_5",
                name: "完美动作",
                achievementDescription: "获得一次95分以上的评分",
                icon: "✨",
                unlocked: true
            ),
            Achievement(
                id: "ach_6",
                name: "体能达人",
                achievementDescription: "完成体能测评",
                icon: "💪",
                unlocked: false
            )
        ]

        // 生成今日计划
        generateTodayPlan()
    }

    // MARK: - 计划管理

    /// 生成今日计划
    func generateTodayPlan() {
        let recommendation = PlanRecommendationService.shared
        todayPlan = recommendation.generatePersonalizedPlan(
            userProfile: userProfile,
            streakDays: userProfile.streakDays,
            weekMinutes: userProfile.totalExerciseMinutes / 7
        )
    }

    /// 保存测评结果
    func saveAssessmentResult(_ result: AssessmentResult) {
        assessmentResults.append(result)
        objectWillChange.send()
    }

    /// 开始运动
    func startExercise(plan: ExercisePlan) {
        todayPlan = plan
        currentExerciseIndex = 0
        isExerciseInProgress = true
    }

    /// 完成当前动作
    func completeCurrentExercise() {
        currentExerciseIndex += 1
        if let plan = todayPlan, currentExerciseIndex >= plan.exercises.count {
            finishExercise()
        }
    }

    /// 结束运动
    func finishExercise() {
        isExerciseInProgress = false
        currentExerciseIndex = 0
        currentScore = nil

        // 更新用户数据
        if todayPlan != nil {
            var newTotal += 10  // 假设每次 +1
            var profile = userProfile
            profile.streakDays += 1
            profile.experience += 50
            userProfile = profile
        }
    }

    /// 更新分数
    func updateScore(_ score: ScoreResult) {
        currentScore = score
    }

    // MARK: - 数据统计

    var currentExercise: Exercise? {
        guard let plan = todayPlan, currentExerciseIndex < plan.exercises.count else { return nil }
        return plan.exercises[currentExerciseIndex]
    }

    var fitnessLevel: String {
        let scoreMap: [AssessmentType: Int] = [
            .reaction: 80,
            .accuracy: 75,
            .power: 70,
            .endurance: 65,
            .balance: 85,
            .coordination: 78
        ]
        return PlanRecommendationService.shared.assessFitnessLevel(scores: scoreMap)
    }
}
