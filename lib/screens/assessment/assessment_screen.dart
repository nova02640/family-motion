import 'dart:async';

import 'package:flutter/material.dart';
import '../../models/assessment.dart';
import 'assessment_result_screen.dart';

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
  Timer? _gameTimer;

  @override
  void dispose() {
    _gameTimer?.cancel();
    super.dispose();
  }

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
      if (!mounted) return;
      if (countdown > 0) {
        setState(() => countdown--);
        _countdownTimer();
      } else {
        _startGameLoop();
      }
    });
  }

  void _startGameLoop() {
    _gameTimer?.cancel();
    const interval = Duration(milliseconds: 500);
    _gameTimer = Timer.periodic(interval, (timer) {
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

    // 将 Map<AssessmentType, int> 转换为按 AssessmentType 顺序排列的 List<int>
    List<int> orderedScores = AssessmentType.values.map((type) => scores[type] ?? 0).toList();

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => AssessmentResultScreen(scores: orderedScores),
      ),
    );
    // totalScore 当前未在新结果页使用，但保留以备后续扩展
    debugPrint('体能测评完成，总分: $totalScore');
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
                      '剩余时间: ${timeLeft}s',
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
}
