# TimeLapse Camera - 架构设计文档

**版本：** 1.0.0  
**创建日期：** 2026-03-11  
**技术栈：** React Native + Expo + TypeScript

---

## 1. 系统架构图和技术选型

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户界面层                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  相机页面   │  │   图集页面   │  │  设置页面   │             │
│  │  Camera     │  │   Gallery   │  │   Settings  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         业务逻辑层                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ 相机管理    │  │ 视频生成    │  │ 媒体管理    │             │
│  │ CameraMgr   │  │ VideoGen    │  │ MediaMgr    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ 定时任务    │  │ 通知管理    │  │ 权限管理    │             │
│  │ Scheduler   │  │ Notifier    │  │ Permissions │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         数据访问层                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ SQLite DB   │  │ 文件系统    │  │ AsyncStorage│             │
│  │ (媒体元数据) │  │ (照片/视频) │  │ (配置/状态) │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      原生模块层 (Expo Modules)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ expo-camera │  │expo-av/video│  │expo-file-system            │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 技术选型理由

| 技术/库 | 选型理由 | 替代方案对比 |
|---------|---------|-------------|
| **React Native** | 跨平台开发，一套代码支持 iOS/Android，社区活跃 | Flutter 学习曲线陡峭，Native 开发成本高 |
| **Expo** | 快速原型开发，内置原生模块，OTA 更新支持 | 纯 RN 需要手动配置原生依赖 |
| **TypeScript** | 类型安全，更好的 IDE 支持，减少运行时错误 | JavaScript 缺乏类型检查 |
| **expo-camera** | Expo 官方维护，API 简洁，支持定时拍摄 | react-native-camera 已废弃 |
| **expo-av** | 支持视频播放和基础编辑，与 Expo 生态集成好 | react-native-video 功能单一 |
| **expo-sqlite** | 本地关系型数据库，支持复杂查询 | AsyncStorage 仅支持键值对 |
| **expo-file-system** | 统一的文件操作 API，跨平台兼容 | react-native-fs 需要原生配置 |
| **Zustand** | 轻量级状态管理，无样板代码 | Redux 过于复杂，Context 性能较差 |

---

## 2. 前端目录结构和组件设计

### 2.1 目录结构

```
timelapse-camera/
├── App.tsx                      # 应用入口
├── app.json                     # Expo 配置
├── package.json                 # 依赖管理
├── tsconfig.json                # TypeScript 配置
├── assets/                      # 静态资源
│   ├── icon.png
│   ├── splash-icon.png
│   └── sounds/                  # 提示音
├── src/
│   ├── components/              # 可复用组件
│   │   ├── camera/
│   │   │   ├── CameraView.tsx   # 相机预览组件
│   │   │   ├── CaptureButton.tsx # 拍摄按钮
│   │   │   ├── TimerDisplay.tsx  # 倒计时显示
│   │   │   └── SettingsPanel.tsx # 设置面板
│   │   ├── gallery/
│   │   │   ├── GalleryGrid.tsx   # 图集网格
│   │   │   ├── Thumbnail.tsx     # 缩略图
│   │   │   ├── MediaPreview.tsx  # 媒体预览
│   │   │   └── SelectionBar.tsx  # 选择工具栏
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── Toast.tsx
│   │   └── video/
│   │       ├── VideoPlayer.tsx
│   │       ├── TimelineSlider.tsx
│   │       └── ExportOptions.tsx
│   ├── screens/                 # 页面组件
│   │   ├── CameraScreen.tsx     # 相机主页面
│   │   ├── GalleryScreen.tsx    # 图集页面
│   │   ├── VideoScreen.tsx      # 视频预览页面
│   │   └── SettingsScreen.tsx   # 设置页面
│   ├── hooks/                   # 自定义 Hooks
│   │   ├── useCamera.ts         # 相机逻辑
│   │   ├── useGallery.ts        # 图集逻辑
│   │   ├── useVideo.ts          # 视频生成逻辑
│   │   ├── useStorage.ts        # 存储逻辑
│   │   └── usePermissions.ts    # 权限逻辑
│   ├── services/                # 业务服务
│   │   ├── CameraService.ts     # 相机服务
│   │   ├── VideoService.ts      # 视频生成服务
│   │   ├── StorageService.ts    # 存储服务
│   │   └── NotificationService.ts # 通知服务
│   ├── store/                   # 状态管理
│   │   ├── index.ts             # Store 导出
│   │   ├── cameraStore.ts       # 相机状态
│   │   ├── galleryStore.ts      # 图集状态
│   │   └── settingsStore.ts     # 设置状态
│   ├── database/                # 数据库相关
│   │   ├── schema.ts            # 数据库 Schema
│   │   ├── migrations.ts        # 数据库迁移
│   │   └── queries.ts           # 查询封装
│   ├── types/                   # TypeScript 类型定义
│   │   ├── media.ts             # 媒体类型
│   │   ├── project.ts           # 项目类型
│   │   └── settings.ts          # 设置类型
│   └── utils/                   # 工具函数
│       ├── date.ts              # 日期处理
│       ├── file.ts              # 文件处理
│       └── validation.ts        # 数据验证
└── tests/                       # 测试文件
    ├── components/
    ├── hooks/
    └── services/
```

