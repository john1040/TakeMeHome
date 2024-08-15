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

type Square = {
  id: number;
  number: number;
  x: number;
  y: number;
};

type SquareProps = {
  square: Square;
  isActive: boolean;
  onDrag: (id: number, x: number, y: number) => void;
  onDragEnd: (id: number, x: number, y: number) => void;
};

const SquareComponent: React.FC<SquareProps> = ({ square, isActive, onDrag, onDragEnd }) => {
  const offset = useSharedValue({ x: 0, y: 0 });
  const animatedStyles = useAnimatedStyle(() => ({
    transform: [
      { translateX: isActive ? offset.value.x : withSpring(square.x) },
      { translateY: isActive ? offset.value.y : withSpring(square.y) },
    ],
    zIndex: isActive ? 1 : 0,
  }));

  const gesture = Gesture.Pan()
    .onStart(() => {
      offset.value = { x: square.x, y: square.y };
    })
    .onUpdate((event) => {
      offset.value = {
        x: square.x + event.translationX,
        y: square.y + event.translationY,
      };
      runOnJS(onDrag)(square.id, offset.value.x, offset.value.y);
    })
    .onEnd(() => {
      runOnJS(onDragEnd)(square.id, offset.value.x, offset.value.y);
    });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.square, animatedStyles]}>
        <Text style={styles.number}>{square.number}</Text>
      </Animated.View>
    </GestureDetector>
  );
};

const ReorderableGrid: React.FC = () => {
  const [squares, setSquares] = useState<Square[]>(
    Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => ({
      id: i,
      number: i + 1,
      x: (i % GRID_SIZE) * (SQUARE_SIZE + GRID_PADDING),
      y: Math.floor(i / GRID_SIZE) * (SQUARE_SIZE + GRID_PADDING),
    }))
  );
  const [activeSquareId, setActiveSquareId] = useState<number | null>(null);

  const getPositionForIndex = (index: number) => ({
    x: (index % GRID_SIZE) * (SQUARE_SIZE + GRID_PADDING),
    y: Math.floor(index / GRID_SIZE) * (SQUARE_SIZE + GRID_PADDING),
  });

  const handleDrag = (id: number, x: number, y: number) => {
    setActiveSquareId(id);
    setSquares(currentSquares => {
      const draggedSquareIndex = currentSquares.findIndex(s => s.id === id);
      const newSquares = [...currentSquares];
      
      let swapIndex = draggedSquareIndex;
      currentSquares.forEach((square, index) => {
        if (index !== draggedSquareIndex) {
          if (
            Math.abs(x - square.x) < SQUARE_SIZE / 2 &&
            Math.abs(y - square.y) < SQUARE_SIZE / 2
          ) {
            swapIndex = index;
          }
        }
      });

      if (swapIndex !== draggedSquareIndex) {
        const draggedSquare = newSquares[draggedSquareIndex];
        newSquares.splice(draggedSquareIndex, 1);
        newSquares.splice(swapIndex, 0, draggedSquare);

        return newSquares.map((square, index) => ({
          ...square,
          ...(square.id !== id ? getPositionForIndex(index) : {}),
        }));
      }

      return currentSquares;
    });
  };

  const handleDragEnd = (id: number, x: number, y: number) => {
    setActiveSquareId(null);
    setSquares(currentSquares => 
      currentSquares.map((square, index) => ({
        ...square,
        ...getPositionForIndex(index),
      }))
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.grid}>
        {squares.map((square) => (
          <SquareComponent
            key={square.id}
            square={square}
            isActive={square.id === activeSquareId}
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