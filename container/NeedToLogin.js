import React from 'react';
import { Text, ImageBackground, View, StyleSheet } from 'react-native';
import { ThemeProvider, Button } from 'react-native-elements';
import WhiteCloseButton from '../component/WhiteCloseButton'

const theme = {
    colors: {
        primary: 'tomato'
    },
};

export default class NeedToLogin extends React.Component {


    render() {

        return (
            <View style={styles.container}>
                <ImageBackground source={require("../assets/needtologin7.jpg")} style={styles.imageBG}>
                    <WhiteCloseButton onPress={() => this.props.navigation.push('Home')}> Close </WhiteCloseButton>
                    <Text style={{fontSize: 33, fontWeight: 'bold', color: 'white', marginTop: 470, textAlign: 'center', shadowColor: 'black', shadowOpacity: 0.9 }}>Login to discover more features available</Text>
                </ImageBackground>
                <View style={{marginTop: -35}}>
                    <ThemeProvider theme={theme}>
                        <Button
                            title="Login"
                            style={{ width: '70%', alignSelf: 'center' }}
                            onPress={() => this.props.navigation.push("Login")}
                        />
                    </ThemeProvider>
                    <View style={styles.textBottom}>
                        <Text>Don't have an account? <Text style={styles.textSignUp} onPress={
                            () => { this.props.navigation.navigate('SignUp') }}
                        >Sign Up</Text></Text>
                    </View>
                </View>
            </View>
        );
    }


}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    imageBG: {
        resizeMode: "cover",
        justifyContent: "center",
        opacity: 0.95,
        fontFamily: 'Avenir',
        height: '90%',
    },
    button: {
        color: 'white'
    },
    textBottom: {
        justifyContent: 'flex-end',
        alignSelf: "center",
        padding: 15,
        marginBottom: 100
    },
    textSignUp: {
        fontWeight: 'bold',
        textDecorationLine: 'underline',
        color: 'tomato'
    },

});