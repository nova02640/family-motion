//
//  ExerciseViewModel.swift
//  FamilyMotion
//
//  Created by FamilyMotion on 2026/06/10.
//

import Foundation
import SwiftUI
import Combine
import AVFoundation
import Vision

// MARK: - 运动视图状态
struct ExerciseViewState {

    // 显示阶段
    enum Phase {
        case preparation      // 准备阶段（倒计时）
        case inProgress       // 运动进行中
        case completed        // 单次动作完成
        case planFinished     // 计划全部完成
    }

    var phase: Phase = .preparation
    var countdown: Int = 3
    var currentScore: ScoreResult? = nil
    var repCount: Int = 0
    var currentExerciseIndex: Int = 0
    var exerciseScores: [Int] = []
    var totalScore: Int {
        exerciseScores.reduce(0, +)
    }
    var isPlaying: Bool = false
}

// MARK: - ExerciseViewModel
@MainActor
final class ExerciseViewModel: ObservableObject {

    // MARK: 状态
    @Published var state: ExerciseViewState = ExerciseViewState()
    @Published var poseData: PoseData? = nil
    @Published var isCameraAuthorized: Bool = false
    @Published var showCameraPermissionAlert: Bool = false

    // MARK: 外部依赖
    let plan: ExercisePlan
    let poseService: PoseDetectionService
    let scoringEngine: ActionScoringEngine

    // MARK: 定时器
    private var timer: Timer?
    private var countdownTimer: Timer?

    // MARK: 初始化
    init(plan: ExercisePlan) {
        self.plan = plan
        self.poseService = PoseDetectionService()
        self.scoringEngine = ActionScoringEngine()

        // 订阅骨骼检测结果
        // 注意：因为我们在不同线程处理，这里手动在外部通过 updatePoseData 传递

        // 检查权限
        Task {
            await checkCameraPermission()
        }
    }

    deinit {
        stopAll()
    }

    // MARK: - 权限检查
    func checkCameraPermission() async {
        let authorized = await poseService.checkCameraPermission()
        isCameraAuthorized = authorized
    }

    // MARK: - 启动倒计时
    func startCountdown() {
        scoringEngine.reset()
        state.countdown = 3
        state.phase = .preparation
        state.repCount = 0

        countdownTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] timer in
            Task { @MainActor in
                guard let self = self else { return }

                if self.state.countdown > 1 {
                    self.state.countdown -= 1
                } else {
                    timer.invalidate()
                    self.startExercise()
                }
            }
        }
    }

    // MARK: - 启动运动
    private func startExercise() {
        state.phase = .inProgress
        state.isPlaying = true

        // 启动相机追踪
        poseService.startTracking()

        // 启动定时评分（每 0.5 秒）
        timer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { [weak self] timer in
            Task { @MainActor in
                self?.performScoring()
            }
        }
    }

    // MARK: - 执行评分
    private func performScoring() {
        guard let pose = poseData else { return }

        let currentExercise = plan.exercises[state.currentExerciseIndex]
        let result = scoringEngine.scoreAction(
            currentPose: pose,
            targetExercise: currentExercise
        )

        state.currentScore = result

        // 检测是否完成一次动作
        if let previousPose = poseData, pose != previousPose {
            if scoringEngine.detectRepCompletion(
                currentPose: pose,
                previousPose: previousPose,
                exercise: currentExercise
            ) {
                state.repCount += 1

                if state.repCount >= currentExercise.reps {
                    completeCurrentExercise()
                }
            }
        }
    }

    // MARK: - 更新骨骼数据
    func updatePoseData(_ pose: PoseData) {
        self.poseData = pose
    }

    // MARK: - 暂停
    func pauseExercise() {
        state.isPlaying = false
        timer?.invalidate()
        timer = nil
        poseService.stopTracking()
    }

    // MARK: - 恢复
    func resumeExercise() {
        state.isPlaying = true
        poseService.startTracking()

        timer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { [weak self] timer in
            Task { @MainActor in
                self?.performScoring()
            }
        }
    }

    // MARK: - 完成当前动作
    func completeCurrentExercise() {
        pauseExercise()

        if let score = state.currentScore {
            state.exerciseScores.append(score.totalScore)
        } else {
            state.exerciseScores.append(0)
        }

        state.phase = .completed
    }

    // MARK: - 进入下一个动作
    func nextExercise() {
        if state.currentExerciseIndex + 1 >= plan.exercises.count {
            // 全部完成
            state.phase = .planFinished
        } else {
            state.currentExerciseIndex += 1
            state.repCount = 0
            state.currentScore = nil
            startCountdown()
        }
    }

    // MARK: - 重置
    func reset() {
        stopAll()
        state = ExerciseViewState()
    }

    // MARK: - 停止所有
    private func stopAll() {
        timer?.invalidate()
        countdownTimer?.invalidate()
        timer = nil
        countdownTimer = nil
        poseService.stopTracking()
        state.isPlaying = false
    }

    // MARK: - 计算属性
    var currentExercise: Exercise {
        return plan.exercises[state.currentExerciseIndex]
    }

    var progressText: String {
        return "\(state.currentExerciseIndex + 1) / \(plan.exercises.count)"
    }

    var averageScore: Int {
        guard !state.exerciseScores.isEmpty else { return 0 }
        return state.exerciseScores.reduce(0, +) / state.exerciseScores.count
    }
}
