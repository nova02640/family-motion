import 'dart:math' as math;

import 'package:flutter/material.dart';

class AssessmentResultScreen extends StatelessWidget {
  final List<int> scores;

  const AssessmentResultScreen({super.key, required this.scores});

  final List<String> dimensions = const [
    '反应速度',
    '动作准确度',
    '爆发力',
    '下肢力量',
    '平衡力',
    '协调性',
  ];

  double get overallScore => scores.reduce((a, b) => a + b) / scores.length;

  String getGrade(double score) {
    if (score >= 90) return '优秀';
    if (score >= 80) return '良好';
    if (score >= 70) return '中等';
    if (score >= 60) return '及格';
    return '需要加油';
  }

  Color getGradeColor(double score) {
    if (score >= 90) return Colors.green;
    if (score >= 80) return Colors.blue;
    if (score >= 70) return Colors.yellow;
    if (score >= 60) return Colors.orange;
    return Colors.red;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1A1A2E),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              const Text(
                '体能测评完成！',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 30),
              Container(
                width: 180,
                height: 180,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: getGradeColor(overallScore).withOpacity(0.2),
                  border: Border.all(color: getGradeColor(overallScore), width: 4),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      overallScore.round().toString(),
                      style: TextStyle(
                        color: getGradeColor(overallScore),
                        fontSize: 48,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      getGrade(overallScore),
                      style: TextStyle(
                        color: getGradeColor(overallScore),
                        fontSize: 20,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 30),
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF16213E),
                  borderRadius: BorderRadius.circular(20),
                ),
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    const Text(
                      '能力雷达图',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      height: 200,
                      child: CustomPaint(
                        painter: RadarChartPainter(scores),
                        size: const Size(200, 200),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 30),
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF16213E),
                  borderRadius: BorderRadius.circular(20),
                ),
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    const Text(
                      '分项得分',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Column(
                      children: scores.asMap().entries.map((entry) {
                        int index = entry.key;
                        int score = entry.value;
                        return Container(
                          margin: const EdgeInsets.symmetric(vertical: 8),
                          child: Row(
                            children: [
                              Expanded(
                                flex: 2,
                                child: Text(
                                  dimensions[index],
                                  style: const TextStyle(color: Colors.white),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                flex: 3,
                                child: LinearProgressIndicator(
                                  value: score / 100,
                                  backgroundColor: const Color(0xFF333),
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    getGradeColor(score.toDouble()),
                                  ),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                flex: 1,
                                child: Text(
                                  score.toString(),
                                  textAlign: TextAlign.right,
                                  style: TextStyle(
                                    color: getGradeColor(score.toDouble()),
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 30),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.of(context).popUntil((route) => route.isFirst);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF6366F1),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        '返回首页',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('分享功能待接入'),
                            duration: Duration(seconds: 1),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF16213E),
                        side: const BorderSide(color: Color(0xFF6366F1)),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        '分享报告',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class RadarChartPainter extends CustomPainter {
  final List<int> scores;

  RadarChartPainter(this.scores);

  @override
  void paint(Canvas canvas, Size size) {
    final centerX = size.width / 2;
    final centerY = size.height / 2;
    final radius = size.width / 2 - 20;

    final paint = Paint()
      ..color = Colors.grey.withOpacity(0.3)
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke;

    // Draw concentric polygons (5 levels)
    for (int i = 1; i <= 5; i++) {
      double r = radius * i / 5;
      Path path = Path();
      for (int j = 0; j < 6; j++) {
        double angle = (j * 2 * math.pi / 6) - math.pi / 2;
        double x = centerX + r * math.cos(angle);
        double y = centerY + r * math.sin(angle);
        if (j == 0) {
          path.moveTo(x, y);
        } else {
          path.lineTo(x, y);
        }
      }
      path.close();
      canvas.drawPath(path, paint);
    }

    // Draw axes
    for (int j = 0; j < 6; j++) {
      double angle = (j * 2 * math.pi / 6) - math.pi / 2;
      double x = centerX + radius * math.cos(angle);
      double y = centerY + radius * math.sin(angle);
      canvas.drawLine(Offset(centerX, centerY), Offset(x, y), paint);
    }

    // Draw data polygon
    final dataPaint = Paint()
      ..color = const Color(0xFF6366F1).withOpacity(0.3)
      ..style = PaintingStyle.fill;

    Path dataPath = Path();
    for (int j = 0; j < 6; j++) {
      double angle = (j * 2 * math.pi / 6) - math.pi / 2;
      double r = radius * scores[j] / 100;
      double x = centerX + r * math.cos(angle);
      double y = centerY + r * math.sin(angle);
      if (j == 0) {
        dataPath.moveTo(x, y);
      } else {
        dataPath.lineTo(x, y);
      }
    }
    dataPath.close();
    canvas.drawPath(dataPath, dataPaint);

    // Draw data outline
    dataPaint.color = const Color(0xFF6366F1);
    dataPaint.style = PaintingStyle.stroke;
    dataPaint.strokeWidth = 2;
    canvas.drawPath(dataPath, dataPaint);

    // Draw data points
    final dotPaint = Paint()
      ..color = const Color(0xFF6366F1)
      ..style = PaintingStyle.fill;

    for (int j = 0; j < 6; j++) {
      double angle = (j * 2 * math.pi / 6) - math.pi / 2;
      double r = radius * scores[j] / 100;
      double x = centerX + r * math.cos(angle);
      double y = centerY + r * math.sin(angle);
      canvas.drawCircle(Offset(x, y), 4, dotPaint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) {
    if (oldDelegate is RadarChartPainter) {
      return oldDelegate.scores != scores;
    }
    return true;
  }
}
