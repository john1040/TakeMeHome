import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import PostItem from '@/components/PostItem';

const { height } = Dimensions.get('window');

interface SlidingPostViewProps {
  post: any;
  userId: string;
  onClose: () => void;
}

const SlidingPostView: React.FC<SlidingPostViewProps> = ({ post, userId, onClose }) => {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: height })).current;

  useEffect(() => {
    if (post) {
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
      }).start();
    }
  }, [post]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event([null, { dy: pan.y }], { useNativeDriver: false }),
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 50) {
        Animated.spring(pan, {
          toValue: { x: 0, y: height },
          useNativeDriver: false,
        }).start(onClose);
      } else {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      }
    },
  });

  const slideAnimation = pan.y.interpolate({
    inputRange: [0, height],
    outputRange: [0, height],
    extrapolate: 'clamp',
  });

  if (!post) return null;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: slideAnimation }] }]}
      {...panResponder.panHandlers}
    >
      <View style={styles.handle} />
      <PostItem post={post} userId={userId} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
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