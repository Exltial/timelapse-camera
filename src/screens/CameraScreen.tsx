import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { useAppStore } from '../store/appStore';
import { Photo } from '../types';
import { generateId, getProjectDirectory, ensureDirectory, isAndroid13OrHigher } from '../utils/helpers';
import { CountdownOverlay, CaptureButton, ModeSelector } from '../components/camera';

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
  const timerRef = useRef<NodeJS.Timeout[]>([]);
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedCount, setCapturedCount] = useState(0);

  const requestMediaPermission = async () => {
    try {
      // Android 13+ 使用新的媒体权限
      const isAndroid13 = await isAndroid13OrHigher();
      
      let result: MediaLibrary.PermissionResponse;
      
      if (Platform.OS === 'android' && isAndroid13) {
        // Android 13+ 需要分别请求媒体权限
        // 注意：expo-media-library 会自动处理 Android 13+ 的新权限
        result = await MediaLibrary.requestPermissionsAsync();
      } else {
        // Android 12 及以下使用传统存储权限
        result = await MediaLibrary.requestPermissionsAsync();
      }
      
      setMediaPermission(result);
    } catch (error) {
      console.error('请求媒体权限失败:', error);
    }
  };

  // 辅助函数：创建可清理的定时器
  const setManagedTimeout = (callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      callback();
      // 从列表中移除已执行的定时器
      timerRef.current = timerRef.current.filter(t => t !== timer);
    }, delay);
    timerRef.current.push(timer);
    return timer;
  };

  useEffect(() => {
    requestPermission();
    requestMediaPermission();
    
    // 清理函数：组件卸载时清理所有定时器
    return () => {
      timerRef.current.forEach(clearTimeout);
      timerRef.current = [];
    };
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
      // 检查是否应该取消
      if (!isCapturing) break;
      
      // 倒计时
      for (let j = 3; j > 0; j--) {
        setCountdown(j);
        await new Promise((resolve) => {
          setManagedTimeout(() => resolve(null), 1000);
        });
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
        await new Promise((resolve) => {
          setManagedTimeout(() => resolve(null), interval);
        });
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
    await new Promise((resolve) => {
      setManagedTimeout(() => resolve(null), 1000);
    });
    setCountdown(2);
    await new Promise((resolve) => {
      setManagedTimeout(() => resolve(null), 1000);
    });
    setCountdown(1);
    await new Promise((resolve) => {
      setManagedTimeout(() => resolve(null), 1000);
    });
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

          <CountdownOverlay countdown={countdown} />

          {isCapturing && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {capturedCount} / 预计需要张数
              </Text>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}

          <View style={styles.controls}>
            <CaptureButton
              onPress={takeSinglePhoto}
              isCapturing={isCapturing}
            />
          </View>

          <ModeSelector
            onSinglePhoto={takeSinglePhoto}
            onTimelapse={startTimelapse}
            disabled={isCapturing}
          />
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
