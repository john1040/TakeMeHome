import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, PanResponder, Dimensions, TouchableWithoutFeedback } from 'react-native';
import PostItem from '@/components/PostItem';

const { height } = Dimensions.get('window');

interface SlidingPostViewProps {
  post: any;
  userId: string;
  onClose: () => void;
}

const SlidingPostView: React.FC<SlidingPostViewProps> = ({ post, userId, onClose }) => {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: height })).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (post) {
      Animated.parallel([
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [post]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      pan.y.setValue(Math.max(0, gestureState.dy));
      overlayOpacity.setValue(Math.max(0, 1 - gestureState.dy / (height * 0.5)));
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 50) {
        closeSlider();
      } else {
        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }),
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start();
      }
    },
  });

  const slideAnimation = pan.y.interpolate({
    inputRange: [0, height],
    outputRange: [0, height],
    extrapolate: 'clamp',
  });

  const closeSlider = () => {
    Animated.parallel([
      Animated.timing(pan.y, {
        toValue: height,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(onClose);
  };

  if (!post) return null;

  return (
    <TouchableWithoutFeedback onPress={closeSlider}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Animated.View
          style={[styles.container, { transform: [{ translateY: slideAnimation }] }]}
          {...panResponder.panHandlers}
        >
          <TouchableWithoutFeedback>
            <View style={styles.content}>
              <View style={styles.handle} />
              <PostItem post={post} userId={userId} />
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  content: {
    padding: 20,
    flex: 1,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
  },
});

export default SlidingPostView;