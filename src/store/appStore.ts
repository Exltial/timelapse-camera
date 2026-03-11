import { create } from 'zustand';
import { Project, Photo, VideoTask, CameraSettings } from '../types';

interface AppState {
  // 项目数据
  projects: Project[];
  currentProjectId?: string;
  
  // 照片数据 (按项目分组)
  photos: Record<string, Photo[]>;
  
  // 视频任务
  videoTasks: VideoTask[];
  
  // 拍摄状态
  isCapturing: boolean;
  captureProgress: number;
  totalCaptures: number;
  capturedCount: number;
  
  // 相机设置
  cameraSettings: CameraSettings;
  
  // Actions
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (id?: string) => void;
  
  addPhoto: (photo: Photo) => void;
  deletePhoto: (projectId: string, photoId: string) => void;
  getPhotosByProject: (projectId: string) => Photo[];
  
  addVideoTask: (task: VideoTask) => void;
  updateVideoTask: (id: string, updates: Partial<VideoTask>) => void;
  
  setCapturing: (isCapturing: boolean) => void;
  setCaptureProgress: (progress: number, total: number, captured: number) => void;
  
  updateCameraSettings: (settings: Partial<CameraSettings>) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // 初始状态
  projects: [],
  currentProjectId: undefined,
  photos: {},
  videoTasks: [],
  isCapturing: false,
  captureProgress: 0,
  totalCaptures: 0,
  capturedCount: 0,
  cameraSettings: {
    intervalSeconds: 5,
    targetDurationSeconds: 10,
    flashMode: 'off',
    quality: 'high',
  },
  
  // 项目管理
  addProject: (project) => set((state) => ({
    projects: [...state.projects, project],
  })),
  
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
    ),
  })),
  
  deleteProject: (id) => set((state) => ({
    projects: state.projects.filter((p) => p.id !== id),
    photos: Object.fromEntries(
      Object.entries(state.photos).filter(([projectId]) => projectId !== id)
    ),
    currentProjectId: state.currentProjectId === id ? undefined : state.currentProjectId,
  })),
  
  setCurrentProject: (id) => set({ currentProjectId: id }),
  
  // 照片管理
  addPhoto: (photo) => set((state) => {
    const projectPhotos = state.photos[photo.projectId] || [];
    return {
      photos: {
        ...state.photos,
        [photo.projectId]: [...projectPhotos, photo],
      },
    };
  }),
  
  deletePhoto: (projectId, photoId) => set((state) => ({
    photos: {
      ...state.photos,
      [projectId]: (state.photos[projectId] || []).filter((p) => p.id !== photoId),
    },
  })),
  
  getPhotosByProject: (projectId) => {
    return get().photos[projectId] || [];
  },
  
  // 视频任务管理
  addVideoTask: (task) => set((state) => ({
    videoTasks: [...state.videoTasks, task],
  })),
  
  updateVideoTask: (id, updates) => set((state) => ({
    videoTasks: state.videoTasks.map((t) =>
      t.id === id ? { ...t, ...updates } : t
    ),
  })),
  
  // 拍摄状态
  setCapturing: (isCapturing) => set({ isCapturing }),
  
  setCaptureProgress: (progress, total, captured) => set({
    captureProgress: progress,
    totalCaptures: total,
    capturedCount: captured,
  }),
  
  // 相机设置
  updateCameraSettings: (settings) => set((state) => ({
    cameraSettings: { ...state.cameraSettings, ...settings },
  })),
}));
