//
//  UserProfile.swift
//  FamilyMotion
//
//  Created by FamilyMotion on 2026/06/10.
//

import Foundation

// MARK: - UserProfile 用户档案
struct UserProfile: Identifiable, Codable, Hashable {
    var id: String = UUID().uuidString
    var name: String = ""
    var age: Int = 0
    var gender: String = ""
    var height: Float = 0  // cm
    var weight: Float = 0  // kg
    var avatarEmoji: String = "👦"
    var level: Int = 1
    var experience: Int = 0
    var streakDays: Int = 0
    var totalExerciseMinutes: Int = 0

    var bmi: Float {
        guard height > 0 else { return 0 }
        let heightInMeters = height / 100.0
        return weight / (heightInMeters * heightInMeters)
    }

    var bmiCategory: String {
        let bmiValue = bmi
        if bmiValue < 18.5 { return "偏瘦" }
        if bmiValue < 24 { return "正常" }
        if bmiValue < 28 { return "偏胖" }
        return "肥胖"
    }
}

// MARK: - ExercisePlan 运动计划
struct ExercisePlan: Identifiable, Codable, Hashable {
    var id: String = UUID().uuidString
    var title: String = ""
    var planDescription: String = ""
    var duration: Int = 0  // 分钟
    var difficulty: Difficulty = .easy
    var exercises: [Exercise] = []
    var isCompleted: Bool = false
    var completedAt: Date? = nil
}

// MARK: - Exercise 单个运动
struct Exercise: Identifiable, Codable, Hashable {
    var id: String = UUID().uuidString
    var name: String = ""
    var exerciseDescription: String = ""
    var icon: String = ""
    var reps: Int = 10
    var duration: Int = 0  // 秒
    var difficulty: Difficulty = .easy
    var type: ExerciseType = .normal
    var targetJointAngles: [JointAngle] = []
}

// MARK: - JointAngle 关节角度约束
struct JointAngle: Codable, Hashable {
    var joint: JointType
    var minAngle: Float
    var maxAngle: Float
    var description: String = ""
}

// MARK: - JointType 关节类型
enum JointType: String, Codable, CaseIterable, Hashable {
    case leftKnee = "左膝"
    case rightKnee = "右膝"
    case leftHip = "左髋"
    case rightHip = "右髋"
    case leftShoulder = "左肩"
    case rightShoulder = "右肩"
    case leftElbow = "左肘"
    case rightElbow = "右肘"
    case waist = "腰部"
    case shoulder = "肩部"
}

// MARK: - Difficulty 难度
enum Difficulty: String, Codable, CaseIterable, Hashable {
    case easy = "简单"
    case medium = "中等"
    case hard = "困难"

    var colorHex: String {
        switch self {
        case .easy: return "#4CAF50"
        case .medium: return "#FF9800"
        case .hard: return "#F44336"
        }
    }
}

// MARK: - ExerciseType 运动类型
enum ExerciseType: String, Codable, CaseIterable, Hashable {
    case normal = "普通"
    case warmUp = "热身"
    case stretch = "拉伸"
    case cardio = "有氧"
    case strength = "力量"
    case balance = "平衡"
}

// MARK: - ScoreResult 评分结果
struct ScoreResult: Codable, Hashable {
    var totalScore: Int = 0
    var accuracyScore: Int = 0
    var completionScore: Int = 0
    var smoothnessScore: Int = 0
    var feedback: [String] = []
    var isPerfect: Bool = false
    var repCount: Int = 0

    var grade: String {
        if totalScore >= 90 { return "优秀" }
        if totalScore >= 80 { return "良好" }
        if totalScore >= 70 { return "中等" }
        if totalScore >= 60 { return "及格" }
        return "需要加油"
    }

    var scoreColorHex: String {
        if totalScore >= 90 { return "#10B981" }
        if totalScore >= 80 { return "#3B82F6" }
        if totalScore >= 70 { return "#F59E0B" }
        if totalScore >= 60 { return "#FF9800" }
        return "#EF4444"
    }
}

// MARK: - AssessmentResult 测评结果
struct AssessmentResult: Identifiable, Codable, Hashable {
    var id: String = UUID().uuidString
    var timestamp: Date = Date()
    var scores: [AssessmentType: Int] = [:]
    var overallScore: Int = 0
    var grade: String = ""

    static func calculateGrade(score: Int) -> String {
        if score >= 90 { return "优秀" }
        if score >= 80 { return "良好" }
        if score >= 70 { return "中等" }
        if score >= 60 { return "及格" }
        return "需要加油"
    }
}

// MARK: - AssessmentType 测评类型
enum AssessmentType: String, Codable, CaseIterable, Hashable {
    case reaction = "反应速度"
    case accuracy = "动作准确度"
    case power = "爆发力"
    case endurance = "下肢力量"
    case balance = "平衡力"
    case coordination = "协调性"

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

// MARK: - SceneMode 场景模式
struct SceneMode: Identifiable, Codable, Hashable {
    var id: String = UUID().uuidString
    var name: String = ""
    var icon: String = ""
    var description: String = ""
    var recommendedTime: String = ""
    var exercises: [Exercise] = []
}

// MARK: - DuelMode 对战模式
enum DuelMode: String, Codable, CaseIterable, Hashable {
    case race = "竞速模式"
    case accuracy = "准确度模式"
    case cooperation = "合作模式"
}

// MARK: - Achievement 成就
struct Achievement: Identifiable, Codable, Hashable {
    var id: String = UUID().uuidString
    var name: String = ""
    var achievementDescription: String = ""
    var icon: String = ""
    var unlocked: Bool = false
    var unlockedAt: Date? = nil
}

// MARK: - 工具扩展
extension Difficulty {
    var displayName: String {
        return rawValue
    }
}

extension ExerciseType {
    var displayName: String {
        return rawValue
    }
}
