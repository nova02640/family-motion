package com.familymotion.app.ui.screens

import android.Manifest
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.familymotion.app.data.model.ExercisePlan
import com.familymotion.app.data.model.ScoreResult
import com.familymotion.app.data.model.PoseData
import com.familymotion.app.domain.service.PoseDetectionService
import com.familymotion.app.ui.theme.*
import com.familymotion.app.ui.viewmodel.ExerciseViewModel
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState

@Composable
fun ExerciseScreen(
    plan: ExercisePlan,
    viewModel: ExerciseViewModel,
    onBack: () -> Unit,
    onComplete: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    var hasCameraPermission by remember { mutableStateOf(false) }

    // 初始化运动
    LaunchedEffect(plan) {
        viewModel.initExercise(plan)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBackground)
    ) {
        when {
            // 倒计时阶段
            state.isCountingDown -> {
                CountdownOverlay(countdown = state.countdown)
            }

            // 运动进行中
            state.isPlaying -> {
                CameraPreviewWithPose(
                    context = context,
                    lifecycleOwner = lifecycleOwner,
                    onPoseDetected = { poseData ->
                        viewModel.updatePoseData(poseData)
                    }
                )

                // 动作信息覆盖层
                ExerciseOverlay(
                    exercise = state.currentExercise,
                    score = state.currentScore,
                    repCount = state.repCount,
                    maxReps = state.maxReps,
                    onPause = { viewModel.pauseExercise() },
                    onComplete = { viewModel.completeCurrentExercise() }
                )
            }

            // 完成当前动作，等待下一个
            state.currentScore != null && !state.isPlaying && !state.isCompleted -> {
                ExerciseCompleteOverlay(
                    score = state.currentScore!!,
                    onNext = { viewModel.nextExercise() },
                    onFinish = onComplete
                )
            }

            // 全部完成
            state.isCompleted -> {
                ExerciseFinishedOverlay(
                    totalScore = state.totalScore,
                    exerciseScores = state.exerciseScores,
                    onFinish = onComplete
                )
            }

            // 准备开始
            else -> {
                PreparationOverlay(
                    exercise = state.currentExercise,
                    onStart = { viewModel.startCountdown() },
                    onBack = onBack
                )
            }
        }
    }
}

@Composable
private fun CameraPreviewWithPose(
    context: android.content.Context,
    lifecycleOwner: androidx.lifecycle.LifecycleOwner,
    onPoseDetected: (PoseData) -> Unit
) {
    val poseService = remember {
        PoseDetectionService(context)
    }

    DisposableEffect(lifecycleOwner) {
        val previewView = PreviewView(context)
        poseService.startTracking(lifecycleOwner, previewView) { poseData ->
            onPoseDetected(poseData)
        }

        onDispose {
            poseService.release()
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(
            factory = { ctx ->
                PreviewView(ctx).apply {
                    implementationMode = PreviewView.ImplementationMode.COMPATIBLE
                }
            },
            modifier = Modifier.fillMaxSize()
        )

        // 骨骼点覆盖层（待实现）
        PoseOverlay(poseData = null)
    }
}

@Composable
private fun PoseOverlay(poseData: PoseData?) {
    // TODO: 绘制骨骼点和连接线
    Box(modifier = Modifier.fillMaxSize())
}

@Composable
private fun CountdownOverlay(countdown: Int) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = countdown.toString(),
            fontSize = 120.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White
        )
    }
}

