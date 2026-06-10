import 'exercise.dart';

enum SceneType {
  morning,
  afterMeal,
  bedtime,
  weekend,
  rainyDay,
}

class SceneMode {
  final SceneType type;
  final String name;
  final String icon;
  final String description;
  final int duration;
  final List<Exercise> exercises;
  final String backgroundMusic;
  final bool isLowIntensity;

  SceneMode({
    required this.type,
    required this.name,
    required this.icon,
    required this.description,
    required this.duration,
    required this.exercises,
    this.backgroundMusic = '',
    this.isLowIntensity = false,
  });

  static List<SceneMode> get availableScenes {
    return [
      SceneMode(
        type: SceneType.morning,
        name: '起床唤醒',
        icon: '🌅',
        description: '轻度拉伸唤醒身体',
        duration: 5,
        isLowIntensity: true,
        exercises: [
          Exercise(
            id: 'ex_stretch_1',
            name: '头部转动',
            duration: 30,
            reps: 5,
            icon: '👤',
            difficulty: 'easy',
            description: '缓慢转动头部',
          ),
          Exercise(
            id: 'ex_stretch_2',
            name: '手臂伸展',
            duration: 30,
            reps: 5,
            icon: '💪',
            difficulty: 'easy',
            description: '向上伸展手臂',
          ),
          Exercise(
            id: 'ex_stretch_3',
            name: '深呼吸',
            duration: 30,
            reps: 10,
            icon: '💨',
            difficulty: 'easy',
            description: '深呼吸放松',
          ),
        ],
      ),
      SceneMode(
        type: SceneType.afterMeal,
        name: '饭后消食',
        icon: '🍚',
        description: '促进消化的轻度运动',
        duration: 10,
        isLowIntensity: true,
        exercises: [
          Exercise(
            id: 'ex_walk',
            name: '原地踏步',
            duration: 60,
            reps: 60,
            icon: '🚶',
            difficulty: 'easy',
            description: '原地缓慢踏步',
          ),
          Exercise(
            id: 'ex_arm',
            name: '手臂摆动',
            duration: 45,
            reps: 30,
            icon: '🦾',
            difficulty: 'easy',
            description: '前后摆动手臂',
          ),
          Exercise(
            id: 'ex_twist',
            name: '腰部扭转',
            duration: 30,
            reps: 10,
            icon: '🌀',
            difficulty: 'easy',
            description: '缓慢扭转腰部',
          ),
        ],
      ),
      SceneMode(
        type: SceneType.bedtime,
        name: '睡前放松',
        icon: '🌙',
        description: '助眠瑜伽式拉伸',
        duration: 5,
        isLowIntensity: true,
        exercises: [
          Exercise(
            id: 'ex_cat',
            name: '猫式伸展',
            duration: 30,
            reps: 5,
            icon: '🐱',
            difficulty: 'easy',
            description: '背部伸展放松',
          ),
          Exercise(
            id: 'ex_leg',
            name: '腿部拉伸',
            duration: 30,
            reps: 3,
            icon: '🦵',
            difficulty: 'easy',
            description: '腿部后侧拉伸',
          ),
          Exercise(
            id: 'ex_breath',
            name: '冥想呼吸',
            duration: 60,
            reps: 5,
            icon: '🧘',
            difficulty: 'easy',
            description: '深呼吸冥想',
          ),
        ],
      ),
      SceneMode(
        type: SceneType.weekend,
        name: '周末运动会',
        icon: '🏆',
        description: '完整赛制家庭运动会',
        duration: 30,
        isLowIntensity: false,
        exercises: [
          Exercise(
            id: 'ex_jump',
            name: '开合跳',
            duration: 60,
            reps: 30,
            icon: '✌️',
            difficulty: 'medium',
            description: '双脚开合跳跃',
          ),
          Exercise(
            id: 'ex_squat',
            name: '深蹲',
            duration: 60,
            reps: 15,
            icon: '🦾',
            difficulty: 'medium',
            description: '锻炼腿部力量',
          ),
          Exercise(
            id: 'ex_plank',
            name: '平板支撑',
            duration: 45,
            reps: 2,
            icon: '🏋️',
            difficulty: 'medium',
            description: '锻炼核心力量',
          ),
          Exercise(
            id: 'ex_high_knee',
            name: '高抬腿',
            duration: 60,
            reps: 30,
            icon: '🦵',
            difficulty: 'easy',
            description: '快速抬起膝盖',
          ),
        ],
      ),
      SceneMode(
        type: SceneType.rainyDay,
        name: '雨天室内',
        icon: '🌧️',
        description: '无需大空间的室内运动',
        duration: 15,
        isLowIntensity: false,
        exercises: [
          Exercise(
            id: 'ex_knee',
            name: '高抬腿',
            duration: 60,
            reps: 30,
            icon: '🦵',
            difficulty: 'easy',
            description: '快速抬起膝盖',
          ),
          Exercise(
            id: 'ex_arm_circle',
            name: '手臂绕环',
            duration: 30,
            reps: 10,
            icon: '💪',
            difficulty: 'easy',
            description: '活动肩颈',
          ),
          Exercise(
            id: 'ex_side_lunge',
            name: '侧弓步',
            duration: 45,
            reps: 10,
            icon: '🦵',
            difficulty: 'medium',
            description: '锻炼侧腰',
          ),
        ],
      ),
    ];
  }

  static SceneMode getSceneByTime() {
    int hour = DateTime.now().hour;
    if (hour >= 7 && hour < 9) {
      return availableScenes.firstWhere((s) => s.type == SceneType.morning);
    }
    if (hour >= 12 && hour < 14) {
      return availableScenes.firstWhere((s) => s.type == SceneType.afterMeal);
    }
    if (hour >= 21 && hour < 23) {
      return availableScenes.firstWhere((s) => s.type == SceneType.bedtime);
    }
    return availableScenes.firstWhere((s) => s.type == SceneType.weekend);
  }
}