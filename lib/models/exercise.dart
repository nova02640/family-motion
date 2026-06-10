class Exercise {
  final String id;
  final String name;
  final int duration;
  final int reps;
  final String icon;
  final String difficulty;
  final String description;

  Exercise({
    required this.id,
    required this.name,
    required this.duration,
    required this.reps,
    required this.icon,
    required this.difficulty,
    required this.description,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'duration': duration,
      'reps': reps,
      'icon': icon,
      'difficulty': difficulty,
      'description': description,
    };
  }

  factory Exercise.fromJson(Map<String, dynamic> json) {
    return Exercise(
      id: json['id'],
      name: json['name'],
      duration: json['duration'],
      reps: json['reps'],
      icon: json['icon'],
      difficulty: json['difficulty'],
      description: json['description'],
    );
  }
}
