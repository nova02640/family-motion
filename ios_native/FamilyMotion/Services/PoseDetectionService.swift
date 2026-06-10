//
//  PoseDetectionService.swift
//  FamilyMotion
//
//  Created by FamilyMotion on 2026/06/10.
//

import Foundation
import AVFoundation
import Vision
import UIKit
import Combine
import CoreGraphics

// MARK: - PoseDetectionService 体感识别服务
@MainActor
final class PoseDetectionService: NSObject, ObservableObject {

    // 输出的 PoseData（实时订阅）
    @Published var currentPose: PoseData? = nil
    @Published var isTracking: Bool = false
    @Published var confidence: Float = 0.0
    @Published var isCameraAuthorized: Bool = false

    // 捕获会话
    private var captureSession: AVCaptureSession?
    private let captureSessionQueue = DispatchQueue(label: "com.familymotion.capture.queue")
    private var videoOutput: AVCaptureVideoDataOutput?

    // Vision 请求
    private var bodyPoseRequest: VNHumanBodyPoseObservationRequest?
    private var bodyPointsRequest: VNDetectBodyPointsRequest?

    // 相机配置
    private var cameraPosition: AVCaptureDevice.Position = .front

    // 用于 UI 显示的预览层
    var previewLayer: AVCaptureVideoPreviewLayer?

    // MARK: 初始化
    override init() {
        super.init()
        setupVisionRequests()
    }