### 2.2 核心组件设计

#### CameraView 组件

```typescript
// src/components/camera/CameraView.tsx
import React, { useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { CaptureButton } from './CaptureButton';
import { TimerDisplay } from './TimerDisplay';
import { SettingsPanel } from './SettingsPanel';

interface CameraViewProps {
  onCapture: (uri: string) => void;
  interval: number;
  isCapturing: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({
  onCapture,
  interval,
  isCapturing,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView>(null);
  const [showSettings, setShowSettings] = useState(false);

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.8,
      base64: false,
      exif: true,
    });
    
    if (photo?.uri) {
      onCapture(photo.uri);
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Button title="授予相机权限" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mute={true}
      >
        <TimerDisplay 
          interval={interval} 
          isCapturing={isCapturing} 
        />
        
        <View style={styles.controls}>
          <CaptureButton 
            onPress={takePhoto}
            disabled={isCapturing}
          />
          <Button
            title="设置"
            onPress={() => setShowSettings(true)}
          />
        </View>

        <SettingsPanel
          visible={showSettings}
          onClose={() => setShowSettings(false)}
          facing={facing}
          onFacingChange={setFacing}
        />
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

#### GalleryGrid 组件

```typescript
// src/components/gallery/GalleryGrid.tsx
import React from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { Thumbnail } from './Thumbnail';
import type { MediaItem } from '../../types/media';

interface GalleryGridProps {
  items: MediaItem[];
  onSelect: (item: MediaItem) => void;
  onMultiSelect?: (items: MediaItem[]) => void;
  multiSelectMode?: boolean;
}

export const GalleryGrid: React.FC<GalleryGridProps> = ({
  items,
  onSelect,
  onMultiSelect,
  multiSelectMode = false,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelect = (item: MediaItem) => {
    if (multiSelectMode) {
      const newSelected = selectedIds.includes(item.id)
        ? selectedIds.filter(id => id !== item.id)
        : [...selectedIds, item.id];
      
      setSelectedIds(newSelected);
      onMultiSelect?.(items.filter(i => newSelected.includes(i.id)));
    } else {
      onSelect(item);
    }
  };

  const renderItem = ({ item }: { item: MediaItem }) => (
    <Thumbnail
      uri={item.thumbnailUri || item.uri}
      duration={item.duration}
      isSelected={selectedIds.includes(item.id)}
      onSelect={() => handleSelect(item)}
      multiSelectMode={multiSelectMode}
    />
  );

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      numColumns={3}
      contentContainerStyle={styles.grid}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  grid: {
    padding: 4,
  },
});
```

---

## 3. 数据层设计

### 3.1 存储方案

| 数据类型 | 存储方案 | 理由 |
|---------|---------|------|
| 照片/视频文件 | 文件系统 (expo-file-system) | 大文件，需要直接访问 |
| 媒体元数据 | SQLite (expo-sqlite) | 结构化数据，支持复杂查询 |
| 应用配置 | AsyncStorage | 简单键值对，频繁读取 |
| 缓存数据 | 文件系统 + SQLite | 缩略图缓存，查询结果缓存 |

### 3.2 数据模型

#### 媒体项 (MediaItem)

```typescript
// src/types/media.ts
export interface MediaItem {
  id: string;                    // 唯一标识
  uri: string;                   // 文件路径
  thumbnailUri?: string;         // 缩略图路径
  type: 'photo' | 'video';       // 媒体类型
  projectId: string;             // 所属项目 ID
  createdAt: number;             // 创建时间戳
  duration?: number;             // 视频时长 (秒)
  width: number;                 // 宽度
  height: number;                // 高度
  fileSize: number;              // 文件大小 (字节)
  isFavorite: boolean;           // 是否收藏
  tags?: string[];               // 标签
  metadata?: {
    location?: { latitude: number; longitude: number };
    device: string;
    settings: CameraSettings;
  };
}

