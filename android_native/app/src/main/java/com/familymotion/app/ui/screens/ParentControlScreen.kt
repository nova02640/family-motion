package com.familymotion.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.familymotion.app.data.model.UserProfile
import com.familymotion.app.ui.theme.*

@Composable
fun ParentControlScreen(
    userProfile: UserProfile,
    onBack: () -> Unit
) {
    var maxExerciseMinutes by remember { mutableIntStateOf(60) }
    var contentFilter by remember { mutableStateOf("儿童安全") }
    var eyeCareInterval by remember { mutableIntStateOf(30) }
    var notificationsEnabled by remember { mutableStateOf(true) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Background),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 顶部返回
        item {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "返回"
                    )
                }
                Text(
                    text = "家长控制",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // 今日运动数据
        item {
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
                    Column {
                        Text(
                            text = "今日运动数据",
                            style = MaterialTheme.typography.titleMedium,
                            color = Color.White
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceAround
                        ) {
                            StatItem(value = "${userProfile.totalExerciseMinutes / 10}分钟", label = "运动时长")
                            StatItem(value = "100%", label = "完成度")
                            StatItem(value = "88分", label = "质量均分")
                        }
                    }
                }
            }
        }

        // 儿童信息
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Surface)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(60.dp)
                            .background(
                                color = Color(0xFFE0E7FF),
                                shape = RoundedCornerShape(16.dp)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(text = userProfile.avatarEmoji, fontSize = 32.sp)
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = userProfile.name,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "${userProfile.age}岁 · ${userProfile.gender}",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )
                        Text(
                            text = "BMI: ${String.format("%.1f", userProfile.bmi)}",
                            style = MaterialTheme.typography.bodySmall,
                            color = if (userProfile.bmi in 18.5f..24f) Success else Warning
                        )
                    }

                    IconButton(onClick = { }) {
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = "编辑",
                            tint = Primary
                        )
                    }
                }
            }
        }

        // 本周运动周报
        item {
            SectionTitle(title = "本周运动周报")
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "运动时长趋势",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium
                        )
                        TextButton(onClick = { }) {
                            Text("查看详情")
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // 柱状图
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(80.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.Bottom
                    ) {
                        listOf(40, 55, 35, 60, 45, 70, 50).forEachIndexed { index, height ->
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Box(
                                    modifier = Modifier
                                        .width(24.dp)
                                        .height(height.dp)
                                        .background(
                                            color = Primary,
                                            shape = RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp)
                                        )
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = listOf("一", "二", "三", "四", "五", "六", "日")[index],
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextHint
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        MiniStat(value = "${userProfile.totalExerciseMinutes}", label = "本周运动(分钟)")
                        MiniStat(value = "${userProfile.streakDays}", label = "连续打卡(天)")
                        MiniStat(value = "5", label = "完成计划(次)")
                    }
                }
            }
        }

        // 设置项
        item {
            SectionTitle(title = "设置")
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Surface)
            ) {
                Column {
                    // 运动时长上限
                    SettingsItem(
                        icon = Icons.Default.Timer,
                        title = "运动时长上限",
                        subtitle = "设置每日最大运动时间",
                        trailing = {
                            Text(
                                text = "${maxExerciseMinutes}分钟",
                                color = Primary,
                                fontWeight = FontWeight.Medium
                            )
                        },
                        onClick = {
                            showDurationDialog(
                                currentValue = maxExerciseMinutes,
                                onSelect = { maxExerciseMinutes = it }
                            )
                        }
                    )

                    HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))

                    // 内容过滤
                    SettingsItem(
                        icon = Icons.Default.FilterList,
                        title = "内容过滤等级",
                        subtitle = "根据年龄筛选适合的内容",
                        trailing = {
                            Text(
                                text = contentFilter,
                                color = Primary,
                                fontWeight = FontWeight.Medium
                            )
                        },
                        onClick = {
                            showFilterDialog(
                                currentValue = contentFilter,
                                onSelect = { contentFilter = it }
                            )
                        }
                    )

                    HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))

                    // 护眼提醒
                    SettingsItem(
                        icon = Icons.Default.Visibility,
                        title = "护眼提醒间隔",
                        subtitle = "定时提醒休息眼睛",
                        trailing = {
                            Text(
                                text = "${eyeCareInterval}分钟",
                                color = Primary,
                                fontWeight = FontWeight.Medium
                            )
                        },
                        onClick = {
                            showEyeCareDialog(
                                currentValue = eyeCareInterval,
                                onSelect = { eyeCareInterval = it }
                            )
                        }
                    )

                    HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))

                    // 运动通知
                    SettingsItem(
                        icon = Icons.Default.Notifications,
                        title = "运动通知",
                        subtitle = "接收运动完成和成就提醒",
                        trailing = {
                            Switch(
                                checked = notificationsEnabled,
                                onCheckedChange = { notificationsEnabled = it },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = Primary,
                                    checkedTrackColor = Primary.copy(alpha = 0.5f)
                                )
                            )
                        },
                        onClick = { }
                    )
                }
            }
        }

        // 消息通知
        item {
            SectionTitle(title = "消息通知")
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    NotificationItem(
                        emoji = "✅",
                        title = "今日运动已完成",
                        content = "${userProfile.name}今天完成了${userProfile.totalExerciseMinutes / 10}分钟运动，表现很棒！",
                        time = "今天"
                    )

                    Spacer(modifier = Modifier.height(12.dp))
                    HorizontalDivider()
                    Spacer(modifier = Modifier.height(12.dp))

                    NotificationItem(
                        emoji = "🏆",
                        title = "连续运动7天",
                        content = "恭喜解锁「连续7天」徽章！",
                        time = "3天前"
                    )
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(32.dp))
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
private fun StatItem(value: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = value,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = Color.White
        )
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = Color.White.copy(alpha = 0.7f)
        )
    }
}

@Composable
private fun MiniStat(value: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = value,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = Primary
        )
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = TextSecondary
        )
    }
}

@Composable
private fun SettingsItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String,
    trailing: @Composable () -> Unit,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = Primary,
            modifier = Modifier.size(24.dp)
        )

        Spacer(modifier = Modifier.width(16.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary
            )
        }

        trailing()

        Icon(
            imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
            contentDescription = null,
            tint = TextHint
        )
    }
}

@Composable
private fun NotificationItem(
    emoji: String,
    title: String,
    content: String,
    time: String
) {
    Row(verticalAlignment = Alignment.Top) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .background(
                    color = Color(0xFFE8F5E9),
                    shape = RoundedCornerShape(12.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(text = emoji, fontSize = 20.sp)
        }

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = content,
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary
            )
        }

        Text(
            text = time,
            style = MaterialTheme.typography.bodySmall,
            color = TextHint
        )
    }
}

@Composable
private fun showDurationDialog(currentValue: Int, onSelect: (Int) -> Unit) {
    // 简化的对话框，实际应用中需要更完整的实现
}

@Composable
private fun showFilterDialog(currentValue: String, onSelect: (String) -> Unit) {
    // 简化的对话框
}

@Composable
private fun showEyeCareDialog(currentValue: Int, onSelect: (Int) -> Unit) {
    // 简化的对话框
}
