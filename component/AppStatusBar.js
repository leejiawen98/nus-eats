import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';

// const AppStatusBar = ({backgroundColor, ...props}) => (
//     <View style={[styles.statusBar, { backgroundColor }]}>
//       <StatusBar translucent backgroundColor={backgroundColor} {...props} />
//     </View>
// );

const AppStatusBar = props => (
    <View>
        <View style={styles.statusBar}>
            <StatusBar translucent barStyle = "light-content" />
        </View>
        <View style = {styles.belowStatusBar}>
            {props.children}
        </View>
    </View>
    );

const styles = StyleSheet.create({
    statusBar: {
        height: 45, 
        backgroundColor: "tomato"
    },
    belowStatusBar: {
        backgroundColor: 'tomato', 
    }
})

export default AppStatusBar