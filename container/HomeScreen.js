import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, 
    ActivityIndicator, TouchableOpacity, Image, ScrollView,
    Picker, ImageBackground} from 'react-native';
import firebaseDb from '../firebaseDb'
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SearchBar } from 'react-native-elements';
import AsyncStorage from '@react-native-community/async-storage';
import { getUserByUsername } from '../api/userAPI';

import AppStatusBar from '../component/AppStatusBar'
import OpeningStatus from '../component/OpeningStatus'
import AppModalFilter from '../component/AppModalFilter'

export default class HomeScreen extends React.Component {
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
        stalls: null,
        allStalls: null,
        latestStalls: null,
        sameCuisineStalls: null,
        lastReviewedStall: '',
        search: '',

        cuisineType: ['All', 'Chinese', 'Western', 'Japanese/Korean', 'Halal', 'Others'],
        cuisineIcon: ['ios-radio-button-on', 'ios-radio-button-off', 'ios-radio-button-off', 'ios-radio-button-off', 'ios-radio-button-off', 'ios-radio-button-off'],
        status: '0',
        filterStyle: styles.filterOff,

        stallType: ['All', 'Restaurants', 'Hawker'],
        stallTypeIcon: ['ios-radio-button-on', 'ios-radio-button-off', 'ios-radio-button-off'],

