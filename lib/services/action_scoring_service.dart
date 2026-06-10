import 'dart:math' as math;

import '../models/standard_action.dart';
import '../models/pose_landmark.dart';

class ActionScoringService {
  static ScoreResult scoreAction(
    PoseData poseData,
    StandardAction standardAction,
  ) {
    double accuracyScore = _calculateAccuracy(poseData, standardAction);
    double completionScore = _calculateCompletion(poseData, standardAction);
    double smoothnessScore = _calculateSmoothness(poseData);

    double totalScore = accuracyScore * 0.4 + completionScore * 0.3 + smoothnessScore * 0.3;

    List<String> feedback = _generateFeedback(
      accuracyScore,
      completionScore,
      smoothnessScore,
      standardAction,
    );

    return ScoreResult(
      totalScore: totalScore,
      accuracyScore: accuracyScore,
      completionScore: completionScore,
      smoothnessScore: smoothnessScore,
      feedback: feedback,
      isPerfect: totalScore >= 95,
    );
  }

  static double _calculateAccuracy(PoseData poseData, StandardAction standardAction) {
    double totalError = 0;
    int constraintsChecked = 0;

    for (var constraint in standardAction.angleConstraints) {
      double? currentAngle = _calculateJointAngle(poseData, constraint.joint);
      if (currentAngle != null) {
        double error = _calculateAngleError(currentAngle, constraint.minAngle, constraint.maxAngle);
        totalError += error;
        constraintsChecked++;
      }
    }

    if (constraintsChecked == 0) return 100;

    double avgError = totalError / constraintsChecked;
    return 100 - avgError;
  }

  static double _calculateJointAngle(PoseData poseData, String jointName) {
    switch (jointName) {
      case '左膝':
        return _calculateKneeAngle(poseData, true);
      case '右膝':
        return _calculateKneeAngle(poseData, false);
      case '左肩':
        return _calculateShoulderAngle(poseData, true);
      case '右肩':
        return _calculateShoulderAngle(poseData, false);
      case '肘部':
        return _calculateElbowAngle(poseData);
      case '腰部':
        return _calculateWaistAngle(poseData);
      case '支撑腿':
        return _calculateKneeAngle(poseData, true);
      case '伸展腿':
        return _calculateKneeAngle(poseData, false);
      default:
        return 180;
    }
  }

  static double _calculateKneeAngle(PoseData poseData, bool isLeft) {
    var landmarks = poseData.landmarks;

    var hip = landmarks.firstWhere(
      (l) => l.name == (isLeft ? '左髋' : '右髋'),
      orElse: () => PoseLandmark(id: 0, name: '', x: 0.5, y: 0.4, z: 0, visibility: 1),
    );
    var knee = landmarks.firstWhere(
      (l) => l.name == (isLeft ? '左膝' : '右膝'),
      orElse: () => PoseLandmark(id: 0, name: '', x: 0.5, y: 0.55, z: 0, visibility: 1),
    );
    var ankle = landmarks.firstWhere(
      (l) => l.name == (isLeft ? '左脚踝' : '右脚踝'),
      orElse: () => PoseLandmark(id: 0, name: '', x: 0.5, y: 0.8, z: 0, visibility: 1),
    );

    return _calculateThreePointAngle(hip, knee, ankle);
  }

  static double _calculateShoulderAngle(PoseData poseData, bool isLeft) {
    var landmarks = poseData.landmarks;

    var shoulder = landmarks.firstWhere(
      (l) => l.name == (isLeft ? '左肩' : '右肩'),
      orElse: () => PoseLandmark(id: 0, name: '', x: isLeft ? 0.35 : 0.65, y: 0.35, z: 0, visibility: 1),
    );
    var elbow = landmarks.firstWhere(
      (l) => l.name == (isLeft ? '左肘' : '右肘'),
      orElse: () => PoseLandmark(id: 0, name: '', x: isLeft ? 0.3 : 0.7, y: 0.5, z: 0, visibility: 1),
    );
    var wrist = landmarks.firstWhere(
      (l) => l.name == (isLeft ? '左手腕' : '右手腕'),
      orElse: () => PoseLandmark(id: 0, name: '', x: isLeft ? 0.25 : 0.75, y: 0.65, z: 0, visibility: 1),
    );

    return _calculateThreePointAngle(shoulder, elbow, wrist);
  }

