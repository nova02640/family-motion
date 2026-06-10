//
//  Theme.swift
//  FamilyMotion
//
//  Created by FamilyMotion on 2026/06/10.
//

import SwiftUI
import UIKit

// MARK: - Color 扩展
extension Color {

    // 主色调
    static let primary = Color(red: 0.39, green: 0.40, blue: 0.95)
    static let primaryVariant = Color(red: 0.31, green: 0.27, blue: 0.90)
    static let onPrimary = Color.white

    // 辅助色
    static let secondary = Color(red: 0.93, green: 0.28, blue: 0.60)
    static let secondaryVariant = Color(red: 0.86, green: 0.16, blue: 0.47)
    static let onSecondary = Color.white

    // 背景色
    static let background = Color(red: 0.98, green: 0.98, blue: 0.98)
    static let surface = Color.white
    static let onBackground = Color(red: 0.12, green: 0.16, blue: 0.22)
    static let onSurface = Color(red: 0.12, green: 0.16, blue: 0.22)

    // 深色主题
    static let darkBackground = Color(red: 0.10, green: 0.10, blue: 0.18)
    static let darkSurface = Color(red: 0.09, green: 0.13, blue: 0.24)

    // 状态色
    static let success = Color(red: 0.06, green: 0.72, blue: 0.51)
    static let warning = Color(red: 0.96, green: 0.62, blue: 0.04)
    static let error = Color(red: 0.94, green: 0.27, blue: 0.27)

    // 评分色
    static let scoreExcellent = Color(red: 0.06, green: 0.72, blue: 0.51)
    static let scoreGood = Color(red: 0.23, green: 0.51, blue: 0.96)
    static let scoreAverage = Color(red: 0.96, green: 0.62, blue: 0.04)
    static let scorePoor = Color(red: 0.94, green: 0.27, blue: 0.27)

    // 渐变色
    static let gradientStart = Color(red: 0.39, green: 0.40, blue: 0.95)
    static let gradientEnd = Color(red: 0.55, green: 0.36, blue: 0.97)
    static let gradientPinkStart = Color(red: 0.96, green: 0.45, blue: 0.71)
    static let gradientPinkEnd = Color(red: 0.93, green: 0.28, blue: 0.60)
    static let gradientGoldStart = Color(red: 1.00, green: 0.84, blue: 0.00)
    static let gradientGoldEnd = Color(red: 1.00, green: 0.65, blue: 0.00)

    // 次要文字色
    static let textPrimary = Color(red: 0.12, green: 0.16, blue: 0.22)
    static let textSecondary = Color(red: 0.42, green: 0.45, blue: 0.50)
    static let textHint = Color(red: 0.61, green: 0.64, blue: 0.68)

    // 根据分数获取颜色
    static func scoreColor(for score: Int) -> Color {
        switch score {
        case 90...100:
            return scoreExcellent
        case 80..<90:
            return scoreGood
        case 70..<80:
            return scoreAverage
        default:
            return scorePoor
        }
    }
}

// MARK: - 渐变扩展
extension LinearGradient {
    static let primaryGradient = LinearGradient(
        colors: [Color.gradientStart, Color.gradientEnd],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let pinkGradient = LinearGradient(
        colors: [Color.gradientPinkStart, Color.gradientPinkEnd],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let goldGradient = LinearGradient(
        colors: [Color.gradientGoldStart, Color.gradientGoldEnd],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}

// MARK: - 字体扩展
extension Font {
    static func customTitle(_ size: CGFloat = 28) -> Font {
        return .system(size: size, weight: .bold)
    }

    static func customHeadline(_ size: CGFloat = 20) -> Font {
        return .system(size: size, weight: .semibold)
    }

    static func customBody(_ size: CGFloat = 16) -> Font {
        return .system(size: size, weight: .regular)
    }

    static func customCaption(_ size: CGFloat = 12) -> Font {
        return .system(size: size, weight: .medium)
    }
}

// MARK: - 圆角样式
struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}

extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}
