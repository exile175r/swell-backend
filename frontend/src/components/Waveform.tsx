import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";

/**
 * @description 음성 녹음 시 파동 애니메이션
 */
type WaveformProps = {
  isRecording: boolean;
};

const Waveform = ({ isRecording }: WaveformProps) => {
  const animValues = useRef([...Array(15)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (isRecording) {
      const animations = animValues.map((anim) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 400 + Math.random() * 300,
              useNativeDriver: false, // Height animation requires false for native driver unless using transform
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 400 + Math.random() * 300,
              useNativeDriver: false,
            }),
          ]),
        );
      });
      animations.forEach((a) => a.start());
      return () => animations.forEach((a) => a.stop());
    } else {
      animValues.forEach((anim) => anim.setValue(0));
    }
  }, [isRecording, animValues]);

  return (
    <View className="flex-row items-center justify-center h-40 w-full">
      {animValues.map((anim, i) => (
        <Animated.View
          key={i}
          className="w-1.5 mx-1.5 rounded-full bg-[#00E0D0]"
          style={{
            height: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [24, 120],
            }),
            opacity: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1],
            }),
          }}
        />
      ))}
    </View>
  );
};

export default Waveform;
