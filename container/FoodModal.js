import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, Image, FlatList, TouchableOpacity, ActivityIndicator, Alert,
        Dimensions} from 'react-native';
import firebaseDb from '../firebaseDb'
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-community/async-storage';
import { getUserByUsername } from '../api/userAPI';


import BackButtonWbg from '../component/BackButtonWbg'

export default class FoodModal extends React.Component {
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
        reviews: null,
        totalReviews: 0,
        allReview: null,
        canReview: true
    }

    constructor(props) {
        super(props);
        // this.getData();
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
        this.checkReview()
    }

    componentDidMount() { 
        const {foodId} = this.props.route.params
        firebaseDb
        .firestore()
        .collection('foodReview')
        .get()
        .then(querySnapshot => {
            const results = []
            const allResults = []
            querySnapshot.forEach(doc => {
                if (doc.data().foodId == foodId) {  
                    allResults.push(doc.data())
                }
            })
            allResults.sort((a,b) => new Date(b.date.toDate()) - new Date(a.date.toDate()))

            let count = 0
            allResults.forEach(doc => {
                if (count < 3) {
                    results.push(doc)
                    count++
                }
            })
            
            this.setState({isLoading: false, reviews: results, 
                totalReviews: allResults.length, allReview: allResults})
            this.getData()
            this.retrieveImage()
        }).catch(err => console.error(err))    
    }

    getStars = (itemRating) => {
        let stars = [];
        let count = 0;
        // Loop 5 times
        for (var i = 1; i <= 5; i++) {
            // Set the path to filled stars
            stars[count] = styles.starFilled;
            // If ratings is lower, set the path to unfilled stars
            if (i > itemRating) {
                stars[count] = styles.starUnfilled;
            }
            count++;
        }

        return (
            <View style = {{flex: 1.5, flexDirection: 'row'}}>
                <Ionicons name='ios-star' style = {stars[0]}/>
                <Ionicons name='ios-star' style = {stars[1]}/>
                <Ionicons name='ios-star' style = {stars[2]}/>
                <Ionicons name='ios-star' style = {stars[3]}/>
                <Ionicons name='ios-star' style = {stars[4]}/>
            </View>
        );
    }

    checkReview = async () => {
        for (var i = 0; i < Object.keys(this.state.allReview).length; i++) {
            if (this.state.allReview[i].userId == this.state.user.userId) {
                this.setState({canReview: false})
                break
            }
        }
    }

    convertDate = (date) => {
        let dateF = date.toDate()
        var date = new Date(dateF).getDate();
        var month = new Date(dateF).getMonth() > 9 ? new Date(dateF).getMonth() + 1 : '0' + (new Date(dateF).getMonth() + 1);
        var year = new Date(dateF).getFullYear();
  
        return date + '-' + month + '-' + year;
    }

    retrieveImage = async () => {
        let updatedReview = this.state.reviews
        for(var i=0; i<Object.keys(updatedReview).length; i++) {
            let ref = firebaseDb.storage().ref(updatedReview[i].imagePath);
            await ref.getDownloadURL().then((url) => {
                updatedReview[i].image = url
            })
        }
        this.setState({ reviews: updatedReview })
    }

    render() {
        const { foodName, foodRating, foodPrice, foodDesc, foodId, refId, stallName, stallId, image } = this.props.route.params
        const { isLoading, reviews, totalReviews} = this.state

        if (isLoading) 
            return <ActivityIndicator style = {{alignSelf: 'center', flex: 1}} size = 'large' color= 'tomato' />

        return(
            <SafeAreaView style = {styles.container}>
                <BackButtonWbg onPress = {() => { this.props.navigation.goBack() }}/>
                <Image source = {{uri: image}} style = {{width: Dimensions.get('window').width, height: 279, position: 'absolute'}}/>
                <View style = {styles.foodImage}>
                    <View style = {styles.foodCaption}>
                        <View style = {styles.captionText}>
                            <Text style = {styles.captionText1}>
                                {foodName}
                            </Text>
                            <View style = {styles.captionText2}>
                                <Ionicons name='ios-star' style = {{color:'#FFD700', fontSize: 17, marginRight: 5}} />
                                <Text style = {{fontSize: 17}}>
                                    {foodRating}
                                </Text>
                            </View>
                        </View>
                        <View style = {styles.foodPrice}>
                            <Text style = {{color: 'black', fontSize: 20, fontWeight: 'bold'}}>
                                ${Number(foodPrice).toFixed(2)}
                            </Text>
                        </View>
                    </View>
                </View>
                <Text style = {styles.header}>Description: </Text>
                <View style = {styles.desc}>
                    <Text style = {{flex: 1,}}>{foodDesc}</Text>
                    <View style = {styles.header2}>
                        <Text style = {styles.subHeader}>Reviews </Text>
                        <TouchableOpacity style = {styles.subHeader2} onPress = {() => {
                                this.props.navigation.navigate('Review', {
                                    foodId: foodId,
                                    stallName: stallName,
                                    refId: refId,
                                    reviews: reviews,
                                    stallId: stallId,
                                    foodImage: image
                                })
                            }}>
                            <Text style = {styles.subText}>See all reviews ({totalReviews}) </Text>
                        </TouchableOpacity>
                    </View>
                    <View style = {styles.reviews}>
                        { this.state.loggedIn &&
                            <TouchableOpacity style = {styles.add} onPress = {() => {
                            if(this.state.canReview == true) {
                                this.props.navigation.navigate('AddReview', {
                                    foodId: foodId,
                                    stallName: stallName,
                                    refId: refId,
                                    reviews: reviews,
                                    stallId: stallId,
                                    foodImage: image
                                })
                            } else {
                                Alert.alert('Already reviewed', 'You reviewed this already' , [
                                    {
                                        text: 'OK'
                                    },
                                    {
                                        text: 'Edit Review',
                                        onPress: () => {
                                            this.props.navigation.navigate('AddReview', {
                                                foodId: foodId,
                                                stallName: stallName,
                                                reviews: reviews,
                                                refId: refId,
                                                foodImage: image,
                                                stallId: stallId,
                                                existing: true
                                            })
                                        }
                                    }
                                ])
                            }
                            }}>
                                <Ionicons name = "ios-add-circle" style = {{fontSize: 50, color: 'tomato',}} />
                            </TouchableOpacity>
                        }
                        {reviews[0] == null ?
                            <Text style = {{fontSize: 15, alignSelf: 'center', color: 'gray'}}>There are no reviews</Text> : 
                        <FlatList 
                        data={ reviews } 
                        renderItem={ ({ item }) => (
                            <View style = {styles.reviewStack}> 
                                <View style = {styles.reviewHeader}>
                                    <Text style = {{flex: 4, fontWeight: 'bold'}}>{item.username}</Text>
                                    {this.getStars(item.userRating)}
                                </View>
                                <Text style = {{marginLeft: 10, bottom: 5, color: '#696969', fontSize: 12}}>
                                    {this.convertDate(item.date)}
                                </Text>
                                <TouchableOpacity style = {{margin: 10}} onPress={() => {this.props.navigation.navigate('ImageViewer', {
                                    image: item.image
                                })}}>
                                    <Image source = {{uri: item.image}}  style = {{width: 160, height: 150, borderWidth: 1, borderColor: 'silver'}} />
                                </TouchableOpacity>
                                <Text style = {styles.comment}>{item.comments}</Text>
                            </View>
                        )}
                        keyExtractor={ item => item.userId + item.foodId } />
                        }
                    </View>
                </View>
            </SafeAreaView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'space-evenly',
      flexDirection: 'column'
    },
    foodImage: {
        flex: 2.1,
        width: 350,
        marginBottom: 20,
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
    },
    foodCaption: {
        backgroundColor: '#FFFFFF99',
        width: 380,
        right: 10,
        flexDirection: 'row',
    },
    captionText: {
        marginLeft: 30,
        flex: 2,
        marginTop: 10
    },
    captionText1: {
        color: 'black',
        fontSize: 20,
        marginBottom: 5,
        fontWeight: 'bold'
    },
    captionText2: {
        color: 'black',
        fontSize: 16,
        marginBottom: 20,
        flexDirection: 'row'
    },
    foodPrice: {
        flex: 1,
        flexDirection: 'row',
        alignSelf: 'flex-start',
        justifyContent: 'flex-end',
        marginRight: 30,
        marginTop: 10,
    },
    header:{
        fontSize: 20,
        alignSelf: 'flex-start',
        marginLeft: 30,
        fontWeight: 'bold',
        marginBottom: 5
    },
    desc: {
        flex: 4,
        width: 350,
        marginLeft: 35,
    },
    reviews: {
        flex: 4,
        marginRight: 30,
        //backgroundColor: '#00000010',
        borderRadius: 5,
        justifyContent: 'center',
    },
    header2: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginBottom: 10
    },
    subHeader: {
        flex: 3,
        fontSize: 20,
        alignSelf: 'flex-start',
        fontWeight: 'bold',
        marginBottom: 5
    },
    subHeader2: {
        flex: 2.5,
        marginTop: 3,
    },
    subText: {
        color: 'tomato',
        fontWeight: 'bold',
        fontSize: 15
    },
    add: {
        alignSelf: 'flex-end',
        position: 'absolute',
        top: 270,
        right: 10,
        zIndex: 999,
    },
    reviewStack: {
        width: 320,
        height: 265,
    },
    reviewHeader: {
        flexDirection: 'row',
        margin: 10
    },
    comment: {
        margin: 10,
        color: 'black',
        marginBottom: 10,
        bottom: 5
    },
    starFilled: {
        color:'#FFD700', 
        fontSize: 16, 
        marginRight: 2
    },
    starUnfilled: {
        color:'silver', 
        fontSize: 16, 
        marginRight: 2
    }
  });