import React from 'react';
import { KeyboardAvoidingView, View, Image, Text, StyleSheet, ActivityIndicator, 
    FlatList, TouchableOpacity, TextInput, TouchableWithoutFeedback, Keyboard, Alert, ActionSheetIOS, } from 'react-native';
import firebaseDb from '../firebaseDb'
import Ionicons from 'react-native-vector-icons/Ionicons';

import AsyncStorage from '@react-native-community/async-storage';
import { getUserByUsername } from '../api/userAPI';

import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';

import AppStatusBar from '../component/AppStatusBar'
import BackButton from '../component/BackButton'

export default class AddReviewScreen extends React.Component {
    state = {
        loggedIn: false,
        user: {
            email: '',
            name: '',
            password: '',
            profilePic: 'a',
            userId: '',
            username: '',
            refId: ''
        },
        isLoading: true,
        foodItem: null,
        currentStyle: [styles.uncolorStar, styles.uncolorStar, styles.uncolorStar, styles.uncolorStar, styles.uncolorStar],
        rating: 0,
        comment: '',
        success: false,
        image: '',
        imageExist: false,

        overallStallRating: 0,
        stallRefId: '',
        foodCount: 0,
        previousFoodRating: '',

        updateReview: null
    }

    constructor(props) {
        super(props);
        this.getData();
    }

    getData = async () => {
        try {
            const valueUser = await AsyncStorage.getItem('username');
            if (valueUser != null) {
                this.setState({ loggedIn: true });
                getUserByUsername(valueUser, this.userRetrieved);
            } 
        } catch (err) {
            console.log(err);
        }
    }
    
    userRetrieved = (user) => {

        this.setState({
            user: {
                email: user.email,
                name: user.name,
                password: user.password,
                profilePic: user.profilePic,
                userId: user.userId,
                username: user.username,
                refId: user.refId
            },
        });
        const { existing } = this.props.route.params
        if (existing) {
            this.findExistingReview()
        }
    }

    findExistingReview = () => {
        const { foodId } = this.props.route.params
        let existingReview = []
        firebaseDb
        .firestore()
        .collection('foodReview')
        .get()
        .then(querySnapshot => {
            querySnapshot.forEach(doc => {
                if(doc.data().userId == this.state.user.userId && doc.data().foodId == foodId) {
                    existingReview.push({
                        ...doc.data(),
                        refId: doc.id
                    })
                    this.setState({updateReview: existingReview[0]})
                }
            })
            this.setState({
                rating: this.state.updateReview.userRating,
                imagePath: this.state.updateReview.imagePath,
                comment: this.state.updateReview.comments,
                imageExist: true,
                isLoading: false
            })
            this.fillStars(this.state.rating)
            this.retrieveImage(this.state.imagePath)
        })
    }

    componentDidMount() { 
        const {foodId, stallId, existing} = this.props.route.params
        firebaseDb
        .firestore()
        .collection('food')
        .get()
        .then(querySnapshot => {
            const results = []
            let stallRating = 0
            let count = 1
            let sRefId = ''
            querySnapshot.forEach(doc => {
                if (doc.data().foodId == foodId) {
                    results.push(doc.data())
                    sRefId = doc.data().stallRefId
                } else if (doc.data().stallId == stallId && doc.data().foodId != foodId) {
                    stallRating += parseFloat(doc.data().overallFoodRating)
                    count++   
                }
            })
            if (!existing)
                this.setState({isLoading: false, foodItem: results})
            else
                this.setState({foodItem: results})
            this.setState({ overallStallRating: stallRating, stallRefId: sRefId, foodCount: count })
        }).catch(err => console.error(err)) 
    }
    
    fillStars = (value) => {
        let index = value - 1
        let newArray = [...this.state.currentStyle];
        if (this.state.currentStyle[index] == styles.uncolorStar) {
            while (index > -1) {
                newArray[index] = styles.colorStar
                index--
            }
        } else {
            while (index < 5) {
                newArray[index+1] = styles.uncolorStar
                index++
            }      
        }
        this.setState( { currentStyle: newArray, rating: value  })
    }

    handleComment = (text) => {
        this.setState({ comment: text })
    }

