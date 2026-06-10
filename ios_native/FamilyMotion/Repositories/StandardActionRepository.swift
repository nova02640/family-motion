//
//  StandardActionRepository.swift
//  FamilyMotion
//
//  Created by FamilyMotion on 2026/06/10.
//

import Foundation

// MARK: - 标准动作库
@MainActor
final class StandardActionRepository: ObservableObject {

    static let shared = StandardActionRepository()

    // 所有动作
    let standardActions: [Exercise] = [
        // MARK: 热身动作
        Exercise(
            id: "warm_up_1",
            name: "原地高抬腿",
            exerciseDescription: "快速抬膝至腰部高度",
            icon: "🏃",
            reps: 20,
            duration: 30,
            difficulty: .easy,
            type: .warmUp,
            targetJointAngles: [
                JointAngle(joint: .leftKnee, minAngle: 70, maxAngle: 110, description: "膝盖抬高到 90°"),
                JointAngle(joint: .rightKnee, minAngle: 70, maxAngle: 110, description: "膝盖抬高到 90°")
            ]
        ),
        Exercise(
            id: "warm_up_2",
            name: "开合跳",
            exerciseDescription: "双手双脚同时打开和并拢",
            icon: "⭐",
            reps: 15,
            duration: 20,
            difficulty: .easy,
            type: .warmUp,
            targetJointAngles: [
                JointAngle(joint: .leftShoulder, minAngle: 30, maxAngle: 90, description: "手臂打开幅度"),
                JointAngle(joint: .rightShoulder, minAngle: 30, maxAngle: 90, description: "手臂打开幅度")
            ]
        ),

        // MARK: 核心力量
        Exercise(
            id: "strength_1",
            name: "深蹲",
            exerciseDescription: "屈膝下蹲，膝盖不超过脚尖",
            icon: "🦵",
            reps: 12,
            duration: 0,
            difficulty: .medium,
            type: .strength,
            targetJointAngles: [
                JointAngle(joint: .leftKnee, minAngle: 70, maxAngle: 110, description: "膝盖弯曲角度"),
                JointAngle(joint: .rightKnee, minAngle: 70, maxAngle: 110, description: "膝盖弯曲角度"),
                JointAngle(joint: .waist, minAngle: 70, maxAngle: 100, description: "保持腰部挺直")
            ]
        ),
        Exercise(
            id: "strength_2",
            name: "平板支撑",
            exerciseDescription: "身体保持一条直线",
            icon: "🧘",
            reps: 1,
            duration: 30,
            difficulty: .medium,
            type: .strength,
            targetJointAngles: [
                JointAngle(joint: .leftShoulder, minAngle: 80, maxAngle: 100, description: "肩部角度"),
                JointAngle(joint: .rightShoulder, minAngle: 80, maxAngle: 100, description: "肩部角度"),
                JointAngle(joint: .waist, minAngle: 160, maxAngle: 180, description: "身体保持直线")
            ]
        ),
        Exercise(
            id: "strength_3",
            name: "俯卧撑",
            exerciseDescription: "屈臂下降，推起身体",
            icon: "💪",
            reps: 10,
            duration: 0,
            difficulty: .hard,
            type: .strength,
            targetJointAngles: [
                JointAngle(joint: .leftElbow, minAngle: 80, maxAngle: 100, description: "手臂弯曲"),
                JointAngle(joint: .rightElbow, minAngle: 80, maxAngle: 100, description: "手臂弯曲"),
                JointAngle(joint: .waist, minAngle: 160, maxAngle: 180, description: "身体平直")
            ]
        ),

        // MARK: 有氧运动
        Exercise(
            id: "cardio_1",
            name: "波比跳",
            exerciseDescription: "蹲下撑地-跳起-站立",
            icon: "🔥",
            reps: 8,
            duration: 0,
            difficulty: .hard,
            type: .cardio,
            targetJointAngles: [
                JointAngle(joint: .leftKnee, minAngle: 80, maxAngle: 120, description: "膝盖弯曲"),
                JointAngle(joint: .rightKnee, minAngle: 80, maxAngle: 120, description: "膝盖弯曲")
            ]
        ),
        Exercise(
            id: "cardio_2",
            name: "登山跑",
            exerciseDescription: "俯卧撑姿势交替提膝",
            icon: "⛰️",
            reps: 20,
            duration: 0,
            difficulty: .medium,
            type: .cardio,
            targetJointAngles: [
                JointAngle(joint: .leftKnee, minAngle: 80, maxAngle: 120, description: "膝盖抬高"),
                JointAngle(joint: .rightKnee, minAngle: 80, maxAngle: 120, description: "膝盖抬高")
            ]
        ),

        // MARK: 拉伸动作
        Exercise(
            id: "stretch_1",
            name: "弓步拉伸",
            exerciseDescription: "前后弓步压腿",
            icon: "🙆",
            reps: 5,
            duration: 30,
            difficulty: .easy,
            type: .stretch,
            targetJointAngles: [
                JointAngle(joint: .leftKnee, minAngle: 80, maxAngle: 120, description: "腿部伸直"),
                JointAngle(joint: .rightKnee, minAngle: 80, maxAngle: 120, description: "腿部伸直")
            ]
        ),
        Exercise(
            id: "stretch_2",
            name: "侧身拉伸",
            exerciseDescription: "单手向上伸展并侧弯",
            icon: "🌴",
            reps: 5,
            duration: 20,
            difficulty: .easy,
            type: .stretch,
            targetJointAngles: [
                JointAngle(joint: .leftShoulder, minAngle: 150, maxAngle: 180, description: "手臂伸直"),
                JointAngle(joint: .rightShoulder, minAngle: 150, maxAngle: 180, description: "手臂伸直")
            ]
        ),

        // MARK: 平衡动作
        Exercise(
            id: "balance_1",
            name: "单脚站立",
            exerciseDescription: "单腿站立保持平衡",
            icon: "🦈",
            reps: 1,
            duration: 30,
            difficulty: .medium,
            type: .balance,
            targetJointAngles: []
        ),
        Exercise(
            id: "balance_2",
            name: "燕式平衡",
            exerciseDescription: "单腿站立，另一腿后伸",
            icon: "🦅",
            reps: 1,
            duration: 20,
            difficulty: .hard,
            type: .balance,
            targetJointAngles: [
                JointAngle(joint: .leftHip, minAngle: 150, maxAngle: 180, description: "后腿抬高"),
                JointAngle(joint: .rightHip, minAngle: 150, maxAngle: 180, description: "后腿抬高")
            ]
        )
    ]

    // MARK: 查询方法
    func getExercise(by id: String) -> Exercise? {
        return standardActions.first { $0.id == id }
    }

    func getExercises(by type: ExerciseType) -> [Exercise] {
        return standardActions.filter { $0.type == type }
    }

    func getExercises(by difficulty: Difficulty) -> [Exercise] {
        return standardActions.filter { $0.difficulty == difficulty }
    }

    func getWarmUpExercises() -> [Exercise] {
        return standardActions.filter { $0.type == .warmUp }
    }

    func getStretchExercises() -> [Exercise] {
        return standardActions.filter { $0.type == .stretch }
    }
}
