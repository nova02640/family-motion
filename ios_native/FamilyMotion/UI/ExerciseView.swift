//
//  ExerciseView.swift
//  FamilyMotion
//
//  Created by FamilyMotion on 2026/06/10.
//

import SwiftUI
import AVFoundation
import UIKit

// MARK: - ExerciseView 运动界面
struct ExerciseView: View {

    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel: ExerciseViewModel

    @State private var showPermissionAlert = false
    @State private var showResult = false

    init(plan: ExercisePlan) {
        _viewModel = StateObject(wrappedValue: ExerciseViewModel(plan: plan))
    }

    var body: some View {
        ZStack {

            // 背景
            if viewModel.state.phase == .preparation {
                preparationBackground
            } else if viewModel.state.phase == .planFinished {
                finishedBackground
            } else {
                exerciseBackground
            }

            // 相机预览（进行中显示）
            if viewModel.state.phase == .inProgress {
                CameraPreview(poseService: viewModel.poseService)
                    .edgesIgnoringSafeArea(.all)
            }

            // 内容层
            VStack {

                switch viewModel.state.phase {

                case .preparation:
                    PreparationView(
                        viewModel: viewModel,
                        onStart: {
                            if viewModel.isCameraAuthorized {
                                viewModel.startCountdown()
                            } else {
                                showPermissionAlert = true
                            }
                        }
                    )

                case .inProgress:
                    InProgressView(
                        viewModel: viewModel,
                        onPause: { viewModel.pauseExercise() },
                        onComplete: { viewModel.completeCurrentExercise() }
                    )

                case .completed:
                    CompletedView(
                        viewModel: viewModel,
                        onNext: { viewModel.nextExercise() },
                        onFinish: {
                            dismiss()
                        }
                    )

                case .planFinished:
                    PlanFinishedView(
                        viewModel: viewModel,
                        onFinish: {
                            appState.finishExercise()
                            dismiss()
                        }
                    )
                }
            }
            .padding()
        }
        .navigationBarBackButtonHidden(true)
        .navigationBarHidden(true)
        .alert("需要相机权限", isPresented: $showPermissionAlert) {
            Button("取消", role: .cancel) { }
            Button("前往设置") {
                if let url = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(url)
                }
            }
        } message: {
            Text("请在设置中允许相机访问以进行体感动作识别")
        }
    }

    // MARK: - 背景样式
    private var preparationBackground: some View {
        LinearGradient(
            colors: [Color.darkBackground, Color.darkSurface],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        .ignoresSafeArea()
    }

    private var exerciseBackground: some View {
        Color.black.opacity(0.9)
            .ignoresSafeArea()
    }

    private var finishedBackground: some View {
        LinearGradient.primaryGradient
            .ignoresSafeArea()
    }
}

// MARK: - 准备阶段
struct PreparationView: View {

    @ObservedObject var viewModel: ExerciseViewModel
    let onStart: () -> Void

    var body: some View {
        VStack(spacing: 24) {

            // 返回按钮
            HStack {
                Button(action: {
                    viewModel.reset()
                }) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 32))
                        .foregroundColor(.white)
                }
                Spacer()

