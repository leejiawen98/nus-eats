import React from 'react';
import { AsyncStorage, View, Image, TextInput, StyleSheet, KeyboardAvoidingView, StatusBar, TouchableOpacity, Text, Alert } from 'react-native'
import BlueButton from '../component/BlueButton';
import firebase from '../firebaseDb';
import { addUser, checkUserEmailAndUsername } from '../api/userAPI';
import BackButton from '../component/BackButton'
import { checkUsernameExistance } from '../api/userAPI';
import { Feather } from '@expo/vector-icons';

export default class SignUp extends React.Component {


  state = {
    name: '',
    username: '',
    email: '',
    password: '',
    cfmpassword: '',
    profilePic: '',
    imagePath: '',
    signUpSuccess: false,
    nameError: '',
    emailError: '',
    passwordError: '',
    usernameError: '',
    passAndCfmPassError: '',
    secureTextEntry: true,
    confirm_secureTextEntry: true,

  }

  //Password Hidden Entry 

  updateSecureTextEntry = () => {
    if (this.state.secureTextEntry == true) {
      this.setState({
        secureTextEntry: false
      })
    } else {
      this.setState({
        secureTextEntry: true
      })
    }
  }

  updateConfirmSecureTextEntry = () => {
    if (this.state.confirm_secureTextEntry == true) {
      this.setState({
        confirm_secureTextEntry: false
      })
    } else {
      this.setState({
        confirm_secureTextEntry: true
      })
    }
  }

  //Handle Validation

  validateName = name => {
    var re = /^[a-zA-Z].*[\s\.]*$/

    return re.test(name);
  }

  validateEmail = email => {

    var re = /^(([^<>()\[\]\\.,;:\s@”]+(\.[^<>()\[\]\\.,;:\s@”]+)*)|(“.+”))@((\[[0–9]{1,3}\.[0–9]{1,3}\.[0–9]{1,3}\.[0–9]{1,3}])|(([a-zA-Z\-0–9]+\.)+[a-zA-Z]{2,}))$/;

    return re.test(email);

  }

  // validateEmailAvailability = email => {

  //   var kickbox = require('kickbox').client('live_0548447e109d15f0ea902d90d261c47713febaff0406ec6e9ed620186e7f7279').kickbox();

  //   kickbox.verify(email, function (err, response) {
  //     console.log(response.body);
  //   });

  // }

  validatePassword = password => {

    if (password.length < 8) {
      return false;
    } else {
      return true;
    }

  }

  //Handle Update Text Change

  handleUpdateName = name => {

    this.setState({ name })

    this.validateErrorName = false;

    if (!this.validateName(name)) {
      this.setState({ nameError: 'Name must be alphabetical' });
      this.validateErrorName = true;
    }

  }

  handleUpdateUsername = username => {

    this.setState({ username })

    this.validateErrorUsername = false;

    if (username.length == 0) {
      this.setState({ usernameError: 'Please input username' });
      this.validateErrorUsername = true;
    }


  }

  handleUpdateEmail = email => {

    this.setState({ email })
    this.validateErrorEmail = false;

    if (!this.validateEmail(email)) {
      this.setState({ emailError: 'Please input a correct email' });
      this.validateErrorEmail = true;
    }
  }

  handleUpdatePassword = password => {

    this.setState({ password })
    this.validateErrorPassword = false;

    if (!this.validatePassword(password)) {
      this.setState({ passwordError: 'Please input proper password' });
      this.validateErrorPassword = true;
    } 
    
    if (this.state.cfmPassword != '' && this.state.password != this.state.cfmPassword) {
      this.setState({ passAndCfmPassError: 'Confirm Password different from Password' });
      this.validateErrorCfmPassword = true;
    }

  }

  handleUpdateCfmPassword = cfmpassword => {

    this.setState({ cfmpassword })
    this.validateErrorCfmPassword = false;

    if (this.state.password != cfmpassword) {
      this.setState({
        passAndCfmPassError: 'Confirm Password different from Password'
      });
      this.validateErrorCfmPassword = true;
    }


  }

  //Handle Add User

  userRetrieved = async (user) => {

    if (user.length == 2) {
      alert('This email has already been registered with us. This username has been taken.')
    }

    if (user.length == 1) {
      if (this.state.email == user[0].email && this.state.username == user[0].username) {
        alert('This email and username has already been registered with us');
      } else if (this.state.email == user[0].email) {
        alert('This email has already been registered with us');
      } else {
        alert('This username has been taken');
      }
    }

    if (user.length == 0) {

      addUser(this.state.name, this.state.email, this.state.username.toLowerCase(), this.state.password)
      await AsyncStorage.setItem('username', this.state.username);
      this.setState({
        signUpSuccess: true,
        name: '',
        email: '',
        password: '',
        username: '',
        cfmpassword: ''
      })
      this.props.navigation.push("Home");
    }

  }



