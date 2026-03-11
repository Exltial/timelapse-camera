import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { useAppStore } from '../store/appStore';
import { Photo } from '../types';
import { generateId, getProjectDirectory, ensureDirectory } from '../utils/helpers';

interface CameraScreenProps {
  navigation: any;
  route: {
    params: {
      projectId: string;
    };
  };
}

export const CameraScreen: React.FC<CameraScreenProps> = ({
  navigation,
  route,
}) => {
  const { projectId } = route.params;
  
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, setMediaPermission] = useState<MediaLibrary.PermissionResponse | null>(null);
  
  const projects = useAppStore((state) => state.projects);
  const addPhoto = useAppStore((state) => state.addPhoto);
  const updateProject = useAppStore((state) => state.updateProject);
  const setCapturing = useAppStore((state) => state.setCapturing);
  const setCaptureProgress = useAppStore((state) => state.setCaptureProgress);
  
  const project = projects.find((p) => p.id === projectId);
  const cameraRef = useRef<CameraView>(null);
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedCount, setCapturedCount] = useState(0);

  useEffect(() => {
    requestPermission();
    MediaLibrary.requestPermissionsAsync().then(setMediaPermission);
  }, []);

  if (!permission || !mediaPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>需要相机和相册权限</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => {
            requestPermission();
            requestMediaPermission();
          }}
        >
          <Text style={styles.permissionButtonText}>授予权限</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>项目不存在</Text>
      </View>
    );
  }

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: true,
      });

      if (photo && photo.uri) {
        // 保存到项目目录
        const projectDir = await getProjectDirectory(projectId);
        await ensureDirectory(projectDir);
        
        const fileName = `IMG_${generateId()}.jpg`;
        const destPath = `${projectDir}${fileName}`;
        
        // 复制文件到项目目录
        await FileSystem.copyAsync({
          from: photo.uri,
          to: destPath,
        });

        // 添加到 store
        const photoData: Photo = {
          id: generateId(),
          projectId,
          uri: destPath,
          timestamp: Date.now(),
          sequenceNumber: capturedCount + 1,
          width: photo.width || 1920,
          height: photo.height || 1080,
        };

        addPhoto(photoData);
        updateProject(projectId, {
          photoCount: capturedCount + 1,
          coverImageUri: capturedCount === 0 ? destPath : project.coverImageUri,
        });

        setCapturedCount((prev) => prev + 1);
        return true;
      }
    } catch (error) {
      console.error('拍摄失败:', error);
      Alert.alert('拍摄失败', '请重试');
    }
    return false;
  };

  const startTimelapse = async () => {
    const totalCaptures = Math.ceil(
      project.targetDurationSeconds * 30 / 1 // 假设 30fps
    );
    
    setIsCapturing(true);
    setCapturing(true);
    setCapturedCount(0);

    let captured = 0;
    const interval = project.intervalSeconds * 1000;

    for (let i = 0; i < totalCaptures; i++) {
      // 倒计时
      for (let j = 3; j > 0; j--) {
        setCountdown(j);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setCountdown(null);

      // 拍摄
      const success = await takePhoto();
      if (success) {
        captured++;
        setCaptureProgress(
          Math.round((captured / totalCaptures) * 100),
          totalCaptures,
          captured
        );
      }

      // 如果不是最后一张，等待间隔时间
      if (i < totalCaptures - 1) {
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }

    setIsCapturing(false);
    setCapturing(false);
    setCaptureProgress(0, 0, 0);

    Alert.alert(
      '拍摄完成',
      `成功拍摄 ${captured} 张照片`,
      [
        {
          text: '查看照片',
          onPress: () => navigation.goBack(),
        },
        {
          text: '生成视频',
          onPress: () => navigation.navigate('VideoGenerate', { projectId }),
        },
      ]
    );
  };

  const takeSinglePhoto = async () => {
    if (isCapturing) return;
    
    setCountdown(3);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setCountdown(2);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setCountdown(1);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setCountdown(null);

    const success = await takePhoto();
    if (success) {
      Alert.alert('拍摄成功', '照片已保存');
    }
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.projectName}>{project.name}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {countdown !== null && (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdown}>{countdown}</Text>
            </View>
          )}

          {isCapturing && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {capturedCount} / 预计需要张数
              </Text>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}

          <View style={styles.controls}>
            <TouchableOpacity
              style={[
                styles.captureButton,
                isCapturing && styles.captureButtonDisabled,
              ]}
              onPress={isCapturing ? undefined : takeSinglePhoto}
              disabled={isCapturing}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>

          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={styles.modeButton}
              onPress={takeSinglePhoto}
              disabled={isCapturing}
            >
              <Text style={styles.modeText}>单张</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, styles.modeButtonActive]}
              onPress={startTimelapse}
              disabled={isCapturing}
            >
              <Text style={[styles.modeText, styles.modeTextActive]}>
                延时拍摄
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  projectName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  countdownContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdown: {
    fontSize: 120,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  progressContainer: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  progressText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  controls: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  modeSelector: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  modeButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modeButtonActive: {
    backgroundColor: '#007AFF',
  },
  modeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modeTextActive: {
    color: '#fff',
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
});