                Text(viewModel.progressText)
                    .font(.customHeadline(16))
                    .foregroundColor(.white)
            }

            Spacer()

            // 倒计时或动作图标
            if viewModel.state.countdown < 3 {
                Text("\(viewModel.state.countdown)")
                    .font(.system(size: 150, weight: .bold))
                    .foregroundColor(.white)
            } else {
                Text(viewModel.currentExercise.icon)
                    .font(.system(size: 120))
                    .padding()
                    .background(Color.white.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 24))
            }

            Text(viewModel.currentExercise.name)
                .font(.customTitle(28))
                .foregroundColor(.white)

            Text(viewModel.currentExercise.exerciseDescription)
                .font(.customBody())
                .foregroundColor(.white.opacity(0.7))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            HStack(spacing: 12) {
                Label(
                    "\(viewModel.currentExercise.reps)次",
                    systemImage: "number.circle"
                )
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color.primary.opacity(0.8))
                .clipShape(Capsule())
                .foregroundColor(.white)

                if viewModel.currentExercise.duration > 0 {
                    Label(
                        "\(viewModel.currentExercise.duration)秒",
                        systemImage: "timer"
                    )
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color.secondary.opacity(0.8))
                    .clipShape(Capsule())
                    .foregroundColor(.white)
                }
            }

            Spacer()

            // 开始按钮
            Button(action: onStart) {
                HStack {
                    Image(systemName: "play.fill")
                    Text("开始动作")
                }
                .font(.customHeadline(18))
                .foregroundColor(.white)
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color.primary)
                .clipShape(RoundedRectangle(cornerRadius: 28))
            }
            .padding(.bottom, 32)
        }
        .padding()
    }
}

// MARK: - 进行中
struct InProgressView: View {

    @ObservedObject var viewModel: ExerciseViewModel
    let onPause: () -> Void
    let onComplete: () -> Void

    var body: some View {
        VStack {

            // 顶部栏
            HStack {
                Button(action: onPause) {
                    Image(systemName: "pause.circle.fill")
                        .font(.system(size: 32))
                        .foregroundColor(.white)
                }

                Spacer()

                Text(viewModel.currentExercise.name)
                    .font(.customHeadline(18))
                    .foregroundColor(.white)

                Spacer()

                Text("\(viewModel.state.repCount) / \(viewModel.currentExercise.reps)")
                    .font(.customHeadline(18))
                    .foregroundColor(.white)
            }

            Spacer()

            // 当前分数展示
            if let score = viewModel.state.currentScore {
                VStack(spacing: 16) {
                    VStack(spacing: 8) {
                        Text("\(score.totalScore)")
                            .font(.system(size: 80, weight: .bold))
                            .foregroundColor(Color.scoreColor(for: score.totalScore))

                        Text("实时得分")
                            .font(.customCaption())
                            .foregroundColor(.white.opacity(0.8))
                    }
                    .padding(32)
                    .background(Color.black.opacity(0.5))
                    .clipShape(RoundedRectangle(cornerRadius: 20))

                    // 进度条
                    VStack(alignment: .leading, spacing: 8) {
                        ProgressView(value: Double(min(viewModel.state.repCount, viewModel.currentExercise.reps)), max: Double(viewModel.currentExercise.reps)) {
                            Text("完成进度")
                                .foregroundColor(.white)
                        }
                        .tint(Color.scoreColor(for: score.totalScore))
                        .progressViewStyle(.linear)
                    }
                    .padding()

                    // 反馈信息
                    if !score.feedback.isEmpty {
                        ForEach(score.feedback.prefix(2), id: \.self) { feedback in
                            Text(feedback)
                                .font(.customBody())
                                .foregroundColor(.yellow)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(Color.black.opacity(0.6))
                                .clipShape(Capsule())
                        }
                    }
                }
            } else {
                VStack(spacing: 16) {
                    Text("📷")
                        .font(.system(size: 80))

                    Text("正在识别动作...")
                        .font(.customBody())
                        .foregroundColor(.white)
                }
                .padding(32)
                .background(Color.black.opacity(0.5))
                .clipShape(RoundedRectangle(cornerRadius: 20))
            }

            Spacer()

            // 完成按钮
            Button(action: onComplete) {
                Text("完成动作")
                    .font(.customHeadline(18))
                    .foregroundColor(.white)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.success)
                    .clipShape(RoundedRectangle(cornerRadius: 28))
            }
            .padding(.bottom, 16)
        }
    }
}

// MARK: - 单个动作完成
struct CompletedView: View {

    @ObservedObject var viewModel: ExerciseViewModel
    let onNext: () -> Void
    let onFinish: () -> Void

