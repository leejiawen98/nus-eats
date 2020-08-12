import React from 'react'
import { KeyboardAvoidingView, Alert, ActionSheetIOS, View, Text, StyleSheet, SafeAreaView, Image, ActivityIndicator } from 'react-native'
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Button } from 'react-native-elements';
import t from 'tcomb-form-native';
import BlueButton from '../component/BlueButton';
import { getUserByUsername, updateUser } from '../api/userAPI';
import AsyncStorage from '@react-native-community/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import Constants from 'expo-constants';
import firebase from '../firebaseDb';


export default class Profile extends React.Component {

    state = {
        loggedIn: false,
        user: {
            email: '',
            name: '',
            password: '',
            profilePic: 'a',
            userId: '',
            username: '',
            refId: '',
            imagePath: ''
        },
        value: {
            userId: '',
            name: '',
            profilePic: 'a',
            email: '',
            password: '',
            username: '',
            refId: '',
            imagePath: ''
        },
        showUpdate: false,
        CameraPermission: null,
        type: Camera.Constants.Type.back,
        loading: false,
        profileDefaultUrl: '',
    }


    // Get user Data

    constructor(props) {
        super(props);
        this.getData();
    }



    getData = async () => {
        this.setState({ loading: true });
        try {
            const valueUser = await AsyncStorage.getItem('username');
            if (valueUser != null) {
                this.setState({ loggedIn: true });
                getUserByUsername(valueUser, this.userRetrieved);
            } else {
                this.props.navigation.push("NeedToLogin")
            }
            this.setState({ loading: false });

        } catch (err) {
            console.log(err);
            this.setState({ loading: false });
        }
    }

    renderLoading() {
        if (this.state.loading) {
            return (
                <ActivityIndicator size="large" color="tomato" style={{
                    position: 'absolute', left: 0, right: 0, bottom: 0, top: 0
                }} />
            )
        } else {
            return null
        }
    }

    //Handle update of fields

    handleUpdateEmail = email => this.setState({ editEmail: email });
    handleUpdatePassword = password => this.setState({ editPassword: password });
    handleUpdateUsername = username => this.setState({ editUsername: username });

    // Handle Show and hide update component 

    ShowHideComponent = () => {
        if (this.state.showUpdate == true) {
            this.setState({ showUpdate: false });
        } else {
            this.setState({ showUpdate: true });
        }
    }

    //Handle user retrieved

    userRetrieved = async (user) => {

        console.log(2);

        let ref = firebase.storage().ref(user.imagePath);
        await ref.getDownloadURL().then((url) => {
            this.setState({
                user: {
                    email: user.email,
                    name: user.name,
                    password: user.password,
                    profilePic: url,
                    userId: user.userId,
                    username: user.username,
                    refId: user.refId,
                    imagePath: user.imagePath
                },
                value: {
                    email: user.email,
                    name: user.name,
                    password: user.password,
                    profilePic: url,
                    userId: user.userId,
                    username: user.username,
                    refId: user.refId,
                    imagePath: user.imagePath
                }
            });
        })

    }

    //To check if there's a change in updated value

    onChange = (value) => {
        this.refs.form.getValue();
        this.setState({ value });
    }

    // What to do after Update is completed

    uploadImage = async (uri) => {
        const response = await fetch(uri);
        const blob = await response.blob();
        var ref = firebase.storage().ref().child("images/" + this.state.user.userId + "/profilePic");
        return ref.put(blob);
    }

    updateCompleted = async (user) => {
        this.uploadImage(this.state.value.profilePic);
        await AsyncStorage.setItem('username', this.state.value.username);
        this.setState({
            user: {
                email: this.state.value.email,
                name: this.state.value.name,
                password: this.state.value.password,
                profilePic: this.state.value.profilePic,
                userId: this.state.value.userId,
                username: this.state.value.username,
                refId: this.state.value.refId,
                imagePath: this.state.value.imagePath
            }
        })

        if (this.state.showUpdate == true) {
            this.setState({ showUpdate: false });
            alert('Update completed');
        }
    }

