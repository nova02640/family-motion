import 'package:flutter/material.dart';
import '../../models/duel_state.dart';
import '../../models/standard_action.dart';
import '../../models/pose_landmark.dart';
import '../../services/action_scoring_service.dart';

class DuelScreen extends StatefulWidget {
  const DuelScreen({super.key});

  @override
  State<DuelScreen> createState() => _DuelScreenState();
}

class _DuelScreenState extends State<DuelScreen> {
  DuelMode? selectedMode;
  DuelState? duelState;
  bool isDetectingPlayers = false;
  bool showPlayerDetection = false;

  final List<Map<String, dynamic>> modes = [
    {
      'name': '竞速模式',
      'description': '谁先完成规定次数标准动作',
      'icon': '🏎️',
      'color': Colors.red,
      'mode': DuelMode.race,
    },
    {
      'name': '准确度模式',
      'description': '规定时间内，动作准确度总分高者胜',
      'icon': '🎯',
      'color': Colors.blue,
      'mode': DuelMode.accuracy,
    },
    {
      'name': '合作模式',
      'description': '两人动作同步率达标才能通关',
      'icon': '🤝',
      'color': Colors.green,
      'mode': DuelMode.cooperation,
    },
  ];

  void selectMode(DuelMode mode) {
    setState(() {
      selectedMode = mode;
    });
  }

  void startPlayerDetection() {
    setState(() {
      showPlayerDetection = true;
      isDetectingPlayers = true;
    });

    Future.delayed(const Duration(seconds: 3), () {
      setState(() {
        isDetectingPlayers = false;
        startDuel();
      });
    });
  }

  void startDuel() {
    final action = StandardAction.standardActions[0];
    setState(() {
      duelState = DuelState(
        mode: selectedMode ?? DuelMode.race,
        status: DuelStatus.countingDown,
        playerA: PlayerState(id: 'A', name: '小明', avatar: '👦'),
        playerB: PlayerState(id: 'B', name: '妈妈', avatar: '👩'),
        currentAction: action,
        countdown: 3,
        timeLeft: selectedMode == DuelMode.accuracy ? 60 : 90,
        targetReps: 10,
      );
    });
    startCountdown();
  }

  void startCountdown() {
    if (duelState?.status != DuelStatus.countingDown) return;

    Future.delayed(const Duration(seconds: 1), () {
      if (mounted && duelState != null) {
        if (duelState!.countdown > 1) {
          setState(() {
            duelState = duelState!.copyWith(
              countdown: duelState!.countdown - 1,
            );
          });
          startCountdown();
        } else {
          setState(() {
            duelState = duelState!.copyWith(
              status: DuelStatus.playing,
              countdown: 0,
            );
          });
          startGameLoop();
        }
      }
    });
  }

  void startGameLoop() {
    const interval = Duration(milliseconds: 500);
    Timer.periodic(interval, (timer) {
      if (!mounted || duelState == null || duelState!.status != DuelStatus.playing) {
        timer.cancel();
        return;
      }

      if (duelState!.isComplete) {
        timer.cancel();
        setState(() {
          duelState = duelState!.copyWith(status: DuelStatus.finished);
        });
        return;
      }

      PoseData poseA = _generateMockPose(true);
      PoseData poseB = _generateMockPose(false);

      ScoreResult resultA = ActionScoringService.scoreAction(poseA, duelState!.currentAction);
      ScoreResult resultB = ActionScoringService.scoreAction(poseB, duelState!.currentAction);

      int newRepA = duelState!.playerA.repCount + (resultA.totalScore >= 70 ? 1 : 0);
      int newRepB = duelState!.playerB.repCount + (resultB.totalScore >= 70 ? 1 : 0);

      setState(() {
        duelState = duelState!.copyWith(
          timeLeft: duelState!.timeLeft - (interval.inMilliseconds ~/ 1000),
          playerA: duelState!.playerA.copyWith(
            currentScore: resultA.totalScore,
            repCount: newRepA,
            actionScores: [...duelState!.playerA.actionScores, resultA.totalScore.round()],
            currentPose: poseA,
          ),
          playerB: duelState!.playerB.copyWith(
            currentScore: resultB.totalScore,
            repCount: newRepB,
            actionScores: [...duelState!.playerB.actionScores, resultB.totalScore.round()],
            currentPose: poseB,
          ),
        );
      });
    });
  }

