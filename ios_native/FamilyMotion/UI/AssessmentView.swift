//
//  AssessmentView.swift
//  FamilyMotion
//
//  Created by FamilyMotion on 2026/06/10.
//

import SwiftUI

// MARK: - AssessmentView 体能测评
struct AssessmentView: View {

    @EnvironmentObject var appState: AppState
    @State private var currentIndex: Int = 0
    @State private var isPlaying: Bool = false
    @State private var countdown: Int = 3
    @State private var score: Int = 0
    @State private var scores: [AssessmentType: Int] = [:]
    @State private var showResult: Bool = false
    @State private var timer: Timer? = nil

    let assessments: [AssessmentItem] = Assessment.assessments

    var body: some View {
        NavigationView {
            ZStack {
                Color.background.ignoresSafeArea()

                VStack(alignment: .leading, spacing: 16) {

                    // 顶部进度
                    HStack(spacing: 4) {
                        ForEach(0..<assessments.count, id: \.self) { idx in
                            Capsule()
                                .frame(height: 4)
                                .foregroundColor(
                                    scores[assessments[idx].type] != nil
                                        ? .primary
                                        : idx == currentIndex
                                            ? Color.primary.opacity(0.5)
                                            : Color.gray.opacity(0.3)
                                )
                        }
                    }
                    .padding(.top, 8)

                    // 动作卡片
                    if !showResult {
                        let assessment = assessments[currentIndex]

                        VStack(spacing: 16) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 20)
                                    .fill(LinearGradient.primaryGradient)

                                VStack(spacing: 12) {
                                    Text(assessment.icon)
                                        .font(.system(size: 80))

                                    Text(assessment.name)
                                        .font(.customTitle(24))
                                        .foregroundColor(.white)

                                    Text(assessment.description)
                                        .font(.customBody())
                                        .foregroundColor(.white.opacity(0.8))
                                }
                                .padding(24)
                            }
                            .frame(maxWidth: .infinity)

                            // 游戏说明
                            VStack(alignment: .leading, spacing: 12) {
                                Text("游戏说明")
                                    .font(.customHeadline(18))
                                    .foregroundColor(.textPrimary)

                                Text(assessment.gameInstruction)
                                    .font(.customBody())
                                    .foregroundColor(.textSecondary)

                                HStack {
                                    Spacer()

                                    Label(
                                        "\(assessment.duration)秒",
                                        systemImage: "timer"
                                    )
                                    .font(.customHeadline())
                                    .foregroundColor(.primary)
                                }
                            }
                            .padding(20)
                            .background(Color.surface)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .shadow(color: Color.black.opacity(0.05), radius: 8)

                            Spacer()

                            // 倒计时或得分显示
                            if isPlaying {
                                VStack(spacing: 16) {
                                    if countdown > 0 {
                                        Text("\(countdown)")
                                            .font(.system(size: 120, weight: .bold))
                                            .foregroundColor(.primary)
                                    } else {
                                        VStack(spacing: 8) {
                                            Text(assessment.icon)
                                                .font(.system(size: 80))

                                            Text("得分: \(score)")
                                                .font(.customTitle(28))
                                                .foregroundColor(.primary)
                                        }
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 32)
                                .background(Color.primary.opacity(0.05))
                                .clipShape(RoundedRectangle(cornerRadius: 16))
                            }

                            Spacer()

                            // 按钮
                            if !isPlaying {
                                Button(action: startAssessment) {
                                    Text(currentIndex >= assessments.count - 1 && scores.count >= assessments.count ? "完成测评" : "开始测试")
                                        .font(.customHeadline(18))
                                        .foregroundColor(.white)
                                        .padding()
                                        .frame(maxWidth: .infinity)
                                        .background(Color.primary)
                                        .clipShape(RoundedRectangle(cornerRadius: 28))
                                }
                                .disabled(scores.count >= assessments.count && currentIndex >= assessments.count - 1)
                            }
                        }
                    } else {
                        // 结果页面
                        AssessmentResultView(
                            scores: scores,
                            onBack: {
                                showResult = false
                                currentIndex = 0
                                scores.removeAll()
                                score = 0
                            }
                        )
                    }
                }
                .padding(.horizontal, 16)
            }
            .navigationBarTitle("体能测评", displayMode: .inline)
            .navigationBarHidden(false)
        }
        .navigationViewStyle(.stack)
    }

    // MARK: - 开始测评
    private func startAssessment() {

        // 重置
        countdown = 3
        isPlaying = true
        score = 0

        // 倒计时
        Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { t in
            if countdown > 1 {
                countdown -= 1
            } else {
                t.invalidate()
                // 启动得分动画（模拟）
                startScoring()
            }
        }
    }

    // 模拟得分
    private func startScoring() {
        let assessment = assessments[currentIndex]

        // 模拟：每秒增加分数
        Timer.scheduledTimer(withTimeInterval: 0.2, repeats: true) { t in
            if score < 100 {
                score = min(100, score + Int.random(in: 2...6))
            } else {
                t.invalidate()
                // 保存本次测评结果
                scores[assessment.type] = score

                // 延迟一会儿后切换到下一个或完成
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                    if currentIndex < assessments.count - 1 {
                        currentIndex += 1
                        isPlaying = false
                        score = 0
                    } else {
                        // 全部完成
                        isPlaying = false

                        // 计算综合得分
                        let totalScore = scores.values.reduce(0, +) / max(scores.count, 1)
                        let result = AssessmentResult(
                            id: UUID().uuidString,
                            timestamp: Date(),
                            scores: scores,
                            overallScore: totalScore,
                            grade: AssessmentResult.calculateGrade(score: totalScore)
                        )
                        appState.saveAssessmentResult(result)
                        showResult = true
                    }
                }
            }
        }
    }
}

