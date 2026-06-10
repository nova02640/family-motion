import 'exercise.dart';

class Plan {
  final String id;
  final String title;
  final int duration;
  final int calories;
  final List<Exercise> exercises;
  final String description;
  bool isCompleted;
  final DateTime date;

  Plan({
    required this.id,
    required this.title,
    required this.duration,
    required this.calories,
    required this.exercises,
    required this.description,
    this.isCompleted = false,
    required this.date,
  });

  static Plan generateTodayPlan() {
    return Plan(
      id: 'plan_${DateTime.now().toIso8601String()}',
      title: '活力上午运动',
      duration: 15,
      calories: 120,
      description: '包含3个动作，适合早晨唤醒身体',
      exercises: [
        Exercise(
          id: 'ex_1',
          name: '高抬腿',
          duration: 60,
          reps: 30,
          icon: '🦵',
          difficulty: 'easy',
          description: '快速抬起膝盖，锻炼腿部力量',
        ),
        Exercise(
          id: 'ex_2',
          name: '开合跳',
          duration: 45,
          reps: 25,
          icon: '✌️',
          difficulty: 'medium',
          description: '双脚开合跳跃，提高心肺功能',
        ),
        Exercise(
          id: 'ex_3',
          name: '平板支撑',
          duration: 30,
          reps: 1,
          icon: '🏋️',
          difficulty: 'medium',
          description: '保持身体平直，锻炼核心力量',
        ),
      ],
      date: DateTime.now(),
    );
  }
}
