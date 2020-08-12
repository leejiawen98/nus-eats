import React from 'react';
import { ActivityIndicator, Modal, Dimensions, AsyncStorage, Image, FlatList, TouchableOpacity, SafeAreaView, View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { Header } from 'react-native-elements';
import { getUserByUsername } from '../api/userAPI';
import { getFavouritesByUserId } from '../api/userFavouritesAPI';
import { getAllHawker } from '../api/hawkerAPI';
import { AntDesign } from '@expo/vector-icons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { CheckBox } from 'react-native-elements'
import OpeningStatus from '../component/OpeningStatus'
import firebaseDb from '../firebaseDb'

const { width, height } = Dimensions.get('window');

export default class FavouritesScreen extends React.Component {

    state = {
        favourites: [],
        filtered: [],
        showPicker: false,
        hawkerList: [],
        hawkerNameList: [],
        stallCuisineList: [],
        checkedHawker: [],
        checkedCuisineType: [],
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
        favIcon: 'ios-heart',
        favId: '',
        isLoading: false
    }

    constructor(props) {
        super(props);
        // this.getData();
    }

    getData = async () => {
        try {
            const value = await AsyncStorage.getItem('username');
            if (value != null) {
                this.setState({ loggedIn: true });
                getUserByUsername(value, this.userRetrieved);
            } else {
                this.props.navigation.push("NeedToLogin")
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
            }
        });

        getFavouritesByUserId(user.userId, this.allFavouritesRetrieved);

    }

    allFavouritesRetrieved = (favouriteList) => {

        var hawkerNameL = [];
        var cuisineL = [];
        var check = [];
        var checkCuisine = [];

        for (var i = 0; i < favouriteList.length; i++) {
            if (hawkerNameL.includes(favouriteList[i].hawkerName)) {
            } else {
                hawkerNameL.push(favouriteList[i].hawkerName);
                check.push(false);
            }
        }

        for (var i = 0; i < favouriteList.length; i++) {
            if (cuisineL.includes(favouriteList[i].cuisineType)) {
            } else {
                cuisineL.push(favouriteList[i].cuisineType);
                checkCuisine.push(false);
            }
        }


        this.setState(prevState => ({
            favourites: prevState.favourites = favouriteList,
            filtered: prevState.filtered = favouriteList,
            hawkerNameList: prevState.hawkerNameList = hawkerNameL,
            checkedHawker: prevState.checkedHawker = check,
            stallCuisineList: prevState.stallCuisineList = cuisineL,
            checkedCuisineType: prevState.checkedCuisineType = checkCuisine
        }));
        this.setState({ isLoading: false });
    }

    hawkerRetrieved = (hawkerList) => {
        this.setState(prevState => ({
            hawkerList: prevState.hawkerList = hawkerList,
        }));
    }

    //Get stall from favourites db
    // stallsRetrieved = (stall) => {
    //     console.log('2');
    //     console.log(stall)
    //     DATA.push(stall);
    // }


    componentDidMount() {
        this._unsubscribe = this.props.navigation.addListener('focus', () => {
            this.setState({ isLoading: true });
            this.getData();
        });

        getAllHawker(this.hawkerRetrieved);
    }

    componentWillUnmount() {
        this._unsubscribe();
    }

    //Picker

    openPicker = () => {

        this.setState(prevState => ({
            showPicker: prevState.showPicker = !this.state.showPicker
        }))

    }

    selectedPicker = (value) => {
        var filteredList = [];

        for (var i = 0; i < this.states.favourites; i++) {
            if (this.state.favourites[i].hawkerName === value) {
                filteredList.push(this.state.favourites[i]);
            }
        }

        this.setState(prevState => ({
            filtered: prevState.filtered = filteredList
        }))

    }

    FlatListItemSeparator = () => {
        return (
            <View
                style={{
                    height: 1,
                    width: "100%",
                    backgroundColor: 'grey',
                }}
            />
        );
    }

    checkStallStatus = (openingHours, closingHours) => {
        let today = new Date(Date.now())
        let todayTime = today.getHours() * 100 + today.getMinutes()

        let opening = new Date(openingHours)
        let openingTime = opening.getHours() * 100 + opening.getMinutes()

        let closing = new Date(closingHours)
        let closingTime = closing.getHours() * 100 + closing.getMinutes()

        if (todayTime >= openingTime && todayTime <= closingTime) {
            return (
                <View style={{ zIndex: 999, backgroundColor: 'green', borderRadius: 3, position: 'absolute', marginLeft: 8, marginTop: 17, padding: 2 }}>
                    <OpeningStatus style={{ color: 'white', marginTop: 0 }}>
                        Open
                    </OpeningStatus>
                </View>
            );
        } else {
            return (
                <View style={{ zIndex: 999, backgroundColor: 'red', borderRadius: 3, position: 'absolute', marginLeft: 8, marginTop: 17, padding: 2 }}>
                    <OpeningStatus style={{ color: 'white', marginTop: 0 }}>
                        Closed
                    </OpeningStatus>
                </View>
            );
        }
    }

    fillHeart = (item) => {
        Alert.alert('Confirm', 'Are you sure you want to remove?', [
            {
                text: 'Yes',
                onPress: () => {
                    this.setState({ isLoading: true})
                    let newFav = []
                    let newFil = []
                    for (var i=0;i<Object.keys(this.state.favourites).length;i++){
                        if (this.state.favourites[i].refId != item.refId) {
                            newFav.push(this.state.favourites[i])
                        }
                    }
                    for (var i=0;i<Object.keys(this.state.filtered).length;i++){
                        if (this.state.filtered[i].refId != item.refId) {
                            newFil.push(this.state.filtered[i])
                        }
                    }

                    firebaseDb
                    .firestore()
                    .collection('userFavourite')
                    .doc(item.refId)
                    .delete()
                    .then(() => {
                        this.setState({ favourites: newFav, filtered: newFil, isLoading: false })
                    })
                    .catch(err => console.error(err))
                    console.log('Deleted')
                }
            },
            {
                text: 'No',
                onPress: () => console.log('Action cancelled')
            }
        ])
    }

    FlatListItemSeparator = () => {
        return (
            <View
                style={{
                    height: 1,
                    width: "88%",
                    backgroundColor: "#DCDCDC",
                    alignSelf: 'center',
                    opacity: 0.4
                }}
            />
        );
    }
    render() {

        const { favourites, filtered, loggedIn, hawkerNameList, stallCuisineList, hawkerList, showPicker, checkedHawker, checkedCuisineType, isLoading } = this.state

        if (isLoading)
            return <ActivityIndicator style={{
                position: 'absolute', left: 0, right: 0, bottom: 0, top: 0
            }} size='large' color='tomato' />

        return (
            <View style={styles.container}>
                <Header
                    centerComponent={{ text: 'Favourite', style: { color: '#fff', fontSize: 20, fontWeight: 'bold' } }}
                    containerStyle={{ backgroundColor: 'tomato' }}
                    rightComponent={<AntDesign name="filter" size={24} color="white" onPress={() => {
                        // if (favourites.length == 0) {
                        //     Alert.alert("You do not have any favourites to be filtered.");
                        // } else {
                        this.openPicker();
                        // }
                    }} />}
                >

                </Header>

                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={showPicker}
                    onRequestClose={() => {
                        Alert.alert("Modal has been closed.");
                    }}
                >

                    <View style={styles.centeredView}>
                        <View style={styles.modalView}>
                            <View style={styles.header}>
                                <Text style={styles.headerText}>
                                    Filter
                                </Text>
                            </View>
                            <Text style={{ alignSelf: 'flex-start', paddingTop: 5, paddingLeft: 8, textDecorationLine: 'underline', fontWeight: 'bold' }}>Hawker</Text>
                            <FlatList
                                ItemSeparatorComponent={this.FlatListItemSeparator}
                                style={{ width: '100%' }}
                                contentContainerStyle={{ flexGrow: 1 }}
                                numColumns='2'
                                data={hawkerNameList}
                                renderItem={({ item, index }) => {
                                    return (
                                        <View style={{ flex: 1 }}>
                                            <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center', }}>
                                                <View style={{ width: '100%' }}>
                                                    <CheckBox
                                                        title={item}
                                                        checkedColor='tomato'
                                                        containerStyle={{ width: '100%', backgroundColor: 'white', borderWidth: 0, alignSelf: 'center' }}
                                                        checked={checkedHawker[index]}
                                                        onPress={() => {
                                                            var check = checkedHawker;
                                                            if (check[index] == true) {
                                                                check[index] = !check[index];
                                                            } else {
                                                                for (var i = 0; i < check.length; i++) {
                                                                    check[i] = false;
                                                                }
                                                                check[index] = !check[index];
                                                            }
                                                            this.setState({ checkedHawker: check });
                                                        }}
                                                    />
                                                </View>
                                            </View>
                                        </View>
                                    );
                                }}
                            >

                            </FlatList>
                            <Text style={{ alignSelf: 'flex-start', paddingTop: 5, paddingLeft: 8, textDecorationLine: 'underline', fontWeight: 'bold' }}>Cuisine Type</Text>
                            <FlatList
                                ItemSeparatorComponent={this.FlatListItemSeparator}
                                style={{ width: '100%' }}
                                contentContainerStyle={{ flexGrow: 1 }}
                                numColumns='2'
                                data={stallCuisineList}
                                renderItem={({ item, index }) => {
                                    return (
                                        <View style={{ flex: 1 }}>
                                            <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center', }}>
                                                <View style={{ width: '100%' }}>
                                                    <CheckBox
                                                        title={item}
                                                        checkedColor='tomato'
                                                        containerStyle={{ width: '100%', backgroundColor: 'white', borderWidth: 0, alignSelf: 'center' }}
                                                        checked={checkedCuisineType[index]}
                                                        onPress={() => {
                                                            var check = checkedCuisineType;
                                                            if (check[index] == true) {
                                                                check[index] = !check[index];
                                                            } else {
                                                                for (var i = 0; i < check.length; i++) {
                                                                    check[i] = false;
                                                                }
                                                                check[index] = !check[index];
                                                            }
                                                            this.setState({ checkedCuisineType: check });
                                                        }}
                                                    />
                                                </View>
                                            </View>
                                        </View>
                                    );
                                }}
                            >

                            </FlatList>


                            <View style={styles.headerBottom}>
                                <View style={{ paddingTop: 5 }}>
                                    <TouchableOpacity style={{ backgroundColor: "tomato" }} onPress={() => {

                                        var filteredList = favourites;

                                        if (checkedHawker.includes(true) && checkedCuisineType.includes(true)) {

                                            for (var cH = 0; cH < checkedHawker.length; cH++) {
                                                if (checkedHawker[cH] == true) {
                                                    filteredList = favourites.filter((item) => {
                                                        return item.hawkerName.includes(hawkerNameList[cH]);
                                                    })
                                                }
                                            }

                                            for (var cCT = 0; cCT < checkedCuisineType.length; cCT++) {
                                                if (checkedCuisineType[cCT] == true) {
                                                    filteredList = filteredList.filter((item) => {
                                                        return item.cuisineType.includes(stallCuisineList[cCT]);
                                                    })
                                                }
                                            }

                                        } else if (checkedCuisineType.includes(true)) {

                                            for (var cCT = 0; cCT < checkedCuisineType.length; cCT++) {
                                                if (checkedCuisineType[cCT] == true) {
                                                    filteredList = favourites.filter((item) => {
                                                        return item.cuisineType.includes(stallCuisineList[cCT]);
                                                    })
                                                }
                                            }

                                        } else if (checkedHawker.includes(true)) {

                                            for (var cH = 0; cH < checkedHawker.length; cH++) {
                                                if (checkedHawker[cH] == true) {
                                                    filteredList = favourites.filter((item) => {
                                                        return item.hawkerName.includes(hawkerNameList[cH]);
                                                    })
                                                }
                                            }

                                        }


                                        if (!checkedHawker.includes(true) && !checkedCuisineType.includes(true)) {
                                            this.setState({ filtered: favourites });
                                        } else {
                                            this.setState({ filtered: filteredList });
                                        }


                                        this.openPicker();

                                    }}>
                                        <Text style={{ fontSize: 15, width: 150, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 10, color: 'white', textAlign: 'center' }}>View</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </Modal>

                {
                    (favourites.length != 0) ? (
                        <FlatList
                            style={{ width: '95%', alignSelf: 'center' }}
                            data={filtered}
                            renderItem={({ item }) => {
                                return (
                                    <View style={styles.cardContainer}>
                                        <TouchableOpacity style={styles.cardView} onPress={() => {
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
                                            {this.checkStallStatus(item.monTofriOpening.toDate(), item.monTofriClosing.toDate())}
                                            <TouchableOpacity style={styles.favourite} onPress={() => { this.fillHeart(item) }}>
                                                <View style={{ backgroundColor: '#FFFFFF99', width: 45, height: 45, position: 'absolute', borderRadius: 20, left: -10 }} />
                                                <Ionicons name={this.state.favIcon} style={styles.heartStyle} />
                                            </TouchableOpacity>

                                            <Image style={styles.cardImage} source={{ uri: item.image }} />
                                            <View style={styles.textView}>
                                                <Text style={styles.itemTitle}>{item.stallName}</Text>
                                                <Text style={styles.itemDescription}>{item.hawkerName}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                );
                            }}
                            keyExtractor={(item) => item.stallId}
                        />


                    ) : (

                            <View style={{ flex: 1, justifyContent: 'center', alignSelf: 'center' }}>
                                <Text>You do not have any favourites at the moment.</Text>
                            </View>

                        )
                }

            </View >


        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    cardContainer: {
        paddingTop: 10,
    },
    textCol2: {
        fontSize: 15,
        fontWeight: 'bold',
        lineHeight: 40,
        fontFamily: 'Avenir',
        textAlign: 'right'
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 0,
        overflow: "hidden"
    },
    card: {
        // backgroundColor: '#fff',
        // marginBottom: 10,
        // marginLeft: '2%',
        // width: '95%',
        // shadowColor: '#000',
        // shadowOpacity: 1,
        // shadowOffset: {
        //     width: 3,
        //     height: 3
        // }
        flex: 1,
        width: width - 20,
        height: height / 3,
        backgroundColor: 'white',
        margin: 10,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0.5, height: 0.5 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
        elevation: 5,
    },
    textView: {
        position: 'absolute',
        bottom: 10,
        margin: 10,
        left: 5
    },
    itemTitle: {
        color: 'white',
        fontSize: 22,
        shadowColor: '#000',
        shadowOffset: { width: 0.8, height: 0.8 },
        shadowOpacity: 1,
        shadowRadius: 3,
        marginBottom: 5,
        fontWeight: 'bold',
        elevation: 5
    },
    itemDescription: {
        color: 'white',
        fontSize: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0.8, height: 0.8 },
        shadowOpacity: 1,
        shadowRadius: 3,
        elevation: 5
    },
    cardImage: {
        width: width - 20,
        height: height / 5,
        borderRadius: 10
    },
    cardText: {
        fontSize: 15,
        fontWeight: 'bold',

    },
    row: {
        flexDirection: 'row',
        padding: 10
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: 'rgba(255,255,255,0.9)',
        
    },
    modalView: {
        width: width - 20,
        height: 420,
        backgroundColor: "white",
        padding: 10,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        borderRadius: 10
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
    header: {
        width: '100%',
        height: '10%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',

    },
    headerBottom: {
        width: '100%',
        height: '11%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',

    },
    headerText: {
        fontWeight: 'bold',
        fontSize: 20,
        color: 'tomato',
        letterSpacing: 1,
    },
    icon: {
        position: 'absolute',
        right: 16,
    }
});