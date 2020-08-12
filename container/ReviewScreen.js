import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, Image, FlatList, TouchableOpacity, ActivityIndicator, Alert} from 'react-native';
import firebaseDb from '../firebaseDb'
import Ionicons from 'react-native-vector-icons/Ionicons';

import AsyncStorage from '@react-native-community/async-storage';
import { getUserByUsername } from '../api/userAPI';


import BackButton from '../component/BackButton'
import AppStatusBar from '../component/AppStatusBar';

export default class ReviewScreen extends React.Component {
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
        allReviews: null,
        canReview: true,
        filterCount: [0, 0, 0, 0, 0, 0],
        filterStyle: [styles.filterSelectedButton, styles.filterButton, styles.filterButton, styles.filterButton, styles.filterButton, styles.filterButton,]
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
            let newArray = [...this.state.filterCount]
            querySnapshot.forEach(doc => {
                if (doc.data().foodId == foodId) {  
                    results.push(doc.data())
                    newArray[0]++
                    if (doc.data().userRating == 5) {
                        newArray[5]++
                    } else if (doc.data().userRating == 4) {
                        newArray[4]++
                    } else if (doc.data().userRating == 3) {
                        newArray[3]++
                    } else if (doc.data().userRating == 2) {
                        newArray[2]++
                    } else if (doc.data().userRating == 1) {
                        newArray[1]++
                    }
                }
            })
            results.sort((a,b) => new Date(b.date.toDate()) - new Date(a.date.toDate()))
            this.setState({isLoading: false, reviews: results, allReviews: results, filterCount: newArray})
            this.getData();
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
            <View style = {{flex: 1.5, flexDirection: 'row',}}>
                <Ionicons name='ios-star' style = {stars[0]}/>
                <Ionicons name='ios-star' style = {stars[1]}/>
                <Ionicons name='ios-star' style = {stars[2]}/>
                <Ionicons name='ios-star' style = {stars[3]}/>
                <Ionicons name='ios-star' style = {stars[4]}/>
            </View>
        );
    }

    selectFilter = (rating) => {
        let newArray = [styles.filterButton, styles.filterButton, styles.filterButton, styles.filterButton, styles.filterButton, styles.filterButton,];
        newArray[rating] = styles.filterSelectedButton
        this.setState( { filterStyle: newArray })

        const {foodId} = this.props.route.params
        let results = []
        this.state.allReviews.forEach(r => {
            if(r.foodId == foodId && r.userRating == rating && rating != 0) {
                results.push(r)
            }
        })

        if (rating == 0) {
            this.setState({isLoading: false, reviews: this.state.allReviews})
        } else {
            this.setState({isLoading: false, reviews: results})
        }
    }

    checkReview = () => {
        for (var i = 0; i < Object.keys(this.state.allReviews).length; i++) {
            if (this.state.allReviews[i].userId == this.state.user.userId) {
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
        const { foodId, stallName, foodImage, stallId, refId } = this.props.route.params
        const { isLoading, reviews } = this.state

        if (isLoading)
            return <ActivityIndicator style = {{alignSelf: 'center', flex: 1}} size = 'large' color= 'tomato' />

        return(
            <View style = {styles.container}>
                <AppStatusBar>
                    <View style = {styles.header}>
                        <Text style = {{color: 'white', alignSelf: 'center', fontSize: 23, fontWeight: 'bold', top: 13}}>
                            Reviews
                        </Text>
                        <TouchableOpacity onPress = {() => {
                        if (this.state.loggedIn) {
                            this.checkReview()
                            if (this.state.canReview == true) {
                            this.props.navigation.navigate('AddReview', {
                                foodId: foodId,
                                stallName: stallName,
                                reviews: reviews,
                                refId: refId,
                                foodImage: foodImage,
                                stallId: stallId,
                                existing: false
                                })
                            } else {
                                Alert.alert('Already reviewed', 'You reviewed this already', [
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
                                                foodImage: foodImage,
                                                stallId: stallId,
                                                existing: true
                                            })
                                        }
                                    }
                                ])
                            }
                        } else {
                            Alert.alert('Login required', 'Please login first before submitting a review' )
                        }
                        }}>
                            <Ionicons name = 'ios-create' color = 'white' style = {{marginRight: 13, fontSize: 30, bottom: 17}} />
                        </TouchableOpacity>
                    </View>
                </AppStatusBar>
                <BackButton style = {{color: 'white'}} onPress = {() => { this.props.navigation.goBack() }}/>
                <SafeAreaView style = {styles.container}>
                    <View style = {styles.filter}>
                        <View style = {{flexDirection: 'row', margin: 10}}>
                            <TouchableOpacity style = {this.state.filterStyle[0]} onPress = { () => {this.selectFilter(0)}}>
                                <Text>All {"\n"}({this.state.filterCount[0]})</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style = {this.state.filterStyle[5]} onPress = { () => {this.selectFilter(5)}}>
                                {this.getStars(5)}
                                <Text>
                                    ({this.state.filterCount[5]})
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style = {this.state.filterStyle[4]} onPress = { () => {this.selectFilter(4)}}>
                                {this.getStars(4)}
                                <Text>
                                    ({this.state.filterCount[4]})
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style = {this.state.filterStyle[3]} onPress = { () => {this.selectFilter(3)}}>
                                {this.getStars(3)}
                                <Text>
                                    ({this.state.filterCount[3]})
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style = {{flexDirection: 'row', marginBottom: 10, marginHorizontal: 10, height: 30}}>
                            <TouchableOpacity style = {this.state.filterStyle[2]} onPress = { () => {this.selectFilter(2)}}>
                                {this.getStars(2)}
                                <Text>
                                    ({this.state.filterCount[2]})
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style = {this.state.filterStyle[1]} onPress = { () => {this.selectFilter(1)}}>
                                {this.getStars(1)}
                                <Text>
                                    ({this.state.filterCount[1]})
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style = {styles.reviews}>
                        {reviews[0] == null ?
                            <Text style = {{fontSize: 15, alignSelf: 'center', color: 'gray'}}>There are no reviews</Text> : 
                            <FlatList 
                            style = {{backgroundColor: '#00000005'}}
                            data={ reviews } 
                            renderItem={ ({ item }) => (
                                <View style = {styles.reviewStack}> 
                                    <View style = {styles.reviewHeader}>
                                        <Text style = {{flex: 5, fontWeight: 'bold'}}>{item.username}</Text>
                                        {this.getStars(item.userRating)}
                                    </View>
                                    <Text style = {{marginLeft: 10, bottom: 5, color: '#696969', fontSize: 12}}>{this.convertDate(item.date)}</Text>
                                    <TouchableOpacity style = {{margin: 10}} onPress={() => {this.props.navigation.navigate('ImageViewer', {
                                            image: item.image
                                    })}}>
                                        <Image source = {{uri: item.image}} style = {{width: 200, height: 200, borderWidth: 1, borderColor: 'silver'}} />
                                    </TouchableOpacity>
                                    <Text style = {styles.comment}>{item.comments}</Text>
                                    <View style = {styles.seperator} />
                                </View>
                            )}
                            keyExtractor={ item => item.userId + item.foodId } />
                            }
                    </View>
                </SafeAreaView>
        </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
    },
    header: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'flex-end'
    },
    filter: {
        flex: 0.9,
    },
    filterButton: {
        borderWidth: 1,
        borderColor: '#00000008',
        padding: 5,
        marginHorizontal: 5,
        borderRadius: 5,
        backgroundColor: '#00000009',
        alignItems: 'center',
        height: 50,
    },
    filterSelectedButton: {
        borderWidth: 1,
        borderColor: 'tomato',
        padding: 5,
        marginHorizontal: 5,
        borderRadius: 5,
        alignItems: 'center',
        height: 50
    },
    reviews: {
        flex: 4,
        marginLeft: 5,
        borderRadius: 5,
        justifyContent: 'center',
        marginTop: 10
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
    reviewStack: {
        height: 310,
        marginBottom: 5
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
        color:'#f0ca00', 
        fontSize: 16, 
        marginRight: 3
    },
    starUnfilled: {
        color:'silver', 
        fontSize: 16, 
        marginRight: 3
    },
    seperator: {
        height: 1,
        backgroundColor: 'silver',
    },
  });