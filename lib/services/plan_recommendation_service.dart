import '../models/plan.dart';
import '../models/exercise.dart';
import '../models/child_profile.dart';
import '../models/standard_action.dart';

class PlanRecommendationService {
  static Plan generatePersonalizedPlan(ChildProfile child, int streakDays, int weekMinutes) {
    DateTime now = DateTime.now();
    int hour = now.hour;
    
    List<Exercise> exercises = _selectExercises(child, streakDays, weekMinutes, hour);
    
    int totalDuration = exercises.fold(0, (sum, ex) => sum + ex.duration);
    int calories = (totalDuration * 0.8).round();
    
    String title = _getPlanTitle(hour, exercises);
    String description = _getPlanDescription(exercises);
    
    return Plan(
      id: 'plan_${now.toIso8601String()}',
      title: title,
      duration: (totalDuration / 60).round(),
      calories: calories,
      exercises: exercises,
      description: description,
      isCompleted: false,
      date: now,
    );
  }

  static List<Exercise> _selectExercises(
    ChildProfile child,
    int streakDays,
    int weekMinutes,
    int hour,
  ) {
    List<Exercise> availableExercises = _getAvailableExercises(child);
    List<Exercise> selected = [];
    
    double difficulty = _calculateDifficulty(child.age, streakDays, weekMinutes);
    
    int targetDuration = _getTargetDuration(hour);
    int currentDuration = 0;
    
    List<Exercise> sortedExercises = List.from(availableExercises)
      ..sort((a, b) {
        int difficultyOrder = _getDifficultyOrder(a.difficulty).compareTo(_getDifficultyOrder(b.difficulty));
        if (difficultyOrder != 0) return difficultyOrder;
        return a.duration.compareTo(b.duration);
      });
    
    for (var exercise in sortedExercises) {
      if (currentDuration + exercise.duration <= targetDuration) {
        if (_isAppropriateDifficulty(exercise.difficulty, difficulty)) {
          selected.add(exercise);
          currentDuration += exercise.duration;
        }
      }
      if (selected.length >= 4) break;
    }
    
    if (selected.isEmpty) {
      selected.add(Exercise(
        id: 'ex_default',
        name: '高抬腿',
        duration: 60,
        reps: 30,
        icon: '🦵',
        difficulty: 'easy',
        description: '快速抬起膝盖，锻炼腿部力量',
      ));
    }
    
    return selected;
  }

  static List<Exercise> _getAvailableExercises(ChildProfile child) {
    List<Exercise> exercises = [];
    
    for (var action in StandardAction.standardActions) {
      bool isAgeAppropriate = _isAgeAppropriate(child.age, action.difficulty);
      if (isAgeAppropriate) {
        exercises.add(Exercise(
          id: action.id,
          name: action.name,
          duration: action.duration,
          reps: _adjustRepsForAge(child.age, action.reps),
          icon: action.icon,
          difficulty: action.difficulty,
          description: action.description,
        ));
      }
    }
    
    return exercises;
  }

  static bool _isAgeAppropriate(int age, String difficulty) {
    if (age <= 6) {
      return difficulty == 'easy';
    } else if (age <= 9) {
      return difficulty == 'easy' || difficulty == 'medium';
    } else {
      return true;
    }
  }

  static int _adjustRepsForAge(int age, int baseReps) {
    if (age <= 6) return (baseReps * 0.6).round();
    if (age <= 9) return (baseReps * 0.8).round();
    return baseReps;
  }

  static double _calculateDifficulty(int age, int streakDays, int weekMinutes) {
    double baseDifficulty = age <= 6 ? 0.3 : age <= 9 ? 0.5 : 0.7;
    
    if (streakDays >= 7) baseDifficulty += 0.15;
    else if (streakDays >= 3) baseDifficulty += 0.05;
    
    if (weekMinutes >= 120) baseDifficulty += 0.1;
    else if (weekMinutes >= 60) baseDifficulty += 0.05;
    
    return baseDifficulty.clamp(0.2, 0.9);
  }

  static bool _isAppropriateDifficulty(String exerciseDifficulty, double targetDifficulty) {
    int exerciseLevel = _getDifficultyOrder(exerciseDifficulty);
    int targetLevel = targetDifficulty < 0.4 ? 1 : targetDifficulty < 0.7 ? 2 : 3;
    
    return (targetLevel - 1 <= exerciseLevel) && (exerciseLevel <= targetLevel);
  }

  static int _getDifficultyOrder(String difficulty) {
    switch (difficulty) {
      case 'easy':
        return 1;
      case 'medium':
        return 2;
      case 'hard':
        return 3;
      default:
        return 1;
    }
  }

  static int _getTargetDuration(int hour) {
    if (hour >= 7 && hour < 9) return 300;
    if (hour >= 12 && hour < 14) return 600;
    if (hour >= 18 && hour < 20) return 900;
    if (hour >= 20 && hour < 22) return 300;
    return 900;
  }

  static String _getPlanTitle(int hour, List<Exercise> exercises) {
    if (hour >= 7 && hour < 9) return '🌅 晨间唤醒运动';
    if (hour >= 12 && hour < 14) return '🍚 饭后活力运动';
    if (hour >= 18 && hour < 20) return '🏋️ 晚间体能训练';
    if (hour >= 20 && hour < 22) return '🌙 睡前放松运动';
    
    String types = exercises.map((e) => e.icon).join('');
    return '$types 今日运动计划';
  }

  static String _getPlanDescription(List<Exercise> exercises) {
    List<String> names = exercises.map((e) => e.name).toList();
    if (names.length == 1) return '包含${names[0]}';
    if (names.length == 2) return '包含${names.join('和')}';
    return '包含${names.sublist(0, names.length - 1).join('、')}和${names.last}';
  }
}