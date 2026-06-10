# FamilyMotion — 亲子运动体感系统 (iOS)

原生 iOS 版本的亲子运动体感识别应用，使用 **Swift + SwiftUI + AVFoundation + Vision** 开发。

---

## 🎯 核心功能

### 1. AI 动作识别与纠错
- 使用 **AVFoundation** 捕获相机流
- 使用 **Vision** 框架进行人体姿态检测
- 基于关节角度计算动作准确度
- 实时语音/文字反馈指导

### 2. 个性化运动计划
- 根据用户年龄、体能水平推荐
- 支持 6 种场景模式（起床唤醒、饭后消食、睡前放松等）
- 智能难度调整

### 3. 体能测评系统
- 6 项游戏化体能测试（反应速度、准确度、爆发力、下肢力量、平衡力、协调性
- 雷达图可视化能力展示
- 历史记录追踪

### 4. 家长控制面板
- 运动数据统计与分析
- 每日运动时长限制
- 内容过滤等级设置

---

## 🏗️ 项目架构

```
FamilyMotion/
├── Models/                      # 数据模型
│   ├── Models.swift            # ExercisePlan, Exercise, UserProfile, Assessment 等核心模型
│   ├── PoseData.swift        # 骨骼数据模型（对应 Vision 输出
│
├── Repositories/              # 数据仓库
│   ├── StandardActionRepository.swift  # 标准动作库
│   └── SceneModeRepository.swift  # 场景模式
│
├── Services/                  # 业务服务
│   ├── PoseDetectionService.swift  # 骨骼识别
│   ├── ActionScoringEngine.swift  # 动作评分
│   └── PlanRecommendationService.swift  # 计划推荐
│
├── ViewModels/              # 状态管理
│   ├── AppState.swift      # 全局状态
│   └── ExerciseViewModel.swift  # 运动视图状态
│
└── UI/                       # SwiftUI 界面
    ├── Theme.swift              # 主题与颜色
    ├── HomeView.swift           # 首页
    ├── ExerciseView.swift         # 运动执行界面
    ├── AssessmentView.swift       # 体能测评
    ├── ProfileView.swift        # 个人中心
    ├── ParentControlView.swift  # 家长控制
    └── FamilyMotionApp.swift   # 应用入口
```

---

## 🛠️ 技术栈

| 技术 | 用途 |
|------|-----|
| **Swift | 开发语言 |
| **SwiftUI** | 声明式 UI |
| **AVFoundation** | 相机捕获 |
| **Vision** | 人体姿态识别 (VNDetectHumanBodyPoseRequest |
| **Combine** | 响应式状态 |
| **MVVM** | 架构模式 |

---

## 📱 系统要求

| 项目 | 要求 |
|------|------|
| iOS | iOS 15.0+ |
| Xcode | 15.0+ |
| Swift | 5.9+ |
| 设备 | iPhone 建议 A12 及以上 |

> Vision 框架需要真机使用 **iOS 14+ 支持

---

## 🚀 快速开始

### 1. 克隆项目

```bash
cd ios_native/
```

### 2. 使用 Xcode 打开

```bash
# 打开项目目录
open ios_native/FamilyMotion
```

在 Xcode 中，选择 **File > New > Project，选择 **iOS App，然后将代码文件复制到项目中。

### 3. 添加权限

在 **Info.plist** 中添加：

```xml
<key>NSCameraUsageDescription</key>
<string>需要使用相机进行动作识别</string>

<key>NSMicrophoneUsageDescription</key>
<string>需要使用麦克风进行语音反馈</string>
```

### 4. 选择签名

在 Xcode 中选择 Team 与 Bundle Identifier。

### 5. 运行

连接真机（**推荐**），使用 **Cmd + R** 运行。

---

## 🌳 项目构建

```bash
# 使用 xcodebuild
xcodebuild \
  -project FamilyMotion.xcodeproj \
  -scheme FamilyMotion \
  -destination 'platform=iOS,name=My iPhone' \
  build
```

---

## 📊 核心算法

### 动作评分引擎

| 评分维度 | 说明 |
|---------|------|
| 准确度（40%） | 关节角度是否在合理区间 |
| 完成度（30%） | 动作幅度是否达到要求 |
| 流畅度（30%） | 动作平滑度 |

### 角度计算

```
cos(θ) = (向量BA · 向量BC) / (|BA| × |BC|)
```

---

## 🔒 隐私与数据

- **相机数据仅在本地进行实时分析，**不上传任何图像
- 运动数据可存储在本地
- 家长控制界面允许限制每日使用时长

---

## 📝 后续开发计划

- [ ] 多人对战模式（多人动作同步）
- [ ] HealthKit 数据同步
- [ ] iCloud 数据同步
- [ ] CloudKit 或 Firebase 云端数据备份
- [ ] 更多成就与奖励
- [ ] 多语言支持（中文/英文）
- [ ] 动画与游戏化交互

---

## 📄 License

MIT License

---

© 2026 FamilyMotion

