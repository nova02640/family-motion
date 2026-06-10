# Family Motion - 亲子运动体感系统

基于原生 Android 开发的亲子运动体感识别应用，采用 Kotlin + Jetpack Compose 构建。

## 功能特性

### 1. AI 动作识别与纠错
- 使用 CameraX + ML Kit Pose Detection 进行实时骨骼追踪
- 基于关键点角度计算实现动作评分
- 实时语音/文字反馈指导动作

### 2. 个性化运动计划
- 根据用户年龄、体能水平生成推荐计划
- 支持场景模式（起床唤醒、饭后消食、睡前放松等）
- 智能难度调整算法

### 3. 体能测评系统
- 6 项游戏化体能测试
- 雷达图可视化能力展示
- 历史记录追踪

### 4. 家长控制面板
- 运动数据统计与分析
- 时长限制与内容过滤
- 护眼提醒设置

## 技术架构

```
app/
├── data/
│   ├── model/          # 数据模型
│   └── repository/     # 数据仓库
├── domain/
│   └── service/        # 业务逻辑服务
└── ui/
    ├── navigation/    # 导航配置
    ├── screens/       # 页面
    ├── theme/         # 主题配置
    └── viewmodel/     # 状态管理
```

## 技术栈

| 分类 | 技术 |
|------|------|
| 语言 | Kotlin 1.9+ |
| UI | Jetpack Compose |
| 相机 | CameraX 1.3+ |
| AI | ML Kit Pose Detection |
| 架构 | MVVM + Clean Architecture |
| 状态 | StateFlow + ViewModel |
| 导航 | Navigation Compose |
| 序列化 | Kotlin Serialization |

## 核心算法

### 动作评分引擎
- **准确度 (40%)**: 关节角度约束满足程度
- **完成度 (30%)**: 动作幅度与标准动作接近度
- **流畅度 (30%)**: 时间序列平滑度

### 难度调整算法
```
difficulty = f(age, streakDays, weekMinutes)
```

## 项目结构

```
android_native/
├── app/
│   ├── build.gradle.kts      # App 模块配置
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/com/familymotion/app/
│       │   ├── MainActivity.kt
│       │   ├── data/
│       │   ├── domain/
│       │   └── ui/
│       └── res/
│           └── values/
├── build.gradle.kts          # 根配置
├── settings.gradle.kts       # 项目设置
└── gradle.properties         # Gradle 属性
```

## 环境要求

- **Android SDK**: 34+
- **Min SDK**: 26 (Android 8.0)
- **Gradle**: 8.2+
- **JDK**: 17+

## 构建与运行

```bash
# 克隆项目
git clone <repository_url>

# 进入项目目录
cd android_native

# 同步依赖
./gradlew dependencies

# 运行调试版
./gradlew installDebug

# 运行发布版
./gradlew assembleRelease
```

## 权限说明

| 权限 | 用途 |
|------|------|
| CAMERA | 体感动作识别 |
| VIBRATE | 动作反馈震动 |

## 后续开发

- [ ] 多人同屏对战模式
- [ ] 动作流畅度真实算法（DTW）
- [ ] 数据云端同步
- [ ] 社交分享功能
- [ ] 成就系统扩展
- [ ] 国际化支持

## License

MIT License