    handleCreateReview = () => {
    const {foodId, refId, stallId} = this.props.route.params
        firebaseDb
        .firestore() 
        .collection('foodReview')
        .add({
            userId: this.state.user.userId, 
            username: this.state.user.username,
            foodId: foodId,
            date: new Date(),
            userRating: this.state.rating,
            comments: this.state.comment,
            image: 'https://i.stack.imgur.com/h6viz.gif', //default loading pic
            imagePath: "images/" + this.state.user.userId + "/reviews/" + foodId,
            stallId: stallId
        }).then(() => {
            this.uploadImage(this.state.image);
            let updatedFoodRating = this.calculateOverallFoodRating()
            //update food rating
                firebaseDb
                .firestore()
                .collection('food')
                .doc(refId)
                .update({
                    overallFoodRating: updatedFoodRating
                }).then(() => {
                    this.setState({ 
                        currentStyle: [styles.uncolorStar, styles.uncolorStar, styles.uncolorStar, styles.uncolorStar, styles.uncolorStar],
                        rating: 0,
                        comment: '',
                        success: true,
                        image: '',
                        imageExist: false,
                    })
                    firebaseDb
                    .firestore()
                    .collection('stall')
                    .doc(this.state.stallRefId)
                    .update({
                        overallStallRating: Number(this.calculateStallRating(updatedFoodRating))
                    })
                })
            }
        ).catch(err => console.error(err))
    }

    handleUpdateReview = () => {
        const {foodId, refId, stallId} = this.props.route.params
            firebaseDb
            .firestore() 
            .collection('foodReview')
            .doc(this.state.updateReview.refId)
            .update({
                date: new Date(),
                userRating: this.state.rating,
                comments: this.state.comment,
                imagePath: "images/" + this.state.user.userId + "/reviews/" + foodId,
            }).then(() => {
                this.uploadImage(this.state.image);
                let updatedFoodRating = this.calculateOverallFoodRating()
                //update food rating
                    firebaseDb
                    .firestore()
                    .collection('food')
                    .doc(refId)
                    .update({
                        overallFoodRating: updatedFoodRating
                    }).then(() => {
                        this.setState({ 
                            currentStyle: [styles.uncolorStar, styles.uncolorStar, styles.uncolorStar, styles.uncolorStar, styles.uncolorStar],
                            rating: 0,
                            comment: '',
                            success: true,
                            image: '',
                            imageExist: false,
                        })
                        firebaseDb
                        .firestore()
                        .collection('stall')
                        .doc(this.state.stallRefId)
                        .update({
                            overallStallRating: Number(this.calculateStallRating(updatedFoodRating))
                        })
                    })
                }
            ).catch(err => console.error(err))
        }
    

    calculateOverallFoodRating = () => {
        const {reviews, existing} = this.props.route.params
        let sum = 0
        let count = 0
        if (reviews != null) {
            for (let r of reviews) {
                sum += r.userRating 
                count++
            }
        }

        if (existing) {
            this.setState({ previousFoodRating: (sum/count).toFixed(2) })
            let currentRating = this.state.updateReview.userRating
            sum -= currentRating
        } else {
            count++
        }

        sum += this.state.rating
        return (sum/count).toFixed(2)
    }

    calculateStallRating = (updatedFoodRating) => {
        return ((this.state.overallStallRating + Number(updatedFoodRating))/(this.state.foodCount)).toFixed(2)
    }