        newMenu: null
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
            } else {
                this.retrieveRecentlyReviewed()
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
        this.retrieveRecentlyReviewed()
    }

    componentDidMount() { 
        this._unsubscribe = this.props.navigation.addListener('focus', () => {
            this.retrieveStalls()
        });
    }

    componentWillUnmount() {
        this._unsubscribe();
    }

    retrieveStalls = () => {
        firebaseDb
        .firestore()
        .collection('stall')
        .get()
        .then(querySnapshot => {
            const results = []
            querySnapshot.docs.map(documentSnapshot => 
                results.push({
                    ...documentSnapshot.data(),
                    id: documentSnapshot.id
                })
            ) 
            const latest = []
            let todayDate = Date.now()
            
            querySnapshot.forEach(doc => {
                let date = new Date(doc.data().creationDate.toDate())
                // console.log(date.getTime())
                if (todayDate - date.getTime() <= 604800000 ) {
                    latest.push(doc.data())
                }
            })
            latest.sort((a,b) => new Date(b.creationDate.toDate()) - new Date(a.creationDate.toDate()))
            this.setState({stalls: results, allStalls: results, latestStalls: latest})
            this.getData();
            this.retrieveNewFood()
        }).catch(err => console.error(err)) 
    }

    retrieveNewFood = () => {
        firebaseDb
        .firestore()
        .collection('food')
        .get()
        .then(querySnapshot => {
            const menuLatest = []
            let todayDate = Date.now()
            let count = 0
            querySnapshot.forEach(doc => {
                let date = new Date(doc.data().creationDate.toDate())
                if (todayDate - date.getTime() <= 604800000 && count < 5) {
                    this.state.stalls.forEach(s =>{
                        if (s.stallId == doc.data().stallId) {
                            menuLatest.push({
                                ...doc.data(),
                                stallName: s.stallName,
                                address: s.address
                            })
                        }
                    })
                    count++
                }
            })
            menuLatest.sort((a,b) => new Date(b.creationDate.toDate()) - new Date(a.creationDate.toDate()))
            this.setState({newMenu: menuLatest})
        }).catch(err => console.error(err)) 
    }



    updateSearch = text => {
        this.setState({search: text});

        const newStalls = this.state.stalls.filter(item => {
            const itemData = `${item.stallName.toUpperCase()}`;
            const textData = text.toUpperCase();
            return itemData.includes(textData); // this will return true if our itemData contains the textData
          });
        
        if (text != '') {
            this.setState({
                stalls: newStalls
            });
        } else {
            this.setState({
                stalls: this.state.allStalls
            })
        }
    }

    //CHECK STALL STATUS
    checkOpenClosed = (openingHours, closingHours) => {
        let today = new Date(Date.now())
        let todayTime = today.getHours()*100 + today.getMinutes()

        let opening = new Date(openingHours)
        let openingTime = opening.getHours()*100 + opening.getMinutes()

        let closing = new Date(closingHours)
        let closingTime = closing.getHours()*100 + closing.getMinutes()

        if ( todayTime >= openingTime && todayTime <= closingTime ) {
            return true
        } else {
            return false
        }
    }

    checkStallStatus = (openingHours, closingHours) => {
        let status = this.checkOpenClosed(openingHours, closingHours)

        if ( status ) {
            return (
                <View style ={{zIndex: 999, backgroundColor: 'green', borderRadius: 3, position: 'absolute', marginLeft: 8, marginTop: 17, padding: 2}}>
                    <OpeningStatus style = {{color: 'white', marginTop: 0}}>
                        Open
                    </OpeningStatus>
                </View>
            );
        } else  {
            return (
                <View style ={{zIndex: 999, backgroundColor: 'red', borderRadius: 3, position: 'absolute', marginLeft: 8, marginTop: 17, padding: 2}}>
                    <OpeningStatus style = {{color: 'white', marginTop: 0}}>
                        Closed
                    </OpeningStatus>
                </View>
            );
        }
    }

    checkStallStatus2 = (openingHours, closingHours) => {
        let status = this.checkOpenClosed(openingHours, closingHours)

        if ( status ) {
            return (
                <View style = {{backgroundColor: 'green', flex: 1, borderRadius: 3, padding: 1.5, top: 4, right: 4}}>
                    <OpeningStatus style = {{color: 'white', marginTop: 0, bottom: 2, left: 2  }}>
                        Open
                    </OpeningStatus>
                </View>
            );
        } else {
            return (
                <View style = {{backgroundColor: 'red', flex: 1.3, borderRadius: 3, padding: 2, top: 4, right: 4}}>
                    <OpeningStatus style = {{color: 'white', marginTop: 0, bottom: 2, left: 2 }}>
                        Closed
                    </OpeningStatus>
                </View>
            );
        }
    }

    //RETRIEVE LAST REVIEWED
    retrieveRecentlyReviewed = () => {
        let stallId = ''
        firebaseDb
        .firestore()
        .collection('foodReview')
        .get()
        .then(querySnapshot => {
            let result = []
            let count = 1
            let userHasReviews = true
            querySnapshot.forEach(doc => {
                if (this.state.loggedIn) {
                    if (doc.data().userId == this.state.user.userId){
                        result.push(doc.data())
                    }
                }
            })

            if (Object.keys(result).length == 0) {
                querySnapshot.forEach(doc => {
                    if (count<10) {
                        result.push(doc.data())
                        count++
                    }
                })
                userHasReviews = false
            }

            result.sort((a,b) => new Date(b.date.toDate()) - new Date(a.date.toDate()))
            if (this.state.loggedIn && userHasReviews)
                stallId = result[0].stallId
        
            let cuisineType = ''
            let stallName = ''
            firebaseDb
            .firestore()
            .collection('stall')
            .get()
            .then(querySnapshot => {
                let result2 = []
                if (this.state.loggedIn && userHasReviews) {
                    querySnapshot.forEach(doc => { 
                        if (doc.data().stallId == stallId) {
                            cuisineType = doc.data().cuisineType
                            stallName = doc.data().stallName + ' (' + doc.data().address + ')'

                            querySnapshot.forEach(doc2 => {
                                if (doc2.data().cuisineType == cuisineType && doc2.data().stallId != stallId) {
                                    result2.push(doc2.data())
                                }
                            })
                        }
                    })
                } else {
                    let result3 = []
                    for (var i = 0; i < Object.keys(result).length; i++) {
                        querySnapshot.forEach(doc => { 
                            if (doc.data().stallId == result[i].stallId) {
                                result3.push(doc.data())
                            }
                        })
                    }
                    result2 = result3.filter((ele, ind) => ind === result3.findIndex( elem => elem.stallId === ele.stallId ))
                }
            this.setState({sameCuisineStalls: result2, isLoading: false, lastReviewedStall: stallName})    
            }).catch(err => console.error(err)) 
        }).catch(err => console.error(err)) 
    }

    //FILTER
    handleStatus = (status) => this.setState({ status })

    selectStallType = (index) => {
        const { stallTypeIcon } = this.state

        if ( index == 0 ) {
            this.setState({ stallTypeIcon: ['ios-radio-button-on', 'ios-radio-button-off', 'ios-radio-button-off'] })
        } else if ( index == 1 ){
            this.setState({ stallTypeIcon: ['ios-radio-button-off', 'ios-radio-button-on', 'ios-radio-button-off'] })  
        } else{
            this.setState({ stallTypeIcon: ['ios-radio-button-off', 'ios-radio-button-off', 'ios-radio-button-on'] })  
        }
    }
    
    selectCuisine = (index) => {
        const { cuisineIcon } = this.state

        if (index == 0) {
            this.setState({ cuisineIcon: ['ios-radio-button-on', 'ios-radio-button-off', 'ios-radio-button-off', 'ios-radio-button-off', 'ios-radio-button-off', 'ios-radio-button-off']})
        } else {
            let newArray = cuisineIcon
            newArray[0] = 'ios-radio-button-off'
            if ( cuisineIcon[index] == 'ios-radio-button-off' ) {
                newArray[index] = 'ios-radio-button-on'
            } else {
                newArray[index] = 'ios-radio-button-off'
            }
            this.setState({ cuisineIcon: newArray})
        }     
    }

    filter = (selectedStatus) => {
        //filter status
        let newArr = []
        if (selectedStatus == 0) {
            newArr = this.state.allStalls
        } else {
            this.state.allStalls.forEach(s => {
                let status = this.checkOpenClosed(s.monTofriOpening.toDate(), s.monTofriClosing.toDate())
                if (selectedStatus == 1 && status) {
                    newArr.push(s)
                } else if (selectedStatus == -1 && !status) {
                    newArr.push(s)
                }
            })
        }

        //filter stall type
        let newArr2 = []
        if (this.state.stallTypeIcon[0] == 'ios-radio-button-on') {
            newArr2 = newArr
        } else if (this.state.stallTypeIcon[1] == 'ios-radio-button-on') {
            newArr.forEach(s => {
                if (s.hawkerId == 'H07') {
                    newArr2.push(s)
                }
            })
        } else {
            newArr.forEach(s => {
                if (s.hawkerId != 'H07') {
                    newArr2.push(s)
                }
            })
        }
        newArr = newArr2

        //filter cuisine
        if (this.state.cuisineIcon[0] == 'ios-radio-button-on') {
            this.setState({ stalls: newArr, filterStyle: styles.filterOn })
        } else {
            let finalArr = [], index = 0
            this.state.cuisineIcon.forEach(c => {
                if (c == 'ios-radio-button-on') {
                    newArr.forEach(s => {
                        if ( s.cuisineType == this.state.cuisineType[index] ) {
                            finalArr.push(s)
                        }
                    })
                }
                index++
            })
            this.setState({ stalls: finalArr, filterStyle: styles.filterOn })
        }
    }

    resetFilter = () => {
        this.setState({ stalls: this.state.allStalls, status: '0', filterStyle: styles.filterOff,
                    cuisineIcon: ['ios-radio-button-on', 'ios-radio-button-off', 'ios-radio-button-off', 'ios-radio-button-off', 'ios-radio-button-off', 'ios-radio-button-off'] })
                    this.setState({ stallTypeIcon: ['ios-radio-button-on', 'ios-radio-button-off', 'ios-radio-button-off'] })
    }

    render() {
        // DISABLE YELLOW WARNINGS
        console.disableYellowBox = true;
        const { isLoading, stalls, search, latestStalls, sameCuisineStalls, lastReviewedStall,
                filterStyle, cuisineIcon, status, stallType, stallTypeIcon, newMenu } = this.state
                    
        if (isLoading)
            return <ActivityIndicator style = {{alignSelf: 'center', flex: 1}} size = 'large' color= 'tomato' />


        const renderCarousel = (array) => {
            return (
                <FlatList style = {{flex: 1, marginLeft: 5, backgroundColor: '#00000005'}}
                    showsHorizontalScrollIndicator = 'false'
                    horizontal = {true}
                    data = {array}
                    renderItem={ ({ item }) => (
                    <TouchableOpacity style = {styles.card} onPress = {() => {
                        this.props.navigation.navigate('Stall', {
                            stallName: item.stallName,
                            firebaseId: item.id,
                            stallId: item.stallId,
                            stallRating: item.overallStallRating,
                            stallDesc: item.desc,
                            address: item.address,
                            openingHours: item.monTofriOpening.toDate(),
                            closingHours: item.monTofriClosing.toDate(),
                            image: item.image
                        })
                    }}>
                        <Image source = {{uri: item.image}} style = {{...styles.image, opacity: !this.checkOpenClosed(item.monTofriOpening.toDate(), item.monTofriClosing.toDate()) ? 0.4 : 1}}/>
                        <Text style = {{fontSize: 11, fontWeight: 'bold'}}>
                            {item.stallName}
                        </Text>
                        <Text style = {{fontSize: 11, color: 'gray'}}>
                            {item.address}
                        </Text>
                        <View style = {{flexDirection: 'row'}}>
                            <View style = {{flexDirection: 'row', flex: 1.8}}>
                                <Ionicons name='ios-star' style = {{color:'#f0ca00', fontSize: 15, marginRight: 2}} />
                                <Text style = {{fontSize: 12, marginTop: 1}}>
                                    {item.overallStallRating}
                                </Text>
                            </View>
                            {this.checkStallStatus2(item.monTofriOpening.toDate(), item.monTofriClosing.toDate())}
                        </View>
                    </TouchableOpacity>
                    )}
                keyExtractor={ item => item.stallId} />
            );
        }

        return(
            <View style = {styles.container}>
                <AppStatusBar>
                    <SearchBar
                        //style
                        containerStyle = {{backgroundColor: 'tomato', paddingHorizontal: 10, borderTopColor: 'transparent'}}
                        inputContainerStyle = {{backgroundColor: 'white', height: 40, bottom: 3}}
                        inputStyle = {{fontSize: 15, color: 'black'}}
                        lightTheme
                        //function
                        placeholder="Search for stalls.."
                        onChangeText={this.updateSearch}
                        value={search}
                        onClear={() => {this.setState({stalls: this.state.allStalls})}}
                    />
                </AppStatusBar>
                <SafeAreaView style = {styles.container}>
                    <ScrollView>
                        { search == '' &&
                            <View style = {{flex: 2}}>
                                { (latestStalls.length > 0 || newMenu.length > 0) && 
                                <View>
                                    <Text style = {{fontSize: 23, marginLeft: 10, marginTop: 15, marginBottom: 15, color: 'black', fontWeight: 'bold' }}>
                                            What's New?
                                    </Text>
                                    {renderCarousel(latestStalls)}
                                
                                    <FlatList 
                                    style = {{backgroundColor: '#00000005'}}
                                    data = {newMenu}
                                    horizontal = {true}
                                    showsHorizontalScrollIndicator = {false}
                                    renderItem={ ({ item }) => (
                                        <TouchableOpacity onPress={() => {this.props.navigation.navigate('FoodModal', {
                                            foodName: item.foodName,
                                            foodId: item.foodId,
                                            foodRating: item.overallFoodRating,
                                            foodDesc: item.desc,
                                            foodPrice: item.price,
                                            refId: item.refId,
                                            stallName: item.stallName,
                                            image: item.image,
                                            stallId: item.stallId,
                                            })
                                        }}
                                        style = {{padding: 15, marginTop: 5,
                                            shadowColor: "#000",
                                            shadowOffset: {
                                                width: 0,
                                                height: 2
                                            },
                                            shadowOpacity: 0.3,
                                            shadowRadius: 3.84,}}
                                            >
                                                <ImageBackground source = {{uri: item.image}} style = {{height: 120, flex: 1, borderRadius: 5, marginRight: 10, justifyContent: 'flex-end'}}>
                                                <View style = {{padding: 10, backgroundColor: 'rgba(0, 0, 0, .4)'}}>
                                                    <View style = {{flexDirection: 'row'}}>
                                                        <Text style = {{color: 'white', fontWeight: 'bold'}}>{item.foodName}{" "}</Text>
                                                        <View style = {{flexDirection: 'row', flex: 1.8, alignSelf: 'flex-end', justifyContent: 'flex-end'}}>
                                                            <Ionicons name='ios-star' style = {{color:'#f0ca00', fontSize: 15, marginRight: 2}} />
                                                            <Text style = {{fontSize: 12, marginTop: 1, color: 'white'}}>
                                                                {item.overallFoodRating}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <Text style = {{color: 'white'}}>{item.stallName}</Text>
                                                    <Text style = {{color: 'white', fontSize: 10}}>{item.address}</Text>
                                                </View>
                                            </ImageBackground>  
                                        </TouchableOpacity>
                                    )}
                                    keyExtractor={ item => item.foodId}/>
                                </View>
                                }
                                { lastReviewedStall != '' ? 
                                <View>
                                    <Text style = {{fontSize: 23, marginLeft: 10, marginTop: 15, marginBottom: 15, color: 'black', fontWeight: 'bold' }}>
                                            Because you last reviewed for
                                            {"\n"}
                                            <Text style = {{fontSize: 18, fontStyle: 'italic'}}>{this.state.lastReviewedStall}</Text>
                                    </Text>
                                    {renderCarousel(sameCuisineStalls)}
                                </View>
                                :
                                <View>
                                    <Text style = {{fontSize: 23, marginLeft: 10, marginTop: 15, marginBottom: 15, color: 'black', fontWeight: 'bold' }}>
                                            Reviewed Recently 
                                    </Text>
                                    {renderCarousel(sameCuisineStalls)}
                                </View>
                                }
                            </View>
                        }
                        <View style = {{flex: 2,}}>
                            {search == '' && 
                                <View style = {{flex: 1.8, flexDirection: 'row'}}>
                                    <Text style = {{...styles.text, color: 'black', fontWeight: 'bold', fontSize: 23, marginBottom: 15}}>
                                        All Stalls
                                    </Text>
                                    { filterStyle == styles.filterOn && 
                                    <TouchableOpacity style = {{borderWidth: 1, borderColor: 'tomato', padding: 2, borderRadius: 5, height: 23, marginRight: 10, alignSelf: 'center'}}
                                        onPress = {() => this.resetFilter()}>
                                            <Text style = {{color: 'tomato', flex: 1}}>Reset</Text>
                                    </TouchableOpacity>
                                    }
                                    <View style = {{marginTop: 10}}>
                                    <AppModalFilter onPress = {() => this.filter(status)} style = {filterStyle}>
                                        <Text style = {{fontWeight: 'bold'}}>Status:</Text>
                                        <Picker style = {styles.picker}
                                            selectedValue = {status} onValueChange = {(itemValue, itemIndex) => this.handleStatus(itemValue)} 
                                        >
                                            <Picker.Item value='0' label='All' />
                                            <Picker.Item value='1' label='Open' />
                                            <Picker.Item value='-1' label='Closed' />
                                        </Picker>
                                        <Text style = {{fontWeight: 'bold', marginTop: -70}}>Type:</Text>
                                        <View style = {{flexDirection: 'row', marginBottom: 10}}>
                                            <TouchableOpacity style = {styles.cuisineButton}
                                                onPress = {() => this.selectStallType(0)}>
                                                    <Ionicons name = {stallTypeIcon[0]} style = {styles.cuisineText}/>
                                                    <Text>All</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style = {styles.cuisineButton}
                                            onPress = {() => this.selectStallType(1)}>
                                                <Ionicons name = {stallTypeIcon[1]} style = {styles.cuisineText}/>
                                                <Text>Restaurants</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style = {styles.cuisineButton}
                                            onPress = {() => this.selectStallType(2)}>
                                                <Ionicons name = {stallTypeIcon[2]} style = {styles.cuisineText}/>
                                                <Text>Hawker Stalls</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <Text style = {{fontWeight: 'bold', }}>Cuisine Types:</Text>
                                        <View style = {{flexDirection: 'row', marginTop: 5}}>
                                            <TouchableOpacity style = {styles.cuisineButton}
                                            onPress = {() => this.selectCuisine(0)}>
                                                <Ionicons name = {cuisineIcon[0]} style = {styles.cuisineText}/>
                                                <Text>All</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity style = {styles.cuisineButton}
                                            onPress = {() => this.selectCuisine(1)}>
                                                <Ionicons name = {cuisineIcon[1]} style = {styles.cuisineText}/>
                                                <Text>Chinese</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity style = {styles.cuisineButton}
                                            onPress = {() =>this.selectCuisine(2)}>
                                                <Ionicons name = {cuisineIcon[2]} style = {styles.cuisineText}/>
                                                <Text>Western</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View style = {{flexDirection: 'row', marginBottom: 30}}>
                                            <TouchableOpacity style = {styles.cuisineButton}
                                            onPress = {() => this.selectCuisine(3)}>
                                                <Ionicons name = {cuisineIcon[3]} style = {styles.cuisineText}/>
                                                <Text>Japanese/Korean</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity style = {styles.cuisineButton}
                                            onPress = {() => this.selectCuisine(4)}>
                                                <Ionicons name = {cuisineIcon[4]} style = {styles.cuisineText}/>
                                                <Text>Halal</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity style = {styles.cuisineButton}
                                            onPress = {() => this.selectCuisine(5)}>
                                                <Ionicons name = {cuisineIcon[5]} style = {styles.cuisineText}/>
                                                <Text>Others</Text>
                                            </TouchableOpacity>
                                        </View>
                                        
                                    </AppModalFilter>
                                    </View>
                                </View>
                            }
                            <View style = {{flex: 8}}>
                            { stalls != '' ? 
                                <FlatList 
                                style = {{backgroundColor: '#00000005'}}
                                data={stalls} 
                                extraData={this.state}
                                renderItem={ ({ item }) => (
                                    <TouchableOpacity onPress = {() => {
                                        this.props.navigation.navigate('Stall', {
                                            stallName: item.stallName,
                                            firebaseId: item.id,
                                            stallId: item.stallId,
                                            stallRating: item.overallStallRating,
                                            stallDesc: item.desc,
                                            address: item.address,
                                            openingHours: item.monTofriOpening.toDate(),
                                            closingHours: item.monTofriClosing.toDate(),
                                            image: item.image
                                        })
                                    }}>
                                        <View style = {{flexDirection: 'row'}}>
                                            <View style = {{flex: 1, marginRight: 15}}>
                                                {this.checkStallStatus(item.monTofriOpening.toDate(), item.monTofriClosing.toDate())}
                                                <Image source = {{uri: item.image}} style = {{...styles.image2, opacity: !this.checkOpenClosed(item.monTofriOpening.toDate(), item.monTofriClosing.toDate()) ? 0.4 : 1}}/>
                                            </View>
                                            <View style = {{flex: 2, alignSelf: 'center'}}>
                                                <Text style = {{fontSize: 15, marginLeft: 5, fontWeight: 'bold'}}>
                                                    {item.stallName}
                                                </Text> 
                                                <Text style = {{fontSize: 13, marginLeft: 5, color: 'gray', marginBottom: 5}}>
                                                    {item.cuisineType}
                                                </Text>
                                                <Text style = {{fontSize: 15, marginLeft: 5, marginBottom: 3}}>
                                                    {item.address}
                                                </Text>
                                                <View style = {{flexDirection: 'row', marginLeft: 5}}>
                                                    <Ionicons name='ios-star' style = {{color:'#f0ca00', fontSize: 15, marginRight: 2}} />
                                                    <Text style = {{fontSize: 12, marginTop: 1}}>
                                                        {item.overallStallRating}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Ionicons name='ios-arrow-forward' style = {styles.icon} />
                                        </View>
                                        <View style = {styles.seperator} />
                                    </TouchableOpacity>
                                )}
                                keyExtractor={ item => item.stallId } />
                                :
                                <Text style = {{alignSelf: 'center', marginTop: 50}}>No stalls found</Text>
                                }
                            </View>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    text: {
        alignItems:'flex-start',
        fontSize: 23,
        marginTop: 10,
        marginLeft: 10,
        flex: 15
    },
    seperator: {
        height: 1,
        width: "100%",
        backgroundColor: 'silver',
    },
    icon: {
        color: 'gray',
        fontSize: 25,
        marginTop: 15,
        flex: 0.3,
        alignSelf: 'center'
    },
    card: {
        backgroundColor: 'white',
        margin: 10,
        height: 180,
        width: 150,
        borderRadius: 5,
        // borderWidth: 1,
        // borderColor: '#00000008',
        paddingLeft: 5,
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2
        },
        shadowOpacity: 0.3,
        shadowRadius: 3.84,
    },
    image: {
        height: 120, 
        width: 150, 
        borderTopLeftRadius: 5, 
        borderTopRightRadius: 5,
        marginBottom: 5,
        right: 5,
    },
    image2: {
        margin: 10, 
        width: 100, 
        height: 100, 
        marginLeft: 15,
        borderRadius: 5,
    },
    picker: {
        width:200,
        borderColor: '#DCDCDC', 
        top: -50,
        alignSelf: 'center'
    },
    cuisineButton: {
        flexDirection: 'row', 
        margin: 10
    },
    cuisineText: {
        color: 'tomato', 
        marginTop: 2.5, 
        marginRight: 3
    },
    textStyle: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
    },
    filterOn: {
        color: 'tomato'
    },
    filterOff: {
        color: 'gray'
    }
  });