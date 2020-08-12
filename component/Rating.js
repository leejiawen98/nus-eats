import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Rating = props => (
    <View style = {[styles.rating, props.style]}>
        <Ionicons name='ios-star' style = {styles.icon} />
        <Text style = {styles.text}>
            {props.children}
        </Text>
    </View>
)

const styles = StyleSheet.create({
    rating: {
        flex: 1,
        flexDirection: 'row',
        alignSelf: 'flex-start',
        justifyContent: 'flex-end',
    },
    icon: {
        color:'#FFD700', 
        fontSize: 17, 
        marginRight: 5
    },
    text: {
        fontSize: 15, 
        color: 'black'
    }
})

export default Rating