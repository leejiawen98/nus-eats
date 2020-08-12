import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const WhiteCloseButton = props => {
    return (
        <TouchableOpacity style={[styles.back, props.style]} onPress={props.onPress}>
            <Text style = {styles.backText}>{props.children}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    back: {
        flexDirection: 'row',
        position: 'absolute',
        top: 50,
        left: 20,
        color: 'tomato'
      },
      backText: {
        marginLeft: 290,
        marginTop: 2,
        fontSize: 17,
        color: 'white',
        fontWeight:'bold'
      },
      backIcon: {
          fontSize: 25,
          color: 'tomato'
      }
})

export default WhiteCloseButton