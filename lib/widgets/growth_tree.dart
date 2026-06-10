import 'package:flutter/material.dart';

class GrowthTree extends StatelessWidget {
  const GrowthTree({super.key});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFFE8F5E9),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFA5D6A7), width: 2),
        ),
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            const Text(
              '🌳',
              style: TextStyle(fontSize: 24),
            ),
            const SizedBox(height: 4),
            const Text(
              'Lv.5',
              style: TextStyle(
                color: Color(0xFF2E7D32),
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 2),
            const Text(
              '体能成长树',
              style: TextStyle(
                color: Color(0xFF66BB6A),
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
