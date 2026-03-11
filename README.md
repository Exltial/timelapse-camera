# TimeLapse Camera

📸 用照片记录变化，自动生成延时视频

[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue)](https://expo.dev)
[![React Native](https://img.shields.io/badge/react--native-0.83.2-0284c7)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/expo-55.0.5-000020)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/typescript-5.9.2-3178c6)](https://www.typescriptlang.org)

## 🎯 产品定位

一款专注于记录时间变化的相机应用，帮助用户记录健身减肥、宝宝成长、装修进度、植物生长等过程，一键生成延时摄影视频。

## ✨ 核心功能

- 📷 **图集系统** - 创建和管理不同主题的图集
- 📸 **智能相机** - 支持单张拍摄和自动延时拍摄
- 📊 **时间轴** - 按时间顺序展示所有照片
- 🎬 **视频生成** - 一键生成延时摄影视频
- 💾 **本地存储** - 所有数据保存在本地

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9
- iOS Simulator / Android Emulator 或真机

### 安装运行

```bash
# 克隆项目
git clone https://github.com/YOUR_USERNAME/timelapse-camera.git
cd timelapse-camera

# 安装依赖
npm install

# 启动开发服务器
npm start

# 运行到模拟器
npm run ios    # iOS
npm run android  # Android
```

## 📱 使用流程

1. **创建项目** → 输入项目名称、拍摄间隔、目标时长
2. **开始拍摄** → 选择单张或延时模式
3. **查看照片** → 时间轴浏览所有照片
4. **生成视频** → 一键合成延时视频
5. **保存分享** → 保存到相册或分享

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React Native + Expo |
| 语言 | TypeScript |
| 状态管理 | Zustand |
| 导航 | React Navigation |
| 相机 | expo-camera |
| 媒体库 | expo-media-library |
| 文件系统 | expo-file-system |
| 视频 | expo-av |

## 📁 项目结构

```
timelapse-camera/
├── App.tsx                    # 应用入口
├── package.json               # 依赖配置
├── app.json                   # Expo 配置
├── README.md                  # 项目说明
└── src/
    ├── types/index.ts         # 类型定义
    ├── store/appStore.ts      # 状态管理
    ├── utils/                 # 工具函数
    └── screens/               # 页面组件
        ├── HomeScreen.tsx
        ├── CreateProjectScreen.tsx
        ├── ProjectDetailScreen.tsx
        ├── CameraScreen.tsx
        ├── VideoGenerateScreen.tsx
        └── PhotoPreviewScreen.tsx
```

## 📋 开发计划

- [x] MVP 核心功能开发
- [ ] FFmpeg 真实视频编码集成
- [ ] 照片编辑（裁剪、滤镜）
- [ ] 云同步备份
- [ ] 社交分享

## 📄 文档

- [产品需求文档](./PRD.md)
- [架构设计文档](./ARCHITECTURE.md)
- [测试报告](./TEST_REPORT.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📝 License

MIT License
