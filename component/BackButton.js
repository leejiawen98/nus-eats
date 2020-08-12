import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const BackButton = props => {
    return (
        <TouchableOpacity style={styles.back} onPress={props.onPress} title={props.title}>
            <Ionicons name = 'ios-arrow-back' style = {[styles.backIcon, props.style]}/>
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
        color: 'tomato',
        zIndex: 999,
      },
      backText: {
        marginLeft: 10,
        marginTop: 2,
        fontSize: 17,
        color: 'tomato'
      },
      backIcon: {
          fontSize: 30,
          color: 'tomato',
      }
})

export default BackButton