package com.familymotion.app.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.familymotion.app.data.model.AssessmentResult
import com.familymotion.app.data.model.AssessmentType
import com.familymotion.app.ui.theme.*
import kotlin.math.*

@Composable
fun AssessmentResultScreen(
    result: AssessmentResult,
    onBack: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
            .padding(16.dp)
    ) {
        // 返回按钮
        IconButton(onClick = onBack) {
            Icon(
                imageVector = Icons.Default.ArrowBack,
                contentDescription = "返回",
                tint = Color.White
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // 标题
        Text(
            text = "体能测评完成！",
            style = MaterialTheme.typography.headlineMedium,
            color = Color.White,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.align(Alignment.CenterHorizontally)
        )

        Spacer(modifier = Modifier.height(32.dp))

        // 总分圆环
        Box(
            modifier = Modifier
                .align(Alignment.CenterHorizontally)
                .size(180.dp),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator(
                progress = { result.overallScore / 100f },
                modifier = Modifier.fillMaxSize(),
                color = getGradeColor(result.overallScore),
                strokeWidth = 8.dp,
                trackColor = Color.Gray.copy(alpha = 0.3f)
            )

            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "${result.overallScore}",
                    style = MaterialTheme.typography.displayMedium,
                    fontWeight = FontWeight.Bold,
                    color = getGradeColor(result.overallScore)
                )
                Text(
                    text = result.grade,
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.Gray
                )
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        // 雷达图
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .height(220.dp),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = DarkSurface)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "能力雷达图",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(16.dp))

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    RadarChart(
                        scores = result.scores,
                        modifier = Modifier.size(180.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // 分项得分
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = DarkSurface)
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "分项得分",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(16.dp))

                result.scores.forEach { (type, score) ->
                    ScoreItem(
                        type = type,
                        score = score
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                }
            }
        }

        Spacer(modifier = Modifier.weight(1f))

        // 返回按钮
        Button(
            onClick = onBack,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            shape = RoundedCornerShape(28.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Primary)
        ) {
            Text("返回首页", fontSize = 18.sp)
        }

        Spacer(modifier = Modifier.height(32.dp))
    }
}

@Composable
private fun ScoreItem(type: AssessmentType, score: Int) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = getAssessmentIcon(type),
                    fontSize = 20.sp
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = getAssessmentName(type),
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White
                )
            }

            Text(
                text = "$score",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = getGradeColor(score)
            )
        }

        Spacer(modifier = Modifier.height(4.dp))

        LinearProgressIndicator(
            progress = { score / 100f },
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp)
                .clip(RoundedCornerShape(3.dp)),
            color = getGradeColor(score),
            trackColor = Color.Gray.copy(alpha = 0.3f)
        )
    }
}

@Composable
private fun RadarChart(
    scores: Map<AssessmentType, Int>,
    modifier: Modifier = Modifier
) {
    val primaryColor = Primary
    val gridColor = Color.Gray.copy(alpha = 0.3f)

    Canvas(modifier = modifier) {
        val centerX = size.width / 2
        val centerY = size.height / 2
        val radius = minOf(centerX, centerY) - 20f

        // 绘制网格
        for (level in 1..5) {
            val r = radius * level / 5
            val path = Path()
            for (i in 0..5) {
                val angle = (i * 60 - 90) * PI / 180
                val x = centerX + r * cos(angle).toFloat()
                val y = centerY + r * sin(angle).toFloat()
                if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
            }
            path.close()
            drawPath(path, gridColor, style = Stroke(width = 1f))
        }

        // 绘制轴线
        for (i in 0..5) {
            val angle = (i * 60 - 90) * PI / 180
            val x = centerX + radius * cos(angle).toFloat()
            val y = centerY + radius * sin(angle).toFloat()
            drawLine(gridColor, Offset(centerX, centerY), Offset(x, y), width = 1f)
        }

        // 绘制数据区域
        val dataPath = Path()
        AssessmentType.values().forEachIndexed { index, type ->
            val score = scores[type] ?: 0
            val angle = (index * 60 - 90) * PI / 180
            val r = radius * score / 100
            val x = centerX + r * cos(angle).toFloat()
            val y = centerY + r * sin(angle).toFloat()
            if (index == 0) dataPath.moveTo(x, y) else dataPath.lineTo(x, y)
        }
        dataPath.close()

        drawPath(
            dataPath,
            primaryColor.copy(alpha = 0.3f)
        )
        drawPath(
            dataPath,
            primaryColor,
            style = Stroke(width = 2f)
        )

        // 绘制数据点
        AssessmentType.values().forEachIndexed { index, type ->
            val score = scores[type] ?: 0
            val angle = (index * 60 - 90) * PI / 180
            val r = radius * score / 100
            val x = centerX + r * cos(angle).toFloat()
            val y = centerY + r * sin(angle).toFloat()
            drawCircle(primaryColor, radius = 6f, center = Offset(x, y))
        }
    }
}

private fun getGradeColor(score: Int): Color {
    return when {
        score >= 90 -> ScoreExcellent
        score >= 80 -> ScoreGood
        score >= 70 -> ScoreAverage
        score >= 60 -> Warning
        else -> ScorePoor
    }
}

private fun getAssessmentIcon(type: AssessmentType): String {
    return when (type) {
        AssessmentType.REACTION -> "🐡"
        AssessmentType.ACCURACY -> "❤️"
        AssessmentType.POWER -> "📦"
        AssessmentType.ENDURANCE -> "🐹"
        AssessmentType.BALANCE -> "🏎️"
        AssessmentType.COORDINATION -> "👯"
    }
}

private fun getAssessmentName(type: AssessmentType): String {
    return when (type) {
        AssessmentType.REACTION -> "反应速度"
        AssessmentType.ACCURACY -> "动作准确度"
        AssessmentType.POWER -> "爆发力"
        AssessmentType.ENDURANCE -> "下肢力量"
        AssessmentType.BALANCE -> "平衡力"
        AssessmentType.COORDINATION -> "协调性"
    }
}
