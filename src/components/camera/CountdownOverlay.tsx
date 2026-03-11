import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CountdownOverlayProps {
  countdown: number | null;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ countdown }) => {
  if (countdown === null) {
    return null;
  }

  return (
    <View style={styles.countdownContainer}>
      <Text style={styles.countdown}>{countdown}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  countdownContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdown: {
    fontSize: 120,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
});
