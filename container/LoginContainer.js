import React from 'react'
import { TouchableOpacity, View, Image, TextInput, Text, StyleSheet, KeyboardAvoidingView, Alert } from 'react-native'
import BlueButton from '../component/BlueButton';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Button } from 'react-native-elements';
import { getUserByUsernameAndPassword } from '../api/userAPI';
import AsyncStorage from '@react-native-community/async-storage';
import CloseButton from '../component/CloseButton'
import firebase from '../firebaseDb';


export default class LoginContainer extends React.Component {

  state = {
    username: '',
    password: '',
    loginSuccess: false
  }

  constructor(props) {
    super(props);
    this.getData();
  }

  getData = async () => {
    try {
      const value = await AsyncStorage.getItem('username');
      if (value != null) {
        this.props.navigation.push('Home');
      }
    } catch (err) {
      console.log(err);
    }
  }

  // Handle Update

  handleUpdateUsername = username => this.setState({ username })

  handleUpdatePassword = password => this.setState({ password })

  //Handle Retrieve

  userRetrieved = async (user) => {

    if (user == undefined) {
      alert('User not found');

      this.setState({
        username: '',
        password: ''
      })

    }

    if (user.username == this.state.username && user.password == this.state.password) {
      try {

        await AsyncStorage.setItem('username', this.state.username);
        this.props.navigation.push('Home');
        this.setState({
          username: '',
          password: ''
        })

      } catch (err) {

        console.log(err);

      }

    }

  }

  render() {
    const { username, password, loginSuccess } = this.state;
    return (
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <CloseButton onPress={() => this.props.navigation.push("Home")}>Close</CloseButton>
        <Image style={styles.image} source={require('../assets/logo.png')} />
        <TextInput style={styles.textInput} placeholder="Username" onChangeText={this.handleUpdateUsername} value={username} />
        <TextInput secureTextEntry={true} style={styles.textInput} placeholder="Password" onChangeText={this.handleUpdatePassword} value={password} />

        <BlueButton style={styles.button} onPress={() => {
          if (username.length && password.length) {
            getUserByUsernameAndPassword(username, password, this.userRetrieved)
          } else {
            Alert.alert("Please enter username and password at an appropriate format.")
          }
        }}>
          Login
              </BlueButton>


        <View style={styles.textBottom}>
          <Text>Don't have an account? <Text style={styles.textSignUp} onPress={
            () => { this.props.navigation.navigate('SignUp') }}
          >Sign Up</Text></Text>
        {/* <Text style={styles.textForgotPassword} onPress={() => {this.props.navigation.navigate("ForgotPassword")}}>Forgot password?</Text> */}
        </View>

      </ KeyboardAvoidingView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#FFFFFF",
  },
  image: {
    marginBottom: 30,
    width: 230,
    height: 230,
    resizeMode: 'contain'
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#C0C0C0',
    fontSize: 18,
    marginBottom: 8,
    width: 250,
    padding: 12
  },
  button: {
    marginTop: 10,
    width: 250,
    backgroundColor: 'tomato',
    borderRadius: 4
  },
  text: {
    fontSize: 20,
    color: 'green',
    marginTop: 40
  },
  textBottom: {
    flex: 0.5,
    justifyContent: 'flex-end',
    marginBottom: -20,
  },
  textSignUp: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    color: 'tomato'
  },
  textForgotPassword: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    color: 'tomato',
    padding: 10,
    textAlign:'center'
  },
});