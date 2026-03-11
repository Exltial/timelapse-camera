import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { AVPlaybackStatus } from 'expo-av';

// 视频生成配置
export interface VideoConfig {
  outputUri: string;
  fps: number;
  width: number;
  height: number;
  onProgress?: (progress: number) => void;
}

// FFmpeg 实例缓存
let ffmpegInstance: FFmpeg | null = null;

// 初始化 FFmpeg
const loadFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  ffmpegInstance = new FFmpeg();
  
  // 加载 FFmpeg 核心文件
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  
  ffmpegInstance.on('log', ({ message }) => {
    console.log('[FFmpeg]', message);
  });

  ffmpegInstance.on('progress', ({ progress }) => {
    console.log('[FFmpeg Progress]', progress);
  });

  await ffmpegInstance.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return ffmpegInstance;
};

// 生成视频（使用 FFmpeg 真实编码）
export const generateVideo = async (
  photoUris: string[],
  config: VideoConfig
): Promise<string> => {
  const { outputUri, fps, width, height, onProgress } = config;
  
  console.log(`[VideoGen] 开始生成视频：${photoUris.length} 张照片，${fps}fps，分辨率 ${width}x${height}`);
  
  try {
    // 加载 FFmpeg
    const ffmpeg = await loadFFmpeg();
    
    // 创建临时目录
    const tempDir = `${FileSystem.cacheDirectory}timelapse_${Date.now()}`;
    await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
    
    // 将照片复制到临时目录并重命名
    const imageFiles: string[] = [];
    for (let i = 0; i < photoUris.length; i++) {
      const uri = photoUris[i];
      const fileName = `image_${String(i).padStart(4, '0')}.jpg`;
      const destPath = `${tempDir}/${fileName}`;
      
      // 复制文件到临时目录
      await FileSystem.copyAsync({
        from: uri,
        to: destPath,
      });
      
      imageFiles.push(fileName);
      
      // 报告进度（准备阶段）
      if (onProgress) {
        onProgress((i + 1) / photoUris.length * 0.3); // 准备阶段占 30%
      }
    }
    
    console.log(`[VideoGen] 已准备 ${imageFiles.length} 张图片`);
    
    // 使用 FFmpeg 生成视频（图像序列方式）
    // 将图片重命名为连续的数字序列
    const inputPattern = `${tempDir}/image_%04d.jpg`;
    const outputPath = `${tempDir}/output.mp4`;
    
    // FFmpeg 命令：将图像序列转换为视频
    // -framerate: 输入帧率
    // -i: 输入文件模式
    // -c:v: 视频编码器 (libx264)
    // -preset: 编码速度/质量平衡
    // -pix_fmt: 像素格式 (yuv420p 兼容性最好)
    // -vf: 视频滤镜 (缩放)
    const command = [
      '-framerate', fps.toString(),
      '-i', inputPattern,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-pix_fmt', 'yuv420p',
      '-vf', `scale=${width}:${height}`,
      '-y', // 覆盖输出文件
      outputPath,
    ];
    
    console.log(`[VideoGen] 执行 FFmpeg 命令: ${command.join(' ')}`);
    
    // 执行 FFmpeg
    await ffmpeg.exec(command);
    
    // 报告进度（编码完成）
    if (onProgress) {
      onProgress(1.0);
    }
    
    // 验证输出文件存在
    const fileInfo = await FileSystem.getInfoAsync(outputPath);
    if (!fileInfo.exists) {
      throw new Error('视频文件生成失败：输出文件不存在');
    }
    
    console.log(`[VideoGen] 视频生成成功：${outputPath}`);
    console.log(`[VideoGen] 文件大小：${fileInfo.size} bytes`);
    
    // 将视频保存到相册
    const asset = await MediaLibrary.createAssetAsync(outputPath);
    console.log(`[VideoGen] 已保存到相册：${asset.uri}`);
    
    // 如果需要保存到指定的 outputUri，复制文件
    if (outputUri !== outputPath) {
      await FileSystem.copyAsync({
        from: outputPath,
        to: outputUri,
      });
      console.log(`[VideoGen] 已复制到：${outputUri}`);
    }
    
    // 清理临时文件
    await FileSystem.deleteAsync(tempDir, { idempotent: true });
    
    // 返回最终输出路径
    return outputUri;
    
  } catch (error) {
    console.error('[VideoGen] 视频生成失败:', error);
    
    // 清理临时文件（如果存在）
    try {
      const tempDir = `${FileSystem.cacheDirectory}timelapse_*`;
      // 注意：这里需要更复杂的清理逻辑
    } catch (cleanupError) {
      console.error('[VideoGen] 清理临时文件失败:', cleanupError);
    }
    
    throw error;
  }
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

// 估算视频时长
export const estimateVideoDuration = (photoCount: number, fps: number): number => {
  return (photoCount / fps) * 1000; // 返回毫秒
};

// 重置 FFmpeg 实例（用于释放资源）
export const resetFFmpeg = (): void => {
  if (ffmpegInstance) {
    ffmpegInstance = null;
    console.log('[VideoGen] FFmpeg 实例已重置');
  }
};
