import React, { useState, useRef } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { StyleSheet, View, Dimensions, Text } from 'react-native';

const { width } = Dimensions.get('window');
const SQUARE_SIZE = 100;
const GRID_PADDING = 10;
const GRID_SIZE = 3;

type SquareProps = {
  index: number;
  number: number;
  position: { x: number; y: number };
  onDrag: (index: number, x: number, y: number) => void;
  onDragEnd: (index: number, x: number, y: number) => void;
};

const Square: React.FC<SquareProps> = ({ index, number, position, onDrag, onDragEnd }) => {
  const offset = useSharedValue({ x: 0, y: 0 });
  const animatedStyles = useAnimatedStyle(() => ({
    transform: [
      { translateX: offset.value.x + position.x },
      { translateY: offset.value.y + position.y },
    ],
    zIndex: offset.value.x !== 0 || offset.value.y !== 0 ? 1 : 0,
  }));

  const gesture = Gesture.Pan()
    .onStart(() => {
      offset.value = { x: 0, y: 0 };
    })
    .onUpdate((event) => {
      offset.value = {
        x: event.translationX,
        y: event.translationY,
      };
      runOnJS(onDrag)(index, position.x + offset.value.x, position.y + offset.value.y);
    })
    .onEnd(() => {
      runOnJS(onDragEnd)(index, position.x + offset.value.x, position.y + offset.value.y);
      offset.value = { x: 0, y: 0 };
    });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.square, animatedStyles]}>
        <Text style={styles.number}>{number}</Text>
      </Animated.View>
    </GestureDetector>
  );
};

const ReorderableGrid: React.FC = () => {
  const [squares, setSquares] = useState(
    Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => ({
      id: i,
      number: i + 1,
      x: (i % GRID_SIZE) * (SQUARE_SIZE + GRID_PADDING),
      y: Math.floor(i / GRID_SIZE) * (SQUARE_SIZE + GRID_PADDING),
    }))
  );

  const handleDrag = (index: number, x: number, y: number) => {
    // We don't need to update the state here, just for visual feedback if needed
  };

  const handleDragEnd = (index: number, x: number, y: number) => {
    const draggedSquare = squares[index];
    let newIndex = index;

    // Check for overlap and find the new index
    for (let i = 0; i < squares.length; i++) {
      if (i !== index) {
        const otherSquare = squares[i];
        if (
          Math.abs(x - otherSquare.x) < SQUARE_SIZE / 2 &&
          Math.abs(y - otherSquare.y) < SQUARE_SIZE / 2
        ) {
          newIndex = i;
          break;
        }
      }
    }

    // Reorder the squares array
    if (newIndex !== index) {
      const newSquares = [...squares];
      newSquares.splice(index, 1);
      newSquares.splice(newIndex, 0, draggedSquare);
      
      // Update positions after reordering
      const updatedSquares = newSquares.map((square, i) => ({
        ...square,
        x: (i % GRID_SIZE) * (SQUARE_SIZE + GRID_PADDING),
        y: Math.floor(i / GRID_SIZE) * (SQUARE_SIZE + GRID_PADDING),
      }));
      
      setSquares(updatedSquares);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.grid}>
        {squares.map((square, index) => (
          <Square
            key={square.id}
            index={index}
            number={square.number}
            position={{ x: square.x, y: square.y }}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
          />
        ))}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    width: GRID_SIZE * (SQUARE_SIZE + GRID_PADDING) - GRID_PADDING,
    height: GRID_SIZE * (SQUARE_SIZE + GRID_PADDING) - GRID_PADDING,
  },
  square: {
    position: 'absolute',
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    backgroundColor: '#b58df1',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  number: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default ReorderableGrid;