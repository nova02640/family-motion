import 'package:flutter/material.dart';

class GameLibraryScreen extends StatelessWidget {
  const GameLibraryScreen({super.key});

  final List<Map<String, dynamic>> categories = [
    {'name': '全部', 'icon': '🎮', 'count': 24},
    {'name': '热身运动', 'icon': '🏃', 'count': 6},
    {'name': '力量训练', 'icon': '💪', 'count': 5},
    {'name': '协调性', 'icon': '⚽', 'count': 4},
    {'name': '柔韧性', 'icon': '🧘', 'count': 5},
    {'name': '反应力', 'icon': '⚡', 'count': 4},
  ];

  final List<Map<String, dynamic>> games = [
    {'icon': '🦵', 'name': '高抬腿挑战', 'category': '热身运动', 'rating': 4.8, 'duration': '1分钟'},
    {'icon': '✌️', 'name': '开合跳达人', 'category': '热身运动', 'rating': 4.7, 'duration': '45秒'},
    {'icon': '🏋️', 'name': '平板支撑王', 'category': '力量训练', 'rating': 4.9, 'duration': '30秒'},
    {'icon': '🎾', 'name': '网球挥拍', 'category': '协调性', 'rating': 4.6, 'duration': '1分钟'},
    {'icon': '🩰', 'name': '芭蕾站姿', 'category': '柔韧性', 'rating': 4.5, 'duration': '45秒'},
    {'icon': '🐸', 'name': '青蛙跳', 'category': '力量训练', 'rating': 4.4, 'duration': '1分钟'},
    {'icon': '🏓', 'name': '乒乓球', 'category': '反应力', 'rating': 4.7, 'duration': '1分钟'},
    {'icon': '🤸', 'name': '侧手翻', 'category': '柔韧性', 'rating': 4.3, 'duration': '1分钟'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('游戏库'),
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
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.1),
                    blurRadius: 4,
                  ),
                ],
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: const Row(
                children: [
                  Icon(Icons.search, color: Colors.grey),
                  SizedBox(width: 8),
                  Text(
                    '搜索游戏',
                    style: TextStyle(color: Colors.grey),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 48,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: categories.length,
                itemBuilder: (context, index) {
                  final category = categories[index];
                  return Container(
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: index == 0 ? const Color(0xFF6366F1) : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.grey.withOpacity(0.1),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Text(category['icon']),
                        const SizedBox(width: 4),
                        Text(
                          category['name'],
                          style: TextStyle(
                            color: index == 0 ? Colors.white : Colors.black,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${category['count']}',
                          style: TextStyle(
                            color: index == 0 ? Colors.white70 : Colors.grey,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              '推荐游戏',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 1.2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              itemCount: games.length,
              itemBuilder: (context, index) {
                final game = games[index];
                return Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.grey.withOpacity(0.1),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 50,
                        height: 50,
                        decoration: BoxDecoration(
                          color: const Color(0xFFEEF2FF),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: Text(game['icon'], style: const TextStyle(fontSize: 28)),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        game['name'],
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.star, color: Colors.yellow, size: 12),
                          const SizedBox(width: 2),
                          Text(
                            game['rating'].toString(),
                            style: const TextStyle(fontSize: 12, color: Colors.grey),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            game['duration'],
                            style: const TextStyle(fontSize: 12, color: Colors.grey),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ElevatedButton(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF6366F1),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                        child: const Text(
                          '开始',
                          style: TextStyle(color: Colors.white, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
