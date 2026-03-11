import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useAppStore } from '../store/appStore';
import { Photo } from '../types';
import { formatDate } from '../utils/helpers';

interface ProjectDetailScreenProps {
  navigation: any;
  route: {
    params: {
      projectId: string;
    };
  };
}

export const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { projectId } = route.params;
  
  const projects = useAppStore((state) => state.projects);
  const photos = useAppStore((state) => state.photos[projectId] || []);
  const updateProject = useAppStore((state) => state.updateProject);

  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>项目不存在</Text>
      </View>
    );
  }

  const handleStartCapture = () => {
    navigation.navigate('Camera', { projectId });
  };

  const handleGenerateVideo = () => {
    if (photos.length === 0) {
      Alert.alert('提示', '还没有照片，请先拍摄');
      return;
    }
    navigation.navigate('VideoGenerate', { projectId });
  };

  const handlePhotoPress = (photo: Photo) => {
    navigation.navigate('PhotoPreview', { photo });
  };

  const renderPhoto = ({ item }: { item: Photo }) => (
    <TouchableOpacity
      style={styles.photoItem}
      onPress={() => handlePhotoPress(item)}
    >
      <Image source={{ uri: item.uri }} style={styles.photoImage} />
      <View style={styles.photoOverlay}>
        <Text style={styles.photoNumber}>{item.sequenceNumber}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{project.name}</Text>
        {project.description && (
          <Text style={styles.description}>{project.description}</Text>
        )}
        
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{photos.length}</Text>
            <Text style={styles.statLabel}>照片</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{project.intervalSeconds}s</Text>
            <Text style={styles.statLabel}>间隔</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{project.targetDurationSeconds}s</Text>
            <Text style={styles.statLabel}>目标时长</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleStartCapture}
        >
          <Text style={[styles.actionButtonText, styles.primaryButtonText]}>
            📷 拍摄
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleGenerateVideo}
          disabled={photos.length === 0}
        >
          <Text
            style={[
              styles.actionButtonText,
              styles.secondaryButtonText,
              photos.length === 0 && styles.disabledText,
            ]}
          >
            🎬 生成视频
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.galleryHeader}>
        <Text style={styles.galleryTitle}>照片时间轴</Text>
        <Text style={styles.galleryCount}>{photos.length} 张照片</Text>
      </View>

      {photos.length === 0 ? (
        <View style={styles.emptyGallery}>
          <Text style={styles.emptyText}>暂无照片</Text>
          <Text style={styles.emptySubtext}>点击"拍摄"按钮开始拍摄</Text>
        </View>
      ) : (
        <FlatList
          data={photos.sort((a, b) => a.sequenceNumber - b.sequenceNumber)}
          renderItem={renderPhoto}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.gallery}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#1a1a1a',
  },
  disabledText: {
    color: '#ccc',
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  galleryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  galleryCount: {
    fontSize: 14,
    color: '#999',
  },
  gallery: {
    padding: 4,
  },
  photoItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 4,
  },
  photoNumber: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyGallery: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 100,
  },
});