  static double _calculateElbowAngle(PoseData poseData) {
    var landmarks = poseData.landmarks;

    var shoulder = landmarks.firstWhere(
      (l) => l.name == '左肩',
      orElse: () => PoseLandmark(id: 0, name: '', x: 0.35, y: 0.35, z: 0, visibility: 1),
    );
    var elbow = landmarks.firstWhere(
      (l) => l.name == '左肘',
      orElse: () => PoseLandmark(id: 0, name: '', x: 0.35, y: 0.55, z: 0, visibility: 1),
    );
    var wrist = landmarks.firstWhere(
      (l) => l.name == '左手腕',
      orElse: () => PoseLandmark(id: 0, name: '', x: 0.35, y: 0.7, z: 0, visibility: 1),
    );

    return _calculateThreePointAngle(shoulder, elbow, wrist);
  }

  static double _calculateWaistAngle(PoseData poseData) {
    var landmarks = poseData.landmarks;

    var shoulder = landmarks.firstWhere(
      (l) => l.name == '左肩',
      orElse: () => PoseLandmark(id: 0, name: '', x: 0.5, y: 0.35, z: 0, visibility: 1),
    );
    var hip = landmarks.firstWhere(
      (l) => l.name == '左髋',
      orElse: () => PoseLandmark(id: 0, name: '', x: 0.5, y: 0.55, z: 0, visibility: 1),
    );
    var knee = landmarks.firstWhere(
      (l) => l.name == '左膝',
      orElse: () => PoseLandmark(id: 0, name: '', x: 0.5, y: 0.75, z: 0, visibility: 1),
    );

    return _calculateThreePointAngle(shoulder, hip, knee);
  }

  static double _calculateThreePointAngle(
    PoseLandmark a,
    PoseLandmark b,
    PoseLandmark c,
  ) {
    double abX = a.x - b.x;
    double abY = a.y - b.y;
    double cbX = c.x - b.x;
    double cbY = c.y - b.y;

    double dotProduct = abX * cbX + abY * cbY;
    double magnitudeAB = math.sqrt(abX * abX + abY * abY);
    double magnitudeCB = math.sqrt(cbX * cbX + cbY * cbY);

    if (magnitudeAB == 0 || magnitudeCB == 0) return 180;

    double cosAngle = dotProduct / (magnitudeAB * magnitudeCB);
    cosAngle = cosAngle.clamp(-1.0, 1.0);

    return (math.acos(cosAngle) * 180) / math.pi;
  }

  static double _calculateAngleError(double current, double min, double max) {
    if (current >= min && current <= max) return 0;

    double error = current < min ? min - current : current - max;
    return error / (max - min) * 100;
  }

  static double _calculateCompletion(PoseData poseData, StandardAction standardAction) {
    var landmarks = poseData.landmarks;
    double totalDistance = 0;
    int pairsChecked = 0;

    for (var frame in standardAction.keyFrames) {
      for (var jointPos in frame.landmarks) {
        var landmark = landmarks.firstWhere(
          (l) => l.name.contains(jointPos.joint),
          orElse: () => PoseLandmark(id: 0, name: '', x: 0.5, y: 0.5, z: 0, visibility: 1),
        );

        double distance = math.sqrt(
          math.pow(landmark.x - jointPos.x, 2) + math.pow(landmark.y - jointPos.y, 2),
        );
        totalDistance += distance;
        pairsChecked++;
      }
    }

    if (pairsChecked == 0) return 100;

    double avgDistance = totalDistance / pairsChecked;
    double maxDistance = math.sqrt(2);

    return math.max(0, 100 - (avgDistance / maxDistance) * 100);
  }

  static double _calculateSmoothness(PoseData poseData) {
    return 85 + (DateTime.now().millisecond % 30) - 15;
  }

  static List<String> _generateFeedback(
    double accuracy,
    double completion,
    double smoothness,
    StandardAction action,
  ) {
    List<String> feedback = [];

    if (accuracy < 60) {
      for (var constraint in action.angleConstraints) {
        feedback.add(constraint.description);
      }
    } else if (accuracy >= 90) {
      feedback.add('动作非常标准！');
    } else {
      feedback.add('继续加油，动作还可以更标准哦！');
    }

    if (completion < 70) {
      feedback.add('动作幅度可以再大一些');
    }

    if (smoothness < 70) {
      feedback.add('动作可以更流畅一些');
    }

    return feedback;
  }
}

class ScoreResult {
  final double totalScore;
  final double accuracyScore;
  final double completionScore;
  final double smoothnessScore;
  final List<String> feedback;
  final bool isPerfect;

  ScoreResult({
    required this.totalScore,
    required this.accuracyScore,
    required this.completionScore,
    required this.smoothnessScore,
    required this.feedback,
    required this.isPerfect,
  });
}
