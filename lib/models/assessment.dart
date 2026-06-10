import 'exercise.dart';

enum AssessmentType {
  reaction,
  accuracy,
  power,
  endurance,
  balance,
  coordination,
}

class Assessment {
  final String id;
  final AssessmentType type;
  final String name;
  final String icon;
  final String description;
  final int duration;
  final Exercise exercise;
  final String gameInstruction;

  Assessment({
    required this.id,
    required this.type,
    required this.name,
    required this.icon,
    required this.description,
    required this.duration,
    required this.exercise,
    required this.gameInstruction,
  });

  static List<Assessment> get assessments {
    return [
      Assessment(
        id: 'ass_reaction',
        type: AssessmentType.reaction,
        name: '躲河豚',
        icon: '🐡',
        description: '测试反应速度和协调性',
        duration: 60,
        exercise: Exercise(
          id: 'ex_reaction',
          name: '左右闪避',
          duration: 60,
          reps: 20,
          icon: '🐡',
          difficulty: 'medium',
          description: '左右移动躲避河豚',
        ),
        gameInstruction: '看到河豚出现时，快速向相反方向移动！',
      ),
      Assessment(
        id: 'ass_accuracy',
        type: AssessmentType.accuracy,
        name: '找爱心',
        icon: '❤️',
        description: '测试动作准确度和平衡力',
        duration: 90,
        exercise: Exercise(
          id: 'ex_accuracy',
          name: '接住爱心',
          duration: 90,
          reps: 15,
          icon: '❤️',
          difficulty: 'medium',
          description: '做出指定动作接住爱心',
        ),
        gameInstruction: '根据提示做出正确动作，接住掉落的爱心！',
      ),
      Assessment(
        id: 'ass_power',
        type: AssessmentType.power,
        name: '倒货箱',
        icon: '📦',
        description: '测试爆发力和核心力量',
        duration: 60,
        exercise: Exercise(
          id: 'ex_power',
          name: '搬运模拟',
          duration: 60,
          reps: 10,
          icon: '📦',
          difficulty: 'medium',
          description: '模拟搬运动作',
        ),
        gameInstruction: '用力做出搬运动作，把货箱搬到指定位置！',
      ),
      Assessment(
        id: 'ass_endurance',
        type: AssessmentType.endurance,
        name: '打地鼠',
        icon: '🐹',
        description: '测试下肢力量和耐力',
        duration: 60,
        exercise: Exercise(
          id: 'ex_endurance',
          name: '快速蹲起',
          duration: 60,
          reps: 20,
          icon: '🐹',
          difficulty: 'medium',
          description: '快速蹲下站起打地鼠',
        ),
        gameInstruction: '快速蹲下站起，击打冒出来的地鼠！',
      ),
      Assessment(
        id: 'ass_balance',
        type: AssessmentType.balance,
        name: '极速车',
        icon: '🏎️',
        description: '测试平衡力和核心稳定性',
        duration: 90,
        exercise: Exercise(
          id: 'ex_balance',
          name: '倾斜控制',
          duration: 90,
          reps: 15,
          icon: '🏎️',
          difficulty: 'medium',
          description: '左右倾斜控制方向',
        ),
        gameInstruction: '左右倾斜身体，控制小车躲避障碍物！',
      ),
      Assessment(
        id: 'ass_coordination',
        type: AssessmentType.coordination,
        name: '跟我学',
        icon: '👯',
        description: '测试协调性和记忆力',
        duration: 120,
        exercise: Exercise(
          id: 'ex_coordination',
          name: '动作模仿',
          duration: 120,
          reps: 8,
          icon: '👯',
          difficulty: 'medium',
          description: '模仿教练做动作组合',
        ),
        gameInstruction: '仔细看教练示范，然后模仿做出相同动作！',
      ),
    ];
  }
}

class AssessmentResult {
  final String id;
  final DateTime date;
  final Map<AssessmentType, int> scores;
  final int overallScore;
  final String level;

  AssessmentResult({
    required this.id,
    required this.date,
    required this.scores,
    required this.overallScore,
    required this.level,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'date': date.toIso8601String(),
      'scores': scores.map((key, value) => MapEntry(key.name, value)),
      'overallScore': overallScore,
      'level': level,
    };
  }

  factory AssessmentResult.fromJson(Map<String, dynamic> json) {
    return AssessmentResult(
      id: json['id'],
      date: DateTime.parse(json['date']),
      scores: Map.fromEntries(
        json['scores'].entries.map(
          (entry) => MapEntry(
            AssessmentType.values.firstWhere((e) => e.name == entry.key),
            entry.value,
          ),
        ),
      ),
      overallScore: json['overallScore'],
      level: json['level'],
    );
  }

  List<int> get scoreList {
    return AssessmentType.values.map((type) => scores[type] ?? 0).toList();
  }

  String getLevelFromScore(int score) {
    if (score >= 90) return '优秀';
    if (score >= 80) return '良好';
    if (score >= 70) return '中等';
    if (score >= 60) return '及格';
    return '需要加油';
  }
}