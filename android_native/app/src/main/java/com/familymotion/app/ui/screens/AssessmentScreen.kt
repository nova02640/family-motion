package com.familymotion.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.familymotion.app.data.model.*
import com.familymotion.app.ui.theme.*

@Composable
fun AssessmentScreen(
    onComplete: (AssessmentResult) -> Unit,
    onBack: () -> Unit
) {
    var currentIndex by remember { mutableIntStateOf(0) }
    var isPlaying by remember { mutableStateOf(false) }
    var countdown by remember { mutableIntStateOf(3) }
    var score by remember { mutableIntStateOf(0) }
    var scores by remember { mutableStateOf<Map<AssessmentType, Int>>(emptyMap()) }

    val assessments = Assessment.assessments
    val currentAssessment = assessments.getOrNull(currentIndex)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .padding(16.dp)
    ) {
        // 返回按钮
        IconButton(onClick = onBack) {
            Icon(
                imageVector = androidx.compose.material.icons.Icons.Default.ArrowBack,
                contentDescription = "返回"
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // 进度指示器
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            assessments.forEachIndexed { index, assessment ->
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(4.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(
                            when {
                                scores.containsKey(assessment.type) -> Primary
                                index == currentIndex && isPlaying -> Primary.copy(alpha = 0.5f)
                                else -> Color.Gray.copy(alpha = 0.3f)
                            }
                        )
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        if (currentAssessment != null) {
            // 动作卡片
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.Transparent)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            brush = Brush.verticalGradient(
                                colors = listOf(GradientStart, GradientEnd)
                            )
                        )
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = currentAssessment.icon,
                            fontSize = 64.sp
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        Text(
                            text = currentAssessment.name,
                            style = MaterialTheme.typography.headlineSmall,
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = currentAssessment.description,
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color.White.copy(alpha = 0.7f),
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // 游戏说明
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Surface)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp)
                ) {
                    Text(
                        text = "游戏说明",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = currentAssessment.gameInstruction,
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = androidx.compose.material.icons.Icons.Default.Timer,
                            contentDescription = null,
                            tint = Primary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "${currentAssessment.duration}秒",
                            style = MaterialTheme.typography.titleMedium,
                            color = Primary,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            // 倒计时或得分显示
            if (isPlaying && countdown > 0) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = countdown.toString(),
                        fontSize = 100.sp,
                        fontWeight = FontWeight.Bold,
                        color = Primary
                    )
                }
            } else if (isPlaying) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = currentAssessment.icon,
                        fontSize = 80.sp
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "得分: $score",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                        color = Primary
                    )
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            // 开始按钮
            if (!isPlaying) {
                Button(
                    onClick = {
                        if (currentIndex < assessments.size - 1) {
                            countdown = 3
                            isPlaying = true
                            // 开始倒计时逻辑
                            startAssessment(
                                duration = currentAssessment.duration,
                                onScoreUpdate = { s -> score = s },
                                onComplete = { finalScore ->
                                    scores = scores + (currentAssessment.type to finalScore)
                                    if (currentIndex < assessments.size - 1) {
                                        currentIndex++
                                        score = 0
                                        isPlaying = false
                                    } else {
                                        // 全部完成
                                        val overallScore = scores.values.average().toInt()
                                        val result = AssessmentResult(
                                            scores = scores,
                                            overallScore = overallScore,
                                            grade = AssessmentResult.calculateGrade(overallScore)
                                        )
                                        onComplete(result)
                                    }
                                }
                            )
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    shape = RoundedCornerShape(28.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Primary)
                ) {
                    Text(
                        text = if (scores.size == assessments.size - 1) "完成测评" else "开始测试",
                        fontSize = 18.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

// 模拟测评过程
private fun startAssessment(
    duration: Int,
    onScoreUpdate: (Int) -> Unit,
    onComplete: (Int) -> Unit
) {
    // 实际应用中，这里会使用协程来模拟计时
    // 这里简化为随机分数
    val score = (60..100).random()
    onComplete(score)
}

object Assessment {
    val assessments = listOf(
        AssessmentItem(
            type = AssessmentType.REACTION,
            name = "反应测试",
            description = "快速反应能力",
            icon = "🐡",
            duration = 10,
            gameInstruction = "看到提示时尽快做出反应"
        ),
        AssessmentItem(
            type = AssessmentType.ACCURACY,
            name = "准确度测试",
            description = "动作精确度",
            icon = "❤️",
            duration = 15,
            gameInstruction = "保持动作稳定准确"
        ),
        AssessmentItem(
            type = AssessmentType.POWER,
            name = "爆发力测试",
            description = "力量输出能力",
            icon = "📦",
            duration = 20,
            gameInstruction = "尽可能用力完成动作"
        ),
        AssessmentItem(
            type = AssessmentType.ENDURANCE,
            name = "耐力测试",
            description = "持续运动能力",
            icon = "🐹",
            duration = 30,
            gameInstruction = "保持节奏持续运动"
        ),
        AssessmentItem(
            type = AssessmentType.BALANCE,
            name = "平衡测试",
            description = "身体平衡能力",
            icon = "🏎️",
            duration = 15,
            gameInstruction = "保持身体平衡稳定"
        ),
        AssessmentItem(
            type = AssessmentType.COORDINATION,
            name = "协调性测试",
            description = "动作协调能力",
            icon = "👯",
            duration = 20,
            gameInstruction = "协调完成复合动作"
        )
    )
}

data class AssessmentItem(
    val type: AssessmentType,
    val name: String,
    val description: String,
    val icon: String,
    val duration: Int,
    val gameInstruction: String
)
