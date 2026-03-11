import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAppStore } from '../store/appStore';
import { Project } from '../types';
import { generateId } from '../utils/helpers';

interface CreateProjectScreenProps {
  navigation: any;
}

export const CreateProjectScreen: React.FC<CreateProjectScreenProps> = ({
  navigation,
}) => {
  const addProject = useAppStore((state) => state.addProject);
  const setCurrentProject = useAppStore((state) => state.setCurrentProject);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [intervalSeconds, setIntervalSeconds] = useState('5');
  const [targetDuration, setTargetDuration] = useState('10');

  const handleCreate = () => {
    if (!name.trim()) {
      Alert.alert('提示', '请输入项目名称');
      return;
    }

    const interval = parseInt(intervalSeconds, 10);
    const target = parseInt(targetDuration, 10);

    if (isNaN(interval) || interval < 1) {
      Alert.alert('提示', '拍摄间隔必须大于 0 秒');
      return;
    }

    if (isNaN(target) || target < 1) {
      Alert.alert('提示', '目标时长必须大于 0 秒');
      return;
    }

    const project: Project = {
      id: generateId(),
      name: name.trim(),
      description: description.trim() || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      photoCount: 0,
      intervalSeconds: interval,
      targetDurationSeconds: target,
    };

    addProject(project);
    setCurrentProject(project.id);

    Alert.alert(
      '创建成功',
      `项目"${project.name}"已创建`,
      [
        {
          text: '开始拍摄',
          onPress: () => {
            navigation.navigate('Camera', { projectId: project.id });
          },
        },
        {
          text: '稍后再说',
          style: 'cancel',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>创建新项目</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>项目名称 *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="例如：日出延时、植物生长"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>描述</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="可选，描述这个项目"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>拍摄间隔（秒）*</Text>
          <TextInput
            style={styles.input}
            value={intervalSeconds}
            onChangeText={setIntervalSeconds}
            placeholder="例如：5"
            placeholderTextColor="#999"
            keyboardType="number-pad"
          />
          <Text style={styles.hint}>每张照片之间的时间间隔</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>目标视频时长（秒）*</Text>
          <TextInput
            style={styles.input}
            value={targetDuration}
            onChangeText={setTargetDuration}
            placeholder="例如：10"
            placeholderTextColor="#999"
            keyboardType="number-pad"
          />
          <Text style={styles.hint}>生成的视频期望时长</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleCreate}>
          <Text style={styles.buttonText}>创建项目</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  form: {
    padding: 20,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
