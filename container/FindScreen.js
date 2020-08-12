import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, ActivityIndicator, FlatList, 
    TouchableOpacity, ScrollView, Image, ImageBackground, SectionList, Animated, Dimensions } from 'react-native';
import firebaseDb from '../firebaseDb'
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SearchBar } from 'react-native-elements';
import OpeningStatus from '../component/OpeningStatus'
import AppStatusBar from '../component/AppStatusBar'
import CampusMap from '../component/CampusMap'
import { Marker, Callout } from 'react-native-maps';
import * as Permissions from 'expo-permissions';
import * as Location from 'expo-location';
import { orderByDistance, getDistance } from 'geolib';

const { width } = Dimensions.get('window');

export default class Findscreen extends React.Component {
    state = {
        active: 0,
        translateX: new Animated.Value(0),
        translateXCategory: new Animated.Value(width),
        translateXDistance: new Animated.Value(0),
        translateY: -1000,
        xDistance: 0,
        xCategory: 0,

        isLoading: true,
        hawkers: null,
        isLoading2: true,
        standaloneStalls: null,
        search: '',
        allHawkers: null,
        allStalls: null,
        myLocation: null,
        school: {
            latitude: 1.296551, 
            longitude: 103.776378,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        },

        peek: false,
        peekIcon: 'ios-eye',
        food: null,
        hawkerStall: null,

        nearest: [],
        sectionList: [],
        section: [
            {
                name: 'Science',
                latitude: 1.296077,
                longitude: 103.779234,
                radius: 300,
                area: []
            },
            {
                name: 'USC-Yusof Ishak',
                latitude: 1.298993,
                longitude: 103.775241,
                radius: 200,
                area: []
            },
            {
                name: 'Engineering',
                latitude: 1.299358,
                longitude: 103.771495,
                radius: 200,
                area: []
            },
            {
                name: 'Arts/Computing/Biz',
                latitude: 1.294020,
                longitude: 103.773318,
                radius: 250,
                area: []
            },
            {
                name: 'Prince Geroges Park Residence',
                latitude: 1.290866,
                longitude: 103.781043,
                radius: 200,
                area: []
            },
            {
                name: 'University Town',
                latitude: 1.305537,
                longitude: 103.773050,
                radius: 300,
                area: []
            }
        ]
    }

    handleSlide = type => {
        let { active, translateX, translateXDistance, translateXCategory } = this.state;
        Animated.spring(translateX, {
            toValue: type,
            duration: 100
        }).start();

        if (active === 0) {
            Animated.parallel([
                Animated.spring(translateXDistance, {
                    toValue: 0,
                    duration: 100
                }).start(),
                Animated.spring(translateXCategory, {
                    toValue: width,
                    duration: 100
                }).start()
            ])
        } else {
            Animated.parallel([
                Animated.spring(translateXDistance, {
                    toValue: -width,
                    duration: 100
                }).start(),
                Animated.spring(translateXCategory, {
                    toValue: 0,
                    duration: 100
                }).start()
            ])
        }
    }

    componentDidMount() { 
        this._unsubscribe = this.props.navigation.addListener('focus', () => {
            firebaseDb
            .firestore()
            .collection('hawker')
            .get()
            .then(querySnapshot => {
                const results = []
                querySnapshot.docs.map(documentSnapshot => {
                    if (documentSnapshot.data().hawkerId != 'H07') {
                        results.push({
                            ...documentSnapshot.data(),
                            id: documentSnapshot.id
                        })
                    }
                }) 
                this.setState({isLoading: false, hawkers: results, allHawkers: results})
                this.retrieveStalls()
            }).catch(err => console.error(err)) 

            
            this.getMyLocation();

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
            const stalls = []
            let l = []
            querySnapshot.forEach(doc => {
                if (doc.data().hawkerId == 'H07') {
                    stalls.push(doc.data())
                } else {
                    l.push(doc.data())
                }
            })
            this.setState({standaloneStalls: stalls, allStalls: stalls, hawkerStall: l})
            this.retrieveFood()
            this.findNearestLocations()
        }).catch(err => console.error(err)) 
    }

