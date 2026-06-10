//
//  HomeView.swift
//  FamilyMotion
//
//  Created by FamilyMotion on 2026/06/10.
//

import SwiftUI

// MARK: - HomeView 首页
struct HomeView: View {

    @EnvironmentObject var appState: AppState
    @State private var showExercise: Bool = false
    @State private var selectedScene: SceneMode? = nil
    @State private var selectedPlan: ExercisePlan? = nil

    var body: some View {
        NavigationView {
            ZStack {
                Color.background.ignoresSafeArea()

                ScrollView(.vertical, showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 20) {

                        // 用户信息卡
                        UserProfileCard(userProfile: appState.userProfile)
                            .padding(.top, 16)

                        // 今日计划卡片
                        if let plan = appState.todayPlan {
                            TodayPlanCard(
                                plan: plan,
                                onStart: {
                                    selectedPlan = plan
                                    showExercise = true
                                }
                            )
                        }

                        // 连续打卡和统计
                        StatsRow(
                            streakDays: appState.userProfile.streakDays,
                            totalMinutes: appState.userProfile.totalExerciseMinutes
                        )

                        // 场景模式
                        SectionHeader(title: "场景模式")

                        SceneModeGrid(
                            onSceneSelected: { scene in
                                let plan = PlanRecommendationService.shared.generateScenePlan(sceneMode: scene)
                                selectedPlan = plan
                                showExercise = true
                            }
                        )

                        // 推荐运动
                        SectionHeader(title: "推荐运动")

                        RecommendedExercises(
                            onExerciseSelected: { exercise in
                                let plan = ExercisePlan(
                                    id: "temp_\(UUID().uuidString.prefix(8))",
                                    title: exercise.name,
                                    planDescription: "快速开始 \(exercise.name)",
                                    duration: max(5, exercise.duration / 60),
                                    difficulty: exercise.difficulty,
                                    exercises: [exercise]
                                )
                                selectedPlan = plan
                                showExercise = true
                            }
                        )

                        // 成就徽章
                        SectionHeader(title: "成就徽章")

                        AchievementsRow(achievements: appState.achievements)

                        // 底部留白
                        Color.clear.frame(height: 80)
                    }
                    .padding(.horizontal, 16)
                }

                // 导航到运动页
                if showExercise, let plan = selectedPlan {
                    NavigationLink(
                        destination: ExerciseView(plan: plan)
                            .environmentObject(appState),
                        isActive: $showExercise
                    ) { EmptyView() }
                }
            }
            .navigationBarTitle("亲子运动", displayMode: .inline)
            .navigationBarHidden(true)
        }
        .navigationViewStyle(.stack)
    }
}

// MARK: - 用户信息卡
struct UserProfileCard: View {
    let userProfile: UserProfile

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 20)
                .fill(LinearGradient.primaryGradient)

            HStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(Color.white)
                        .frame(width: 70, height: 70)

                    Text(userProfile.avatarEmoji)
                        .font(.system(size: 40))
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(userProfile.name)
                        .font(.customTitle())
                        .foregroundColor(.white)

                    Text("\(userProfile.age)岁 · \(userProfile.gender)")
                        .font(.customBody())
                        .foregroundColor(.white.opacity(0.8))

                    HStack(spacing: 6) {
                        Text("成长树 Lv.\(userProfile.level)")
                            .font(.customCaption())
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.white.opacity(0.2))
                            .clipShape(Capsule())
                            .foregroundColor(.white)
                    }
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text("🔥 \(userProfile.streakDays)天")
                        .font(.customCaption())
                        .foregroundColor(.white)
                    Text("⏱️ \(userProfile.totalExerciseMinutes)分钟")
                        .font(.customCaption())
                        .foregroundColor(.white.opacity(0.8))
                }
            }
            .padding(20)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - 今日计划卡片
struct TodayPlanCard: View {
    let plan: ExercisePlan
    let onStart: () -> Void

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.surface)
                .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)

            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("今日计划")
                            .font(.customHeadline())
                            .foregroundColor(.textPrimary)

                        Text("\(plan.exercises.count) 个动作 · 约 \(plan.duration) 分钟")
                            .font(.customCaption())
                            .foregroundColor(.textSecondary)
                    }

                    Spacer()

                    Button(action: onStart) {
                        Text("开始")
                            .font(.customHeadline(14))
                            .padding(.horizontal, 20)
                            .padding(.vertical, 10)
                            .background(Color.primary)
                            .foregroundColor(.white)
                            .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                }

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 10) {
                        ForEach(plan.exercises.prefix(6)) { exercise in
                            ExerciseThumbnail(exercise: exercise)
                        }

                        if plan.exercises.count > 6 {
                            Text("+\(plan.exercises.count - 6)")
                                .font(.customCaption())
                                .foregroundColor(.primary)
                                .frame(width: 50, height: 50)
                                .background(Color.primary.opacity(0.1))
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    }
                }
            }
            .padding(16)
        }
    }
}

