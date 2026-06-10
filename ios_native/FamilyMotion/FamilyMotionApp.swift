//
//  FamilyMotionApp.swift
//  FamilyMotion
//
//  Created by FamilyMotion on 2026/06/10.
//

import SwiftUI

@main
struct FamilyMotionApp: App {

    // 全局状态
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
                .onAppear {
                    // 应用启动时的初始化（如需加载本地数据等）
                }
        }
    }
}

// MARK: - RootView 根视图
struct RootView: View {

    @EnvironmentObject var appState: AppState

    var body: some View {
        TabView(selection: $appState.currentTab) {

            // 首页
            HomeView()
                .environmentObject(appState)
                .tabItem {
                    Image(systemName: "house.fill")
                    Text("首页")
                }
                .tag(AppState.AppTab.home)

            // 运动
            ExerciseQuickStartTabView()
                .environmentObject(appState)
                .tabItem {
                    Image(systemName: "flame.fill")
                    Text("运动")
                }
                .tag(AppState.AppTab.exercise)

            // 测评
            AssessmentView()
                .environmentObject(appState)
                .tabItem {
                    Image(systemName: "timer")
                    Text("测评")
                }
                .tag(AppState.AppTab.assessment)

            // 我的
            ProfileView()
                .environmentObject(appState)
                .tabItem {
                    Image(systemName: "person.fill")
                    Text("我的")
                }
                .tag(AppState.AppTab.profile)
        }
        .tint(.primary)
        .onAppear {
            // 自定义 Tab Bar 外观
            let appearance = UITabBarAppearance()
            appearance.configureWithDefaultBackground()
            UITabBar.appearance().standardAppearance = appearance
            if #available(iOS 15.0, *) {
                UITabBar.appearance().scrollEdgeAppearance = appearance
            }
        }
    }
}

// MARK: - 运动快捷启动 Tab
struct ExerciseQuickStartTabView: View {

    @EnvironmentObject var appState: AppState
    @State private var selectedPlan: ExercisePlan? = nil
    @State private var showExercise = false

    private let recommendedExercises: [Exercise] = {
        let all = StandardActionRepository.shared.standardActions
        return Array(all.shuffled().prefix(8))
    }()

    var body: some View {
        NavigationView {
            ZStack {
                Color.background.ignoresSafeArea()

                ScrollView(.vertical, showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 16) {

                        // 推荐计划横幅
                        ZStack {
                            RoundedRectangle(cornerRadius: 20)
                                .fill(LinearGradient.primaryGradient)

                            HStack(spacing: 16) {
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("今日推荐")
                                        .font(.customHeadline(18))
                                        .foregroundColor(.white)

                                    Text(appState.todayPlan?.title ?? "活力亲子运动")
                                        .font(.customTitle())
                                        .foregroundColor(.white)

                                    Text("\(appState.todayPlan?.exercises.count ?? 5)个动作 · 约 \(appState.todayPlan?.duration ?? 15)分钟")
                                        .font(.customCaption())
                                        .foregroundColor(.white.opacity(0.8))

                                    Button(action: {
                                        if let plan = appState.todayPlan {
                                            selectedPlan = plan
                                            showExercise = true
                                        }
                                    }) {
                                        HStack {
                                            Image(systemName: "play.fill")
                                            Text("开始运动")
                                        }
                                        .font(.customHeadline(14))
                                        .foregroundColor(.primary)
                                        .padding(.horizontal, 20)
                                        .padding(.vertical, 10)
                                        .background(Color.white)
                                        .clipShape(Capsule())
                                    }
                                }

                                Spacer()

                                Text("🏃")
                                    .font(.system(size: 100))
                            }
                            .padding(24)
                        }
                        .padding(.top, 16)

                        // 场景模式
                        SectionHeader(title: "场景模式")

                        SceneModeGrid(
                            onSceneSelected: { scene in
                                let plan = PlanRecommendationService.shared.generateScenePlan(sceneMode: scene)
                                selectedPlan = plan
                                showExercise = true
                            }
                        )

                        // 动作库
                        SectionHeader(title: "动作库")

                        LazyVGrid(
                            columns: [
                                GridItem(.flexible(), spacing: 12),
                                GridItem(.flexible(), spacing: 12),
                                GridItem(.flexible(), spacing: 12)
                            ],
                            spacing: 12
                        ) {
                            ForEach(recommendedExercises) { exercise in
                                Button(action: {
                                    let plan = ExercisePlan(
                                        id: "temp_\(exercise.id)",
                                        title: exercise.name,
                                        planDescription: "快速练习 \(exercise.name)",
                                        duration: max(5, exercise.duration / 60),
                                        difficulty: exercise.difficulty,
                                        exercises: [exercise]
                                    )
                                    selectedPlan = plan
                                    showExercise = true
                                }) {
                                    ExerciseGridItem(exercise: exercise)
                                }
                                .buttonStyle(.plain)
                            }
                        }

                        Color.clear.frame(height: 40)
                    }
                    .padding(.horizontal, 16)
                }
                .navigationBarTitle("运动", displayMode: .inline)
                .navigationBarHidden(false)

                // 跳转到运动页
                if showExercise, let plan = selectedPlan {
                    NavigationLink(
                        destination: ExerciseView(plan: plan)
                            .environmentObject(appState),
                        isActive: $showExercise
                    ) { EmptyView() }
                }
            }
        }
        .navigationViewStyle(.stack)
    }
}

// MARK: - 运动网格项
struct ExerciseGridItem: View {

    let exercise: Exercise

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color.primary.opacity(0.1))

                Text(exercise.icon)
                    .font(.system(size: 48))
            }
            .frame(height: 100)

            Text(exercise.name)
                .font(.customCaption())
                .foregroundColor(.textPrimary)
                .lineLimit(1)

            Text("\(exercise.reps)次")
                .font(.system(size: 10))
                .foregroundColor(.textSecondary)
        }
        .padding(8)
        .background(Color.surface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: Color.black.opacity(0.05), radius: 4)
    }
}

// MARK: - SceneModeGrid（HStack 版本）
struct SceneModeGrid: View {
    let onSceneSelected: (SceneMode) -> Void

    private let scenes: [SceneMode] = SceneModeRepository.shared.sceneModes

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(scenes) { scene in
                    Button(action: { onSceneSelected(scene) }) {
                        SceneModeCard(scene: scene)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

// MARK: - SceneModeCard（复用 Home 中的样式）
struct SceneModeCard: View {
    let scene: SceneMode

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color.primary.opacity(0.1))

                Text(scene.icon)
                    .font(.system(size: 40))
            }
            .frame(width: 120, height: 90)

            Text(scene.name)
                .font(.customHeadline(14))
                .foregroundColor(.textPrimary)

            Text(scene.recommendedTime)
                .font(.system(size: 11))
                .foregroundColor(.textSecondary)
        }
        .padding(.horizontal, 8)
    }
}
