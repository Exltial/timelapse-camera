import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';

interface CaptureButtonProps {
  onPress: () => void;
  disabled?: boolean;
  isCapturing?: boolean;
}

export const CaptureButton: React.FC<CaptureButtonProps> = ({
  onPress,
  disabled = false,
  isCapturing = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.captureButton,
        isCapturing && styles.captureButtonDisabled,
      ]}
      onPress={disabled ? undefined : onPress}
      disabled={disabled || isCapturing}
    >
      <View style={styles.captureButtonInner} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
});
