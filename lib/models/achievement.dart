class Achievement {
  final String id;
  final String name;
  final String description;
  final String icon;
  bool unlocked;

  Achievement({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    this.unlocked = false,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'icon': icon,
      'unlocked': unlocked,
    };
  }

  factory Achievement.fromJson(Map<String, dynamic> json) {
    return Achievement(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      icon: json['icon'],
      unlocked: json['unlocked'],
    );
  }
}
