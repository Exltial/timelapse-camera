// 项目/图集数据类型
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  coverImageUri?: string;
  photoCount: number;
  intervalSeconds: number; // 拍摄间隔（秒）
  targetDurationSeconds: number; // 目标视频时长（秒）
}

// 照片数据
export interface Photo {
  id: string;
  projectId: string;
  uri: string;
  timestamp: number;
  sequenceNumber: number;
  width: number;
  height: number;
}

// 视频生成任务
export interface VideoTask {
  id: string;
  projectId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  outputUri?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

// 相机设置
export interface CameraSettings {
  intervalSeconds: number;
  targetDurationSeconds: number;
  flashMode: 'off' | 'on' | 'auto';
  quality: 'low' | 'medium' | 'high';
}

// 应用状态
export interface AppState {
  projects: Project[];
  currentProjectId?: string;
  photos: Record<string, Photo[]>; // projectId -> photos
  videoTasks: VideoTask[];
  isCapturing: boolean;
  captureProgress: number;
}