export interface CameraSettings {
  iso?: number;
  exposure?: number;
  whiteBalance?: string;
  flash?: 'on' | 'off' | 'auto';
}
```

#### 项目 (Project)

```typescript
// src/types/project.ts
export interface Project {
  id: string;                    // 唯一标识
  name: string;                  // 项目名称
  description?: string;          // 描述
  coverImageUri?: string;        // 封面图
  createdAt: number;             // 创建时间
  updatedAt: number;             // 更新时间
  settings: ProjectSettings;     // 项目设置
  mediaCount: number;            // 媒体数量
  status: 'active' | 'completed' | 'archived';
}

export interface ProjectSettings {
  captureInterval: number;       // 拍摄间隔 (秒)
  resolution: '720p' | '1080p' | '4k';
  fps: number;                   // 视频帧率
  orientation: 'portrait' | 'landscape';
  autoExport: boolean;           // 自动导出
  notificationEnabled: boolean;  // 通知开关
}
```

#### 数据库 Schema

```typescript
// src/database/schema.ts
export const SCHEMA = {
  projects: `
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      cover_image_uri TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      settings_json TEXT NOT NULL,
      media_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active'
    )
  `,
  media_items: `
    CREATE TABLE IF NOT EXISTS media_items (
      id TEXT PRIMARY KEY,
      uri TEXT NOT NULL,
      thumbnail_uri TEXT,
      type TEXT NOT NULL,
      project_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      duration INTEGER,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      file_size INTEGER NOT NULL,
      is_favorite INTEGER DEFAULT 0,
      tags_json TEXT,
      metadata_json TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `,
  capture_sessions: `
    CREATE TABLE IF NOT EXISTS capture_sessions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      total_captures INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `,
  // 索引
  indexes: `
    CREATE INDEX IF NOT EXISTS idx_media_project ON media_items(project_id);
    CREATE INDEX IF NOT EXISTS idx_media_created ON media_items(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_media_type ON media_items(type);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
  `
};
```

### 3.3 数据访问层

```typescript
// src/services/StorageService.ts
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import type { MediaItem, Project } from '../types';

export class StorageService {
  private db: SQLite.SQLiteDatabase;
  private readonly MEDIA_DIR = `${FileSystem.documentDirectory}media/`;
  private readonly THUMBNAIL_DIR = `${FileSystem.documentDirectory}thumbnails/`;

  constructor() {
    this.db = SQLite.openDatabase('timelapse.db');
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    await this.db.execAsync(SCHEMA.projects);
    await this.db.execAsync(SCHEMA.media_items);
    await this.db.execAsync(SCHEMA.capture_sessions);
    await this.db.execAsync(SCHEMA.indexes);
  }

  async saveMediaItem(item: Omit<MediaItem, 'id'>): Promise<MediaItem> {
    const id = crypto.randomUUID();
    await this.db.runAsync(
      `INSERT INTO media_items (...) VALUES (...)`,
      [id, item.uri, item.thumbnailUri, /* 其他字段 */]
    );
    return { ...item, id };
  }

  async getMediaByProject(projectId: string): Promise<MediaItem[]> {
    const result = await this.db.getAllAsync<MediaItem>(
      'SELECT * FROM media_items WHERE project_id = ? ORDER BY created_at DESC',
      [projectId]
    );
    return result || [];
  }

  async ensureDirectory(dir: string): Promise<void> {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  }
}
```

---

## 4. 核心模块设计

### 4.1 相机模块

#### 架构

```
┌─────────────────────────────────────────┐
│           CameraScreen                  │
│  (UI: 预览、按钮、设置)                  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│           useCamera Hook                │
│  (状态管理：isCapturing, count, etc.)   │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         CameraService                   │
│  (业务逻辑：定时拍摄、参数配置)          │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│      expo-camera (原生模块)             │
│  (硬件访问：相机、传感器)                │
└─────────────────────────────────────────┘
```

#### 核心实现

```typescript
// src/hooks/useCamera.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useCameraPermissions } from 'expo-camera';
import { CameraService } from '../services/CameraService';

