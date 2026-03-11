import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useAppStore } from '../store/appStore';
import { generateId, formatVideoDuration, saveToGallery } from '../utils/helpers';
import { generateVideo } from '../utils/videoUtils';

interface VideoGenerateScreenProps {
  navigation: any;
  route: {
    params: {
      projectId: string;
    };
  };
}

export const VideoGenerateScreen: React.FC<VideoGenerateScreenProps> = ({
  navigation,
  route,
}) => {
  const { projectId } = route.params;
  
  const projects = useAppStore((state) => state.projects);
  const photos = useAppStore((state) => state.photos[projectId] || []);
  const addVideoTask = useAppStore((state) => state.addVideoTask);
  const updateVideoTask = useAppStore((state) => state.updateVideoTask);

  const project = projects.find((p) => p.id === projectId);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedVideoUri, setGeneratedVideoUri] = useState<string | null>(null);
  const [shouldCancel, setShouldCancel] = useState(false);
  const [currentStage, setCurrentStage] = useState('准备中');

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>项目不存在</Text>
      </View>
    );
  }

  const sortedPhotos = [...photos].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  const showCancelAlert = () => {
    Alert.alert(
      '取消生成',
      '确定要取消视频生成吗？',
      [
        {
          text: '继续生成',
          style: 'cancel',
        },
        {
          text: '取消',
          style: 'destructive',
          onPress: () => setShouldCancel(true),
        },
      ]
    );
  };

  const handleGenerateVideo = async () => {
    if (sortedPhotos.length === 0) {
      Alert.alert('提示', '没有照片可以生成视频');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setShouldCancel(false);
    setCurrentStage('准备图片');

    // 取消确认
    const showCancelAlert = () => {
      Alert.alert(
        '取消生成',
        '确定要取消视频生成吗？',
        [
          {
            text: '继续生成',
            style: 'cancel',
          },
          {
            text: '取消',
            style: 'destructive',
            onPress: () => setShouldCancel(true),
          },
        ]
      );
    };

    try {
      // 创建视频输出路径
      const videosDir = `${FileSystem.documentDirectory}timelapse-camera/videos/`;
      await FileSystem.makeDirectoryAsync(videosDir, { intermediates: true });
      
      const outputUri = `${videosDir}timelapse_${generateId()}.mp4`;

      // 计算帧率
      const fps = Math.min(30, Math.floor(sortedPhotos.length / project.targetDurationSeconds)) || 24;

      // 生成视频（带进度回调）
      await generateVideo(
        sortedPhotos.map((p) => p.uri),
        {
          outputUri,
          fps,
          width: sortedPhotos[0]?.width || 1920,
          height: sortedPhotos[0]?.height || 1080,
          onProgress: (progress) => {
            const percent = Math.round(progress * 100);
            setProgress(percent);
            if (progress < 0.3) {
              setCurrentStage('准备图片');
            } else if (progress < 0.8) {
              setCurrentStage('编码视频');
            } else {
              setCurrentStage('保存视频');
            }
          },
          shouldCancel: () => shouldCancel,
        }
      );
      
      if (shouldCancel) {
        Alert.alert('已取消', '视频生成已取消');
        return;
      }
      
      setProgress(100);
      setCurrentStage('完成');

      // 添加视频任务记录
      addVideoTask({
        id: generateId(),
        projectId,
        status: 'completed',
        progress: 100,
        outputUri,
        createdAt: Date.now(),
        completedAt: Date.now(),
      });

      setGeneratedVideoUri(outputUri);

      Alert.alert(
        '视频生成成功',
        `已生成 ${formatVideoDuration(project.targetDurationSeconds * 1000)} 的视频`,
        [
          {
            text: '保存到相册',
            onPress: async () => {
              const saved = await saveToGallery(outputUri);
              if (saved) {
                Alert.alert('成功', '视频已保存到相册');
              } else {
                Alert.alert('失败', '保存失败，请检查权限');
              }
            },
          },
          {
            text: '完成',
            style: 'cancel',
          },
        ]
      );
    } catch (error: any) {
      if (error.message === 'cancelled') {
        console.log('视频生成已取消');
        return;
      }
      console.error('视频生成失败:', error);
      Alert.alert('生成失败', error.message || '请稍后重试');
    } finally {
      setIsGenerating(false);
      setShouldCancel(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>生成视频</Text>
        <Text style={styles.subtitle}>{project.name}</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>照片数量</Text>
          <Text style={styles.infoValue}>{sortedPhotos.length}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>目标时长</Text>
          <Text style={styles.infoValue}>{project.targetDurationSeconds}秒</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>预估帧率</Text>
          <Text style={styles.infoValue}>
            {Math.min(30, Math.floor(sortedPhotos.length / project.targetDurationSeconds)) || 24} fps
          </Text>
        </View>
      </View>

      {isGenerating && (
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>{currentStage}...</Text>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
          <ActivityIndicator size="large" color="#007AFF" style={styles.spinner} />
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={showCancelAlert}
          >
            <Text style={styles.cancelButtonText}>取消生成</Text>
          </TouchableOpacity>
        </View>
      )}

      {generatedVideoUri && (
        <View style={styles.videoSection}>
          <Text style={styles.videoLabel}>预览</Text>
          <Video
            source={{ uri: generatedVideoUri }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.COVER}
          />
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.generateButton,
            (isGenerating || sortedPhotos.length === 0) && styles.generateButtonDisabled,
          ]}
          onPress={handleGenerateVideo}
          disabled={isGenerating || sortedPhotos.length === 0}
        >
          <Text
            style={[
              styles.generateButtonText,
              (isGenerating || sortedPhotos.length === 0) && styles.generateButtonTextDisabled,
            ]}
          >
            {isGenerating ? '生成中...' : '生成视频'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>返回</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  info: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  progressSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 12,
  },
  spinner: {
    marginTop: 20,
  },
  cancelButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  videoSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  videoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  video: {
    width: '100%',
    height: 240,
    backgroundColor: '#000',
    borderRadius: 8,
  },
  actions: {
    padding: 16,
    paddingBottom: 32,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  generateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  generateButtonTextDisabled: {
    color: '#999',
  },
  backButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  backButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 100,
  },
});
