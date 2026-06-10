package com.familymotion.app.domain.service

import android.content.Context
import android.util.Log
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.familymotion.app.data.model.LandmarkIndices
import com.familymotion.app.data.model.LandmarkType
import com.familymotion.app.data.model.PoseData
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.pose.Pose
import com.google.mlkit.vision.pose.PoseDetection
import com.google.mlkit.vision.pose.PoseDetector
import com.google.mlkit.vision.pose.PoseLandmark
import com.google.mlkit.vision.pose.defaults.PoseDetectorOptions
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * 体感动作识别服务
 * 使用 CameraX + ML Kit Pose Detection 实现实时骨骼追踪
 */
class PoseDetectionService(private val context: Context) {

    private var cameraExecutor: ExecutorService? = null
    private var imageAnalyzer: ImageAnalysis? = null
    private var cameraProvider: ProcessCameraProvider? = null
    private var poseDetector: PoseDetector? = null

    private val _poseData = MutableStateFlow<PoseData?>(null)
    val poseData: StateFlow<PoseData?> = _poseData.asStateFlow()

    private val _isTracking = MutableStateFlow(false)
    val isTracking: StateFlow<Boolean> = _isTracking.asStateFlow()

    private val _confidence = MutableStateFlow(0f)
    val confidence: StateFlow<Float> = _confidence.asStateFlow()

    companion object {
        private const val TAG = "PoseDetectionService"
    }

    init {
        initPoseDetector()
    }

    /**
     * 初始化 ML Kit 姿态检测器
     */
    private fun initPoseDetector() {
        val options = PoseDetectorOptions.Builder()
            .setDetectorMode(PoseDetectorOptions.STREAM_MODE)  // 流模式，实时处理
            .build()

        poseDetector = PoseDetection.getClient(options)
    }

    /**
     * 启动相机预览和骨骼追踪
     */
    fun startTracking(
        lifecycleOwner: LifecycleOwner,
        previewView: PreviewView,
        onPoseDetected: (PoseData) -> Unit
    ) {
        cameraExecutor = Executors.newSingleThreadExecutor()

        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)