    retrieveFood = () => {
        firebaseDb
        .firestore()
        .collection('food')
        .get()
        .then(querySnapshot => {
            const results = []
            querySnapshot.forEach(doc => {
                results.push(doc.data())
            })
            results.sort((a,b) => new Date(b.creationDate.toDate()) - new Date(a.creationDate.toDate()))
            this.setState({food: results})
        })
    }
    

    updateSearch = text => {
        this.setState({search: text});

        const newHawkers = this.state.hawkers.filter(item => {
            const itemData = `${item.hawkerName.toUpperCase()}`;
            const textData = text.toUpperCase();
            return itemData.includes(textData); // this will return true if our itemData contains the textData
          });

        const newStalls = this.state.standaloneStalls.filter(item => {
            const itemData = `${item.stallName.toUpperCase()}`;
            const textData = text.toUpperCase();
            return itemData.includes(textData); // this will return true if our itemData contains the textData
        });
        
        if (text != '') {
            this.setState({
                hawkers: newHawkers,
                standaloneStalls: newStalls
            });
        } else {
            this.setState({
                hawkers: this.state.allHawkers,
                standaloneStalls: this.state.allStalls
            })
        }
    };

    getMyLocation = async () => {
        let { status } = await Permissions.askAsync(Permissions.LOCATION);
        if (status !== 'granted') {
            this.setState({
                myLocation: 'Permission denied',
            });
        }
        let location = await Location.getCurrentPositionAsync({});
        this.setState({
            myLocation: {
                latitude: location.coords.latitude, 
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }
        });
    };

    createMarkers = () => {
        return this.state.allHawkers.map(item => {
            return (
                <Marker 
                    key = {item.id}
                    coordinate={{
                        latitude: item.coordinate.latitude, 
                        longitude: item.coordinate.longitude
                    }}
                    image = {require('../assets/marker.png')}
                >
                    <Callout onPress = {() => {
                            this.props.navigation.navigate('Hawker', {
                            hawkerName: item.hawkerName,
                            firebaseId: item.id,
                            hawkerId: item.hawkerId,
                            hawkerAdd: item.address,
                            hawkerDesc: item.desc,
                            image: item.image
                        })
                    }}>
                        <View>
                            <Text style = {{fontSize: 18, flexDirection: 'row'}}>
                                {item.hawkerName}
                            </Text>
                            <Text style = {{fontSize: 12, color: 'gray'}}>
                                {item.address}
                            </Text>
                        </View>
                    </Callout>
                </Marker>
            );
        });
    }

