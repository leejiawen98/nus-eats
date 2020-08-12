import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, Image, FlatList, TouchableOpacity, ActivityIndicator,
        Picker, ImageBackground, Dimensions } from 'react-native';
import firebaseDb from '../firebaseDb'
import Ionicons from 'react-native-vector-icons/Ionicons';

import AppStatusBar from '../component/AppStatusBar'
import BackButtonWbg from '../component/BackButtonWbg'
import AppModal from '../component/AppModal'
import OpeningStatus from '../component/OpeningStatus'
import AppModalFilter from '../component/AppModalFilter';

export default class HawkerPage extends React.Component {
    state = {
        isLoading: true,
        stalls: null,
        allStalls: null,

        cuisineType: ['All', 'Chinese', 'Western', 'Japanese/Korean', 'Halal', 'Others'],
        cuisineIcon: ['ios-radio-button-on', 'ios-radio-button-off', 'ios-radio-button-off', 'ios-radio-button-off', 'ios-radio-button-off', 'ios-radio-button-off'],
        status: '0',
        filterStyle: styles.filterOff,

        sortIcon: 'ios-swap',
        sortStyle: styles.sortOff,

        peek: false,
        peekIcon: 'ios-eye',
        food: null,
        isLoading2: true
    }
    componentDidMount() { 
        const {hawkerId} = this.props.route.params
        firebaseDb
        .firestore()
        .collection('stall')
        .get()
        .then(querySnapshot => {
            const results = []
            querySnapshot.forEach(doc => {
                if (doc.data().hawkerId == hawkerId) {
                    results.push(doc.data())
                }
            })
            results.sort((a,b) => new Date(b.creationDate.toDate()) - new Date(a.creationDate.toDate()))
            this.setState({isLoading: false, stalls: results, allStalls: results})
        }).catch(err => console.error(err)) 

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
            this.setState({isLoading2: false, food: results})
        }).catch(err => console.error(err)) 
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
                <OpeningStatus style = {{color: 'green', alignSelf: 'flex-end', bottom: 5}}>
                    Open
                </OpeningStatus>
            );
        } else  {
            return (
                <OpeningStatus style = {{color: 'red', alignSelf: 'flex-end', bottom: 5}}>
                    Closed
                </OpeningStatus>
            );
        }
    }

    //FILTER
    handleStatus = (status) => this.setState({ status })
    
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

        const { sortIcon } = this.state
        let newArr = this.state.allStalls
        if ( sortIcon == 'md-arrow-forward') {
            newArr.sort((a,b) => a.overallStallRating - b.overallStallRating)
        } else if ( sortIcon == 'md-arrow-back' ) {
            newArr.sort((a,b) => b.overallStallRating - a.overallStallRating)
        }    
        this.setState({ stalls: newArr })
    }

    sort = () => {
        const { sortIcon, stalls } = this.state
        let newArr = stalls
        if ( sortIcon == 'ios-swap') {
            newArr.sort((a,b) => b.overallStallRating - a.overallStallRating)
            this.setState({ sortIcon: 'md-arrow-back', sortStyle: styles.sortOn, stalls: newArr})
        } else if ( sortIcon == 'md-arrow-back' ) {
            newArr.sort((a,b) => a.overallStallRating - b.overallStallRating)
            this.setState({ sortIcon: 'md-arrow-forward', sortStyle: styles.sortOn, stalls: newArr})
        } else {
            newArr.sort((a,b) => new Date(b.creationDate.toDate()) - new Date(a.creationDate.toDate()))
            this.setState({ sortIcon: 'ios-swap', sortStyle: styles.sortOff, stalls: newArr})
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

    peekFood = () => {
        if ( this.state.peek ) {
            this.setState({ peek: false, peekIcon: 'ios-eye' })
        } else {
            this.setState({ peek: true, peekIcon: 'ios-eye-off' })
        }
    }

    peekMenu = (stallId) => {
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
        const { hawkerName, hawkerAdd, hawkerDesc, image } = this.props.route.params
        const { isLoading, isLoading2, stalls, filterStyle, cuisineIcon, status, sortIcon, sortStyle, peek, peekIcon } = this.state

        if (isLoading || isLoading2)
            return <ActivityIndicator style = {{alignSelf: 'center', flex: 1}} size = 'large' color= 'tomato' />

        return(
            <SafeAreaView style = {styles.container}>
                <AppStatusBar/>
                <BackButtonWbg onPress = {() => { this.props.navigation.goBack() }}/>
                <Image source = {{uri: image}} style = {{width: Dimensions.get('window').width, height: 240, position: 'absolute'}}/>
                <View style = {styles.hawkerImage} />
                <View style = {styles.header}>
                    <View style = {{flexDirection: 'row', flex: 1.5}}>
                        <Text style = {{fontWeight: 'bold', fontSize: 25, flex: 0.8,}}>
                            {hawkerName} {" "}
                        </Text>
                        <AppModal style = {{bottom: 2, flex: 1}}>
                            <Text style = {{textAlign: 'center', lineHeight: 25}}>
                                <Text style = {{fontWeight: 'bold'}}>Location: </Text>
                                {"\n"}
                                {hawkerAdd}
                                {"\n"}{"\n"}
                                <Text style = {{fontWeight: 'bold'}}>Opening Hours: </Text>
                                {"\n"}
                                {hawkerDesc}
                            </Text>
                        </AppModal>
                    </View>
                    <View style = {{flex: 1, flexDirection: 'row'}}>
                    <TouchableOpacity style = {{marginRight: 20, marginTop: 5}} onPress = {() => this.peekFood()}>
                        <Ionicons name = {peekIcon} style = {{fontSize: 30, color: 'tomato'}} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style = {{marginRight: 20, marginTop: 5}} onPress = {() => this.sort()}>
                        <Ionicons name = {sortIcon} style = {sortStyle}/>
                        <Ionicons name = 'ios-star' style = {{color:'#FFD700', bottom: 10}} />
                    </TouchableOpacity>

                    { filterStyle == styles.filterOn && 
                    <TouchableOpacity style = {{borderWidth: 1, borderColor: 'tomato', padding: 2, borderRadius: 5, height: 23, marginRight: 10, alignSelf: 'center', marginBottom: 5}}
                        onPress = {() => this.resetFilter()}>
                            <Text style = {{color: 'tomato', flex: 1}}>Reset</Text>
                    </TouchableOpacity>
                    }
                    <AppModalFilter onPress = {() => this.filter(status)} style = {filterStyle}>
                        <Text style = {{fontWeight: 'bold'}}>Status:</Text>
                        <Picker style = {styles.picker}
                            selectedValue = {status} onValueChange = {(itemValue, itemIndex) => this.handleStatus(itemValue)} 
                        >
                            <Picker.Item value='0' label='All' />
                            <Picker.Item value='1' label='Open' />
                            <Picker.Item value='-1' label='Closed' />
                        </Picker>
                        <Text style = {{fontWeight: 'bold', marginTop: -70}}>Cuisine Types:</Text>
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
                <View style = {styles.stalls}>
                    { stalls != '' ? 
                    <FlatList 
                        data={ stalls } 
                        extraData={this.state}
                        renderItem={ ({ item }) => (
                            <TouchableOpacity style = {styles.stallStack} onPress = {() => {
                                this.props.navigation.navigate('Stall', {
                                    stallName: item.stallName,
                                    firebaseId: item.id,
                                    stallId: item.stallId,
                                    stallRating: item.overallStallRating,
                                    stallDesc: item.desc,
                                    hawkerName: hawkerName,
                                    address: item.address,
                                    openingHours: item.monTofriOpening.toDate(),
                                    closingHours: item.monTofriClosing.toDate(),
                                    image: item.image
                                })
                            }}>
                                <View style = {styles.stallImage}>
                                    { !peek ? 
                                    <Image source = {{uri: item.image}} style = {{flex: 1, borderRadius: 5, opacity: !this.checkOpenClosed(item.monTofriOpening.toDate(), item.monTofriClosing.toDate()) ? 0.4 : 1}}/>
                                    :
                                    <ImageBackground source = {{uri: item.image}} style = {{flex: 1, borderRadius: 5}} imageStyle= {{ opacity: 0.1}}> 
                                    <Text style = {{paddingHorizontal: 5, paddingVertical: 1, fontWeight: 'bold'}}>Menu</Text>
                                        <FlatList 
                                            style = {{flex: 1, borderRadius: 5 , backgroundColor: 'rgba(0, 0, 0, .1)'}}
                                            horizontal = {true}
                                            data = {this.peekMenu(item.stallId)}
                                            renderItem={ ({ item }) => (
                                                <View style = {{paddingVertical: 2, paddingHorizontal: 5, width: 100}}>
                                                    <Image source = {{uri: item.image}} style = {{flex: 1, borderTopLeftRadius: 5, borderTopRightRadius: 5}}/>
                                                    <View style = {{backgroundColor: 'white', padding: 2, borderBottomRightRadius: 5, borderBottomLeftRadius: 5, opacity: 0.9}}>
                                                        <Text style = {{fontSize: 10}}>{item.foodName}</Text>
                                                        <View style = {{flexDirection: 'row', alignSelf: 'flex-start'}}>
                                                            <Text style = {{fontWeight: 'bold', color: '#A9DFBF', fontSize: 14, marginLeft: 1}}>$</Text>
                                                            <Text style = {{fontSize: 12, marginLeft: 1}}>
                                                                {" "}{Number(item.price).toFixed(2)}
                                                            </Text>
                                                        </View>
                                                        <View style = {{flexDirection: 'row', alignSelf: 'flex-start'}}>
                                                            <Ionicons name='ios-star' style = {{color:'#FFD700', fontSize: 14, marginLeft: 1}} />
                                                            <Text style = {{fontSize: 12}}>
                                                                {" "}{item.overallFoodRating}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            )}
                                            keyExtractor={ item => item.foodId }/>
                                    </ImageBackground>
                                    }
                                    { this.checkNewMenu(item.creationDate) && 
                                    <View style = {{backgroundColor: 'crimson', flex: 1, borderRadius: 3, padding: 4, top: 2, left: -8, position: 'absolute', paddingHorizontal: 10, opacity: 0.9}}>
                                        <Text style = {{color: 'white', fontWeight: 'bold'}}>
                                            New
                                        </Text>
                                    </View>
                                    }
                                </View>
                                <View style = {styles.stallText}>
                                    <View>
                                        <Text style = {{fontWeight: 'bold', fontSize: 15}}>
                                            {item.stallName}
                                        </Text>
                                        <Text>
                                            {item.cuisineType}
                                        </Text>
                                    </View>
                                    <View style = {styles.rating}>
                                        <View style = {{flexDirection: 'row', alignSelf: 'flex-end'}}>
                                            <Ionicons name='ios-star' style = {{color:'#FFD700', fontSize: 17, marginRight: 5}} />
                                            <Text style = {{fontSize: 15}}>
                                                {item.overallStallRating}
                                            </Text>
                                        </View>
                                        {this.checkStallStatus(item.monTofriOpening.toDate(), item.monTofriClosing.toDate())}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}
                    keyExtractor={ item => item.stallId } />
                    :
                    <Text style = {{alignSelf: 'center', marginTop: 50}} >No stalls found</Text>
                    }
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
    hawkerImage: {
        flex: 1.8,
        height: 10,
        width: 350,
    },
    header: {
        flexDirection: 'row',
        marginLeft: 20,
        marginBottom: 20,
    },
    stalls: {
        flex: 5,
        width: 350,
        bottom: 20,
    },
    stallStack: {
        flex:1,
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'space-around',
        margin: 10,
        borderRadius: 5,
    },
    stallImage: {
        flex:2,
        width: 315,
        height: 120,
        margin: 5,
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    stallText: {
        flex: 1,
        margin: 10,
        flexDirection: 'row',
    },
    rating: {
        flex: 1,
        flexDirection: 'column',
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
    },
    sortOn: {
        transform: [{ rotate: '90deg'}], 
        fontSize: 30,
        color: 'tomato'
    },
    sortOff: {
        transform: [{ rotate: '90deg'}], 
        fontSize: 30,
        color: 'gray'
    }
  });