    imageOptions = () => {
        ActionSheetIOS.showActionSheetWithOptions(
            {
              options: ['Cancel', 'Camera', 'Gallery'],
              cancelButtonIndex: 0,
            },
            buttonIndex => {
                if (buttonIndex === 0) {
                    
                }else if (buttonIndex === 1) {
                    this.useCamera()    
                } else {
                    this.selectPicture()
                }
            }
          );
    }

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
            this.setState({image: response.uri, imageExist: true})
        }
    }

    uploadImage = async (uri) => {
        const { foodId } = this.props.route.params
        const response = await fetch(uri);
        const blob = await response.blob();
        var ref = firebaseDb.storage().ref().child("images/" + this.state.user.userId + "/reviews/" + foodId);
        return ref.put(blob);
      }

    selectPicture = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
          });

        if (result.uri != null) {
            this.setState({image: result.uri, imageExist: true})
        }
    }

    removeImage = () => {
        this.setState({image: '', imageExist: false})
    }

    retrieveImage = async (imagePath) => {
        let ref = firebaseDb.storage().ref(imagePath);
        await ref.getDownloadURL().then((url) => {
            this.setState({image: url})
        })
    }

    submit = (rating, imageExist) => {
        const {existing} = this.props.route.params

        if (rating == 0 || !imageExist) {
            this.setState({ success: false})
            Alert.alert('Missing fields', 'Please at least indicate the rating and upload a photo')
        } else {
            if (!existing) 
                this.handleCreateReview()
            else 
                this.handleUpdateReview()
            Alert.alert('Submitted', 'Thank you for your review!',
                [
                    {onPress: () => this.props.navigation.navigate('Home', {
                        refresh: true
                    })},
                ]
            )
        }
    }

    render() {
        const { isLoading, foodItem, image, imageExist } = this.state
        const { stallName, foodImage, } = this.props.route.params

        if (isLoading)
            return <ActivityIndicator style = {{alignSelf: 'center', flex: 1}} size = 'large' color= 'tomato' />

        return(
            <View style = {styles.container}>
                <AppStatusBar>
                    <View style = {styles.header}>
                        <Text style = {{alignSelf: 'center', color: 'white', top: 6, fontSize: 22}}>Review your meal</Text>
                        <TouchableOpacity onPress = {
                            () => this.submit(this.state.rating, imageExist)
                            }>
                            <Text style = {{marginRight: 10, fontSize: 16, bottom: 15, color: 'white'}}>
                                Submit
                            </Text>
                        </TouchableOpacity>
                    </View>
                </AppStatusBar>
                <BackButton onPress = {() => { this.props.navigation.goBack() }} style = {{color: 'white'}}/>

                <View style = {{flex: 1, padding: 10}}>
                    <FlatList
                    style = {{height: 50}}
                        data={ foodItem } 
                        renderItem={ ({ item }) => (
                            <View style = {styles.food}>
                                <Image source = {{uri: foodImage}} style = {styles.image}/>
                                <View style = {styles.food2}>
                                    <Text style = {{fontSize: 20, marginTop: 5}}>
                                        { item.foodName }
                                    </Text>
                                    <Text style = {{fontSize: 15, marginTop: 5, color: 'grey'}}>
                                        { stallName }
                                    </Text>
                                </View>
                            </View>
                        )}
                        keyExtractor={ item => item.foodId } 
                    />
                    <View style = {styles.rating}>
                        <TouchableOpacity value = '1' onPress={ () => {{this.fillStars(1)}}}>
                            <Ionicons name='ios-star' style = {this.state.currentStyle[0]}/>
                        </TouchableOpacity>
                        
                        <TouchableOpacity value = '2' onPress={ () => {{this.fillStars(2)}}}>
                        <Ionicons name='ios-star' style = {this.state.currentStyle[1]}/>
                        </TouchableOpacity>

                        <TouchableOpacity value = '3' onPress={ () => {{this.fillStars(3)}}}>
                            <Ionicons name='ios-star' style = {this.state.currentStyle[2]}/>
                        </TouchableOpacity>

                        <TouchableOpacity value = '4' onPress={ () => {{this.fillStars(4)}}}>
                            <Ionicons name='ios-star' style = {this.state.currentStyle[3]}/>
                        </TouchableOpacity>

                        <TouchableOpacity value = '5' onPress={ () => {{this.fillStars(5)}}}>
                            <Ionicons name='ios-star' style = {this.state.currentStyle[4]}/>
                        </TouchableOpacity>
                    </View>
                    <View style = {styles.photo}>
                        {!imageExist && <TouchableOpacity style = {styles.photoButton} onPress = {this.imageOptions}>
                            <Ionicons name='ios-camera' style = {{fontSize: 40, color: 'tomato'}}/>
                            <Text style = {{fontSize: 13, color: 'tomato'}}>Add Photo</Text>
                        </TouchableOpacity>}
                        {imageExist && <View style = {{flexDirection: 'row'}}>
                            <TouchableOpacity onPress = {this.imageOptions}>
                                <Image source ={{ uri: image }} style={{ width: 80, height: 80, borderWidth: 1, borderColor: 'tomato'}} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress = {this.removeImage}>
                                <Ionicons name = 'ios-close-circle' style = {{fontSize: 23, color: 'tomato', right: 8, bottom: 12}}/>
                            </TouchableOpacity>
                        </View>}
                    </View>
                    <View style = {styles.comments}>
                        <TextInput placeholder = 'Leave a review...' style = {styles.input}
                        onChangeText = {this.handleComment} value = {this.state.comment} multiline = {true}/>
                    </View>
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: 'white'
    },
    header: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'flex-end'
    },
    image: {
        width: 90,
        height: 75,
        borderRadius: 5
    },
    food: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        top: 10
    },
    food2: {
        flexDirection: 'column',
        marginLeft: 10,
        marginTop: 5,
    },
    rating: {
        flex: 0.8,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    photo: {
        flex: 2.5,
        alignItems: 'center',
        justifyContent: 'center'
    }, 
    comments: {
        flex: 7,
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    input: {
        backgroundColor: '#E8E8E8',
        height: 150,
        width: 350,
        borderWidth: 1,
        borderColor: '#E8E8E8',
        textAlign: 'center',
        paddingTop: 50
    },
    seperator: {
        height: 1,
        backgroundColor: 'silver',
        position: 'absolute'
    },
    colorStar: {
        color:'#FFD700', 
        fontSize: 40, 
        marginRight: 10
    },
    uncolorStar: {
        color:'silver', 
        fontSize: 40, 
        marginRight: 10
    },
    photoButton: {
        borderWidth: 1,
        borderColor: 'tomato',
        height: 80,
        width: 350,
        marginHorizontal: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF'
    },
  });