    createStallMarkers= () => {
        return this.state.standaloneStalls.map(item => {
            return (
                <Marker 
                    key = {item.stallId}
                    coordinate={{
                        latitude: item.coordinate.latitude, 
                        longitude: item.coordinate.longitude
                    }}
                    
                >
                    <Callout onPress = {() => {
                        this.props.navigation.navigate('Stall', {
                            stallName: item.stallName,
                            firebaseId: item.id,
                            stallId: item.stallId,
                            stallRating: item.overallStallRating,
                            stallDesc: item.desc,
                            hawkerName: '',
                            hawkerId: '',
                            address: item.address,
                            openingHours: item.monTofriOpening.toDate(),
                            closingHours: item.monTofriClosing.toDate(),
                            image: item.image
                        })
                    }}>
                        <View>
                            <Text style = {{fontSize: 18, flexDirection: 'row'}}>
                                {item.stallName}
                            </Text>
                            <Text style = {{fontSize: 12, color: 'gray'}}>
                                {item.address} {" "}
                                <Ionicons name='ios-star' style = {{color:'#FFD700', fontSize: 12}} />
                                {" "}{item.overallStallRating}
                            </Text>
                            {this.checkStallStatus2(item.monTofriOpening.toDate(), item.monTofriClosing.toDate())}
                        </View>
                    </Callout>
                </Marker>
            );
        });
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
                <OpeningStatus style = {{color: 'green',}}>
                    Open
                </OpeningStatus>
            );
        } else  {
            return (
                <OpeningStatus style = {{color: 'red',}}>
                    Closed
                </OpeningStatus>
            );
        }
    }

    getAllCoordinates = () => {
        let arrayOfPointsLatitude = []
        let arrayOfPointsLongitude = []
        this.state.allHawkers.forEach(i => {
            arrayOfPointsLatitude.push(i.coordinate.latitude)
            arrayOfPointsLongitude.push(i.coordinate.longitude)
        })
        this.state.allStalls.forEach(i => {
            arrayOfPointsLatitude.push(i.coordinate.latitude)
            arrayOfPointsLongitude.push(i.coordinate.longitude)
        })
        let arrayOfPoints = arrayOfPointsLatitude.map(function(c, i) { return [ c, arrayOfPointsLongitude[i] ] })
        let coordinates = []

        arrayOfPoints.forEach(p => {
            coordinates.push({
                latitude: p[0],
                longitude: p[1]
            })
        })

        return coordinates
    }

    setArr = (c, arr) => {
        this.state.allHawkers.forEach(h => {
            if (c.latitude == h.coordinate.latitude && c.longitude == h.coordinate.longitude) {
                arr.push({
                    type: 'Hawker Centre',
                    name: h.hawkerName,
                    location: h.address,
                    coordinate: h.coordinate,
                    distance: (getDistance(this.state.school, c)/1000).toFixed(2),
                    image: h.image,
                    rating: -1,
                    status: 'NA',

                    typeId: h.hawkerId,
                    desc: h.desc,
                    id: h.id,
                    openingHours: null,
                    closingHours: null,

                })
            }
        })
        this.state.allStalls.forEach(s => {
            if (c.latitude == s.coordinate.latitude && c.longitude == s.coordinate.longitude) {
                arr.push({
                    type: 'Restaurant',
                    name: s.stallName,
                    location: s.address,
                    coordinate: s.coordinate,
                    cuisineType: s.cuisineType,
                    distance: (getDistance(this.state.school, c)/1000.0).toFixed(2),
                    image: s.image,
                    rating: s.overallStallRating,
                    status: this.checkOpenClosed(s.monTofriOpening.toDate(), s.monTofriClosing.toDate()) ? 'Open' : 'Closed',

                    typeId: s.stallId,
                    desc: s.desc,
                    id: s.id,
                    openingHours: s.monTofriOpening.toDate(),
                    closingHours: s.monTofriClosing.toDate(),
                })
            }
        })
    }

    findNearestLocations = () => {
        const { section } = this.state
        
        let coordinates = this.getAllCoordinates()

        let sortedCoordinates = orderByDistance(this.state.school, coordinates)
        let nearestLocations = []
        let count = 0
        sortedCoordinates.forEach(c => {
            if ( count < 5 ) {
                this.setArr(c, nearestLocations)
                count++
            }
        })

        let sortedSection = orderByDistance(this.state.school, section)
        let filteredSection = []
        count = 0
        sortedSection.forEach(x => {
            let areas = []
            sortedCoordinates.forEach(c => {
                if (getDistance(x, c) <= x.radius) {
                    this.setArr(c, areas)
                }
            })
            filteredSection.push({
                title: x.name,
                data: areas
            })
            count++
        })
    
        this.setState({ nearest: nearestLocations, isLoading2: false, sectionList: filteredSection })
    }

    navigateToNearest = (item) => {
        if (item.type == 'Hawker Centre') {
            this.props.navigation.navigate('Hawker', {
                hawkerName: item.name,
                firebaseId: item.id,
                hawkerId: item.typeId,
                hawkerAdd: item.location,
                hawkerDesc: item.desc,
                image: item.image
            }) 
        } else {
            this.props.navigation.navigate('Stall', {
                stallName: item.name,
                firebaseId: item.id,
                stallId: item.typeId,
                stallRating: item.rating,
                stallDesc: item.desc,
                address: item.location,
                openingHours: item.openingHours,
                closingHours: item.closingHours,
                image: item.image
            })
        }
    }

    peekFood = () => {
        if ( this.state.peek ) {
            this.setState({ peek: false, peekIcon: 'ios-eye' })
        } else {
            this.setState({ peek: true, peekIcon: 'ios-eye-off' })
        }
    }

    peekHawkerStall = (hawkerId) => {
        let newArr = []
        let count = 0
        this.state.hawkerStall.forEach(s => {
            if (hawkerId == s.hawkerId && count < 3) {
                newArr.push(s)
            }
        })
        return newArr
    }

    peekRestaurant = (stallId) => {
        let newArr = []
        let count = 0
        this.state.food.forEach(f => {
            if (stallId == f.stallId && count < 3) {
                newArr.push(f)
            }
        })
        return newArr
    }

    render() {
        const { isLoading, hawkers, isLoading2, standaloneStalls, search, myLocation, school, nearest, sectionList, 
            xDistance, xCategory, translateX, translateY, active, translateXDistance, translateXCategory,
            peek, peekIcon} = this.state
            
        if (isLoading || isLoading2)
          return <ActivityIndicator style = {{alignSelf: 'center', flex: 1}} size = 'large' color= 'tomato' />

        return(
            <View style = {styles.container}>
                <AppStatusBar>
                    <View style = {{flexDirection: 'row', bottom: -2}}>
                        <SearchBar
                            //style
                            containerStyle = {{backgroundColor: 'tomato', paddingHorizontal: 10, borderTopColor: 'transparent', flex: 1}}
                            inputContainerStyle = {{backgroundColor: 'white', height: 40, bottom: 3}}
                            inputStyle = {{fontSize: 15, color: 'black'}}
                            lightTheme
                            //function
                            placeholder="Search for hawker centres..."
                            onChangeText={text => {
                                this.setState({active: 1})
                                this.updateSearch(text)
                            }}
                            value={search}
                            onClear={() => {this.setState({hawkers: this.state.allHawkers})}}
                        />
                        <TouchableOpacity style = {{marginRight: 10, alignSelf: 'center'}} onPress = {() => this.peekFood()}>
                            <Ionicons name = {peekIcon} style = {{fontSize: 30, color: 'white'}} />
                        </TouchableOpacity>
                    </View>
                </AppStatusBar>
                <SafeAreaView style = {styles.container}>
                <ScrollView>
                    {search == '' && 
                    //change school to myLocation for GPS to work
                    <View>
                        <CampusMap initialRegion = {school}>
                            <Marker 
                                coordinate={{
                                    latitude: school.latitude, 
                                    longitude: school.longitude
                                }}
                                image = {require('../assets/current-location.png')}
                            />

                            {this.createMarkers()}
                            {this.createStallMarkers()}
                        </CampusMap> 

                        <View style = {{flexDirection: 'row', alignSelf: 'flex-end', marginRight: 10}}>
                            <Animated.View style={{ position: 'absolute', width: '50%', height: '100%', top: 0, left: 0, backgroundColor: 'white', borderRadius: 4, transform: [{ translateX }] }} />
                            <TouchableOpacity style = {{padding: 10, borderWidth: 1, borderColor: 'tomato', backgroundColor: active === 0 ? "tomato" : "white"}}
                            onLayout={event => this.setState({ xDistance: event.nativeEvent.layout.x })}
                            onPress={() => this.setState({ active: 0 }, () => this.handleSlide(xDistance))}>
                                <Text style = {{color: active === 0 ? "white" : "tomato"}}>By Distance</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style = {{padding: 10, borderWidth: 1, borderColor: 'tomato', backgroundColor: active === 1 ? "tomato" : "white"}}
                            onLayout={event => this.setState({ xCategory: event.nativeEvent.layout.x })}
                            onPress={() => this.setState({ active: 1 }, () => this.handleSlide(xCategory))}>
                                <Text style = {{color: active === 1 ? "white" : "tomato"}}>By Category</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    }
                    {(active === 0) ?
                    <Animated.View
                        style={{ flex: 1, height: '100%', transform: [{ translateX: translateXDistance }] }}
                        onLayout={event => this.setState({ translateY: event.nativeEvent.layout.height })}
                    >
                    {search == '' && 
                        <View>
                            <Text style = {{...styles.text, color: '#424242', fontWeight: 'bold'}}>
                                Around you
                            </Text>
                            <FlatList 
                            style = {{backgroundColor: '#00000005'}}
                            horizontal = {true}   
                            showsHorizontalScrollIndicator = 'false'                     
                            data={nearest} 
                            renderItem={ ({ item }) => (
                                <TouchableOpacity style = {{padding: 15}} onPress = {() => this.navigateToNearest(item)}>
                                    <ImageBackground source = {{uri: item.image}} style = {styles.image} imageStyle= {{ opacity: item.status == 'Closed' ? 0.3 : 1}}> 
                                        <View style = {{padding: 10, backgroundColor: 'rgba(0, 0, 0, .4)'}} >
                                            <Text style = {{fontSize: 20, color: 'white', fontWeight: 'bold'}}>{item.name}</Text>
                                            { item.type == 'Restaurant' ?
                                            <Text style = {{color: '#EBDEF0', fontWeight: 'bold', fontSize: 12}}>{item.type}, {item.cuisineType}</Text>
                                            :    
                                            <Text style = {{color: '#D6EAF8', fontWeight: 'bold', fontSize: 12}}>{item.type}</Text>
                                            }
                                            <Text style = {{color: 'white', fontSize: 12, marginBottom: 10}}>{item.location}</Text>
                                            { item.rating >-1 &&
                                                <View style = {{flexDirection: 'row', alignSelf: 'flex-end'}}>
                                                    <Ionicons name='ios-star' style = {{color:'#f0ca00', fontSize: 15, marginRight: 2}} />
                                                    <Text style = {{fontSize: 12, marginTop: 1, color: 'white'}}>
                                                        {item.rating} {" "}
                                                    </Text>
                                                    { item.status == 'Open' ?
                                                    <Text style = {{color: 'lime'}}>
                                                        {item.status}
                                                    </Text>
                                                    :
                                                    <Text style = {{color: '#FF3333'}}>
                                                        {item.status}
                                                    </Text>
                                                    }
                                                </View>  
                                            }
                                            <Text style = {{alignSelf: 'flex-end', color: 'white', fontSize: 10, fontWeight: 'bold'}}>{item.distance}km away from you</Text>
                                        </View>
                                    </ImageBackground>
                                </TouchableOpacity>  
                            )}
                            keyExtractor={ item => item.name } 
                            />

                            <Text style = {{...styles.text, color: '#424242', fontWeight: 'bold', backgroundColor: 'white'}}>Nearest Area</Text>
                            <SectionList 
                            sections = {sectionList}
                            style = {{backgroundColor: '#00000005'}}
                            renderItem={({ item }) => (
                                <TouchableOpacity style ={{padding: 15}} onPress = {() => this.navigateToNearest(item)}>
                                    <ImageBackground source = {{uri: item.image}} style = {{flex: 1}} imageStyle= {{ opacity: peek == false ? (item.status == 'Closed' ? 0.15 : 1) : 0.15}}> 
                                        <View style = {{padding: 10, backgroundColor: 'rgba(0, 0, 0, .3)'}} >
                                            <Text style = {{color: 'white', fontWeight: 'bold', fontSize: 18}}>{item.name}</Text>
                                            { peek == false ? 
                                            <View>
                                            { item.type == 'Restaurant' ?
                                            <Text style = {{color: '#EBDEF0', fontWeight: 'bold', fontSize: 14}}>{item.type}, {item.cuisineType}</Text>
                                            :    
                                            <Text style = {{color: '#D6EAF8', fontWeight: 'bold', fontSize: 14}}>{item.type}</Text>
                                            }
                                            <Text style = {{color: 'white', fontSize: 15, marginBottom: 10}}>{item.location}</Text>
                                            </View>
                                            :
                                            <View>
                                                { item.type == 'Restaurant' ?
                                                <View>
                                                    <Text style = {{padding: 5, fontWeight: 'bold', color: '#EBDEF0'}}>Menu</Text>
                                                    <FlatList 
                                                        horizontal = {true}
                                                        data = {this.peekRestaurant(item.typeId)}
                                                        renderItem={ ({ item }) => (
                                                            <View style = {{paddingVertical: 2, paddingHorizontal: 5, width: 100, marginRight: 10}}>
                                                                <Image source = {{uri: item.image}} style = {{flex: 1, borderTopLeftRadius: 5, borderTopRightRadius: 5, height: 50}}/>
                                                                <View style = {{backgroundColor: 'white', padding: 2, borderBottomRightRadius: 5, borderBottomLeftRadius: 5, opacity: 0.9}}>
                                                                    <Text style = {{fontSize: 12}}>{item.foodName}</Text>
                                                                    <View style = {{flexDirection: 'row', alignSelf: 'flex-start'}}>
                                                                        <Text style = {{fontWeight: 'bold', color: '#A9DFBF', fontSize: 14, marginLeft: 1}}>$</Text>
                                                                        <Text style = {{fontSize: 12, marginLeft: 1}}>
                                                                            {" "}{Number(item.price).toFixed(2)}
                                                                        </Text>
                                                                    </View>
                                                                    <View style = {{flexDirection: 'row', alignSelf: 'flex-start'}}>
                                                                        <Ionicons name='ios-star' style = {{color:'#FFD700', fontSize: 14}} />
                                                                        <Text style = {{fontSize: 12}}>
                                                                            {" "}{Number(item.overallFoodRating).toFixed(2)}
                                                                        </Text>
                                                                    </View>
                                                                </View>
                                                            </View>
                                                        )}
                                                        keyExtractor={ item => item.foodId }
                                                    />
                                                </View>
                                                :
                                                <View>
                                                    <Text style = {{padding: 5, fontWeight: 'bold', color: '#D6EAF8'}}>Stalls</Text>
                                                    <FlatList 
                                                        horizontal = {true}
                                                        data = {this.peekHawkerStall(item.typeId)}
                                                        renderItem={ ({ item }) => (
                                                            <View style = {{paddingVertical: 2, paddingHorizontal: 5, width: 100, marginRight: 10}}>
                                                                <Image source = {{uri: item.image}} style = {{flex: 1, borderRadius: 5, height: 50}}/>
                                                                <View style = {{backgroundColor: 'white', padding: 2, borderBottomRightRadius: 5, borderBottomLeftRadius: 5, opacity: 0.9}}>
                                                                    <Text style = {{fontSize: 12}}>{item.stallName}</Text>
                                                                    <View style = {{flexDirection: 'row', alignSelf: 'flex-start'}}>
                                                                        <Ionicons name='ios-star' style = {{color:'#FFD700', fontSize: 14}} />
                                                                        <Text style = {{fontSize: 12}}>
                                                                            {" "} {item.overallStallRating.toFixed(2)}
                                                                        </Text>
                                                                    </View>
                                                                </View>
                                                            </View>
                                                        )}
                                                        keyExtractor={ item => item.stallId }/>
                                                </View>
                                                }
                                            </View>
                                            }
                                            { item.rating >-1 &&
                                                <View style = {{flexDirection: 'row', alignSelf: 'flex-end'}}>
                                                    <Ionicons name='ios-star' style = {{color:'#f0ca00', fontSize: 15, marginRight: 2}} />
                                                    <Text style = {{fontSize: 12, marginTop: 1, color: 'white', fontWeight: 'bold'}}>
                                                        {item.rating} {" "}
                                                    </Text>
                                                    { item.status == 'Open' ?
                                                    <Text style = {{color: 'lime', fontWeight: 'bold'}}>
                                                        {item.status}
                                                    </Text>
                                                    :
                                                    <Text style = {{color: '#FF3333', fontWeight: 'bold'}}>
                                                        {item.status}
                                                    </Text>
                                                    }
                                                </View>  
                                            }
                                            <Text style = {{alignSelf: 'flex-end', color: 'white', fontSize: 12, fontWeight: 'bold'}}>{item.distance}km away from you</Text>
                                        </View>
                                    </ImageBackground>
                                </TouchableOpacity>
                            )}
                            renderSectionHeader={({ section }) => (
                                <Text style = {{...styles.text, color: 'tomato', fontWeight: 'bold', fontSize: 20, backgroundColor: 'white'}}>{section.title}</Text>
                            )}
                            keyExtractor={(item, index) => index} />
                        </View>
                    }
                    </Animated.View>
                    :
                    <Animated.View style={{ flex: 1, transform: [{ translateX: translateXCategory }] }}>
                        <Text style = {{...styles.text, color: '#424242', fontWeight: 'bold'}}>
                            All Hawker Centres
                        </Text>
                        <FlatList 
                        style = {{backgroundColor: '#00000005'}}
                        horizontal = {true}
                        showsHorizontalScrollIndicator = 'false'
                        data={hawkers} 
                        extraData={this.state}
                        renderItem={ ({ item }) => (
                            <TouchableOpacity style = {styles.list} onPress = {() => {
                                this.props.navigation.navigate('Hawker', {
                                    hawkerName: item.hawkerName,
                                    firebaseId: item.id,
                                    hawkerId: item.hawkerId,
                                    hawkerAdd: item.address,
                                    hawkerDesc: item.desc,
                                    image: item.image
                                })
                            }}>
                                <View style ={styles.hawker}>       
                                    <ImageBackground source = {{uri: item.image}} style = {styles.image}>
                                        <View style = {{backgroundColor: 'rgba(0, 0, 0, .5)'}}>
                                            <Text style ={{color: 'white', fontSize: 20, alignSelf: 'center', opacity: 0.9, fontWeight: 'bold', textAlign: 'center', backgroundColor: 'transparent'}}>
                                                {item.hawkerName}
                                            </Text>
                                        </View>
                                    </ImageBackground>
                                </View>
                            </TouchableOpacity>
                        )}
                        keyExtractor={ item => item.hawkerId } />
                        <Text style = {{...styles.text, color: '#424242', marginTop: 20, fontWeight: 'bold'}}>
                            Restaurants
                        </Text>
                        <FlatList 
                            scrollEnabled='false'
                            data={standaloneStalls} 
                            extraData={this.state}
                            renderItem={ ({ item }) => (
                                <TouchableOpacity style = {styles.list} onPress = {() => {
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
                                            <Text style = {{fontSize: 20, marginLeft: 5 }}>
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
                        </Animated.View>
                    }
                    </ScrollView>
                </SafeAreaView>
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
    belowStatusBar: {
        backgroundColor: 'tomato',
    },
    list: {
        position: 'relative',
        flex: 5,
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
    },
    item: {
        flexDirection: "row",
        justifyContent: 'space-evenly'
    },
    text: {
        alignItems:'flex-start',
        fontSize: 23,
        margin: 10,
        marginLeft: 15,
        flex:15
    },
    icon: {
        color: 'gray',
        fontSize: 25,
        marginTop: 15,
        flex: 0.3,
        alignSelf: 'center'
    },
    seperator: {
        height: 1,
        width: "100%",
        backgroundColor: 'silver',
    },
    image2: {
        margin: 10, 
        width: 100, 
        height: 100, 
        marginLeft: 15,
        borderRadius: 5,
    },
    image: {
        height: 130,
        width: 170, 
        borderRadius: 5, 
        justifyContent: 'center'
    },
    hawker: {
        margin: 10,
        marginLeft: 15, 
        marginTop: 15, 
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2
        },
        shadowOpacity: 0.3,
        shadowRadius: 3.84,
    }
  });