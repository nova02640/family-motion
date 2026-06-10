//
//  SceneModeRepository.swift
//  FamilyMotion
//
//  Created by FamilyMotion on 2026/06/10.
//

import Foundation

// MARK: - 场景模式数据仓库
@MainActor
final class SceneModeRepository: ObservableObject {

    static let shared = SceneModeRepository()

    private let standardActionRepository = StandardActionRepository.shared

    // 所有场景模式
    var sceneModes: [SceneMode] {
        let standardActions = standardActionRepository.standardActions

        return [
            SceneMode(
                id: "scene_morning",
                name: "起床唤醒",
                icon: "🌅",
                description: "轻松热身，唤醒身体活力",
                recommendedTime: "07:00 - 09:00",
                exercises: Array(standardActions.filter { $0.type == .warmUp }.prefix(2))
            ),
            SceneMode(
                id: "scene_meal",
                name: "饭后消食",
                icon: "🍽️",
                description: "轻度运动，帮助消化",
                recommendedTime: "12:00 - 13:00 / 19:00 - 20:00",
                exercises: Array(standardActions.filter { $0.type == .stretch || $0.difficulty == .easy }.prefix(2))
            ),
            SceneMode(
                id: "scene_bedtime",
                name: "睡前放松",
                icon: "🌙",
                description: "舒缓拉伸，帮助入睡",
                recommendedTime: "21:00 - 22:00",
                exercises: Array(standardActions.filter { $0.type == .stretch }.prefix(3))
            ),
            SceneMode(
                id: "scene_weekend",
                name: "周末活力",
                icon: "🎉",
                description: "全面锻炼，消耗卡路里",
                recommendedTime: "周末全天",
                exercises: Array(standardActions.prefix(5))
            ),
            SceneMode(
                id: "scene_rainy",
                name: "雨天室内",
                icon: "🌧️",
                description: "室内运动，不受天气影响",
                recommendedTime: "任何时间",
                exercises: Array(standardActions.filter { $0.type != .stretch }.prefix(4))
            )
        ]
    }

    // MARK: 查询方法
    func getSceneMode(by id: String) -> SceneMode? {
        return sceneModes.first { $0.id == id }
    }

    /// 根据当前时间推荐场景
    func getRecommendedSceneByTime() -> SceneMode {
        let hour = Calendar.current.component(.hour, from: Date())

        switch hour {
        case 7..<9:
            return sceneModes[0]  // 起床唤醒
        case 12..<13, 19..<20:
            return sceneModes[1]  // 饭后消食
        case 21..<22:
            return sceneModes[2]  // 睡前放松
        default:
            return sceneModes[3]  // 周末活力
        }
    }

    /// 获取推荐场景数组（根据当前时间排序）
    func getRecommendedScenes() -> [SceneMode] {
        let recommended = getRecommendedSceneByTime()
        var scenes = sceneModes
        if let index = scenes.firstIndex(where: { $0.id == recommended.id }) {
            scenes.move(fromOffsets: IndexSet(integer: index), toOffset: 0)
        }
        return scenes
    }
}

// MARK: - 扩展：辅助方法
extension Array where Element == SceneMode {

    /// 根据当前时间返回建议场景
    func recommendedForCurrentTime() -> SceneMode? {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 7..<9: return first { $0.id == "scene_morning" }
        case 12..<13, 19..<20: return first { $0.id == "scene_meal" }
        case 21..<22: return first { $0.id == "scene_bedtime" }
        default: return first { $0.id == "scene_weekend" }
        }
    }
}
