import 'package:flutter/foundation.dart';
import '../models/plan.dart';
import '../models/child_profile.dart';
import '../models/achievement.dart';
import '../services/plan_recommendation_service.dart';

class AppProvider extends ChangeNotifier {
  ChildProfile _childProfile = ChildProfile(
    name: '小明',
    age: 8,
    gender: '男',
    height: 130,
    weight: 30,
  );

  Plan _todayPlan = Plan.generateTodayPlan();
  
  List<Achievement> _achievements = [
    Achievement(id: '1', name: '运动新手', description: '完成第一次运动', icon: '🏃', unlocked: true),
    Achievement(id: '2', name: '连续7天', description: '连续运动7天', icon: '🔥', unlocked: true),
    Achievement(id: '3', name: '动作达人', description: '完成100个标准动作', icon: '⭐', unlocked: false),
    Achievement(id: '4', name: '亲子冠军', description: '赢得10次亲子对战', icon: '🏆', unlocked: false),
  ];

  int _streakDays = 7;
  int _weekMinutes = 95;
  bool _isPremium = false;

  ChildProfile get childProfile => _childProfile;
  Plan get todayPlan => _todayPlan;
  List<Achievement> get achievements => _achievements;
  int get streakDays => _streakDays;
  int get weekMinutes => _weekMinutes;
  bool get isPremium => _isPremium;

  void updateChildProfile(ChildProfile profile) {
    _childProfile = profile;
    refreshTodayPlan();
    notifyListeners();
  }

  void completePlan() {
    _todayPlan.isCompleted = true;
    _streakDays++;
    _weekMinutes += _todayPlan.duration;
    
    if (_streakDays >= 7 && !_achievements[1].unlocked) {
      unlockAchievement('2');
    }
    
    notifyListeners();
  }

  void unlockAchievement(String id) {
    final achievement = _achievements.firstWhere((a) => a.id == id);
    achievement.unlocked = true;
    notifyListeners();
  }

  void setPremium(bool value) {
    _isPremium = value;
    notifyListeners();
  }

  void refreshTodayPlan() {
    _todayPlan = PlanRecommendationService.generatePersonalizedPlan(
      _childProfile,
      _streakDays,
      _weekMinutes,
    );
    notifyListeners();
  }

  void resetDay() {
    _todayPlan = PlanRecommendationService.generatePersonalizedPlan(
      _childProfile,
      _streakDays,
      _weekMinutes,
    );
    notifyListeners();
  }
}
