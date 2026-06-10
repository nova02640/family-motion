//
//  ParentControlView.swift
//  FamilyMotion
//
//  Created by FamilyMotion on 2026/06/10.
//

import SwiftUI

// MARK: - ParentControlView 家长控制界面
struct ParentControlView: View {

    @EnvironmentObject var appState: AppState
    @State private var maxExerciseMinutes: Int = 60
    @State private var contentFilter: String = "儿童安全"
    @State private var eyeCareInterval: Int = 30
    @State private var notificationsEnabled: Bool = true

    var body: some View {
        ZStack {
            Color.background.ignoresSafeArea()

            ScrollView(.vertical, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 20) {

                    // 今日运动数据
                    TodayStatsCard(userProfile: appState.userProfile)
                        .padding(.top, 16)

                    // 儿童信息
                    ChildInfoCard(userProfile: appState.userProfile)

                    // 本周运动周报
                    SectionHeader(title: "本周运动周报")

                    WeeklyReportCard(
                        totalMinutes: appState.userProfile.totalExerciseMinutes,
                        streakDays: appState.userProfile.streakDays
                    )

                    // 设置
                    SectionHeader(title: "家长设置")

                    SettingsCard(
                        maxExerciseMinutes: $maxExerciseMinutes,
                        contentFilter: $contentFilter,
                        eyeCareInterval: $eyeCareInterval,
                        notificationsEnabled: $notificationsEnabled
                    )

                    // 消息通知
                    SectionHeader(title: "消息通知")

                    NotificationCards()

                    // 底部留白
                    Color.clear.frame(height: 40)
                }
                .padding(.horizontal, 16)
            }
        }
        .navigationBarTitle("家长控制", displayMode: .inline)
        .navigationBarHidden(false)
    }
}

// MARK: - 今日运动数据
struct TodayStatsCard: View {
    let userProfile: UserProfile

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 20)
                .fill(LinearGradient.primaryGradient)

            VStack(alignment: .leading, spacing: 16) {
                Text("今日运动数据")
                    .font(.customHeadline(18))
                    .foregroundColor(.white)

                HStack {
                    VStack(spacing: 4) {
                        Text("\(userProfile.totalExerciseMinutes / 10)")
                            .font(.system(size: 32, weight: .bold))
                            .foregroundColor(.white)

                        Text("运动时长(分钟)")
                            .font(.customCaption())
                            .foregroundColor(.white.opacity(0.8))
                    }
                    .frame(maxWidth: .infinity)

                    VStack(spacing: 4) {
                        Text("\(userProfile.streakDays)")
                            .font(.system(size: 32, weight: .bold))
                            .foregroundColor(.white)

                        Text("连续天数")
                            .font(.customCaption())
                            .foregroundColor(.white.opacity(0.8))
                    }
                    .frame(maxWidth: .infinity)

                    VStack(spacing: 4) {
                        Text("\(userProfile.level)")
                            .font(.system(size: 32, weight: .bold))
                            .foregroundColor(.white)

                        Text("完成度")
                            .font(.customCaption())
                            .foregroundColor(.white.opacity(0.8))
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .padding(24)
        }
    }
}

// MARK: - 儿童信息卡
struct ChildInfoCard: View {
    let userProfile: UserProfile

