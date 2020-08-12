import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import MapView from 'react-native-maps';

const CampusMap = props => (
    <MapView 
        style = {styles.map}
        initialRegion={props.initialRegion}
    >
        {/* <Marker 
            coordinate={{
                latitude: 1.296551, 
                longitude: 103.776378
            }}
            image = {require('../assets/current-location.png')}
        /> */}
        {props.children}
    </MapView>    
)

const styles = StyleSheet.create({
    map: {
        flex: 10,
        width: Dimensions.get('window').width - 15,
        height:300,
        marginHorizontal: 10,
        marginVertical: 15,
        justifyContent: 'flex-end',
        alignItems: 'center',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: 'silver'
    },
})

export default CampusMap