@Composable
private fun PreparationOverlay(
    exercise: com.familymotion.app.data.model.Exercise?,
    onStart: () -> Unit,
    onBack: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // 返回按钮
        Align(
            alignment = Alignment.TopStart
        ) {
            IconButton(onClick = onBack) {
                Icon(
                    imageVector = Icons.Default.ArrowBack,
                    contentDescription = "返回",
                    tint = Color.White
                )
            }
        }

        Spacer(modifier = Modifier.weight(1f))

        if (exercise != null) {
            // 动作图标
            Box(
                modifier = Modifier
                    .size(200.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(DarkSurface),
                contentAlignment = Alignment.Center
            ) {
                Text(text = exercise.icon, fontSize = 80.sp)
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = exercise.name,
                style = MaterialTheme.typography.headlineMedium,
                color = Color.White,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = exercise.description,
                style = MaterialTheme.typography.bodyLarge,
                color = Color.Gray,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = if (exercise.duration > 0) "持续 ${exercise.duration} 秒" else "完成 ${exercise.reps} 次",
                style = MaterialTheme.typography.titleMedium,
                color = Primary
            )

            Spacer(modifier = Modifier.weight(1f))

            Button(
                onClick = onStart,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(28.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Primary)
            ) {
                Icon(imageVector = Icons.Default.PlayArrow, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("开始", fontSize = 18.sp)
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

@Composable
private fun ExerciseOverlay(
    exercise: com.familymotion.app.data.model.Exercise?,
    score: ScoreResult?,
    repCount: Int,
    maxReps: Int,
    onPause: () -> Unit,
    onComplete: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        // 顶部状态栏
        TopAppBar(
            title = { Text(exercise?.name ?: "", color = Color.White) },
            navigationIcon = {
                IconButton(onClick = onPause) {
                    Icon(Icons.Default.Pause, "暂停", tint = Color.White)
                }
            },
            actions = {
                Text(
                    text = "${repCount}/${maxReps}",
                    color = Color.White,
                    modifier = Modifier.padding(end = 16.dp)
                )
            },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = Color.Transparent
            )
        )

        Spacer(modifier = Modifier.weight(1f))

        // 分数显示
        if (score != null) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = DarkSurface.copy(alpha = 0.9f))
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "动作评分",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.Gray
                    )

                    Text(
                        text = "${score.totalScore}",
                        style = MaterialTheme.typography.displayMedium,
                        fontWeight = FontWeight.Bold,
                        color = getScoreColor(score.totalScore)
                    )

                    // 分数进度条
                    LinearProgressIndicator(
                        progress = { score.totalScore / 100f },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp)
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp)),
                        color = getScoreColor(score.totalScore),
                        trackColor = Color.Gray.copy(alpha = 0.3f)
                    )

                    // 反馈文字
                    if (score.feedback.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(8.dp))
                        score.feedback.take(2).forEach { feedback ->
                            Text(
                                text = feedback,
                                style = MaterialTheme.typography.bodyMedium,
                                color = Warning
                            )
                        }
                    }

                    if (score.isPerfect) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "✨ PERFECT!",
                            style = MaterialTheme.typography.titleMedium,
                            color = Warning
                        )
                    }
                }
            }
        }

        // 完成按钮
        Button(
            onClick = onComplete,
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .height(56.dp),
            shape = RoundedCornerShape(28.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Success)
        ) {
            Text("完成动作", fontSize = 18.sp)
        }
    }
}

@Composable
private fun ExerciseCompleteOverlay(
    score: ScoreResult,
    onNext: () -> Unit,
    onFinish: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(text = "🎉", fontSize = 80.sp)

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "动作完成！",
            style = MaterialTheme.typography.headlineMedium,
            color = Color.White,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(16.dp))

        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = DarkSurface)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "${score.totalScore}",
                    fontSize = 64.sp,
                    fontWeight = FontWeight.Bold,
                    color = getScoreColor(score.totalScore)
                )
                Text(
                    text = "得分",
                    style = MaterialTheme.typography.bodyLarge,
                    color = Color.Gray
                )
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedButton(
                onClick = onFinish,
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp),
                shape = RoundedCornerShape(24.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
            ) {
                Text("结束")
            }

            Button(
                onClick = onNext,
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp),
                shape = RoundedCornerShape(24.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Primary)
            ) {
                Text("下一个")
            }
        }
    }
}

@Composable
private fun ExerciseFinishedOverlay(
    totalScore: Int,
    exerciseScores: List<Int>,
    onFinish: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(text = "🏆", fontSize = 80.sp)

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "运动完成！",
            style = MaterialTheme.typography.headlineMedium,
            color = Color.White,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(32.dp))

        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = DarkSurface)
        ) {
            Column(
                modifier = Modifier.padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "总得分",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.Gray
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "$totalScore",
                    fontSize = 72.sp,
                    fontWeight = FontWeight.Bold,
                    color = Primary
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "${exerciseScores.size} 个动作完成",
                    style = MaterialTheme.typography.bodyLarge,
                    color = Color.White
                )

                // 各动作得分
                if (exerciseScores.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        exerciseScores.forEachIndexed { index, score ->
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .background(Primary.copy(alpha = 0.2f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "$score",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = getScoreColor(score)
                                )
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = onFinish,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            shape = RoundedCornerShape(28.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Primary)
        ) {
            Text("返回首页", fontSize = 18.sp)
        }
    }
}

@Composable
private fun getScoreColor(score: Int): Color {
    return when {
        score >= 90 -> ScoreExcellent
        score >= 70 -> ScoreGood
        score >= 50 -> ScoreAverage
        else -> ScorePoor
    }
}
