import React from 'react';
import { View, StyleSheet, Image, } from 'react-native';
import BackButton from '../component/BackButton'


export default class ImageViewer extends React.Component {
    render() {
        const { image } = this.props.route.params

        return (
            <View style = {styles.container}>
                <View style ={{flex: 1}}>
                    <BackButton style = {{color: 'white'}} onPress = {() => { this.props.navigation.goBack() }}/>
                </View>
                <View style ={{flex: 2}}>
                    <Image source = {{uri: image}} style = {styles.image}/>
                </View>
                <View style ={{flex: 1}}/>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'black',
        flex: 1,
        justifyContent: 'space-around',
    },
    image: {
        flex: 1,
        width: 375,
        
    }
});