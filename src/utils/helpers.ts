import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

// 生成唯一 ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// 格式化时间
export const formatTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};

// 格式化日期
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 获取应用目录
export const getAppDirectory = (): string => {
  return `${FileSystem.documentDirectory}timelapse-camera/`;
};

// 获取项目目录
export const getProjectDirectory = (projectId: string): string => {
  return `${getAppDirectory()}projects/${projectId}/`;
};

// 确保目录存在
export const ensureDirectory = async (path: string): Promise<void> => {
  const dirInfo = await FileSystem.getInfoAsync(path);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
};

// 初始化应用目录
export const initializeAppDirectory = async (): Promise<void> => {
  const appDir = getAppDirectory();
  await ensureDirectory(appDir);
  await ensureDirectory(`${appDir}projects/`);
  await ensureDirectory(`${appDir}videos/`);
};

// 保存到相册
export const saveToGallery = async (uri: string): Promise<boolean> => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      return false;
    }
    
    await MediaLibrary.createAssetAsync(uri);
    return true;
  } catch (error) {
    console.error('保存失败:', error);
    return false;
  }
};

// 计算视频帧率
export const calculateFrameRate = (
  photoCount: number,
  targetDurationSeconds: number
): number => {
  if (photoCount <= 0 || targetDurationSeconds <= 0) {
    return 24; // 默认帧率
  }
  return Math.min(30, Math.floor(photoCount / targetDurationSeconds));
};