    // MARK: 权限检查
    func checkCameraPermission() async -> Bool {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            isCameraAuthorized = true
            return true
        case .notDetermined:
            let granted = await AVCaptureDevice.requestAccess(for: .video)
            isCameraAuthorized = granted
            return granted
        case .denied, .restricted:
            isCameraAuthorized = false
            return false
        @unknown default:
            return false
        }
    }

    // MARK: 启动追踪
    func startTracking(previewView: UIView? = nil) {
        guard captureSession == nil else { return }

        Task {
            let authorized = await checkCameraPermission()
            guard authorized else {
                print("⚠️ 相机权限未授予")
                return
            }
            setupCaptureSession(in: previewView)
            captureSession?.startRunning()
            isTracking = true
        }
    }

    // MARK: 停止追踪
    func stopTracking() {
        captureSession?.stopRunning()
        captureSession = nil
        videoOutput = nil
        previewLayer?.removeFromSuperlayer()
        previewLayer = nil
        isTracking = false
        currentPose = nil
    }

    // MARK: 切换摄像头
    func switchCamera() {
        cameraPosition = (cameraPosition == .front) ? .back : .front
        stopTracking()

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            self?.startTracking()
        }
    }

    // MARK: 配置捕获会话
    private func setupCaptureSession(in previewView: UIView?) {
        let session = AVCaptureSession()
        session.sessionPreset = .medium

        // 选择相机设备
        guard
            let camera = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: cameraPosition),
            let input = try? AVCaptureDeviceInput(device: camera)
        else {
            print("⚠️ 无法获取相机")
            return
        }

        session.addInput(input)

        // 视频输出（用于分析）
        let output = AVCaptureVideoDataOutput()
        output.videoSettings = [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
        ]
        output.setSampleBufferDelegate(self, queue: captureSessionQueue)
        session.addOutput(output)
        videoOutput = output

        // 设置连接方向
        if let connection = output.connection(with: .video) {
            connection.videoOrientation = .portrait
            if cameraPosition == .front {
                connection.isVideoMirrored = true
            }
        }

        // 预览层
        if let view = previewView {
            let layer = AVCaptureVideoPreviewLayer(session: session)
            layer.frame = view.bounds
            layer.videoGravity = .resizeAspectFill
            layer.connection?.videoOrientation = .portrait
            if cameraPosition == .front {
                layer.connection?.isVideoMirrored = true
            }
            view.layer.addSublayer(layer)
            previewLayer = layer
        }

        captureSession = session
    }

    // MARK: 设置 Vision 请求
    private func setupVisionRequests() {
        // 2D 人体姿势检测（iOS 14+）
        bodyPoseRequest = VNHumanBodyPoseObservationRequest()
        bodyPoseRequest?.revision = 2

        // 3D 人体点检测（iOS 17+）
        if #available(iOS 17.0, *) {
            bodyPointsRequest = VNDetectBodyPointsRequest()
        }
    }

    // MARK: 执行 Vision 分析
    private func performVisionAnalysis(on sampleBuffer: CMSampleBuffer) {
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }

        let imageSize = CGSize(
            width: CVPixelBufferGetWidth(pixelBuffer),
            height: CVPixelBufferGetHeight(pixelBuffer)
        )

        // 构建请求处理
        let handler = VNImageRequestHandler(
            cvPixelBuffer: pixelBuffer,
            options: [:]
        )

        // 尝试使用 2D 人体姿势检测
        if let request = bodyPoseRequest {
            do {
                try handler.perform([request])

                if let results = request.results, let observation = results.first {
                    if let pose = PoseData.fromHumanBodyPose(
                        observation,
                        imageSize: imageSize
                    ) {
                        Task { @MainActor in
                            currentPose = pose
                            confidence = pose.confidence
                        }
                        return
                    }
                }
            } catch {
                print("⚠️ Vision 2D Pose 分析失败: \(error)")
            }
        }

        // 如果 2D 不可用，尝试使用 3D 人体点（iOS 17+）
        if #available(iOS 17.0, *), let pointsRequest = bodyPointsRequest {
            do {
                try handler.perform([pointsRequest])

                if let results = pointsRequest.results, let observation = results.first {
                    if let pose = PoseData.fromBodyPointsObservation(
                        observation,
                        imageSize: imageSize
                    ) {
                        Task { @MainActor in
                            currentPose = pose
                            confidence = pose.confidence
                        }
                    }
                }
            } catch {
                print("⚠️ Vision 3D BodyPoints 分析失败: \(error)")
            }
        }
    }

    // 获取关键点坐标字典
    func getKeyLandmarks(pose: PoseData) -> [String: (Float, Float)] {
        var result: [String: (Float, Float)] = [:]

        for landmark in pose.landmarks {
            switch landmark.type {
            case .leftShoulder: result["leftShoulder"] = (landmark.x, landmark.y)
            case .rightShoulder: result["rightShoulder"] = (landmark.x, landmark.y)
            case .leftElbow: result["leftElbow"] = (landmark.x, landmark.y)
            case .rightElbow: result["rightElbow"] = (landmark.x, landmark.y)
            case .leftWrist: result["leftWrist"] = (landmark.x, landmark.y)
            case .rightWrist: result["rightWrist"] = (landmark.x, landmark.y)
            case .leftHip: result["leftHip"] = (landmark.x, landmark.y)
            case .rightHip: result["rightHip"] = (landmark.x, landmark.y)
            case .leftKnee: result["leftKnee"] = (landmark.x, landmark.y)
            case .rightKnee: result["rightKnee"] = (landmark.x, landmark.y)
            case .leftAnkle: result["leftAnkle"] = (landmark.x, landmark.y)
            case .rightAnkle: result["rightAnkle"] = (landmark.x, landmark.y)
            default: break
            }
        }

        return result
    }
}

// MARK: - AVCaptureVideoDataOutputSampleBufferDelegate
extension PoseDetectionService: AVCaptureVideoDataOutputSampleBufferDelegate {

    nonisolated func captureOutput(
        _ output: AVCaptureVideoDataOutput,
        didOutput sampleBuffer: CMSampleBuffer,
        from connection: AVCaptureConnection
    ) {
        // 视频帧分析
        performVisionAnalysis(on: sampleBuffer)
    }
}

// MARK: - UIViewRepresentable 包装（用于 SwiftUI 集成）
#if canImport(SwiftUI)
import SwiftUI

struct CameraPreviewView: UIViewRepresentable {
    let poseService: PoseDetectionService

    func makeUIView(context: Context) -> UIView {
        let view = UIView(frame: UIScreen.main.bounds)
        poseService.startTracking(previewView: view)
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        // 更新预览层大小
        if let layer = poseService.previewLayer {
            CATransaction.begin()
            CATransaction.setValue(kCFBooleanTrue, forKey: kCATransactionDisableActions)
            layer.frame = uiView.bounds
            CATransaction.commit()
        }
    }

    static func dismantleUIView(_ uiView: UIView, coordinator: ()) {
        // 停止追踪时在外部调用 stopTracking
    }
}
#endif