  render() {

    var validateErrorName;
    var validateErrorEmail;
    var validateErrorPassword;
    var validateErrorCfmPassword;
    var validateErrorUsername;

    const { name, email, username, password, cfmpassword, signUpSuccess, nameError, emailError, passwordError, usernameError, passAndCfmPassError, secureTextEntry, confirm_secureTextEntry } = this.state;
    return (
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <BackButton onPress={() => { this.props.navigation.goBack() }} >Back</BackButton>
        <StatusBar hidden={false} barStyle="dark-content" />
        <Image style={styles.image} source={require('../assets/logo.png')} />
        <TextInput style={styles.textInput} placeholder="Name" onChangeText={this.handleUpdateName} value={name} />
        {(this.validateErrorName == true) ? <Text style={{ color: 'red', textAlign: 'center', alignSelf: 'stretch', width: '75%', paddingBottom: 8, fontSize: 12 }}> {nameError}</Text> : null}
        <TextInput style={styles.textInput} placeholder="Email" onChangeText={this.handleUpdateEmail} value={email} />
        {(this.validateErrorEmail == true) ? <Text style={{ color: 'red', textAlign: 'center', alignSelf: 'stretch', width: '75%', paddingBottom: 8, fontSize: 12 }}> {emailError}</Text> : null}
        <TextInput style={styles.textInput} placeholder="Username" onChangeText={this.handleUpdateUsername} value={username} />
        {(this.validateErrorUsername == true) ? <Text style={{ color: 'red', textAlign: 'center', alignSelf: 'stretch', width: '69%', paddingBottom: 8, fontSize: 12 }}>{usernameError} </Text> : null}
        <View style={{ flexDirection: 'row' }}>
          <TextInput secureTextEntry={secureTextEntry} style={styles.textInputPassword} placeholder="Password" onChangeText={this.handleUpdatePassword} value={password} />
          <TouchableOpacity onPress={this.updateSecureTextEntry}>
            {secureTextEntry ?
              <Feather name='eye-off' color='black' size={20} style={{ padding: 13 }}></Feather>
              : <Feather name='eye' color='black' size={20} style={{ padding: 13 }}></Feather>}
          </TouchableOpacity>
        </View>
        {(this.validateErrorPassword == true) ? <Text style={{ color: 'red', textAlign: 'center', alignSelf: 'stretch', width: '77%', paddingBottom: 8, fontSize: 12 }}> {passwordError}</Text> : null}

        <View style={{ flexDirection: 'row' }}>
          <TextInput style={styles.textInputPassword} secureTextEntry={confirm_secureTextEntry} placeholder="Confirm Password" onChangeText={this.handleUpdateCfmPassword} value={cfmpassword} />

          <TouchableOpacity onPress={this.updateConfirmSecureTextEntry}>
            {confirm_secureTextEntry ?
              <Feather name='eye-off' color='black' size={20} style={{ padding: 13 }}></Feather>
              : <Feather name='eye' color='black' size={20} style={{ padding: 13 }}></Feather>}
          </TouchableOpacity>
        </View>
        {(this.validateErrorCfmPassword == true && this.validateErrorPassword == false) ? <Text style={{ color: 'red', textAlign: 'center', alignSelf: 'stretch', width: '98%', paddingBottom: 8, fontSize: 12 }}> {passAndCfmPassError}</Text> : null}
        <BlueButton style={styles.button} onPress={() => {

          if(this.validateErrorName == true || this.validateErrorEmail == true || this.validateErrorPassword == true || this.validateErrorCfmPassword  == true || this.validateErrorUsername == true) {
            Alert.alert("Please ammend the incorrect inputs.")
          } else if (name.length && email.length && username.length && password.length && password == cfmpassword) {

            validateErrorName = false;
            validateErrorEmail = false;
            validateErrorPassword = false;
            validateErrorCfmPassword = false;
            validateErrorUsername = false;
  
            this.setState({
              nameError: '',
              emailError: '',
              passwordError: '',
              usernameError: '',
              passAndCfmPassError: '',
            })
            checkUserEmailAndUsername(email, username, this.userRetrieved);
          } else {
            alert("Please fill in the required information");
          }
        }}>
          Sign Up
              </BlueButton>

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
    width: 180,
    height: 180,
    resizeMode: 'contain',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#C0C0C0',
    fontSize: 18,
    marginBottom: 8,
    width: 250,
    padding: 12
  },
  textInputPassword: {
    borderWidth: 1,
    borderColor: '#C0C0C0',
    fontSize: 18,
    marginBottom: 8,
    width: 250,
    padding: 12,
    marginLeft: 45
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
  text2: {
    fontSize: 20,
    paddingBottom: 30
  },
});