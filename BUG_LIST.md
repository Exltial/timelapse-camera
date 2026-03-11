# TimeLapse Camera - Bug 清单

**项目:** TimeLapse Camera  
**版本:** v1.0.0 (MVP)  
**创建日期:** 2026-03-11  
**最后更新:** 2026-03-11  
**状态:** 📋 待修复

---

## 📊 Bug 统计

| 严重程度 | 数量 | 状态 |
|----------|------|------|
| 🔴 Critical | 1 | 待修复 |
| 🟠 Major | 3 | 待修复/待优化 |
| 🟡 Minor | 1 | 待优化 |
| **总计** | **5** | - |

---

## 🔴 Critical 级别（阻塞发布）

### BUG-001: CameraScreen.tsx 语法错误 - 顶层 await

**严重程度:** 🔴 Critical  
**优先级:** P0  
**状态:** ✅ 已修复  
**负责人:** 贾维斯  
**创建日期:** 2026-03-11  
**修复日期:** 2026-03-11  

**问题描述:**
在 `src/screens/CameraScreen.tsx` 第 32-33 行使用了顶层 `await` 语法，这在 React 函数组件中是非法的。

**错误代码:**
```typescript
// src/screens/CameraScreen.tsx 第 32-33 行
const [mediaPermission, requestMediaPermission] =
  await MediaLibrary.requestPermissionsAsync();
```

**错误信息:**
```
SyntaxError: await is only valid in async functions and the top level bodies of modules
```

**影响范围:**
- 相机页面无法加载
- 应用启动后点击"拍摄"按钮会崩溃
- 所有拍照功能不可用

**复现步骤:**
1. 启动应用
2. 创建项目
3. 进入项目详情
4. 点击"拍摄"按钮
5. 应用崩溃或无法加载相机页面

**复现率:** 100%

**修复建议:**
```typescript
// 方案 1: 在 useEffect 中请求权限
export const CameraScreen: React.FC<CameraScreenProps> = ({ navigation, route }) => {
  const { projectId } = route.params;
  
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, setMediaPermission] = useState<MediaLibrary.PermissionResponse | null>(null);
  
  useEffect(() => {
    requestPermission();
    MediaLibrary.requestPermissionsAsync().then(setMediaPermission);
  }, []);
  
  // ... 其余代码
};

// 方案 2: 将权限请求移到函数内部
const handleTakePhoto = async () => {
  const mediaPermission = await MediaLibrary.requestPermissionsAsync();
  if (mediaPermission.status !== 'granted') {
    // 处理权限拒绝
    return;
  }
  // ... 拍照逻辑
};
```

**验收标准:**
- [ ] CameraScreen 可以正常编译
- [ ] 应用启动后点击"拍摄"可以进入相机页面
- [ ] 相机预览正常显示
- [ ] 拍照功能可用

---

## 🟠 Major 级别（严重影响）

### BUG-002: 视频生成功能为模拟实现

**严重程度:** 🟠 Major  
**优先级:** P1  
**状态:** 📋 待优化  
**负责人:** 待分配  
**创建日期:** 2026-03-11  

**问题描述:**
`src/utils/videoUtils.ts` 中的 `generateVideo` 函数仅为模拟实现，没有实际的视频编码逻辑，直接返回输出路径而不生成真实视频。

**问题代码:**
```typescript
// src/utils/videoUtils.ts 第 18-28 行
export const generateVideo = async (
  photoUris: string[],
  config: VideoConfig
): Promise<string> => {
  const { outputUri, fps } = config;
  
  // 模拟视频生成过程
  console.log(`生成视频：${photoUris.length} 张照片，${fps}fps`);
  console.log(`输出路径：${outputUri}`);
  
  // 返回输出路径（未实际生成视频）
  return outputUri;
};
```

**影响范围:**
- 用户无法生成真实的延时视频
- 核心功能缺失
- 用户体验严重受损

**复现步骤:**
1. 拍摄多张照片
2. 进入"生成视频"页面
3. 点击"生成视频"按钮
4. 显示生成成功
5. 尝试播放视频 - 文件不存在或无法播放

**复现率:** 100%

**修复建议:**

**方案 A: 集成 expo-ffmpeg（推荐）**
```bash
npx expo install expo-ffmpeg
```

```typescript
import { FFmpegKit } from 'expo-ffmpeg';

export const generateVideo = async (
  photoUris: string[],
  config: VideoConfig
): Promise<string> => {
  const { outputUri, fps, width, height } = config;
  
  // 创建临时文件列表
  const fileList = photoUris.map(uri => `file '${uri}'`).join('\n');
  const listFilePath = `${FileSystem.cacheDirectory}file_list.txt`;
  await FileSystem.writeAsStringAsync(listFilePath, fileList);
  
  // 使用 FFmpeg 生成视频
  const command = `-f concat -safe 0 -i ${listFilePath} -c:v libx264 -r ${fps} -s ${width}x${height} ${outputUri}`;
  await FFmpegKit.execute(command);
  
  return outputUri;
};
```

**方案 B: 使用云端服务**
- 将照片上传到云端
- 调用云端视频生成 API
- 下载生成的视频

**方案 C: 明确标注为简化版**
- 在 UI 中明确提示"视频生成功能开发中"
- 或仅在开发环境使用模拟

