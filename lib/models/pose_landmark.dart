class PoseLandmark {
  final int id;
  final String name;
  final double x;
  final double y;
  final double z;
  final double visibility;

  PoseLandmark({
    required this.id,
    required this.name,
    required this.x,
    required this.y,
    required this.z,
    required this.visibility,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'x': x,
      'y': y,
      'z': z,
      'visibility': visibility,
    };
  }

  factory PoseLandmark.fromJson(Map<String, dynamic> json) {
    return PoseLandmark(
      id: json['id'],
      name: json['name'],
      x: json['x'],
      y: json['y'],
      z: json['z'],
      visibility: json['visibility'],
    );
  }
}

class PoseData {
  final List<PoseLandmark> landmarks;
  final DateTime timestamp;

  PoseData({
    required this.landmarks,
    required this.timestamp,
  });
}