// MARK: - 测评项目数据
struct AssessmentItem {
    let type: AssessmentType
    let name: String
    let description: String
    let icon: String
    let duration: Int
    let gameInstruction: String
}

struct Assessment {
    static let assessments: [AssessmentItem] = [
        AssessmentItem(
            type: .reaction,
            name: "反应测试",
            description: "测试你的反应速度",
            icon: "🐡",
            duration: 10,
            gameInstruction: "看到提示时尽快做出反应"
        ),
        AssessmentItem(
            type: .accuracy,
            name: "准确度测试",
            description: "测试你的动作精准度",
            icon: "❤️",
            duration: 15,
            gameInstruction: "尽量保持动作的标准与准确"
        ),
        AssessmentItem(
            type: .power,
            name: "爆发力测试",
            description: "测试你的爆发力",
            icon: "📦",
            duration: 20,
            gameInstruction: "用力完成动作，释放你的力量"
        ),
        AssessmentItem(
            type: .endurance,
            name: "下肢力量测试",
            description: "测试你的持续运动能力",
            icon: "🐹",
            duration: 30,
            gameInstruction: "保持节奏，坚持到底"
        ),
        AssessmentItem(
            type: .balance,
            name: "平衡测试",
            description: "测试你的平衡能力",
            icon: "🏎️",
            duration: 15,
            gameInstruction: "保持身体的稳定与平衡"
        ),
        AssessmentItem(
            type: .coordination,
            name: "协调性测试",
            description: "测试你的手脚协调性",
            icon: "👯",
            duration: 20,
            gameInstruction: "协调完成复合动作"
        )
    ]
}

// MARK: - 测评结果页面
struct AssessmentResultView: View {

    let scores: [AssessmentType: Int]
    let onBack: () -> Void

    var overallScore: Int {
        guard !scores.isEmpty else { return 0 }
        return scores.values.reduce(0, +) / scores.count
    }

    var grade: String {
        AssessmentResult.calculateGrade(score: overallScore)
    }

    var body: some View {
        VStack(spacing: 20) {

            // 总分显示
            ZStack {
                RoundedRectangle(cornerRadius: 24)
                    .fill(LinearGradient.primaryGradient)

                VStack(spacing: 8) {
                    Text("🎉")
                        .font(.system(size: 48))

                    Text("\(overallScore)")
                        .font(.system(size: 80, weight: .bold))
                        .foregroundColor(.white)

                    Text(grade)
                        .font(.customHeadline(20))
                        .foregroundColor(.white)

                    Text("你的体能测评完成！")
                        .font(.customBody())
                        .foregroundColor(.white.opacity(0.8))
                }
                .padding(32)
            }

            // 分项得分
            VStack(alignment: .leading, spacing: 12) {
                ForEach(AssessmentType.allCases, id: \.self) { type in
                    let score = scores[type] ?? 0

                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(type.icon)
                                .font(.system(size: 20))

                            Text(type.displayName)
                                .font(.customBody())
                                .foregroundColor(.textPrimary)

                            Spacer()

                            Text("\(score)")
                                .font(.customHeadline(18))
                                .foregroundColor(Color.scoreColor(for: score))
                        }

                        ProgressView(value: Double(score), max: 100)
                            .progressViewStyle(.linear)
                            .tint(Color.scoreColor(for: score))
                    }
                    .padding(.vertical, 8)
                }
            }
            .padding(20)
            .background(Color.surface)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .shadow(color: Color.black.opacity(0.05), radius: 8)

            Spacer()

            Button(action: onBack) {
                Text("返回首页")
                    .font(.customHeadline(18))
                    .foregroundColor(.white)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.primary)
                    .clipShape(RoundedRectangle(cornerRadius: 28))
            }
        }
    }
}

// MARK: - AssessmentType 扩展
extension AssessmentType {
    var displayName: String {
        switch self {
        case .reaction: return "反应速度"
        case .accuracy: return "动作准确度"
        case .power: return "爆发力"
        case .endurance: return "下肢力量"
        case .balance: return "平衡力"
        case .coordination: return "协调性"
        }
    }

    var icon: String {
        switch self {
        case .reaction: return "🐡"
        case .accuracy: return "❤️"
        case .power: return "📦"
        case .endurance: return "🐹"
        case .balance: return "🏎️"
        case .coordination: return "👯"
        }
    }
}

struct AssessmentView_Previews: PreviewProvider {
    static var previews: some View {
        AssessmentView()
            .environmentObject(AppState())
    }
}
