import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../widgets/plan_card.dart';
import '../../widgets/stat_card.dart';
import '../../widgets/growth_tree.dart';
import '../../widgets/scene_shortcuts.dart';
import '../../widgets/recommended_content.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appProvider = Provider.of<AppProvider>(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('亲子体感运动'),
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.black,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              Navigator.pushNamed(context, '/settings');
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            PlanCard(plan: appProvider.todayPlan),
            const SizedBox(height: 20),
            Row(
              children: [
                StatCard(
                  icon: '🔥',
                  label: '连续打卡',
                  value: '${appProvider.streakDays}天',
                  color: const Color(0xFFFF6B35),
                ),
                const SizedBox(width: 12),
                StatCard(
                  icon: '⏱️',
                  label: '本周运动',
                  value: '${appProvider.weekMinutes}分钟',
                  color: const Color(0xFF6366F1),
                ),
                const SizedBox(width: 12),
                const GrowthTree(),
              ],
            ),
            const SizedBox(height: 20),
            const SceneShortcuts(),
            const SizedBox(height: 20),
            const RecommendedContent(),
          ],
        ),
      ),
    );
  }
}
