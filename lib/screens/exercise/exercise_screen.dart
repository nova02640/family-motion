import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/plan.dart';
import '../../providers/app_provider.dart';
import 'exercise_result_screen.dart';

class ExerciseScreen extends StatefulWidget {
  final Plan plan;

  const ExerciseScreen({super.key, required this.plan});

  @override
  State<ExerciseScreen> createState() => _ExerciseScreenState();
}

class _ExerciseScreenState extends State<ExerciseScreen> {
  int currentIndex = 0;
  bool isPlaying = false;
  int countdown = 3;
  int score = 0;
  List<int> exerciseScores = [];

  void startExercise() {
    setState(() {
      countdown = 3;
      isPlaying = true;
    });
    Future.delayed(const Duration(seconds: 1), () {
      if (countdown > 0) {
        setState(() => countdown--);
        startExercise();
      }
    });
  }

  void completeExercise(int earnedScore) {
    setState(() {
      exerciseScores.add(earnedScore);
      score += earnedScore;
      isPlaying = false;
    });

    if (currentIndex < widget.plan.exercises.length - 1) {
      setState(() => currentIndex++);
    } else {
      Provider.of<AppProvider>(context, listen: false).completePlan();
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => ExerciseResultScreen(
            plan: widget.plan,
            totalScore: score,
            exerciseScores: exerciseScores,
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final exercise = widget.plan.exercises[currentIndex];

    return Scaffold(
      backgroundColor: const Color(0xFF1A1A2E),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                  const Spacer(),
                  Text(
                    '${currentIndex + 1}/${widget.plan.exercises.length}',
                    style: const TextStyle(color: Colors.white, fontSize: 16),
                  ),
                  const Spacer(),
                  const Icon(Icons.pause, color: Colors.white),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Expanded(
              child: Column(
                children: [
                  Container(
                    width: 200,
                    height: 200,
                    decoration: BoxDecoration(
                      color: const Color(0xFF16213E),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Center(
                      child: isPlaying && countdown > 0
                          ? Text(
                              countdown.toString(),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 72,
                                fontWeight: FontWeight.bold,
                              ),
                            )
                          : isPlaying && countdown == 0
                              ? Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      exercise.icon,
                                      style: const TextStyle(fontSize: 64),
                                    ),
                                    const SizedBox(height: 16),
                                    Text(
                                      exercise.name,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 24,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                )
                              : Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      exercise.icon,
                                      style: const TextStyle(fontSize: 64),
                                    ),
                                    const SizedBox(height: 16),
                                    Text(
                                      exercise.name,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 24,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      exercise.description,
                                      style: const TextStyle(
                                        color: Colors.grey,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ],
                                ),
                    ),
                  ),
                  const SizedBox(height: 30),
                  if (!isPlaying)
                    ElevatedButton(
                      onPressed: startExercise,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF6366F1),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 60, vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                      ),
                      child: const Text(
                        '开始',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  if (isPlaying && countdown == 0)
                    Container(
                      margin: const EdgeInsets.all(20),
                      child: Column(
                        children: [
                          const Text(
                            '动作评分',
                            style: TextStyle(color: Colors.white, fontSize: 16),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            '85',
                            style: TextStyle(
                              color: Colors.green,
                              fontSize: 48,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          const LinearProgressIndicator(
                            value: 0.7,
                            backgroundColor: Color(0xFF333),
                            color: Color(0xFF6366F1),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            '加油！保持姿势！',
                            style: TextStyle(color: Colors.grey, fontSize: 14),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            if (isPlaying && countdown == 0)
              ElevatedButton(
                onPressed: () => completeExercise(85),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  padding: const EdgeInsets.symmetric(horizontal: 60, vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
                child: const Text(
                  '完成动作',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
