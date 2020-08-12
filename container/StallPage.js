import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, Image, FlatList, TouchableOpacity, ActivityIndicator,
        Picker, Dimensions } from 'react-native';
import firebaseDb from '../firebaseDb'
import Ionicons from 'react-native-vector-icons/Ionicons';
import AppStatusBar from '../component/AppStatusBar'

import AsyncStorage from '@react-native-community/async-storage';
import { getUserByUsername } from '../api/userAPI';

import BackButtonWbg from '../component/BackButtonWbg'
import AppModal from '../component/AppModal'
import Rating from '../component/Rating'
import OpeningStatus from '../component/OpeningStatus'
import AppModalSort from '../component/AppModalSort';

export default class HawkerPage extends React.Component {
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
        menu: null,
        currentStyle: [styles.uncolorStar, styles.uncolorStar, styles.uncolorStar, styles.uncolorStar, styles.uncolorStar],
        favIcon: 'ios-heart-empty',
        favId: '',

        sortStyle: styles.sortOff,
        sorting: 2,
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

        const {stallId} = this.props.route.params
        firebaseDb
        .firestore()
        .collection('userFavourite')
        .get()
        .then(querySnapshot => {
            querySnapshot.forEach(doc => {
                if (doc.data().stallId == stallId && doc.data().userId == this.state.user.userId) {
                    this.setState({favIcon: 'ios-heart', favId: doc.id })
                }
            })
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

    fillHeart = () => {
        const {stallId} = this.props.route.params
        if (this.state.favIcon == 'ios-heart-empty') {
            this.setState({ favIcon: 'ios-heart' })
            firebaseDb
            .firestore() 
            .collection('userFavourite')
            .add({
                userId: this.state.user.userId,
                stallId: stallId,
            }).then(doc => {
                firebaseDb
                .firestore()
                .collection('userFavourite')
                .doc(doc.id)
                .update({
                    refId: doc.id
                })
                this.setState({favId: doc.id})
            })
        } else {
            firebaseDb
            .firestore()
            .collection('userFavourite')
            .doc(this.state.favId)
            .delete()
            .then(() => {
                this.setState({ favIcon: 'ios-heart-empty' })
            })
            .catch(err => console.error(err))
        }
    }

    checkStatus = () => {
        const { openingHours, closingHours } = this.props.route.params
        let today = new Date(Date.now())
        let todayTime = today.getHours()*100 + today.getMinutes()

        let opening = new Date(openingHours)
        let openingTime = opening.getHours()*100 + opening.getMinutes()

        let closing = new Date(closingHours)
        let closingTime = closing.getHours()*100 + closing.getMinutes()

        if ( todayTime >= openingTime && todayTime <= closingTime ) {
            return (
                <OpeningStatus style = {{color: 'lime', alignSelf: 'flex-end'}}>
                    Open
                </OpeningStatus>
            );
        } else  {
            return (
                <OpeningStatus style = {{color: 'orangered', alignSelf: 'flex-end'}}>
                    Closed
                </OpeningStatus>
            );
        }
    }

    handleSorting = (sorting) => this.setState({ sorting })

    sort = () => {
        const { menu, sorting } = this.state

        let newArr = menu
        if ( sorting == 0 ) {
            newArr.sort((a,b) => b.overallFoodRating - a.overallFoodRating)
            this.setState({ sortStyle: styles.sortOn, stalls: newArr})
        } else if ( sorting == -1 ) {
            newArr.sort((a,b) => a.price - b.price)
            this.setState({ sortStyle: styles.sortOn, stalls: newArr})
        } else if ( sorting == 1 ){
            newArr.sort((a,b) => b.price - a.price)
            this.setState({ sortStyle: styles.sortOn, stalls: newArr})
        } else {
            newArr.sort((a,b) => new Date(b.creationDate.toDate()) - new Date(a.creationDate.toDate()))
            this.setState({ sortStyle: styles.sortOn, stalls: newArr})
        }
    }

    checkNewMenu = (date) => {
        let todayDate = Date.now()
        let creationDate = new Date(date.toDate())
        if (todayDate - creationDate.getTime() <= 604800000 ) {
            return true
        }
        return false
    }


    componentDidMount() { 
        const {stallId, hawkerId} = this.props.route.params
        firebaseDb
        .firestore()
        .collection('food')
        .get()
        .then(querySnapshot => {
            const results = []
            querySnapshot.forEach(doc => {
                if (doc.data().stallId == stallId) {
                    results.push(doc.data())
                }
            })
            results.sort((a,b) => new Date(b.creationDate.toDate()) - new Date(a.creationDate.toDate()))
            this.setState({menu: results, isLoading: false})
            this.getData()
        }).catch(err => console.error(err)) 
    }

    render() {
        const { stallName, stallRating, image, stallId, hawkerId, address, openingHours, closingHours } = this.props.route.params
        const { isLoading, menu, sortStyle, sorting } = this.state

        if (isLoading)
            return <ActivityIndicator style = {{alignSelf: 'center', flex: 1}} size = 'large' color= 'tomato' />

        return(
            <SafeAreaView style = {styles.container}>
                <AppStatusBar backgroundColor="tomato" barStyle="light-content" />
                <BackButtonWbg onPress = {() => { this.props.navigation.goBack() }}/>
                { this.state.loggedIn &&
                <TouchableOpacity style = {styles.favourite} onPress = { () => {this.fillHeart()}}>
                    <View style = {{backgroundColor: '#FFFFFF99', width: 45, height: 45, position: 'absolute', borderRadius: 20, left: -10}}/>
                    <Ionicons name = {this.state.favIcon} style = {styles.heartStyle}/>
                </TouchableOpacity>
                }
                <Image source = {{uri: image}} style = {{width: Dimensions.get('window').width, height: 275, position: 'absolute'}}/>
                <View style = {styles.stallImage}>
                    <TouchableOpacity style = {styles.stallCaption}>
                        <View style = {styles.captionText}>
                            <Text style = {styles.captionText1}>
                                {stallName}
                            </Text>
                            <Text style = {styles.captionText2}>
                                { address }
                            </Text>
                        </View>
                        <View style = {styles.stallRating}>
                            <View style = {{flexDirection: 'row', alignSelf: 'flex-end'}}>
                                <Ionicons name='ios-star' style = {{color:'#FFD700', fontSize: 17, marginRight: 5}} />
                                <Text style = {{fontSize: 17, color: 'white'}}>
                                    {stallRating}
                                </Text>
                            </View>
                            {this.checkStatus()}
                        </View>
                    </TouchableOpacity>
                </View>
                <View style = {{flexDirection: 'row', flex: 0.5, paddingTop: 10}}>
                    <View style = {{flex: 1, flexDirection: 'row', justifyContent: 'flex-start'}}>
                        <Text style = {styles.header}>Menu</Text>
                        <AppModal style = {styles.modal}>
                            <Text style = {{textAlign: 'center', lineHeight: 30}}>
                                <Text style = {{fontWeight: 'bold'}}>Operating Hours (Mon-Fri): {"\n"}</Text>
                                {openingHours.getHours()*100 + openingHours.getMinutes()} (AM) - {closingHours.getHours()*100 + closingHours.getMinutes()} (PM)
                            </Text>
                        </AppModal>
                    </View>

                    <AppModalSort style = {sortStyle} onPress = { () => this.sort()}>
                        <Text style = {{fontWeight: 'bold'}}>Sort by: </Text>
                        <Picker style = {styles.picker}
                                selectedValue = {sorting} onValueChange = {(itemValue, itemIndex) => this.handleSorting(itemValue)} 
                        >
                            <Picker.Item value='2' label='Newest' />
                            <Picker.Item value='0' label='Best Ratings' />
                            <Picker.Item value='1' label='Price: High to Low' />
                            <Picker.Item value='-1' label='Price: Low to High' />
                        </Picker>
                    </AppModalSort>
                </View>
                <View style = {styles.menu}>
                    <FlatList 
                        data={ menu } 
                        renderItem={ ({ item }) => (
                            <View style = {styles.menuBg}> 
                                <TouchableOpacity style = {styles.menuStack}
                                    onPress={() => {this.props.navigation.navigate('FoodModal', {
                                        foodName: item.foodName,
                                        //firebaseId: item.id,
                                        foodId: item.foodId,
                                        foodRating: item.overallFoodRating,
                                        foodDesc: item.desc,
                                        foodPrice: item.price,
                                        refId: item.refId,
                                        stallName: stallName,
                                        image: item.image,
                                        stallId: stallId,
                                    })
                                }}>
                                    <View style = {styles.menuImage}>
                                        <Image source = {{uri: item.image}} style = {{width: 129, height: 100, borderRadius: 5}}/>
                                        { this.checkNewMenu(item.creationDate) && 
                                        <View style = {{backgroundColor: 'crimson', flex: 1, borderRadius: 3, padding: 4, top: 2, left: -8, position: 'absolute', paddingHorizontal: 10, opacity: 0.9}}>
                                            <Text style = {{color: 'white', fontWeight: 'bold'}}>
                                                New
                                            </Text>
                                        </View>
                                        }
                                    </View>
                                    <View style = {styles.menuText}>
                                        <View style = {styles.menuText1}>
                                            <Text style = {{fontSize: 17}}>
                                                {item.foodName}
                                            </Text>
                                        </View>
                                        <View style = {styles.menuText2}>
                                            <Rating style = {{flex: 3, justifyContent: 'flex-start'}}>
                                                {item.overallFoodRating}
                                            </Rating>
                                            <Text style = {{flex: 1.5, fontSize: 15, fontWeight: 'bold'}}>
                                                ${Number(item.price).toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}
                    keyExtractor={ item => item.foodId } />
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
    stallImage: {
        flex: 2.1,
        width: 350,
        marginBottom: 10,
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
    },
    stallCaption: {
        backgroundColor: '#00000090',
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
        color: 'white',
        fontSize: 20,
        marginBottom: 5
    },
    captionText2: {
        color: 'silver',
        fontSize: 16,
        marginBottom: 20
    },
    stallRating: {
        flex: 1,
        flexDirection: 'column',
        marginRight: 40,
        marginTop: 15,
    },
    header:{
        fontSize: 20,
        marginLeft: 30,
        fontWeight: 'bold',
        marginBottom: 10,
        marginRight: 15
    },
    menuBg: {
        //backgroundColor: '#E8E8E850',
        borderRadius: 10,
        marginBottom: 10,
    },
    menu: {
        flex: 5,
        width: 350,
    },
    menuStack: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-around',
        margin: 10,
        borderRadius: 5,
    },
    menuImage: {
        flex: 2,
        height: 100,
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    menuText: {
        flex: 3,
        padding: 20,
        flexDirection: 'column',
        marginLeft: 10
    },
    menuText1: {
        flex: 5,
    },
    menuText2: {
        flex: 3,
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    modal: {
        marginTop: 0,
        marginRight: 30,
        bottom: 5,
    },
    rating: {
        margin: 10,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
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
    favourite: {
        zIndex: 999,
        position: 'absolute',
        alignSelf: 'flex-end',
        right: 20,
        top: 50,
    },
    heartStyle: {
        fontSize: 30,
        color: '#DC143C',
        top: 8
    },
    sortOn: {
        color: 'tomato'
    },
    sortOff: {
        color: 'gray'
    },
    picker: {
        width: 200,
        borderColor: '#DCDCDC', 
        top: 0,
        alignSelf: 'center',
        margin: -10
    },
  });