  PoseData _generateMockPose(bool isPlayerA) {
    double offset = isPlayerA ? -0.15 : 0.15;
    double time = DateTime.now().millisecond / 500;
    double baseScore = 75 + (isPlayerA ? 10 : 5) + (sin(time) * 10);

    List<PoseLandmark> landmarks = [
      PoseLandmark(id: 0, name: '左肩', x: 0.5 + offset, y: 0.35, z: 0, visibility: 1),
      PoseLandmark(id: 1, name: '右肩', x: 0.5 + offset, y: 0.35, z: 0, visibility: 1),
      PoseLandmark(id: 2, name: '左肘', x: 0.4 + offset + (baseScore / 300), y: 0.5, z: 0, visibility: 1),
      PoseLandmark(id: 3, name: '右肘', x: 0.6 + offset - (baseScore / 300), y: 0.5, z: 0, visibility: 1),
      PoseLandmark(id: 4, name: '左髋', x: 0.45 + offset, y: 0.55, z: 0, visibility: 1),
      PoseLandmark(id: 5, name: '右髋', x: 0.55 + offset, y: 0.55, z: 0, visibility: 1),
      PoseLandmark(id: 6, name: '左膝', x: 0.45 + offset + (sin(time) * 0.08), y: 0.7 + (sin(time) * 0.15), z: 0, visibility: 1),
      PoseLandmark(id: 7, name: '右膝', x: 0.55 + offset + (sin(time) * 0.08), y: 0.7 + (sin(time) * 0.15), z: 0, visibility: 1),
      PoseLandmark(id: 8, name: '左脚踝', x: 0.45 + offset, y: 0.9, z: 0, visibility: 1),
      PoseLandmark(id: 9, name: '右脚踝', x: 0.55 + offset, y: 0.9, z: 0, visibility: 1),
    ];
    return PoseData(landmarks: landmarks, timestamp: DateTime.now());
  }

  Color _getScoreColor(double score) {
    if (score >= 90) return Colors.green;
    if (score >= 70) return Colors.blue;
    if (score >= 50) return Colors.yellow;
    return Colors.red;
  }

