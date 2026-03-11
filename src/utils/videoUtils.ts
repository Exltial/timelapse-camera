import { AVPlaybackStatus } from 'expo-av';

// 视频生成配置
export interface VideoConfig {
  outputUri: string;
  fps: number;
  width: number;
  height: number;
}

// 生成视频（使用 FFmpeg 或原生 API）
// 注意：在 Expo Go 中，我们使用简化的方式
// 在生产环境中，应使用 expo-ffmpeg 或自定义原生模块
export const generateVideo = async (
  photoUris: string[],
  config: VideoConfig
): Promise<string> => {
  const { outputUri, fps } = config;
  
  // 模拟视频生成过程
  // 实际实现需要 FFmpeg 或原生视频编码
  console.log(`生成视频：${photoUris.length} 张照片，${fps}fps`);
  console.log(`输出路径：${outputUri}`);
  
  // 返回输出路径
  return outputUri;
};

// 检查视频状态
export const checkVideoStatus = (status: AVPlaybackStatus): string => {
  if (!status.isLoaded) {
    return 'loading';
  }
  if (status.isPlaying) {
    return 'playing';
  }
  if (status.positionMillis === status.durationMillis) {
    return 'ended';
  }
  return 'paused';
};

// 格式化视频时长
export const formatVideoDuration = (millis: number): string => {
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
