import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/plan.dart';
import '../../models/standard_action.dart';
import '../../models/pose_landmark.dart';
import '../../providers/app_provider.dart';
import '../../services/action_scoring_service.dart';
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
  double currentScore = 0;
  List<String> currentFeedback = [];
  bool isPerfect = false;
  int repCount = 0;
  int maxReps = 0;

  @override
  void initState() {
    super.initState();
    _updateMaxReps();
  }

  void _updateMaxReps() {
    if (widget.plan.exercises.isNotEmpty) {
      maxReps = widget.plan.exercises[currentIndex].reps;
    }
  }

  void startExercise() {
    setState(() {
      countdown = 3;
      isPlaying = true;
      currentScore = 0;
      currentFeedback = [];
      repCount = 0;
    });
    _countdownTimer();
  }

  void _countdownTimer() {
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted && countdown > 0) {
        setState(() => countdown--);
        _countdownTimer();
      } else if (mounted && countdown == 0) {
        _startScoring();
      }
    });
  }

  void _startScoring() {
    const interval = Duration(milliseconds: 500);
    Timer.periodic(interval, (timer) {
      if (!mounted || !isPlaying) {
        timer.cancel();
        return;
      }

      PoseData mockPoseData = _generateMockPoseData();
      StandardAction? standardAction = StandardAction.standardActions.firstWhere(
        (a) => a.name == widget.plan.exercises[currentIndex].name,
        orElse: () => StandardAction.standardActions[0],
      );

      ScoreResult result = ActionScoringService.scoreAction(mockPoseData, standardAction);

      setState(() {
        currentScore = result.totalScore;
        currentFeedback = result.feedback;
        isPerfect = result.isPerfect;

        if (result.totalScore >= 70) {
          repCount++;
        }
      });

      if (repCount >= maxReps) {
        timer.cancel();
        completeExercise((currentScore).round());
      }
    });
  }

  PoseData _generateMockPoseData() {
    List<PoseLandmark> landmarks = [
      PoseLandmark(id: 0, name: '左肩', x: 0.35 + (currentScore / 200), y: 0.35, z: 0, visibility: 1),
      PoseLandmark(id: 1, name: '右肩', x: 0.65 - (currentScore / 200), y: 0.35, z: 0, visibility: 1),
      PoseLandmark(id: 2, name: '左肘', x: 0.3 + (currentScore / 300), y: 0.5, z: 0, visibility: 1),
      PoseLandmark(id: 3, name: '右肘', x: 0.7 - (currentScore / 300), y: 0.5, z: 0, visibility: 1),
      PoseLandmark(id: 4, name: '左髋', x: 0.4, y: 0.55, z: 0, visibility: 1),
      PoseLandmark(id: 5, name: '右髋', x: 0.6, y: 0.55, z: 0, visibility: 1),
      PoseLandmark(id: 6, name: '左膝', x: 0.4 + (sin(DateTime.now().millisecond / 500) * 0.1), y: 0.75, z: 0, visibility: 1),
      PoseLandmark(id: 7, name: '右膝', x: 0.6 + (sin(DateTime.now().millisecond / 500) * 0.1), y: 0.75, z: 0, visibility: 1),
      PoseLandmark(id: 8, name: '左脚踝', x: 0.4, y: 0.9, z: 0, visibility: 1),
      PoseLandmark(id: 9, name: '右脚踝', x: 0.6, y: 0.9, z: 0, visibility: 1),
    ];
    return PoseData(landmarks: landmarks, timestamp: DateTime.now());
  }

  void completeExercise(int earnedScore) {
    setState(() {
      exerciseScores.add(earnedScore);
      score += earnedScore;
      isPlaying = false;
    });

    if (currentIndex < widget.plan.exercises.length - 1) {
      setState(() {
        currentIndex++;
        _updateMaxReps();
      });
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

  Color _getScoreColor(double score) {
    if (score >= 90) return Colors.green;
    if (score >= 70) return Colors.blue;
    if (score >= 50) return Colors.yellow;
    return Colors.red;
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
                  IconButton(
                    icon: const Icon(Icons.pause, color: Colors.white),
                    onPressed: isPlaying ? () => setState(() => isPlaying = false) : null,
                  ),
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
                              ? Stack(
                                  children: [
                                    Column(
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
                                    ),
                                    if (isPerfect)
                                      const Positioned(
                                        top: 20,
                                        right: 20,
                                        child: Text(
                                          '✨ PERFECT!',
                                          style: TextStyle(
                                            color: Colors.yellow,
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                          ),
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
                          Text(
                            currentScore.round().toString(),
                            style: TextStyle(
                              color: _getScoreColor(currentScore),
                              fontSize: 48,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '完成次数: $repCount/$maxReps',
                            style: const TextStyle(color: Colors.grey, fontSize: 14),
                          ),
                          const SizedBox(height: 16),
                          LinearProgressIndicator(
                            value: repCount / maxReps,
                            backgroundColor: const Color(0xFF333),
                            color: const Color(0xFF6366F1),
                            minHeight: 10,
                          ),
                          const SizedBox(height: 16),
                          ...currentFeedback.map((feedback) => Padding(
                                padding: const EdgeInsets.symmetric(vertical: 4),
                                child: Text(
                                  feedback,
                                  style: const TextStyle(color: Colors.yellow, fontSize: 14),
                                ),
                              )),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            if (isPlaying && countdown == 0)
              ElevatedButton(
                onPressed: () => completeExercise(currentScore.round()),
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

import 'dart:async';
import 'dart:math' as math;
import 'dart:math' show sin;
