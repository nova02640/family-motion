# Family Motion - 亲子体感运动 APP

<div align="center">

**会纠正动作的亲子体感教练**

[![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B?logo=flutter)](https://flutter.dev)
[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-lightgrey)]()
[![License](https://img.shields.io/badge/License-MIT-green)]()

</div>

---

## 📱 产品简介

Family Motion 是一款 **AI 动作纠错 + 多人同屏互动 + 场景化运动计划** 三位一体的亲子体感运动 APP。不只是让孩子动起来，更是让每一次运动都科学、有效、有陪伴。

### ✨ 核心特性

- **🎯 AI 动作纠错引擎** - 实时骨骼识别，对比标准动作库，输出动作质量评分和具体纠错提示
- **👨‍👩‍👧 多人同屏互动** - 支持 2 人同时出现在摄像头画面中，实时比拼动作准确度、速度和完成度
- **📊 体能测评与报告** - 6 项趣味游戏化体能测试，生成参照《国民体质测定标准》的体能报告
- **🌅 场景化运动模式** - 起床唤醒、饭后消食、睡前放松、周末运动会等预设场景
- **🏆 成长体系** - 运动成长树、徽章系统、等级进阶，将运动数据可视化为主观成长感受
- **📱 家长控制面板** - 实时查看孩子运动数据、动作质量评分、设置运动时长限制

---

## 🎯 产品定位

| 维度 | 传统体感 APP | **Family Motion** |
|---|---|---|
| 动作识别深度 | 触发级（动了就算） | **纠错级（判断对错并指导）** |
| 多人互动 | 轮流/排行榜 | **实时同屏同步** |
| 内容组织 | 游戏列表 | **场景化运动计划** |
| 亲子属性 | 弱 | **核心设计目标** |
| 数据反馈 | 计数/时长 | **体能报告 + 动作质量分析** |

---

## 🏗️ 技术架构

### 技术栈

- **框架**: Flutter 3.x (跨平台移动应用)
- **状态管理**: Provider
- **语言**: Dart
- **平台**: iOS & Android

### 项目结构

```
family-motion/
├── lib/
│   ├── main.dart                 # 应用入口
│   ├── providers/
│   │   └── app_provider.dart     # 全局状态管理
│   ├── models/
│   │   ├── plan.dart             # 运动计划模型
│   │   ├── exercise.dart         # 运动项目模型
│   │   ├── child_profile.dart    # 儿童档案模型
│   │   └── achievement.dart      # 成就徽章模型
│   ├── screens/
│   │   ├── home/                 # 首页 - 今日运动计划
│   │   ├── duel/                 # 多人对战模式
│   │   ├── exercise/             # 运动执行页面
│   │   ├── assessment/           # 体能测评
│   │   ├── parent/               # 家长控制面板
│   │   └── growth/               # 成长体系
│   └── widgets/                  # 可复用组件
├── assets/                       # 资源文件
├── test/                         # 测试文件
└── pubspec.yaml                  # 项目配置
```

---

## 🚀 快速开始

### 环境要求

- Flutter SDK 3.x
- Dart SDK 3.x
- iOS 12.0+ / Android 5.0+

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/your-username/family-motion.git
cd family-motion
```

2. **安装依赖**
```bash
flutter pub get
```

3. **运行应用**
```bash
# 运行 iOS
flutter run

# 运行 Android
flutter run

# 或指定设备
flutter devices
flutter run -d <device_id>
```

4. **构建发布版本**
```bash
# Android APK
flutter build apk --release

# iOS
flutter build ios --release
```

---

## 📸 功能截图

### 核心界面

| 首页 - 今日运动计划 | 多人对战模式 | 成长体系 |
|---|---|---|
| ![Home](assets/screenshots/home.png) | ![Duel](assets/screenshots/duel.png) | ![Growth](assets/screenshots/growth.png) |

| 体能测评 | 家长控制面板 | AI 动作纠错 |
|---|---|---|
| ![Assessment](assets/screenshots/assessment.png) | ![Parent](assets/screenshots/parent.png) | ![Exercise](assets/screenshots/exercise.png) |

---

## 🎮 核心功能详解

### 1. AI 动作纠错引擎

实时骨骼识别，对比标准动作库，提供专业纠错指导：

```dart
// 实时骨骼识别与评分
class ExerciseScreen extends StatefulWidget {
  // 支持的动作类型：深蹲、开合跳、高抬腿、平板支撑等
  // 实时反馈：动作角度、速度、完成度
  // 纠错提示：语音 + 文字提示
}
```

### 2. 多人同屏互动

支持三种互动模式：

- **🏃 竞速模式**: 比拼动作速度和完成次数
- **🎯 准确度模式**: 比拼动作标准度
- **🤝 合作模式**: 共同完成挑战，培养默契

### 3. 场景化运动计划

| 场景 | 时长 | 强度 | 目标 |
|---|---|---|---|
| 起床唤醒 | 5-10 分钟 | 低 | 激活身体，唤醒精神 |
| 饭后消食 | 10-15 分钟 | 中低 | 促进消化，放松身心 |
| 睡前放松 | 10 分钟 | 低 | 舒缓肌肉，助眠 |
| 周末运动会 | 30 分钟 | 中高 | 全面锻炼，亲子互动 |

### 4. 体能测评系统

6 项趣味化体能测试，生成专业报告：

- ⚖️ **平衡能力** - 单脚站立测试
- 🤸 **协调能力** - 交叉步测试
- 💥 **爆发力** - 纵跳测试
- 🧘 **柔韧性** - 坐位体前屈测试
- 💪 **耐力** - 开合跳耐力测试
- ⚡ **反应速度** - 视觉反应测试

---

## 🏆 成长体系

### 等级系统

| 等级 | 名称 | 所需经验 | 图标 |
|---|---|---|---|
| Lv.1 | 种子 | 0 | 🌱 |
| Lv.2 | 幼苗 | 100 | 🌿 |
| Lv.3 | 嫩芽 | 300 | 🌼 |
| Lv.4 | 小树 | 600 | 🌳 |
| Lv.5 | 大树 | 1000 | 🌲 |
| Lv.6 | 运动达人 | 1500 | 🏃 |
| Lv.7 | 运动健将 | 2200 | 🏆 |

### 成就徽章

- 📅 **连续打卡奖**: 3 天/7 天/30 天
- 🔥 **运动时长奖**: 累计 1/5/10 小时
- 🎯 **动作标准奖**: 单次动作评分 90+/95+/100 分
- 👨‍👩‍👧 **亲子互动奖**: 完成 10/50/100 次双人运动
- 📈 **体能进步奖**: 体能测评提升显著

---

## 📊 数据与隐私

### 数据类型

- **运动数据**: 运动时长、消耗卡路里、动作评分
- **体能数据**: 6 项体能测试结果及历史趋势
- **成长数据**: 等级、经验值、徽章收集

### 隐私保护

- 所有骨骼识别在设备本地完成
- 视频画面不上传云端
- 运动数据加密存储
- 家长控制数据访问权限

---

## 🛣️ 开发路线图

### v1.0 (当前版本) ✅

- [x] 基础体感游戏 (5-10 个)
- [x] 每日运动计划
- [x] 基础动作纠错
- [x] 多人同屏互动
- [x] 体能测评系统
- [x] 成长体系
- [x] 家长控制面板

### v1.1 (规划中)

- [ ] UGC 动作录制器
- [ ] 社区分享功能
- [ ] 更多体感游戏
- [ ] 电视投屏优化

### v2.0 (未来规划)

- [ ] 远程亲子互动
- [ ] 知名 IP 联名内容
- [ ] AI 个性化训练计划
- [ ] 多孩家庭支持

---

## 🤝 贡献指南

欢迎贡献代码、提出建议或报告问题！

### 开发环境设置

```bash
# 克隆项目
git clone https://github.com/your-username/family-motion.git
cd family-motion

# 安装依赖
flutter pub get

# 运行测试
flutter test

# 代码格式化
flutter format .

# 代码分析
flutter analyze
```

### 提交规范

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具链相关

---

## 📄 许可证

MIT License

Copyright (c) 2026 Family Motion Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

---

## 📞 联系方式

- **项目仓库**: [GitHub](https://github.com/your-username/family-motion)
- **问题反馈**: [Issues](https://github.com/your-username/family-motion/issues)
- **产品文档**: [PRD](family-motion-prd.md)

---

<div align="center">

**让每一次家庭运动都有专业反馈、真实互动和清晰目标** 🎯

Made with ❤️ for families everywhere

</div>
