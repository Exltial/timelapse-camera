import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { initializeAppDirectory } from './src/utils/helpers';
import { HomeScreen } from './src/screens/HomeScreen';
import { CreateProjectScreen } from './src/screens/CreateProjectScreen';
import { ProjectDetailScreen } from './src/screens/ProjectDetailScreen';
import { CameraScreen } from './src/screens/CameraScreen';
import { VideoGenerateScreen } from './src/screens/VideoGenerateScreen';
import { PhotoPreviewScreen } from './src/screens/PhotoPreviewScreen';

export type RootStackParamList = {
  Home: undefined;
  CreateProject: undefined;
  ProjectDetail: { projectId: string };
  Camera: { projectId: string };
  VideoGenerate: { projectId: string };
  PhotoPreview: { photo: any };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  useEffect(() => {
    // 初始化应用目录
    initializeAppDirectory();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CreateProject" component={CreateProjectScreen} />
        <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="VideoGenerate" component={VideoGenerateScreen} />
        <Stack.Screen name="PhotoPreview" component={PhotoPreviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