        cameraProviderFuture.addListener({
            try {
                cameraProvider = cameraProviderFuture.get()

                // 构建预览用例
                val preview = Preview.Builder()
                    .build()
                    .also {
                        it.setSurfaceProvider(previewView.surfaceProvider)
                    }

                // 构建图像分析用例
                imageAnalyzer = ImageAnalysis.Builder()
                    .setTargetResolution(android.util.Size(640, 480))
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .build()
                    .also { analysis ->
                        analysis.setAnalyzer(cameraExecutor!!) { imageProxy ->
                            processImage(imageProxy, onPoseDetected)
                        }
                    }

                // 绑定用例到相机
                val cameraSelector = CameraSelector.DEFAULT_FRONT_CAMERA

                cameraProvider?.unbindAll()
                cameraProvider?.bindToLifecycle(
                    lifecycleOwner,
                    cameraSelector,
                    preview,
                    imageAnalyzer
                )

                _isTracking.value = true

            } catch (e: Exception) {
                Log.e(TAG, "相机初始化失败", e)
            }
        }, ContextCompat.getMainExecutor(context))
    }

    /**
     * 停止追踪
     */
    fun stopTracking() {
        cameraProvider?.unbindAll()
        cameraExecutor?.shutdown()
        _isTracking.value = false
        _poseData.value = null
    }

    /**
     * 释放资源
     */
    fun release() {
        stopTracking()
        poseDetector?.close()
        poseDetector = null
    }

    /**
     * 处理单帧图像
     */
    @androidx.camera.core.ExperimentalGetImage
    private fun processImage(
        imageProxy: ImageProxy,
        onPoseDetected: (PoseData) -> Unit
    ) {
        val mediaImage = imageProxy.image
        if (mediaImage != null) {
            val image = InputImage.fromMediaImage(
                mediaImage,
                imageProxy.imageInfo.rotationDegrees
            )

            poseDetector?.process(image)
                ?.addOnSuccessListener { pose ->
                    handlePoseResult(pose, onPoseDetected)
                }
                ?.addOnFailureListener { e ->
                    Log.e(TAG, "姿态检测失败", e)
                }
                ?.addOnCompleteListener {
                    imageProxy.close()
                }
        } else {
            imageProxy.close()
        }
    }

    /**
     * 处理姿态检测结果
     */
    private fun handlePoseResult(
        pose: Pose,
        onPoseDetected: (PoseData) -> Unit
    ) {
        // 计算平均置信度
        val avgConfidence = pose.allPoseLandmarks
            .map { it.inFrameLikelihood }
            .average()
            .toFloat()

        _confidence.value = avgConfidence

        if (avgConfidence > 0.5f) {
            val poseData = convertToPoseData(pose)
            _poseData.value = poseData
            onPoseDetected(poseData)
        }
    }

    /**
     * 将 ML Kit Pose 转换为应用 PoseData
     */
    private fun convertToPoseData(pose: Pose): PoseData {
        val landmarks = pose.allPoseLandmarks.map { mlLandmark ->
            val type = when (mlLandmark.landmarkType) {
                PoseLandmark.NOSE -> LandmarkType.NOSE
                PoseLandmark.LEFT_EYE_INNER -> LandmarkType.LEFT_EYE_INNER
                PoseLandmark.LEFT_EYE -> LandmarkType.LEFT_EYE
                PoseLandmark.LEFT_EYE_OUTER -> LandmarkType.LEFT_EYE_OUTER
                PoseLandmark.RIGHT_EYE_INNER -> LandmarkType.RIGHT_EYE_INNER
                PoseLandmark.RIGHT_EYE -> LandmarkType.RIGHT_EYE
                PoseLandmark.RIGHT_EYE_OUTER -> LandmarkType.RIGHT_EYE_OUTER
                PoseLandmark.LEFT_EAR -> LandmarkType.LEFT_EAR
                PoseLandmark.RIGHT_EAR -> LandmarkType.RIGHT_EAR
                PoseLandmark.LEFT_MOUTH -> LandmarkType.LEFT_MOUTH
                PoseLandmark.RIGHT_MOUTH -> LandmarkType.RIGHT_MOUTH
                PoseLandmark.LEFT_SHOULDER -> LandmarkType.LEFT_SHOULDER
                PoseLandmark.RIGHT_SHOULDER -> LandmarkType.RIGHT_SHOULDER
                PoseLandmark.LEFT_ELBOW -> LandmarkType.LEFT_ELBOW
                PoseLandmark.RIGHT_ELBOW -> LandmarkType.RIGHT_ELBOW
                PoseLandmark.LEFT_WRIST -> LandmarkType.LEFT_WRIST
                PoseLandmark.RIGHT_WRIST -> LandmarkType.RIGHT_WRIST
                PoseLandmark.LEFT_PINKY -> LandmarkType.LEFT_PINKY
                PoseLandmark.RIGHT_PINKY -> LandmarkType.RIGHT_PINKY
                PoseLandmark.LEFT_INDEX -> LandmarkType.LEFT_INDEX
                PoseLandmark.RIGHT_INDEX -> LandmarkType.RIGHT_INDEX
                PoseLandmark.LEFT_THUMB -> LandmarkType.LEFT_THUMB
                PoseLandmark.RIGHT_THUMB -> LandmarkType.RIGHT_THUMB
                PoseLandmark.LEFT_HIP -> LandmarkType.LEFT_HIP
                PoseLandmark.RIGHT_HIP -> LandmarkType.RIGHT_HIP
                PoseLandmark.LEFT_KNEE -> LandmarkType.LEFT_KNEE
                PoseLandmark.RIGHT_KNEE -> LandmarkType.RIGHT_KNEE
                PoseLandmark.LEFT_ANKLE -> LandmarkType.LEFT_ANKLE
                PoseLandmark.RIGHT_ANKLE -> LandmarkType.RIGHT_ANKLE
                PoseLandmark.LEFT_HEEL -> LandmarkType.LEFT_HEEL
                PoseLandmark.RIGHT_HEEL -> LandmarkType.RIGHT_HEEL
                PoseLandmark.LEFT_FOOT_INDEX -> LandmarkType.LEFT_FOOT_INDEX
                PoseLandmark.RIGHT_FOOT_INDEX -> LandmarkType.RIGHT_FOOT_INDEX
                else -> LandmarkType.NOSE
            }

            com.familymotion.app.data.model.PoseLandmarkData(
                type = type,
                x = mlLandmark.position.x,
                y = mlLandmark.position.y,
                z = mlLandmark.position3D.z,
                inFrameLikelihood = mlLandmark.inFrameLikelihood
            )
        }

        return PoseData(landmarks = landmarks)
    }

    /**
     * 获取关键骨骼点
     */
    fun getKeyLandmarks(poseData: PoseData): Map<String, Pair<Float, Float>> {
        val result = mutableMapOf<String, Pair<Float, Float>>()

        poseData.landmarks.forEach { landmark ->
            val name = when (landmark.type) {
                LandmarkType.LEFT_SHOULDER -> "leftShoulder"
                LandmarkType.RIGHT_SHOULDER -> "rightShoulder"
                LandmarkType.LEFT_ELBOW -> "leftElbow"
                LandmarkType.RIGHT_ELBOW -> "rightElbow"
                LandmarkType.LEFT_WRIST -> "leftWrist"
                LandmarkType.RIGHT_WRIST -> "rightWrist"
                LandmarkType.LEFT_HIP -> "leftHip"
                LandmarkType.RIGHT_HIP -> "rightHip"
                LandmarkType.LEFT_KNEE -> "leftKnee"
                LandmarkType.RIGHT_KNEE -> "rightKnee"
                LandmarkType.LEFT_ANKLE -> "leftAnkle"
                LandmarkType.RIGHT_ANKLE -> "rightAnkle"
                else -> null
            }
            name?.let { result[it] = Pair(landmark.x, landmark.y) }
        }

        return result
    }
}