    render() {

        const { user, value, isLoading } = this.state;

        const Form = t.form.Form;

        //Validate form fields 

        const Email = t.subtype(t.String, email => {
            const reg = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/; //or any other regexp
            return reg.test(email);
        });

        const Password = t.subtype(t.String, password => {
            const reg = (password.length >= 8) ? true : false
            return reg;
        })

        const userLoggedIn = t.struct({
            email: Email,
            username: t.String,
            password: Password,
        });

        var _ = require('lodash');

        const stylesheet = _.cloneDeep(t.form.Form.stylesheet);

        stylesheet.textbox.normal.backgroundColor = '#fff';
        stylesheet.controlLabel.normal.color = 'black';

        var options = {
            stylesheet: stylesheet,
            fields: {
                username: {
                    editable: false
                },
                email: {
                    editable: false
                },
                password: {
                    editable: false,
                    password: true,
                    secureTextEntry: true
                }
            }
        }

        var options2 = {
            stylesheet: stylesheet,
            fields: {
                username: {
                    editable: true,
                    error: 'Insert a valid username'
                },
                email: {
                    editable: true,
                    error: 'Insert a valid email'
                },
                password: {
                    editable: true,
                    password: true,
                    secureTextEntry: true,
                    error: 'Please insert a password',
                }
            }
        }

        //Image Picker        

        useCamera = async () => {
            if (Constants.platform.ios) {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    alert('Sorry, we need camera permissions to make this work!');
                }
            }

            let response = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
                base64: true
            });

            if (response.uri != null) {
                this.setState({
                    value: {
                        email: value.email,
                        name: user.name,
                        password: value.password,
                        profilePic: response.uri,
                        userId: user.userId,
                        username: value.username,
                        refId: user.refId,
                        imagePath: "images/" + user.userId + "/profilePic"
                    }
                });
            }
        }


        const openImage = async () => {

            let permissionResult = await ImagePicker.requestCameraRollPermissionsAsync();

            if (permissionResult.granted == false) {
                alert("Permission to access camera roll is required");
                return;
            }

            let pickerResult = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
                base64: true
            });
            console.log(pickerResult);

            if (!pickerResult.cancelled) {
                this.setState({
                    value: {
                        email: value.email,
                        name: user.name,
                        password: value.password,
                        profilePic: pickerResult.uri,
                        userId: user.userId,
                        username: value.username,
                        refId: user.refId,
                        imagePath: "images/" + user.userId + "/profilePic"
                    }
                });

                console.log(this.state.value);
            }

        }


        onPressImage = async () => {

            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ["Cancel", "Take Photo", "Camera Roll"],
                    destructiveButtonIndex: 2,
                    cancelButtonIndex: 0
                },
                buttonIndex => {
                    if (buttonIndex === 0) {
                        // cancel action
                    } else if (buttonIndex === 1) {

                        useCamera();

                    } else if (buttonIndex === 2) {

                        openImage();

                    }
                }
            );
        }



        return (
            <KeyboardAvoidingView behavior="padding" style={styles.container}>
                <View style={styles.container2}>
                    <View style={styles.titleBar}>
                        <Ionicons name="" size={0} color="#52575D"></Ionicons>
                        <Button type="clear" icon={
                            <Ionicons name="ios-log-out" size={29} color="#fff"></Ionicons>
                        } onPress={() => {

                            Alert.alert(
                                "Logout",
                                "Are you sure that you would like to logout?",
                                [
                                    {
                                        text: "Yes",
                                        onPress: () => {
                                            AsyncStorage.clear();
                                            firebase.auth().signOut();
                                            this.setState({
                                                user: {
                                                    email: '',
                                                    name: '',
                                                    password: '',
                                                    profilePic: '',
                                                    userId: '',
                                                    username: '',
                                                    refId: '',
                                                    imagePath: ''
                                                },
                                                value: {
                                                    userId: '',
                                                    name: '',
                                                    profilePic: '',
                                                    email: '',
                                                    password: '',
                                                    username: '',
                                                    refId: '',
                                                    imagePath: ''
                                                },
                                                loggedIn: false
                                            })
                                            this.props.navigation.push("Home");
                                        }
                                    },
                                    {
                                        text: "No",
                                        onPress: () => console.log("Cancel Pressed"),
                                        style: "cancel"
                                    }
                                ],
                                { cancelable: false }
                            );

                        }} />
                    </View>

                    <View style={{ alignSelf: "center" }}>
                        <View style={styles.profileImage}>
                            <Image source={{
                                uri: value.profilePic,
                            }} style={styles.image} resizeMode="contain" ></Image>
                        </View>
                        {(this.state.showUpdate) ? (

                            <View style={styles.add}>
                                <Button type="clear" icon={
                                    <MaterialIcons name="camera-alt" size={18} color="white" ></MaterialIcons>
                                }
                                    onPress={onPressImage} />
                            </View>

                        ) : (null)}
                    </View>
                </View>


                {(this.state.showUpdate) ? (

                    <KeyboardAvoidingView behavior="padding" style={styles.container3}>
                        <Form ref="form" type={userLoggedIn} value={value} options={options2} onChange={this.onChange} />
                        <View style={styles.ButtonRow}>
                            <BlueButton style={styles.twoButtons} onPress={() => {
                                if(value.password.length < 8) {
                                    alert("Please enter password of more than 8 ");
                                } else {

                                if (user.email != value.email || user.password != value.password || user.username != value.username || user.profilePic != value.profilePic) {
                                    updateUser(value, this.updateCompleted);

                                } else {
                                    alert("Update complete");
                                }
                                this.ShowHideComponent();
                            }

                            }}>
                                Update
</BlueButton>
                            <BlueButton style={styles.twoButtons} onPress={() => {
                                this.setState({
                                    value: {
                                        userId: user.userId,
                                        name: user.name,
                                        profilePic: user.profilePic,
                                        email: user.email,
                                        password: user.password,
                                        username: user.username,
                                        refId: user.refId,
                                        imagePath: user.imagePath
                                    }
                                })
                                this.ShowHideComponent();
                            }}>
                                Cancel
                        </BlueButton>
                        </View>
                    </KeyboardAvoidingView>

                ) : (
                        /* <Text style={styles.text2}>Account Information</Text> */
                        <View style={styles.container3}>
                            <Form type={userLoggedIn} value={user} options={options} />
                            <BlueButton style={styles.button} onPress={this.ShowHideComponent}>
                                Edit
                        </BlueButton>
                        </View>
                    )

                }
                {this.renderLoading()}
            </KeyboardAvoidingView>
        );
    }
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
    },
    container2: {
        resizeMode: "cover",
        justifyContent: "center",
        fontFamily: 'Avenir',
        height: '25%',
        backgroundColor: 'tomato'
    },
    titleBar: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        marginHorizontal: 8,
        marginTop: 40
    },
    container2WithUpdate: {
        flex: 1,
        backgroundColor: "tomato"
    },
    container3: {
        backgroundColor: "#fff",
        justifyContent: 'center',
        marginTop: 40,
        padding: 30,
    },
    button: {
        marginTop: 10,
        width: '100%',
        backgroundColor: 'tomato',
        borderRadius: 4
    },
    twoButtons: {
        marginTop: 10,
        width: '45%',
        backgroundColor: 'tomato',
        borderRadius: 4
    },
    ButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    text: {
        fontFamily: "HelveticaNeue",
        color: "white",
        marginBottom: 10
    },
    text2: {
        fontFamily: "HelveticaNeue",
        color: "black",
        marginTop: 50,
        textAlign: 'center',
        fontSize: 20,
        textDecorationLine: 'underline'
    },
    image: {
        width: 110,
        height: 110,
        marginLeft: -5,
        marginTop: -4
    },
    profileImage: {
        marginTop: 10,
        width: 110,
        height: 110,
        borderRadius: 110 / 2,
        overflow: "hidden",
        marginBottom: -43,
        borderWidth: 5,
        borderColor: 'white'
    },
    dm: {
        backgroundColor: "#41444B",
        position: "absolute",
        top: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center"
    },
    add: {
        backgroundColor: "tomato",
        position: "absolute",
        bottom: -35,
        right: 0,
        width: 35,
        height: 35,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center"
    },
    infoContainer: {
        alignSelf: "center",
        alignItems: "center",
        marginTop: 16
    },
    form: {
        width: 70
    }
})