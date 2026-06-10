import 'package:flutter/material.dart';
import '../../models/assessment.dart';

class AssessmentScreen extends StatefulWidget {
  const AssessmentScreen({super.key});

  @override
  State<AssessmentScreen> createState() => _AssessmentScreenState();
}

class _AssessmentScreenState extends State<AssessmentScreen> {
  int currentIndex = 0;
  bool isPlaying = false;
  int countdown = 3;
  int timeLeft = 0;
  int score = 0;
  Map<AssessmentType, int> scores = {};

  void startAssessment() {
    setState(() {
      countdown = 3;
      isPlaying = true;
      timeLeft = Assessment.assessments[currentIndex].duration;
      score = 0;
    });
    _countdownTimer();
  }

  void _countdownTimer() {
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted && countdown > 0) {
        setState(() => countdown--);
        _countdownTimer();
      } else if (mounted && countdown == 0) {
        _startGameLoop();
      }
    });
  }

  void _startGameLoop() {
    const interval = Duration(milliseconds: 500);
    Timer.periodic(interval, (timer) {
      if (!mounted || !isPlaying) {
        timer.cancel();
        return;
      }

      setState(() {
        timeLeft -= interval.inMilliseconds ~/ 1000;
        score += (DateTime.now().millisecond % 10);
      });

      if (timeLeft <= 0) {
        timer.cancel();
        _completeAssessment();
      }
    });
  }

  void _completeAssessment() {
    setState(() {
      isPlaying = false;
      scores[Assessment.assessments[currentIndex].type] = score.clamp(0, 100);
    });

    if (currentIndex < Assessment.assessments.length - 1) {
      setState(() => currentIndex++);
    } else {
      _showResult();
    }
  }

  void _showResult() {
    int totalScore = scores.values.isNotEmpty
        ? scores.values.reduce((a, b) => a + b) ~/ scores.length
        : 0;

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => AssessmentResultScreen(
          scores: scores,
          totalScore: totalScore,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final assessment = Assessment.assessments[currentIndex];

    return Scaffold(
      appBar: AppBar(
        title: const Text('体能测评'),
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.black,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                children: [
                  Text(
                    assessment.icon,
                    style: const TextStyle(fontSize: 64),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    assessment.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    assessment.description,
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.1),
                    blurRadius: 4,
                  ),
                ],
              ),
              child: Column(
                children: [
                  const Text(
                    '游戏说明',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    assessment.gameInstruction,
                    style: const TextStyle(
                      color: Colors.grey,
                      fontSize: 14,
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.timer, color: Color(0xFF6366F1)),
                      const SizedBox(width: 8),
                      Text(
                        '${assessment.duration}秒',
                        style: const TextStyle(
                          color: Color(0xFF6366F1),
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            if (!isPlaying)
              ElevatedButton(
                onPressed: startAssessment,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6366F1),
                  padding: const EdgeInsets.symmetric(horizontal: 60, vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
                child: const Text(
                  '开始测试',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            if (isPlaying && countdown > 0)
              Container(
                height: 300,
                child: Center(
                  child: Text(
                    countdown.toString(),
                    style: const TextStyle(fontSize: 120, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            if (isPlaying && countdown == 0)
              Container(
                height: 300,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      assessment.icon,
                      style: const TextStyle(fontSize: 80),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      '剩余时间: $timeLefts',
                      style: const TextStyle(fontSize: 24, color: Colors.grey),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      '得分: $score',
                      style: const TextStyle(
                        fontSize: 36,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF6366F1),
                      ),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: Assessment.assessments.asMap().entries.map((entry) {
                  int index = entry.key;
                  var assess = entry.value;
                  bool isCompleted = scores.containsKey(assess.type);
                  bool isCurrent = index == currentIndex;

                  return Expanded(
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: isCompleted
                            ? const Color(0xFF6366F1)
                            : isCurrent
                                ? const Color(0xFFE0E7FF)
                                : Colors.white,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Center(
                        child: Text(
                          assess.icon,
                          style: TextStyle(
                            fontSize: isCompleted ? 20 : 16,
                            color: isCompleted ? Colors.white : Colors.black,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String get timeLefts => timeLeft.toString();
}

import 'dart:async';

class AssessmentResultScreen extends StatelessWidget {
  final Map<AssessmentType, int> scores;
  final int totalScore;

  const AssessmentResultScreen({
    super.key,
    required this.scores,
    required this.totalScore,
  });

  String _getLevel(int score) {
    if (score >= 90) return '优秀';
    if (score >= 80) return '良好';
    if (score >= 70) return '中等';
    if (score >= 60) return '及格';
    return '需要加油';
  }

  Color _getLevelColor(int score) {
    if (score >= 90) return Colors.green;
    if (score >= 80) return Colors.blue;
    if (score >= 70) return Colors.yellow;
    if (score >= 60) return Colors.orange;
    return Colors.red;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('测评结果'),
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.black,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(30),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                children: [
                  const Text(
                    '🎉',
                    style: TextStyle(fontSize: 64),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    totalScore.toString(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 64,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _getLevel(totalScore),
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.1),
                    blurRadius: 4,
                  ),
                ],
              ),
              child: Column(
                children: [
                  const Text(
                    '各项能力得分',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: const [
                      Expanded(child: _RadarChart()),
                    ],
                  ),
                  const SizedBox(height: 20),
                  GridView.count(
                    shrinkWrap: true,
                    crossAxisCount: 3,
                    children: AssessmentType.values.map((type) {
                      int score = scores[type] ?? 0;
                      return Column(
                        children: [
                          Text(
                            _getIcon(type),
                            style: const TextStyle(fontSize: 28),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _getName(type),
                            style: const TextStyle(fontSize: 12),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            score.toString(),
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: _getLevelColor(score),
                            ),
                          ),
                        ],
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6366F1),
                padding: const EdgeInsets.symmetric(horizontal: 60, vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              child: const Text(
                '返回首页',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getIcon(AssessmentType type) {
    switch (type) {
      case AssessmentType.reaction:
        return '🐡';
      case AssessmentType.accuracy:
        return '❤️';
      case AssessmentType.power:
        return '📦';
      case AssessmentType.endurance:
        return '🐹';
      case AssessmentType.balance:
        return '🏎️';
      case AssessmentType.coordination:
        return '👯';
    }
  }

  String _getName(AssessmentType type) {
    switch (type) {
      case AssessmentType.reaction:
        return '反应';
      case AssessmentType.accuracy:
        return '准确';
      case AssessmentType.power:
        return '爆发';
      case AssessmentType.endurance:
        return '耐力';
      case AssessmentType.balance:
        return '平衡';
      case AssessmentType.coordination:
        return '协调';
    }
  }
}

class _RadarChart extends StatelessWidget {
  const _RadarChart();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 200,
      height: 200,
      child: CustomPaint(
        painter: _RadarPainter(),
      ),
    );
  }
}

class _RadarPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    double centerX = size.width / 2;
    double centerY = size.height / 2;
    double radius = size.width / 2 - 20;

    Paint gridPaint = Paint()
      ..color = Colors.grey[300]!
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke;

    for (int i = 1; i <= 5; i++) {
      double r = radius * i / 5;
      Path path = Path();
      for (int j = 0; j < 6; j++) {
        double angle = (j * 60 - 90) * (3.1415926 / 180);
        double x = centerX + r * cos(angle);
        double y = centerY + r * sin(angle);
        if (j == 0) {
          path.moveTo(x, y);
        } else {
          path.lineTo(x, y);
        }
      }
      path.close();
      canvas.drawPath(path, gridPaint);
    }

    for (int i = 0; i < 6; i++) {
      double angle = (i * 60 - 90) * (3.1415926 / 180);
      double x = centerX + radius * cos(angle);
      double y = centerY + radius * sin(angle);
      canvas.drawLine(
        Offset(centerX, centerY),
        Offset(x, y),
        gridPaint,
      );
    }

    List<int> mockScores = [85, 78, 90, 72, 82, 88];
    Paint dataPaint = Paint()
      ..color = const Color(0xFF6366F1)
      ..strokeWidth = 2
      ..style = PaintingStyle.fill
      ..color = const Color(0xFF6366F1).withOpacity(0.3);

    Path dataPath = Path();
    for (int i = 0; i < 6; i++) {
      double angle = (i * 60 - 90) * (3.1415926 / 180);
      double r = radius * (mockScores[i] / 100);
      double x = centerX + r * cos(angle);
      double y = centerY + r * sin(angle);
      if (i == 0) {
        dataPath.moveTo(x, y);
      } else {
        dataPath.lineTo(x, y);
      }
    }
    dataPath.close();
    canvas.drawPath(dataPath, dataPaint);

    Paint borderPaint = Paint()
      ..color = const Color(0xFF6366F1)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;
    canvas.drawPath(dataPath, borderPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) {
    return false;
  }

  double cos(double angle) => math.cos(angle);
  double sin(double angle) => math.sin(angle);
}

import 'dart:math' as math;