// MARK: - 运动缩略图
struct ExerciseThumbnail: View {
    let exercise: Exercise

    var body: some View {
        VStack(spacing: 4) {
            Text(exercise.icon)
                .font(.system(size: 24))
                .frame(width: 50, height: 50)
                .background(Color.primary.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 12))

            Text(exercise.name)
                .font(.system(size: 10))
                .foregroundColor(.textSecondary)
                .lineLimit(1)
                .frame(width: 60)
        }
    }
}

// MARK: - 统计行
struct StatsRow: View {
    let streakDays: Int
    let totalMinutes: Int

    var body: some View {
        HStack(spacing: 12) {
            StatCard(
                icon: "🔥",
                value: "\(streakDays)",
                label: "连续打卡",
                color: .secondary
            )

            StatCard(
                icon: "⏱️",
                value: "\(totalMinutes)",
                label: "累计分钟",
                color: .primary
            )
        }
    }
}

struct StatCard: View {
    let icon: String
    let value: String
    let label: String
    let color: Color

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.surface)
                .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)

            VStack(spacing: 8) {
                Text(icon)
                    .font(.system(size: 28))

                Text(value)
                    .font(.customHeadline(24))
                    .foregroundColor(color)

                Text(label)
                    .font(.customCaption())
                    .foregroundColor(.textSecondary)
            }
            .padding(.vertical, 20)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - 区块标题
struct SectionHeader: View {
    let title: String

    var body: some View {
        Text(title)
            .font(.customHeadline(20))
            .foregroundColor(.textPrimary)
            .padding(.top, 4)
    }
}

// MARK: - 场景模式
struct SceneModeGrid: View {
    let onSceneSelected: (SceneMode) -> Void

    private let scenes: [SceneMode] = SceneModeRepository.shared.sceneModes

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(scenes) { scene in
                    Button(action: {
                        onSceneSelected(scene)
                    }) {
                        SceneModeCard(scene: scene)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

struct SceneModeCard: View {
    let scene: SceneMode

    var body: some View {
        VStack(spacing: 8) {
            Text(scene.icon)
                .font(.system(size: 32))
                .frame(width: 100, height: 80)
                .background(Color.primary.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 16))

            Text(scene.name)
                .font(.customBody())
                .foregroundColor(.textPrimary)
                .lineLimit(1)

            Text(scene.recommendedTime)
                .font(.customCaption())
                .foregroundColor(.textSecondary)
                .lineLimit(1)
        }
        .frame(width: 100)
    }
}

// MARK: - 推荐运动
struct RecommendedExercises: View {
    let onExerciseSelected: (Exercise) -> Void

    private let recommended: [Exercise] = {
        let all = StandardActionRepository.shared.standardActions
        return Array(all.shuffled().prefix(6))
    }()

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(recommended) { exercise in
                    Button(action: {
                        onExerciseSelected(exercise)
                    }) {
                        RecommendedExerciseCard(exercise: exercise)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

struct RecommendedExerciseCard: View {
    let exercise: Exercise

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(exercise.icon)
                .font(.system(size: 36))
                .frame(maxWidth: .infinity)
                .frame(height: 60)
                .background(Color.primary.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 12))

            Text(exercise.name)
                .font(.customBody())
                .foregroundColor(.textPrimary)
                .lineLimit(1)

            Text("\(exercise.reps)次")
                .font(.customCaption())
                .foregroundColor(.textSecondary)
        }
        .frame(width: 140)
    }
}

// MARK: - 成就徽章行
struct AchievementsRow: View {
    let achievements: [Achievement]

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(achievements) { achievement in
                    AchievementBadge(achievement: achievement)
                }
            }
        }
    }
}

struct AchievementBadge: View {
    let achievement: Achievement

    var body: some View {
        VStack(spacing: 6) {
            Text(achievement.icon)
                .font(.system(size: 28))
                .frame(width: 60, height: 60)
                .background(
                    achievement.unlocked
                        ? LinearGradient.goldGradient
                        : LinearGradient(
                            colors: [Color.gray.opacity(0.3), Color.gray.opacity(0.2)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                )
                .clipShape(RoundedRectangle(cornerRadius: 16))

            Text(achievement.name)
                .font(.system(size: 10))
                .foregroundColor(.textSecondary)
                .frame(width: 70)
                .lineLimit(1)
        }
    }
}

struct HomeView_Previews: PreviewProvider {
    static var previews: some View {
        HomeView()
            .environmentObject(AppState())
    }
}