    @State private var showEdit = false

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.surface)
                .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)

            HStack(spacing: 16) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.primary.opacity(0.1))

                    Text(userProfile.avatarEmoji)
                        .font(.system(size: 40))
                }
                .frame(width: 60, height: 60)

                VStack(alignment: .leading, spacing: 4) {
                    Text(userProfile.name)
                        .font(.customHeadline(18))
                        .foregroundColor(.textPrimary)

                    Text("\(userProfile.age)岁 · \(userProfile.gender)")
                        .font(.customBody())
                        .foregroundColor(.textSecondary)

                    HStack(spacing: 12) {
                        Text("身高: \(Int(userProfile.height))cm")
                            .font(.customCaption())
                            .foregroundColor(.textSecondary)

                        Text("体重: \(Int(userProfile.weight))kg")
                            .font(.customCaption())
                            .foregroundColor(.textSecondary)
                    }

                    Text("BMI: \(String(format: "%.1f", userProfile.bmi)) (\(userProfile.bmiCategory))")
                        .font(.customCaption())
                        .foregroundColor(
                            userProfile.bmi >= 18.5 && userProfile.bmi < 24
                                ? Color.success
                                : Color.warning
                        )
                }

                Spacer()

                Button(action: { showEdit = true }) {
                    Image(systemName: "square.and.pencil")
                        .font(.system(size: 20))
                        .foregroundColor(.primary)
                }
                .alert("编辑信息", isPresented: $showEdit) {
                    Button("确定") { }
                } message: {
                    Text("后续版本中支持编辑")
                }
            }
            .padding(16)
        }
    }
}

// MARK: - 周报
struct WeeklyReportCard: View {
    let totalMinutes: Int
    let streakDays: Int

    let weekData: [(day: String, minutes: Int)] = [
        ("一", 40), ("二", 55), ("三", 35), ("四", 60), ("五", 45), ("六", 70), ("日", 50)
    ]

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.surface)
                .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)

            VStack(alignment: .leading, spacing: 16) {

                // 柱状图
                VStack(alignment: .leading, spacing: 12) {
                    Text("运动时长趋势")
                        .font(.customHeadline(16))
                        .foregroundColor(.textPrimary)

                    HStack(alignment: .bottom, spacing: 10) {
                        ForEach(weekData, id: \.day) { item in
                            VStack(spacing: 6) {
                                Text("\(item.minutes)")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(.primary)

                                RoundedRectangle(cornerRadius: 4, style: .continuous)
                                    .fill(Color.primary)
                                    .frame(width: 24, height: CGFloat(item.minutes))

                                Text(item.day)
                                    .font(.system(size: 11))
                                    .foregroundColor(.textSecondary)
                            }
                        }
                    }
                    .padding(.vertical, 12)

                    Divider()

                    // 统计汇总
                    HStack {
                        StatRow(
                            title: "本周运动",
                            value: "\(weekData.map({ $0.minutes }).reduce(0, +))分钟",
                            color: .primary
                        )

                        Spacer()

                        StatRow(
                            title: "连续打卡",
                            value: "\(streakDays)天",
                            color: .secondary
                        )

                        Spacer()

                        StatRow(
                            title: "完成计划",
                            value: "5次",
                            color: .success
                        )
                    }
                    .padding(.top, 8)
                }
            }
            .padding(20)
        }
    }
}

struct StatRow: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.customCaption())
                .foregroundColor(.textSecondary)

            Text(value)
                .font(.customHeadline(16))
                .foregroundColor(color)
        }
    }
}

// MARK: - 设置卡片
struct SettingsCard: View {

    @Binding var maxExerciseMinutes: Int
    @Binding var contentFilter: String
    @Binding var eyeCareInterval: Int
    @Binding var notificationsEnabled: Bool

