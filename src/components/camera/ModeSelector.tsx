import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface ModeSelectorProps {
  onSinglePhoto: () => void;
  onTimelapse: () => void;
  disabled?: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  onSinglePhoto,
  onTimelapse,
  disabled = false,
}) => {
  return (
    <View style={styles.modeSelector}>
      <TouchableOpacity
        style={styles.modeButton}
        onPress={onSinglePhoto}
        disabled={disabled}
      >
        <Text style={styles.modeText}>单张</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.modeButton, styles.modeButtonActive]}
        onPress={onTimelapse}
        disabled={disabled}
      >
        <Text style={[styles.modeText, styles.modeTextActive]}>
          延时拍摄
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  modeSelector: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  modeButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modeButtonActive: {
    backgroundColor: '#007AFF',
  },
  modeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modeTextActive: {
    color: '#fff',
  },
});