    var body: some View {
        VStack(spacing: 20) {

            Text("🎉")
                .font(.system(size: 120))

            Text("动作完成！")
                .font(.customTitle(32))
                .foregroundColor(.white)

            if let score = viewModel.state.currentScore {
                VStack(spacing: 12) {
                    Text("\(score.totalScore)")
                        .font(.system(size: 96, weight: .bold))
                        .foregroundColor(Color.scoreColor(for: score.totalScore))

                    Text("得分")
                        .font(.customHeadline())
                        .foregroundColor(.white.opacity(0.8))
                }
                .padding(32)
                .background(Color.black.opacity(0.3))
                .clipShape(RoundedRectangle(cornerRadius: 24))
            }

            Spacer()

            // 进度
            Text("已完成 \(viewModel.state.currentExerciseIndex + 1) / \(viewModel.plan.exercises.count)")
                .font(.customBody())
                .foregroundColor(.white.opacity(0.8))

            // 下一个 / 结束
            HStack(spacing: 16) {
                Button(action: onFinish) {
                    Text("结束")
                        .font(.customHeadline(18))
                        .foregroundColor(.white)
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color.gray.opacity(0.5))
                        .clipShape(RoundedRectangle(cornerRadius: 28))
                }

                Button(action: onNext) {
                    Text(viewModel.state.currentExerciseIndex + 1 >= viewModel.plan.exercises.count ? "查看结果" : "下一个")
                        .font(.customHeadline(18))
                        .foregroundColor(.white)
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color.primary)
                        .clipShape(RoundedRectangle(cornerRadius: 28))
                }
            }
            .padding(.bottom, 32)
        }
    }
}

// MARK: - 计划完成
struct PlanFinishedView: View {

    @ObservedObject var viewModel: ExerciseViewModel
    let onFinish: () -> Void

    var body: some View {
        VStack(spacing: 24) {

            Text("🏆")
                .font(.system(size: 140))

            Text("运动完成！")
                .font(.customTitle(32))
                .foregroundColor(.white)

            VStack(spacing: 16) {
                Text("\(viewModel.state.totalScore)")
                    .font(.system(size: 120, weight: .bold))
                    .foregroundColor(.white)

                Text("总得分")
                    .font(.customHeadline())
                    .foregroundColor(.white.opacity(0.8))

                if viewModel.state.exerciseScores.count > 1 {
                    HStack(spacing: 12) {
                        ForEach(viewModel.state.exerciseScores, id: \.self) { score in
                            VStack {
                                Text("\(score)")
                                    .font(.customHeadline(16))
                                    .foregroundColor(Color.scoreColor(for: score))
                                    .frame(width: 48, height: 48)
                                    .background(Color.white.opacity(0.2))
                                    .clipShape(Circle())
                            }
                        }
                    }
                }
            }
            .padding(32)
            .background(Color.white.opacity(0.1))
            .clipShape(RoundedRectangle(cornerRadius: 24))

            Spacer()

            Button(action: onFinish) {
                Text("返回首页")
                    .font(.customHeadline(18))
                    .foregroundColor(.primary)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 28))
            }
            .padding(.bottom, 32)
        }
    }
}

// MARK: - 相机预览 UIViewRepresentable
struct CameraPreview: UIViewRepresentable {

    let poseService: PoseDetectionService
    @State private var containerView = UIView()

    func makeUIView(context: Context) -> UIView {
        containerView.backgroundColor = .black
        return containerView
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        // 在实际设备上会启动相机并嵌入预览层
        // 这里是示例实现
        uiView.frame = UIScreen.main.bounds
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject {
        var parent: CameraPreview
        init(_ parent: CameraPreview) { self.parent = parent }
    }
}

struct ExerciseView_Previews: PreviewProvider {
    static var previews: some View {
        ExerciseView(
            plan: ExercisePlan(
                id: "preview",
                title: "今日计划",
                planDescription: "预览",
                duration: 10,
                difficulty: .easy,
                exercises: StandardActionRepository.shared.standardActions
            )
        )
        .environmentObject(AppState())
    }
}
