
import React from 'react';
import { TouchableOpacity, Text, Image, StyleSheet, View } from 'react-native';

interface CustomGoogleSignInButtonProps {
  onPress: () => void;
}

const CustomGoogleSignInButton: React.FC<CustomGoogleSignInButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <View style={styles.contentContainer}>
        <Image
          source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
          style={styles.logo}
        />
        <Text style={styles.text}>Sign in with Google</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 4,
    padding: 10,
    width: 240,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logo: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  text: {
    color: 'black',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CustomGoogleSignInButton;