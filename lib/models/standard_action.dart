import 'pose_landmark.dart';

class StandardAction {
  final String id;
  final String name;
  final String icon;
  final String description;
  final int duration;
  final int reps;
  final String difficulty;
  final List<ActionFrame> keyFrames;
  final List<AngleConstraint> angleConstraints;

  StandardAction({
    required this.id,
    required this.name,
    required this.icon,
    required this.description,
    required this.duration,
    required this.reps,
    required this.difficulty,
    required this.keyFrames,
    required this.angleConstraints,
  });

  static List<StandardAction> get standardActions {
    return [
      StandardAction(
        id: 'high_knee',
        name: '高抬腿',
        icon: '🦵',
        description: '快速抬起膝盖，锻炼腿部力量',
        duration: 60,
        reps: 30,
        difficulty: 'easy',
        keyFrames: _highKneeKeyFrames,
        angleConstraints: [
          AngleConstraint(
            joint: '左膝',
            minAngle: 120,
            maxAngle: 180,
            description: '膝盖要抬高',
          ),
          AngleConstraint(
            joint: '右膝',
            minAngle: 120,
            maxAngle: 180,
            description: '膝盖要抬高',
          ),
        ],
      ),
      StandardAction(
        id: 'jumping_jack',
        name: '开合跳',
        icon: '✌️',
        description: '双脚开合跳跃，提高心肺功能',
        duration: 45,
        reps: 25,
        difficulty: 'medium',
        keyFrames: _jumpingJackKeyFrames,
        angleConstraints: [
          AngleConstraint(
            joint: '左肩',
            minAngle: 150,
            maxAngle: 180,
            description: '手臂要伸直',
          ),
          AngleConstraint(
            joint: '右肩',
            minAngle: 150,
            maxAngle: 180,
            description: '手臂要伸直',
          ),
        ],
      ),
      StandardAction(
        id: 'plank',
        name: '平板支撑',
        icon: '🏋️',
        description: '保持身体平直，锻炼核心力量',
        duration: 30,
        reps: 1,
        difficulty: 'medium',
        keyFrames: _plankKeyFrames,
        angleConstraints: [
          AngleConstraint(
            joint: '腰部',
            minAngle: 160,
            maxAngle: 180,
            description: '身体要保持平直',
          ),
          AngleConstraint(
            joint: '肘部',
            minAngle: 85,
            maxAngle: 95,
            description: '手肘要垂直',
          ),
        ],
      ),
      StandardAction(
        id: 'squat',
        name: '深蹲',
        icon: '🦾',
        description: '锻炼腿部和臀部力量',
        duration: 60,
        reps: 15,
        difficulty: 'medium',
        keyFrames: _squatKeyFrames,
        angleConstraints: [
          AngleConstraint(
            joint: '左膝',
            minAngle: 60,
            maxAngle: 90,
            description: '膝盖不要内扣',
          ),
          AngleConstraint(
            joint: '右膝',
            minAngle: 60,
            maxAngle: 90,
            description: '膝盖不要内扣',
          ),
          AngleConstraint(
            joint: '腰部',
            minAngle: 160,
            maxAngle: 180,
            description: '背部要挺直',
          ),
        ],
      ),
      StandardAction(
        id: 'arm_circle',
        name: '手臂绕环',
        icon: '💪',
        description: '活动肩颈，放松上肢',
        duration: 30,
        reps: 10,
        difficulty: 'easy',
        keyFrames: _armCircleKeyFrames,
        angleConstraints: [
          AngleConstraint(
            joint: '左肩',
            minAngle: 160,
            maxAngle: 180,
            description: '手臂要伸直',
          ),
          AngleConstraint(
            joint: '右肩',
            minAngle: 160,
            maxAngle: 180,
            description: '手臂要伸直',
          ),
        ],
      ),
      StandardAction(
        id: 'side_lunge',
        name: '侧弓步',
        icon: '🦵',
        description: '锻炼侧腰和腿部力量',
        duration: 45,
        reps: 10,
        difficulty: 'medium',
        keyFrames: _sideLungeKeyFrames,
        angleConstraints: [
          AngleConstraint(
            joint: '支撑腿',
            minAngle: 80,
            maxAngle: 110,
            description: '支撑腿要弯曲',
          ),
          AngleConstraint(
            joint: '伸展腿',
            minAngle: 170,
            maxAngle: 180,
            description: '伸展腿要伸直',
          ),
        ],
      ),
    ];
  }

