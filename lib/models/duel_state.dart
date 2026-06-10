import 'pose_landmark.dart';
import 'standard_action.dart';

enum DuelMode {
  race,
  accuracy,
  cooperation,
}

enum DuelStatus {
  preparing,
  countingDown,
  playing,
  finished,
}

class DuelState {
  final DuelMode mode;
  final DuelStatus status;
  final PlayerState playerA;
  final PlayerState playerB;
  final StandardAction currentAction;
  final int countdown;
  final int timeLeft;
  final int targetReps;

  DuelState({
    required this.mode,
    required this.status,
    required this.playerA,
    required this.playerB,
    required this.currentAction,
    this.countdown = 3,
    this.timeLeft = 60,
    this.targetReps = 10,
  });

  DuelState copyWith({
    DuelMode? mode,
    DuelStatus? status,
    PlayerState? playerA,
    PlayerState? playerB,
    StandardAction? currentAction,
    int? countdown,
    int? timeLeft,
    int? targetReps,
  }) {
    return DuelState(
      mode: mode ?? this.mode,
      status: status ?? this.status,
      playerA: playerA ?? this.playerA,
      playerB: playerB ?? this.playerB,
      currentAction: currentAction ?? this.currentAction,
      countdown: countdown ?? this.countdown,
      timeLeft: timeLeft ?? this.timeLeft,
      targetReps: targetReps ?? this.targetReps,
    );
  }

  bool get isComplete {
    switch (mode) {
      case DuelMode.race:
        return playerA.repCount >= targetReps || playerB.repCount >= targetReps;
      case DuelMode.accuracy:
        return timeLeft <= 0;
      case DuelMode.cooperation:
        return playerA.repCount >= targetReps && playerB.repCount >= targetReps;
      default:
        return false;
    }
  }

  PlayerState? get winner {
    if (!isComplete) return null;
    switch (mode) {
      case DuelMode.race:
        if (playerA.repCount >= targetReps && playerB.repCount >= targetReps) {
          return playerA.repCount > playerB.repCount ? playerA : playerB;
        }
        return playerA.repCount >= targetReps ? playerA : playerB;
      case DuelMode.accuracy:
        return playerA.totalScore > playerB.totalScore ? playerA : playerB;
      case DuelMode.cooperation:
        return playerA.totalScore >= playerB.totalScore ? playerA : playerB;
      default:
        return null;
    }
  }

  String get winnerName {
    if (winner == playerA) return playerA.name;
    if (winner == playerB) return playerB.name;
    return '';
  }
}

class PlayerState {
  final String id;
  final String name;
  final String avatar;
  final int score;
  final int repCount;
  final double currentScore;
  final List<int> actionScores;
  final bool isPresent;
  final PoseData? currentPose;

  PlayerState({
    required this.id,
    required this.name,
    required this.avatar,
    this.score = 0,
    this.repCount = 0,
    this.currentScore = 0,
    this.actionScores = const [],
    this.isPresent = true,
    this.currentPose,
  });

  PlayerState copyWith({
    String? id,
    String? name,
    String? avatar,
    int? score,
    int? repCount,
    double? currentScore,
    List<int>? actionScores,
    bool? isPresent,
    PoseData? currentPose,
  }) {
    return PlayerState(
      id: id ?? this.id,
      name: name ?? this.name,
      avatar: avatar ?? this.avatar,
      score: score ?? this.score,
      repCount: repCount ?? this.repCount,
      currentScore: currentScore ?? this.currentScore,
      actionScores: actionScores ?? this.actionScores,
      isPresent: isPresent ?? this.isPresent,
      currentPose: currentPose ?? this.currentPose,
    );
  }

  double get totalScore {
    if (actionScores.isEmpty) return currentScore;
    return actionScores.reduce((a, b) => a + b) / actionScores.length;
  }
}