    @State private var showDurationPicker = false
    @State private var showFilterPicker = false
    @State private var showEyeCarePicker = false

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.surface)
                .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)

            VStack(spacing: 0) {

                // 运动时长上限
                SettingsItem(
                    icon: "timer",
                    iconColor: .primary,
                    title: "运动时长上限",
                    subtitle: "设置每日最大运动时间",
                    trailing: .text("\(maxExerciseMinutes)分钟")
                ) {
                    showDurationPicker = true
                }

                Divider().padding(.leading, 64)

                // 内容过滤
                SettingsItem(
                    icon: "line.horizontal.3.decrease.circle.fill",
                    iconColor: .secondary,
                    title: "内容过滤等级",
                    subtitle: "根据年龄筛选适合的内容",
                    trailing: .text(contentFilter)
                ) {
                    showFilterPicker = true
                }

                Divider().padding(.leading, 64)

                // 护眼提醒
                SettingsItem(
                    icon: "eye.circle.fill",
                    iconColor: .success,
                    title: "护眼提醒间隔",
                    subtitle: "定时提醒休息眼睛",
                    trailing: .text("\(eyeCareInterval)分钟")
                ) {
                    showEyeCarePicker = true
                }

                Divider().padding(.leading, 64)

                // 通知开关
                SettingsItem(
                    icon: "bell.circle.fill",
                    iconColor: .orange,
                    title: "运动通知",
                    subtitle: "接收运动完成和成就提醒",
                    trailing: .toggle($notificationsEnabled)
                ) { }
            }
            .padding(.vertical, 8)
        }

        // 弹窗（简化版）
        .alert("设置每日运动时长", isPresented: $showDurationPicker) {
            Button("30分钟") { maxExerciseMinutes = 30 }
            Button("60分钟") { maxExerciseMinutes = 60 }
            Button("90分钟") { maxExerciseMinutes = 90 }
            Button("取消", role: .cancel) { }
        } message: {
            Text("选择每日运动时长上限")
        }

        .alert("内容过滤等级", isPresented: $showFilterPicker) {
            Button("全部") { contentFilter = "全部" }
            Button("儿童安全") { contentFilter = "儿童安全" }
            Button("青少年") { contentFilter = "青少年" }
            Button("取消", role: .cancel) { }
        } message: {
            Text("选择合适的内容过滤级别")
        }

        .alert("护眼提醒间隔", isPresented: $showEyeCarePicker) {
            Button("20分钟") { eyeCareInterval = 20 }
            Button("30分钟") { eyeCareInterval = 30 }
            Button("60分钟") { eyeCareInterval = 60 }
            Button("取消", role: .cancel) { }
        } message: {
            Text("选择护眼提醒的时间间隔")
        }
    }
}

// MARK: - 设置行
enum SettingsTrailing {
    case text(String)
    case toggle(Binding<Bool>)
}

struct SettingsItem: View {

    let icon: String
    let iconColor: Color
    let title: String
    let subtitle: String
    let trailing: SettingsTrailing
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 16) {
                Image(systemName: icon)
                    .font(.system(size: 24))
                    .foregroundColor(iconColor)

                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.customBody())
                        .foregroundColor(.textPrimary)

                    Text(subtitle)
                        .font(.customCaption())
                        .foregroundColor(.textSecondary)
                }

                Spacer()

                switch trailing {
                case .text(let value):
                    HStack(spacing: 8) {
                        Text(value)
                            .font(.customHeadline(14))
                            .foregroundColor(.primary)

                        Image(systemName: "chevron.right")
                            .foregroundColor(.textHint)
                    }

                case .toggle(let binding):
                    Toggle("", isOn: binding)
                        .labelsHidden()
                        .tint(.primary)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - 通知
struct NotificationCards: View {

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.surface)
                .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)

            VStack(alignment: .leading, spacing: 12) {
                NotificationRow(
                    emoji: "✅",
                    title: "今日运动已完成",
                    content: "小明今天完成了30分钟运动，表现很棒！",
                    time: "刚刚"
                )

                Divider()

                NotificationRow(
                    emoji: "🏆",
                    title: "新成就解锁",
                    content: "恭喜小明解锁了「连续7天」徽章！",
                    time: "3天前"
                )
            }
            .padding(16)
        }
    }
}

struct NotificationRow: View {
    let emoji: String
    let title: String
    let content: String
    let time: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.primary.opacity(0.1))

                Text(emoji)
                    .font(.system(size: 24))
            }
            .frame(width: 44, height: 44)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.customHeadline(14))
                    .foregroundColor(.textPrimary)

                Text(content)
                    .font(.customCaption())
                    .foregroundColor(.textSecondary)
                    .lineLimit(2)
            }

            Spacer()

            Text(time)
                .font(.system(size: 10))
                .foregroundColor(.textHint)
        }
    }
}

struct ParentControlView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            ParentControlView()
                .environmentObject(AppState())
        }
    }
}