interface UseCameraOptions {
  interval: number;        // 拍摄间隔 (秒)
  maxCaptures?: number;    // 最大拍摄数量
  onCapture?: (uri: string) => void;
  onComplete?: () => void;
}

export const useCamera = ({
  interval,
  maxCaptures,
  onCapture,
  onComplete,
}: UseCameraOptions) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureCount, setCaptureCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cameraService = useRef(new CameraService());

  const startCapture = useCallback(async () => {
    if (!permission?.granted) {
      await requestPermission();
      return;
    }

    setIsCapturing(true);
    setCaptureCount(0);

    const captureLoop = async () => {
      try {
        const uri = await cameraService.current.takePhoto();
        setCaptureCount(prev => prev + 1);
        onCapture?.(uri);

        if (maxCaptures && captureCount + 1 >= maxCaptures) {
          stopCapture();
          onComplete?.();
          return;
        }

        // 倒计时
        for (let i = interval; i > 0; i--) {
          setTimeRemaining(i);
          await new Promise(resolve => {
            timerRef.current = setTimeout(resolve, 1000);
          });
        }
      } catch (error) {
        console.error('Capture failed:', error);
        stopCapture();
      }
    };

    // 立即拍摄第一张
    await captureLoop();

    // 持续拍摄
    while (isCapturing) {
      await captureLoop();
    }
  }, [permission, interval, maxCaptures, onCapture, onComplete]);

  const stopCapture = useCallback(() => {
    setIsCapturing(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setTimeRemaining(0);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    permission,
    isCapturing,
    captureCount,
    timeRemaining,
    startCapture,
    stopCapture,
  };
};
```

### 4.2 图集模块

```typescript
// src/hooks/useGallery.ts
import { useState, useEffect, useCallback } from 'react';
import { StorageService } from '../services/StorageService';
import type { MediaItem, Project } from '../types';

export const useGallery = (projectId?: string) => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const storageService = new StorageService();

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      if (projectId) {
        const media = await storageService.getMediaByProject(projectId);
        setItems(media);
      } else {
        // 加载所有项目
        const allProjects = await storageService.getAllProjects();
        setProjects(allProjects);
      }
    } catch (error) {
      console.error('Failed to load gallery:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const deleteItems = useCallback(async (ids: string[]) => {
    await storageService.deleteMediaItems(ids);
    await loadItems();
  }, [loadItems]);

  const toggleFavorite = useCallback(async (id: string) => {
    await storageService.toggleFavorite(id);
    await loadItems();
  }, [loadItems]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return {
    items,
    projects,
    loading,
    refresh: loadItems,
    deleteItems,
    toggleFavorite,
  };
};
```

### 4.3 视频生成模块

#### 架构

```
┌─────────────────────────────────────────┐
│         选择照片 (多图)                  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│      配置参数 (FPS, 分辨率，时长)        │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│       FFmpeg / expo-av (编码)           │
│  (将图片序列编码为视频)                  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         保存/分享视频                     │
└─────────────────────────────────────────┘
```

#### 核心实现

```typescript
// src/services/VideoService.ts
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { FFmpegKit } from 'ffmpeg-kit-react-native';

export class VideoService {
  private readonly OUTPUT_DIR = `${FileSystem.documentDirectory}videos/`;

  async generateVideo({
    imageUris,
    fps = 30,
    outputName = 'timelapse',
  }: {
    imageUris: string[];
    fps?: number;
    outputName?: string;
  }): Promise<string> {
    await this.ensureOutputDirectory();

    const outputPath = `${this.OUTPUT_DIR}${outputName}_${Date.now()}.mp4`;
    
    // 创建 FFmpeg 命令
    // 将图片序列编码为视频
    const ffmpegCommand = `-framerate ${fps} -pattern_type glob -i '${imageUris.join(',')}' ` +
                         `-c:v libx264 -pix_fmt yuv420p -vf "scale=1280:720" ${outputPath}`;

    // 使用 FFmpeg 处理
    const session = await FFmpegKit.execute(ffmpegCommand);
    const returnCode = await session.getReturnCode();

    if (!returnCode.isValueSuccess()) {
      throw new Error('Video generation failed');
    }

    return outputPath;
  }

