import 'package:flutter/material.dart';
import '../models/scene_mode.dart';
import '../models/plan.dart';
import '../screens/exercise/exercise_screen.dart';

class SceneShortcuts extends StatelessWidget {
  const SceneShortcuts({super.key});

  void _startSceneExercise(BuildContext context, SceneMode scene) {
    Plan plan = Plan(
      id: 'scene_plan_${scene.type.name}',
      title: scene.name,
      duration: scene.duration,
      calories: scene.duration * 10,
      exercises: scene.exercises,
      description: scene.description,
      isCompleted: false,
      date: DateTime.now(),
    );

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ExerciseScreen(plan: plan),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '场景快捷入口',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.black,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: SceneMode.availableScenes.take(4)
              .map((scene) => Expanded(
                    child: GestureDetector(
                      onTap: () => _startSceneExercise(context, scene),
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.grey.withOpacity(0.1),
                              blurRadius: 4,
                            ),
                          ],
                        ),
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          children: [
                            Text(
                              scene.icon,
                              style: const TextStyle(fontSize: 28),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              scene.name,
                              style: const TextStyle(
                                color: Colors.black,
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${scene.duration}分钟',
                              style: const TextStyle(
                                color: Colors.grey,
                                fontSize: 10,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ))
              .toList(),
        ),
      ],
    );
  }
}
