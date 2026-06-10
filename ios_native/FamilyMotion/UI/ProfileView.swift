//
//  ProfileView.swift
//  FamilyMotion
//
//  Created by FamilyMotion on 2026/06/10.
//

import SwiftUI

// MARK: - ProfileView 个人中心
struct ProfileView: View {

    @EnvironmentObject var appState: AppState
    @State private var showParentControl = false

    var body: some View {
        NavigationView {
            ZStack {
                Color.background.ignoresSafeArea()

                ScrollView(.vertical, showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 20) {

                        // 用户信息
                        ProfileCard(userProfile: appState.userProfile)
                            .padding(.top, 16)

                        // 成就徽章
                        SectionHeader(title: "成就徽章")

                        AchievementsRow(achievements: appState.achievements)

                        // 功能入口
                        SectionHeader(title: "功能")

                        FunctionMenu(
                            onParentControl: {
                                showParentControl = true
                            },
                            onAssessment: {
                                // 切换到测评标签
                                appState.currentTab = .assessment
                            }
                        )

                        // 会员卡片
                        PremiumCard()

                        // 底部留白
                        Color.clear.frame(height: 80)
                    }
                    .padding(.horizontal, 16)
                }

                // 家长控制导航
                NavigationLink(
                    destination: ParentControlView()
                        .environmentObject(appState),
                    isActive: $showParentControl
                ) {
                    EmptyView()
                }
            }
            .navigationBarTitle("我的", displayMode: .inline)
            .navigationBarHidden(true)
        }
        .navigationViewStyle(.stack)
    }
}

// MARK: - 用户信息卡
struct ProfileCard: View {
    let userProfile: UserProfile

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 20)
                .fill(LinearGradient.primaryGradient)

            HStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(Color.white)
                        .frame(width: 80, height: 80)

                    Text(userProfile.avatarEmoji)
                        .font(.system(size: 42))
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(userProfile.name)
                        .font(.customTitle())
                        .foregroundColor(.white)

                    Text("\(userProfile.age)岁 · \(userProfile.gender) · \(Int(userProfile.height))cm · \(Int(userProfile.weight))kg")
                        .font(.customBody())
                        .foregroundColor(.white.opacity(0.8))

                    Text("BMI: \(String(format: "%.1f", userProfile.bmi))")
                        .font(.customCaption())
                        .foregroundColor(.white.opacity(0.7))
                        .padding(.top, 2)

                    HStack(spacing: 6) {
                        Text("成长树 Lv.\(userProfile.level)")
                            .font(.customCaption())
                            .padding(.horizontal, 10)
                            .padding(.vertical, 4)
                            .background(Color.white.opacity(0.2))
                            .clipShape(Capsule())
                            .foregroundColor(.white)

                        Text("🔥 \(userProfile.streakDays)天")
                            .font(.customCaption())
                            .padding(.horizontal, 10)
                            .padding(.vertical, 4)
                            .background(Color.white.opacity(0.2))
                            .clipShape(Capsule())
                            .foregroundColor(.white)
                    }
                    .padding(.top, 6)
                }

                Spacer()
            }
            .padding(20)
        }
    }
}

// MARK: - 成就徽章行
struct AchievementsRow: View {
    let achievements: [Achievement]

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 14) {
                ForEach(achievements) { achievement in
                    AchievementItem(achievement: achievement)
                }
            }
        }
    }
}

struct AchievementItem: View {
    let achievement: Achievement

    var body: some View {
        VStack(spacing: 8) {
            Text(achievement.icon)
                .font(.system(size: 32))
                .frame(width: 70, height: 70)
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
                .font(.system(size: 11))
                .foregroundColor(.textSecondary)
                .frame(width: 70)
                .lineLimit(1)
        }
    }
}

// MARK: - 功能菜单
struct FunctionMenu: View {

    let onParentControl: () -> Void
    let onAssessment: () -> Void

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.surface)
                .shadow(color: Color.black.opacity(0.05), radius: 8)

            VStack(spacing: 0) {
                FunctionMenuItem(
                    icon: "timer",
                    title: "体能测评",
                    subtitle: "6项游戏化体能测试",
                    color: .primary,
                    onTap: onAssessment
                )

                Divider()
                    .padding(.leading, 64)

                FunctionMenuItem(
                    icon: "person.2.fill",
                    title: "家长控制",
                    subtitle: "查看数据、设置时长限制",
                    color: .secondary,
                    onTap: onParentControl
                )

                Divider()
                    .padding(.leading, 64)

                FunctionMenuItem(
                    icon: "clock.fill",
                    title: "运动历史",
                    subtitle: "查看所有运动记录",
                    color: .success,
                    onTap: { }
                )

                Divider()
                    .padding(.leading, 64)

                FunctionMenuItem(
                    icon: "gearshape.fill",
                    title: "设置",
                    subtitle: "个人信息、通知设置",
                    color: .gray,
                    onTap: { }
                )
            }
            .padding(.vertical, 8)
        }
    }
}

struct FunctionMenuItem: View {

    let icon: String
    let title: String
    let subtitle: String
    let color: Color
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 16) {
                Image(systemName: icon)
                    .font(.system(size: 24))
                    .foregroundColor(color)
                    .frame(width: 40, height: 40)
                    .background(color.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.customBody())
                        .foregroundColor(.textPrimary)

                    Text(subtitle)
                        .font(.customCaption())
                        .foregroundColor(.textSecondary)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .foregroundColor(.textHint)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - 会员卡片
struct PremiumCard: View {

    @State private var showUpgrade = false

    var body: some View {
        Button(action: { showUpgrade = true }) {
            ZStack {
                RoundedRectangle(cornerRadius: 16)
                    .fill(LinearGradient.goldGradient)

                HStack(spacing: 14) {
                    Text("⭐")
                        .font(.system(size: 40))

                    VStack(alignment: .leading, spacing: 4) {
                        Text("升级为会员")
                            .font(.customHeadline(18))
                            .foregroundColor(.black)

                        Text("解锁全部游戏和专属功能")
                            .font(.customCaption())
                            .foregroundColor(.black.opacity(0.7))
                    }

                    Spacer()

                    Text("立即开通")
                        .font(.customHeadline(14))
                        .foregroundColor(.yellow)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(Color.black)
                        .clipShape(Capsule())
                }
                .padding(18)
            }
        }
        .buttonStyle(.plain)
        .alert("会员功能", isPresented: $showUpgrade) {
            Button("了解") { }
        } message: {
            Text("此功能将在后续版本中上线")
        }
    }
}

struct ProfileView_Previews: PreviewProvider {
    static var previews: some View {
        ProfileView()
            .environmentObject(AppState())
    }
}
