package com.familymotion.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.familymotion.app.data.model.*
import com.familymotion.app.data.repository.SceneModeRepository
import com.familymotion.app.ui.theme.*
import com.familymotion.app.ui.viewmodel.MainViewModel

@Composable
fun HomeScreen(
    viewModel: MainViewModel,
    onStartExercise: (String) -> Unit,
    onNavigateToScene: (SceneMode) -> Unit
) {
    val state by viewModel.state.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Background),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 用户信息卡片
        item {
            UserProfileCard(userProfile = state.userProfile)
        }

        // 今日计划卡片
        item {
            TodayPlanCard(
                plan = state.todayPlan,
                onStart = { state.todayPlan?.let { onStartExercise(it.id) } }
            )
        }

        // 连续打卡和统计数据
        item {
            StatsRow(
                streakDays = state.userProfile.streakDays,
                totalMinutes = state.userProfile.totalExerciseMinutes
            )
        }

        // 场景模式
        item {
            SectionTitle(title = "场景模式")
        }

        item {
            SceneModeGrid(
                sceneModes = viewModel.getSceneModes(),
                onSceneClick = onNavigateToScene
            )
        }

        // 推荐运动
        item {
            SectionTitle(title = "推荐运动")
        }

        item {
            RecommendedExercises(
                exercises = viewModel.getRecommendedExercises(),
                onExerciseClick = { exercise ->
                    // 创建临时计划并开始
                    val tempPlan = ExercisePlan(
                        id = "temp_${System.currentTimeMillis()}",
                        title = "快速运动",
                        exercises = listOf(exercise)
                    )
                    onStartExercise(tempPlan.id)
                }
            )
        }

        // 成就徽章
        item {
            SectionTitle(title = "成就徽章")
        }

        item {
            AchievementsRow(achievements = state.achievements)
        }

        // 底部留白
        item {
            Spacer(modifier = Modifier.height(80.dp))
        }
    }
}

@Composable
private fun UserProfileCard(userProfile: UserProfile) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    brush = Brush.horizontalGradient(
                        colors = listOf(GradientStart, GradientEnd)
                    )
                )
                .padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 头像
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .clip(CircleShape)
                        .background(Color.White),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = userProfile.avatarEmoji,
                        fontSize = 40.sp
                    )
                }

                Spacer(modifier = Modifier.width(16.dp))

                // 用户信息
                Column {
                    Text(
                        text = userProfile.name,
                        style = MaterialTheme.typography.headlineSmall,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )

                    Text(
                        text = "${userProfile.age}岁 · ${userProfile.gender}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White.copy(alpha = 0.7f)
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    // 等级标签
                    Box(
                        modifier = Modifier
                            .background(
                                color = Color.White.copy(alpha = 0.2f),
                                shape = RoundedCornerShape(10.dp)
                            )
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = "成长树 Lv.${userProfile.level}",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.White
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun TodayPlanCard(
    plan: ExercisePlan?,
    onStart: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Surface)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "今日计划",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    if (plan != null) {
                        Text(
                            text = "${plan.exercises.size}个动作 · 约${plan.duration}分钟",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )
                    }
                }

                Button(
                    onClick = onStart,
                    enabled = plan != null && !plan.isCompleted,
                    shape = RoundedCornerShape(20.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Primary
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.PlayArrow,
                        contentDescription = null
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(text = if (plan?.isCompleted == true) "已完成" else "开始")
                }
            }

            if (plan != null && plan.exercises.isNotEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))

                // 动作预览
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    plan.exercises.take(4).forEach { exercise ->
                        Box(
                            modifier = Modifier
                                .size(50.dp)
                                .background(
                                    color = Primary.copy(alpha = 0.1f),
                                    shape = RoundedCornerShape(12.dp)
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = exercise.icon,
                                fontSize = 24.sp
                            )
                        }
                    }

                    if (plan.exercises.size > 4) {
                        Box(
                            modifier = Modifier
                                .size(50.dp)
                                .background(
                                    color = Primary.copy(alpha = 0.1f),
                                    shape = RoundedCornerShape(12.dp)
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "+${plan.exercises.size - 4}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = Primary
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StatsRow(streakDays: Int, totalMinutes: Int) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        StatCard(
            modifier = Modifier.weight(1f),
            icon = "🔥",
            value = "$streakDays",
            label = "连续打卡",
            color = Secondary
        )

        StatCard(
            modifier = Modifier.weight(1f),
            icon = "⏱️",
            value = "$totalMinutes",
            label = "累计分钟",
            color = Primary
        )
    }
}

@Composable
private fun StatCard(
    modifier: Modifier = Modifier,
    icon: String,
    value: String,
    label: String,
    color: Color
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Surface)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(text = icon, fontSize = 28.sp)
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = color
            )
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary
            )
        }
    }
}

@Composable
private fun SectionTitle(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.Bold
    )
}

@Composable
private fun SceneModeGrid(
    sceneModes: List<SceneMode>,
    onSceneClick: (SceneMode) -> Unit
) {
    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(sceneModes) { scene ->
            SceneModeCard(
                sceneMode = scene,
                onClick = { onSceneClick(scene) }
            )
        }
    }
}

@Composable
private fun SceneModeCard(
    sceneMode: SceneMode,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .width(120.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Surface)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(text = sceneMode.icon, fontSize = 32.sp)
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = sceneMode.name,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = sceneMode.recommendedTime,
                style = MaterialTheme.typography.bodySmall,
                color = TextHint
            )
        }
    }
}

@Composable
private fun RecommendedExercises(
    exercises: List<Exercise>,
    onExerciseClick: (Exercise) -> Unit
) {
    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(exercises) { exercise ->
            ExerciseCard(
                exercise = exercise,
                onClick = { onExerciseClick(exercise) }
            )
        }
    }
}

@Composable
private fun ExerciseCard(
    exercise: Exercise,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .width(140.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Surface)
    ) {
        Column(
            modifier = Modifier.padding(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(60.dp)
                    .background(
                        color = Primary.copy(alpha = 0.1f),
                        shape = RoundedCornerShape(12.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(text = exercise.icon, fontSize = 36.sp)
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = exercise.name,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                maxLines = 1
            )

            Text(
                text = "${exercise.reps}次",
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary
            )
        }
    }
}

@Composable
private fun AchievementsRow(achievements: List<Achievement>) {
    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(achievements) { achievement ->
            AchievementBadge(achievement = achievement)
        }
    }
}

@Composable
private fun AchievementBadge(achievement: Achievement) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(60.dp)
                .background(
                    color = if (achievement.unlocked)
                        Color(0xFFFEF3C7)
                    else
                        Color.Gray.copy(alpha = 0.2f),
                    shape = RoundedCornerShape(16.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = achievement.icon,
                fontSize = if (achievement.unlocked) 28.sp else 20.sp,
                color = if (achievement.unlocked) Color.Unspecified else Color.Gray
            )
        }

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = achievement.name,
            style = MaterialTheme.typography.bodySmall,
            color = if (achievement.unlocked) TextPrimary else TextHint
        )
    }
}