  Widget _buildModeSelectScreen() {
    return Scaffold(
      appBar: AppBar(
        title: const Text('亲子对战'),
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.black,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFF472B6), Color(0xFFEC4899)],
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFF472B6).withOpacity(0.3),
                    blurRadius: 10,
                  ),
                ],
              ),
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  const Text(
                    '🎮 双人同屏对战',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    '邀请家人一起运动，比比谁更厉害！',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: const [
                        Column(
                          children: [
                            Text('👦', style: TextStyle(fontSize: 32)),
                            SizedBox(height: 4),
                            Text('玩家A', style: TextStyle(color: Colors.white)),
                          ],
                        ),
                        Text(
                          'VS',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Column(
                          children: [
                            Text('👩', style: TextStyle(fontSize: 32)),
                            SizedBox(height: 4),
                            Text('玩家B', style: TextStyle(color: Colors.white)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              '选择对战模式',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Column(
              children: modes
                  .map((mode) => GestureDetector(
                        onTap: () => selectMode(mode['mode']),
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
                            color: selectedMode == mode['mode']
                                ? mode['color'].withOpacity(0.1)
                                : Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: selectedMode == mode['mode']
                                ? Border.all(color: mode['color'], width: 2)
                                : null,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.grey.withOpacity(0.1),
                                blurRadius: 4,
                              ),
                            ],
                          ),
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              Container(
                                width: 60,
                                height: 60,
                                decoration: BoxDecoration(
                                  color: mode['color'].withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Center(
                                  child: Text(mode['icon'], style: const TextStyle(fontSize: 32)),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      mode['name'],
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      mode['description'],
                                      style: const TextStyle(
                                        color: Colors.grey,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (selectedMode == mode['mode'])
                                const Icon(Icons.check_circle, color: Colors.green),
                            ],
                          ),
                        ),
                      ))
                  .toList(),
            ),
            const SizedBox(height: 20),
            Center(
              child: ElevatedButton(
                onPressed: selectedMode != null ? startPlayerDetection : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6366F1),
                  padding: const EdgeInsets.symmetric(horizontal: 60, vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
                child: const Text(
                  '开始对战',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlayerDetectionScreen() {
    return Scaffold(
      backgroundColor: const Color(0xFF1A1A2E),
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                '🎥',
                style: TextStyle(fontSize: 80),
              ),
              const SizedBox(height: 20),
              const Text(
                '正在检测玩家',
                style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              const Text(
                '请两位并排站在摄像头前\n距离1.5-2.5米',
                style: TextStyle(color: Colors.grey, fontSize: 16),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 30),
              if (isDetectingPlayers)
                const CircularProgressIndicator(color: Color(0xFF6366F1)),
              if (!isDetectingPlayers)
                const Text(
                  '✅ 检测完成！',
                  style: TextStyle(color: Colors.green, fontSize: 18),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDuelScreen() {
    if (duelState == null) return const SizedBox();

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
                    onPressed: () => setState(() {
                      duelState = null;
                      selectedMode = null;
                      showPlayerDetection = false;
                    }),
                  ),
                  const Spacer(),
                  Text(
                    _getModeName(duelState!.mode),
                    style: const TextStyle(color: Colors.white, fontSize: 16),
                  ),
                  const Spacer(),
                  const Icon(Icons.pause, color: Colors.white),
                ],
              ),
            ),
            if (duelState!.status == DuelStatus.countingDown)
              Expanded(
                child: Center(
                  child: Text(
                    duelState!.countdown.toString(),
                    style: const TextStyle(color: Colors.white, fontSize: 120, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            if (duelState!.status == DuelStatus.playing)
              Expanded(
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: _buildPlayerPanel(duelState!.playerA, true),
                        ),
                        Expanded(
                          child: _buildPlayerPanel(duelState!.playerB, false),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF16213E),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            duelState!.currentAction.icon,
                            style: const TextStyle(fontSize: 32),
                          ),
                          Column(
                            children: [
                              Text(
                                duelState!.currentAction.name,
                                style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                              ),
                              if (duelState!.mode == DuelMode.accuracy)
                                Text(
                                  '剩余时间: ${duelState!.timeLeft}s',
                                  style: const TextStyle(color: Colors.grey, fontSize: 14),
                                ),
                            ],
                          ),
                          const SizedBox(width: 40),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildProgressBar(),
                  ],
                ),
              ),
            if (duelState!.status == DuelStatus.finished)
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        '🎉',
                        style: TextStyle(fontSize: 80),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        duelState!.winner != null
                            ? '恭喜 ${duelState!.winnerName} 获胜！'
                            : '平局！',
                        style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 20),
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: const Color(0xFF16213E),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildResultPlayer(duelState!.playerA),
                            _buildResultPlayer(duelState!.playerB),
                          ],
                        ),
                      ),
                      const SizedBox(height: 30),
                      ElevatedButton(
                        onPressed: () => setState(() {
                          duelState = null;
                          selectedMode = null;
                          showPlayerDetection = false;
                        }),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF6366F1),
                          padding: const EdgeInsets.symmetric(horizontal: 60, vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(30),
                          ),
                        ),
                        child: const Text(
                          '返回首页',
                          style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlayerPanel(PlayerState player, bool isLeft) {
    return Container(
      margin: const EdgeInsets.all(8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF16213E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: player.isPresent ? Colors.transparent : Colors.red,
          width: 2,
        ),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(player.avatar, style: const TextStyle(fontSize: 28)),
              const SizedBox(width: 8),
              Text(
                player.name,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              color: Colors.grey[800],
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    player.currentScore.round().toString(),
                    style: TextStyle(
                      color: _getScoreColor(player.currentScore),
                      fontSize: 36,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    '得分',
                    style: TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            '完成: ${player.repCount}/${duelState?.targetReps ?? 10}',
            style: const TextStyle(color: Colors.grey, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressBar() {
    if (duelState == null) return const SizedBox();

    double progressA = duelState!.playerA.repCount / duelState!.targetReps;
    double progressB = duelState!.playerB.repCount / duelState!.targetReps;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF16213E),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  children: [
                    LinearProgressIndicator(
                      value: progressA.clamp(0.0, 1.0),
                      backgroundColor: Colors.grey[700],
                      color: Colors.blue,
                      minHeight: 12,
                    ),
                    const SizedBox(height: 4),
                    const Text('玩家A', style: TextStyle(color: Colors.blue, fontSize: 12)),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  children: [
                    LinearProgressIndicator(
                      value: progressB.clamp(0.0, 1.0),
                      backgroundColor: Colors.grey[700],
                      color: Colors.pink,
                      minHeight: 12,
                    ),
                    const SizedBox(height: 4),
                    const Text('玩家B', style: TextStyle(color: Colors.pink, fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildResultPlayer(PlayerState player) {
    return Column(
      children: [
        Text(player.avatar, style: const TextStyle(fontSize: 48)),
        const SizedBox(height: 8),
        Text(
          player.name,
          style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Text(
          '得分: ${player.totalScore.round()}',
          style: TextStyle(
            color: _getScoreColor(player.totalScore),
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '完成: ${player.repCount}次',
          style: const TextStyle(color: Colors.grey, fontSize: 14),
        ),
      ],
    );
  }

  String _getModeName(DuelMode mode) {
    switch (mode) {
      case DuelMode.race:
        return '竞速模式';
      case DuelMode.accuracy:
        return '准确度模式';
      case DuelMode.cooperation:
        return '合作模式';
      default:
        return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    if (showPlayerDetection && duelState == null) {
      return _buildPlayerDetectionScreen();
    }
    if (duelState != null) {
      return _buildDuelScreen();
    }
    return _buildModeSelectScreen();
  }
}

import 'dart:async';
import 'dart:math' show sin;