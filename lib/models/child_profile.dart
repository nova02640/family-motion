class ChildProfile {
  final String name;
  final int age;
  final String gender;
  final int height;
  final int weight;

  ChildProfile({
    required this.name,
    required this.age,
    required this.gender,
    required this.height,
    required this.weight,
  });

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'age': age,
      'gender': gender,
      'height': height,
      'weight': weight,
    };
  }

  factory ChildProfile.fromJson(Map<String, dynamic> json) {
    return ChildProfile(
      name: json['name'],
      age: json['age'],
      gender: json['gender'],
      height: json['height'],
      weight: json['weight'],
    );
  }

  double get bmi => weight / ((height / 100) * (height / 100));
}
