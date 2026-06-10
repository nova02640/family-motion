import 'package:flutter/material.dart';

class SceneShortcuts extends StatelessWidget {
  const SceneShortcuts({super.key});

  final List<Map<String, dynamic>> scenes = [
    {'icon': '🌅', 'name': '起床唤醒', 'color': Colors.orange},
    {'icon': '🍚', 'name': '饭后消食', 'color': Colors.green},
    {'icon': '🌙', 'name': '睡前放松', 'color': Colors.purple},
    {'icon': '🏆', 'name': '周末运动会', 'color': Colors.blue},
  ];

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
          children: scenes
              .map((scene) => Expanded(
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      decoration: BoxDecoration(
                        color: scene['color'].withOpacity(0.1),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        children: [
                          Text(
                            scene['icon'],
                            style: const TextStyle(fontSize: 28),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            scene['name'],
                            style: TextStyle(
                              color: scene['color'],
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ))
              .toList(),
        ),
      ],
    );
  }
}