  static List<ActionFrame> get _highKneeKeyFrames => [
        ActionFrame(
          frameIndex: 0,
          landmarks: [
            JointPosition(joint: '左膝', x: 0.5, y: 0.3),
            JointPosition(joint: '右膝', x: 0.5, y: 0.6),
          ],
        ),
        ActionFrame(
          frameIndex: 1,
          landmarks: [
            JointPosition(joint: '左膝', x: 0.5, y: 0.6),
            JointPosition(joint: '右膝', x: 0.5, y: 0.3),
          ],
        ),
      ];

  static List<ActionFrame> get _jumpingJackKeyFrames => [
        ActionFrame(
          frameIndex: 0,
          landmarks: [
            JointPosition(joint: '左肩', x: 0.3, y: 0.4),
            JointPosition(joint: '右肩', x: 0.7, y: 0.4),
            JointPosition(joint: '左脚', x: 0.35, y: 0.9),
            JointPosition(joint: '右脚', x: 0.65, y: 0.9),
          ],
        ),
        ActionFrame(
          frameIndex: 1,
          landmarks: [
            JointPosition(joint: '左肩', x: 0.5, y: 0.2),
            JointPosition(joint: '右肩', x: 0.5, y: 0.2),
            JointPosition(joint: '左脚', x: 0.5, y: 0.5),
            JointPosition(joint: '右脚', x: 0.5, y: 0.5),
          ],
        ),
      ];

  static List<ActionFrame> get _plankKeyFrames => [
        ActionFrame(
          frameIndex: 0,
          landmarks: [
            JointPosition(joint: '头部', x: 0.5, y: 0.2),
            JointPosition(joint: '肩部', x: 0.5, y: 0.35),
            JointPosition(joint: '臀部', x: 0.5, y: 0.7),
            JointPosition(joint: '脚部', x: 0.5, y: 0.95),
          ],
        ),
      ];

  static List<ActionFrame> get _squatKeyFrames => [
        ActionFrame(
          frameIndex: 0,
          landmarks: [
            JointPosition(joint: '左膝', x: 0.45, y: 0.7),
            JointPosition(joint: '右膝', x: 0.55, y: 0.7),
            JointPosition(joint: '臀部', x: 0.5, y: 0.5),
          ],
        ),
        ActionFrame(
          frameIndex: 1,
          landmarks: [
            JointPosition(joint: '左膝', x: 0.45, y: 0.85),
            JointPosition(joint: '右膝', x: 0.55, y: 0.85),
            JointPosition(joint: '臀部', x: 0.5, y: 0.75),
          ],
        ),
      ];

  static List<ActionFrame> get _armCircleKeyFrames => [
        ActionFrame(
          frameIndex: 0,
          landmarks: [
            JointPosition(joint: '左手', x: 0.3, y: 0.3),
            JointPosition(joint: '右手', x: 0.7, y: 0.3),
          ],
        ),
        ActionFrame(
          frameIndex: 1,
          landmarks: [
            JointPosition(joint: '左手', x: 0.5, y: 0.15),
            JointPosition(joint: '右手', x: 0.5, y: 0.15),
          ],
        ),
        ActionFrame(
          frameIndex: 2,
          landmarks: [
            JointPosition(joint: '左手', x: 0.7, y: 0.3),
            JointPosition(joint: '右手', x: 0.3, y: 0.3),
          ],
        ),
      ];

  static List<ActionFrame> get _sideLungeKeyFrames => [
        ActionFrame(
          frameIndex: 0,
          landmarks: [
            JointPosition(joint: '左膝', x: 0.35, y: 0.8),
            JointPosition(joint: '右膝', x: 0.55, y: 0.5),
          ],
        ),
        ActionFrame(
          frameIndex: 1,
          landmarks: [
            JointPosition(joint: '左膝', x: 0.55, y: 0.5),
            JointPosition(joint: '右膝', x: 0.65, y: 0.8),
          ],
        ),
      ];
}

class ActionFrame {
  final int frameIndex;
  final List<JointPosition> landmarks;

  ActionFrame({
    required this.frameIndex,
    required this.landmarks,
  });
}

class JointPosition {
  final String joint;
  final double x;
  final double y;

  JointPosition({
    required this.joint,
    required this.x,
    required this.y,
  });
}

class AngleConstraint {
  final String joint;
  final double minAngle;
  final double maxAngle;
  final String description;

  AngleConstraint({
    required this.joint,
    required this.minAngle,
    required this.maxAngle,
    required this.description,
  });
}