**验收标准:**
- [ ] 生成的视频文件真实存在
- [ ] 视频可以正常播放
- [ ] 视频帧率符合预期
- [ ] 视频分辨率正确

---

### BUG-003: TypeScript 类型定义错误

**严重程度:** 🟠 Major  
**优先级:** P2  
**状态:** ✅ 已修复  
**负责人:** 贾维斯  
**创建日期:** 2026-03-11  
**修复日期:** 2026-03-11  

**问题描述:**
编译时出现依赖库类型错误，导致 TypeScript 编译失败。

**错误信息:**
```
node_modules/@types/babel__traverse/index.d.ts(1014,20): error TS1005: '}' expected.
```

**影响范围:**
- TypeScript 编译失败
- 影响 CI/CD 流程
- 无法进行类型检查

**复现步骤:**
1. 运行 `npx tsc --noEmit`
2. 出现类型错误

**复现率:** 100%

**修复建议:**

**方案 A: 更新依赖**
```bash
npm update @types/babel__traverse
```

**方案 B: 跳过库检查（推荐临时方案）**
```json
// tsconfig.json
{
  "compilerOptions": {
    "skipLibCheck": true,
    // ... 其他配置
  }
}
```

**方案 C: 固定版本**
```json
// package.json
{
  "devDependencies": {
    "@types/babel__traverse": "7.20.5" // 使用稳定版本
  }
}
```

**验收标准:**
- [ ] `npx tsc --noEmit` 无错误
- [ ] CI/CD 流程正常

---

### BUG-004: 组件目录为空

**严重程度:** 🟠 Minor (降级为 Minor)  
**优先级:** P3  
**状态:** 📋 待优化  
**负责人:** 待分配  
**创建日期:** 2026-03-11  

**问题描述:**
`src/components/` 目录下创建了子目录但均为空，缺少可复用组件。

**空目录列表:**
- `src/components/camera/` - 空
- `src/components/common/` - 空
- `src/components/gallery/` - 空
- `src/components/video/` - 空

**影响范围:**
- 代码复用性差
- 不符合组件化最佳实践
- 目录结构不清晰

**修复建议:**

**方案 A: 提取可复用组件**
```typescript
// src/components/common/Button.tsx
export const Button: React.FC<ButtonProps> = ({ title, onPress, disabled }) => (
  <TouchableOpacity style={[styles.button, disabled && styles.disabled]} onPress={onPress}>
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

// src/components/common/LoadingSpinner.tsx
export const LoadingSpinner: React.FC = () => (
  <ActivityIndicator size="large" color="#007AFF" />
);
```

**方案 B: 删除空目录**
如果暂时不需要，可以删除空目录，待需要时再创建。

**验收标准:**
- [ ] 目录结构清晰
- [ ] 可复用组件被提取
- [ ] 代码复用率提高

---

## 🟡 Minor 级别（轻微问题）

### BUG-005: 缺少加载状态和错误边界处理

**严重程度:** 🟡 Minor  
**优先级:** P3  
**状态:** 📋 待优化  
**负责人:** 待分配  
**创建日期:** 2026-03-11  

**问题描述:**
应用缺少全局错误边界和统一的加载状态处理，可能导致未处理的错误和糟糕的用户体验。

**影响范围:**
- 错误发生时应用可能崩溃
- 加载状态不统一
- 用户体验不一致

**修复建议:**

**添加错误边界:**
```typescript
// src/components/common/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

**统一加载状态:**
```typescript
// src/components/common/LoadingOverlay.tsx
export const LoadingOverlay: React.FC<{ visible: boolean }> = ({ visible }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.overlay}>
      <ActivityIndicator size="large" color="#fff" />
      <Text style={styles.text}>加载中...</Text>
    </View>
  </Modal>
);
```

**验收标准:**
- [ ] 错误被正确捕获和展示
- [ ] 加载状态统一
- [ ] 用户体验提升

---

## 📝 Bug 修复进度

| 日期 | Bug ID | 操作 | 操作人 | 备注 |
|------|--------|------|--------|------|
| 2026-03-11 | BUG-001 | 创建 | QA 测试工程师 | 初始报告 |
| 2026-03-11 | BUG-001 | ✅ 修复 | 贾维斯 | 移除顶层 await，改用 useEffect |
| 2026-03-11 | BUG-002 | 创建 | QA 测试工程师 | 初始报告 |
| 2026-03-11 | BUG-003 | 创建 | QA 测试工程师 | 初始报告 |
| 2026-03-11 | BUG-003 | ✅ 修复 | 贾维斯 | tsconfig.json 添加 skipLibCheck |
| 2026-03-11 | BUG-004 | 创建 | QA 测试工程师 | 初始报告 |
| 2026-03-11 | BUG-005 | 创建 | QA 测试工程师 | 初始报告 |

---

## 🔄 Bug 生命周期

```
发现 → 记录 → 分配 → 修复 → 验证 → 关闭
```

**当前状态:** 所有 Bug 处于"记录"状态，等待分配和修复。

---

## 📌 备注

1. **BUG-001** 是阻塞性 Bug，必须优先修复
2. **BUG-002** 影响核心功能，建议尽快实现真实视频生成
3. **BUG-003** 是依赖库问题，可以通过配置临时解决
4. **BUG-004** 和 **BUG-005** 是优化建议，可以在后续迭代中完成

---

**文档状态:** 📋 待处理  
**最后更新:** 2026-03-11 15:30 GMT+8