  async shareVideo(uri: string): Promise<void> {
    await Sharing.shareAsync(uri, {
      mimeType: 'video/mp4',
      dialogTitle: '分享延时视频',
      UTI: 'public.mpeg-4',
    });
  }

  private async ensureOutputDirectory(): Promise<void> {
    const info = await FileSystem.getInfoAsync(this.OUTPUT_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(this.OUTPUT_DIR, { intermediates: true });
    }
  }
}
```

---

## 5. 技术难点和解决方案

### 5.1 难点一：长时间后台拍摄

**问题：** 应用进入后台后，定时拍摄任务会被系统暂停。

**解决方案：**

```typescript
// 使用 Background Tasks (iOS) + Foreground Service (Android)
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_CAPTURE_TASK = 'background-capture';

TaskManager.defineTask(BACKGROUND_CAPTURE_TASK, async () => {
  try {
    // 拍摄一张照片
    await CameraService.takePhotoInBackground();
    
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// 注册后台任务
await BackgroundFetch.registerTaskAsync(BACKGROUND_CAPTURE_TASK, {
  minimumInterval: 15 * 60, // 15 分钟 (系统限制)
  stopOnTerminate: false,
  startOnBoot: true,
});
```

**限制：** iOS 后台任务有严格限制，建议引导用户使用"引导式访问"模式保持应用在前台。

### 5.2 难点二：大量照片的内存管理

**问题：** 长时间拍摄会产生数百张照片，导致内存溢出。

**解决方案：**

```typescript
// 1. 使用缩略图加载
import { Image } from 'expo-image';

<Image
  source={{ uri: thumbnailUri }}
  contentFit="cover"
  recyclingKey={item.id} // 启用图片回收
  cachePolicy="memory-disk"
/>

// 2. 分页加载
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['media', projectId],
  queryFn: ({ pageParam = 0 }) => 
    storageService.getMediaByProject(projectId, { limit: 50, offset: pageParam }),
  getNextPageParam: (lastPage, allPages) => 
    lastPage.length === 50 ? allPages.length * 50 : undefined,
});

// 3. 定期清理缓存
const cleanupCache = async () => {
  const { freeDiskStorage } = await FileSystem.getInfoAsync(FileSystem.documentDirectory);
  if (freeDiskStorage < 1024 * 1024 * 500) { // 小于 500MB
    await StorageService.clearThumbnailCache();
  }
};
```

### 5.3 难点三：视频生成的性能优化

**问题：** 在移动设备上编码大量图片为视频非常耗时。

**解决方案：**

```typescript
// 1. 使用硬件加速
const ffmpegCommand = `-framerate ${fps} ` +
                     `-i image%d.jpg ` +
                     `-c:v h264_videotoolbox ` + // iOS 硬件编码
                     `-b:v 5M ` +
                     `output.mp4`;

// 2. 后台处理 + 进度通知
import * as BackgroundDownloader from 'expo-background-downloader';

const generateVideoInBackground = async (params) => {
  // 使用后台任务处理
  await TaskManager.registerTaskAsync('video-export', async () => {
    await VideoService.generateVideo(params);
  });
};

// 3. 分批次处理 (超大型项目)
const processInBatches = async (images: string[], batchSize = 100) => {
  const batches = chunk(images, batchSize);
  const intermediateVideos = [];

  for (const batch of batches) {
    const video = await generateVideo({ imageUris: batch });
    intermediateVideos.push(video);
  }

  // 合并所有视频片段
  return await mergeVideos(intermediateVideos);
};
```

### 5.4 难点四：跨平台相机 API 差异

**问题：** iOS 和 Android 的相机 API 存在差异。

**解决方案：**

```typescript
// 使用 Platform-specific 配置
import { Platform } from 'react-native';

const cameraProps = {
  ratio: Platform.OS === 'ios' ? '16:9' : '4:3',
  videoStabilizationMode: Platform.OS === 'ios' 
    ? CameraVideoStabilizationMode.Cinematic 
    : undefined,
  androidCameraImplementationMode: Platform.OS === 'android'
    ? CameraImplementationMode.Compatible // 兼容性更好
    : undefined,
};

// 封装平台差异
class PlatformCamera {
  async takePhoto(): Promise<string> {
    if (Platform.OS === 'ios') {
      return this.takePhotoIOS();
    } else {
      return this.takePhotoAndroid();
    }
  }
}
```

---

## 6. 第三方依赖清单

### 6.1 核心依赖

```json
{
  "dependencies": {
    "expo": "~55.0.5",
    "expo-camera": "~15.0.5",
    "expo-av": "~14.0.5",
    "expo-sqlite": "~14.0.5",
    "expo-file-system": "~17.0.5",
    "expo-image": "~2.0.5",
    "expo-sharing": "~12.0.5",
    "expo-background-fetch": "~12.0.5",
    "expo-task-manager": "~11.0.5",
    "expo-notifications": "~0.28.5",
    "expo-media-library": "~16.0.5",
    
    "react": "19.2.0",
    "react-native": "0.83.2",
    
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.0.0",
    
    "ffmpeg-kit-react-native": "^6.0.0",
    
    "date-fns": "^3.0.0",
    "uuid": "^9.0.0"
  },
  
  "devDependencies": {
    "@types/react": "~19.2.2",
    "@types/uuid": "^9.0.0",
    "typescript": "~5.9.2",
    
    "@testing-library/react-native": "^12.0.0",
    "jest": "^29.0.0",
    "jest-expo": "~55.0.0"
  }
}
```

### 6.2 依赖说明

| 依赖 | 用途 | 必要性 |
|------|------|--------|
| `expo-camera` | 相机访问和控制 | 🔴 核心 |
| `expo-av` | 视频播放 | 🔴 核心 |
| `expo-sqlite` | 本地数据库 | 🔴 核心 |
| `expo-file-system` | 文件操作 | 🔴 核心 |
| `expo-image` | 高性能图片加载 | 🟡 推荐 |
| `expo-sharing` | 分享功能 | 🟡 推荐 |
| `expo-background-fetch` | 后台任务 | 🟡 推荐 |
| `expo-notifications` | 本地通知 | 🟡 推荐 |
| `expo-media-library` | 相册访问 | 🟡 推荐 |
| `zustand` | 状态管理 | 🟡 推荐 |
| `@tanstack/react-query` | 数据获取 | 🟡 推荐 |
| `ffmpeg-kit-react-native` | 视频编码 | 🟢 可选 (可用 expo-av 替代) |
| `date-fns` | 日期处理 | 🟢 可选 |
| `uuid` | UUID 生成 | 🟢 可选 |

### 6.3 安装命令

```bash
# 核心依赖
npx expo install expo-camera expo-av expo-sqlite expo-file-system expo-image

# 功能依赖
npx expo install expo-sharing expo-background-fetch expo-task-manager expo-notifications expo-media-library

# 第三方库
npm install zustand @tanstack/react-query date-fns uuid

# 视频编码 (可选)
npm install ffmpeg-kit-react-native

# 开发依赖
npm install -D @types/uuid @testing-library/react-native jest-expo
```

---

## 附录

### A. 项目启动检查清单

- [ ] 配置 Expo 项目
- [ ] 安装所有依赖
- [ ] 配置 iOS/Android 权限
- [ ] 设置数据库 Schema
- [ ] 实现基础相机功能
- [ ] 实现图集浏览
- [ ] 实现视频生成
- [ ] 添加单元测试
- [ ] 性能优化
- [ ] 发布测试版本

### B. 权限配置

```json
// app.json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "需要访问相机以拍摄延时照片",
        "NSPhotoLibraryUsageDescription": "需要访问相册以保存和浏览照片",
        "NSPhotoLibraryAddUsageDescription": "需要保存照片到相册",
        "NSMicrophoneUsageDescription": "需要访问麦克风以录制视频音频"
      }
    },
    "android": {
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "RECORD_AUDIO"
      ]
    }
  }
}
```

### C. 参考资料

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Camera](https://docs.expo.dev/versions/latest/sdk/camera/)
- [FFmpeg Kit](https://github.com/arthenica/ffmpeg-kit)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [TanStack Query](https://tanstack.com/query/latest)

---

*文档版本：1.0.0 | 最后更新：2026-03-11*
