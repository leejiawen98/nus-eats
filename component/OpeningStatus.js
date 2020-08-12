import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const OpeningStatus = props => {
    return (
        <Text style = {[styles.text, props.style]}>
                    <Ionicons name = 'ios-radio-button-on' style = {styles.icon}/> 
                    {" "}{props.children}
        </Text>

    );
}

const styles = StyleSheet.create({
    text: {
        fontSize: 13, 
        flex: 1, 
        marginTop: 8, 
    },
    icon: {
        fontSize: 13
    }
})

export default OpeningStatus