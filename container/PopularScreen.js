import React from 'react';
import { ActivityIndicator, Animated, TouchableOpacity, FlatList, Image, ImageBackground, View, Text, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { getAllStalls } from '../api/stallAPI';
import { getAllFood } from '../api/foodAPI';

function stallDescendingSort(arr) {

    arr.sort(function (a, b) { return b.overallStallRating - a.overallStallRating });

    return arr;
}

function foodDescendingSort(arr) {

    arr.sort(function (a, b) { return b.overallFoodRating - a.overallFoodRating });

    return arr;
}

const { width } = Dimensions.get('window');

export default class PopularScreen extends React.Component {


    state = {
        stallSorted: [],
        foodSorted: [],
        top10StallSorted: [],
        top10FoodSorted: [],
        stallList: [],
        filterModelShow: false,
        active: 0,
        xStall: 0,
        xFood: 0,
        translateX: new Animated.Value(0),
        translateXFood: new Animated.Value(width),
        translateXStall: new Animated.Value(0),
        translateY: -1000,
        isLoading: false,

    }

    // Segment

    handleSlide = type => {
        let { active, xStall, xFood, translateX, translateXStall, translateXFood } = this.state;
        Animated.spring(translateX, {
            toValue: type,
            duration: 100
        }).start();

        if (active === 0) {
            Animated.parallel([
                Animated.spring(translateXStall, {
                    toValue: 0,
                    duration: 100
                }).start(),
                Animated.spring(translateXFood, {
                    toValue: width,
                    duration: 100
                }).start()
            ])
        } else {
            Animated.parallel([
                Animated.spring(translateXStall, {
                    toValue: -width,
                    duration: 100
                }).start(),
                Animated.spring(translateXFood, {
                    toValue: 0,
                    duration: 100
                }).start()
            ])
        }
    }



    // Retrieve Stall Data

    stallsRetrieved = (stallList) => {

        var sorted = stallDescendingSort(stallList);

        var topTen = [];

        if (sorted.length > 10) {
            for (var i = 0; i < 10; i++) {
                if(sorted[i].overallStallRating >= 3) {
                topTen.push(sorted[i]);
                }
            }
        } else {
            topTen = sorted;
        }

        this.setState(prevState => ({
            stallSorted: prevState.stallSorted = sorted,
            top10StallSorted: prevState.top10StallSorted = topTen,
            stallList: prevState.stallListed = stallList
        }));


    }

    // Retrieve Food Data

    foodRetrieved = (foodList) => {

        var sortedFood = foodDescendingSort(foodList);

        var topTenFood = [];

        if (sortedFood.length > 10) {
            for (var i = 0; i < 10; i++) {
                if(sortedFood[i].overallFoodRating >= 3) {
                topTenFood.push(sortedFood[i]);
                }
            }
        } else {
            topTenFood = sortedFood;
        }

        this.setState(prevState => ({
            foodSorted: prevState.foodSorted = sortedFood,
            top10FoodSorted: prevState.top10FoodSorted = topTenFood,
            isLoading: false
        }));

    }

    componentDidMount() {
        this._unsubscribe = this.props.navigation.addListener('focus', () => {
            this.setState({isLoading: true})
            getAllStalls(this.stallsRetrieved);
            getAllFood(this.foodRetrieved);
        });
    }

    componentWillUnmount() {
        this._unsubscribe();
    }

    FlatListItemSeparator = () => {
        return (
            <View
                style={{
                    height: 1,
                    width: "100%",
                    backgroundColor: 'tomato',
                }}
            />
        );
    }


    render() {

        const { isLoading, stallSorted, stallList, top10StallSorted, top10FoodSorted, xStall, xFood, translateX, translateY, active, translateXStall, translateXFood } = this.state

        if (isLoading)
        return <ActivityIndicator style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, top: 0
        }} size='large' color='tomato' />

        return (
            <View style={styles.container}>
                <ImageBackground source={require("../assets/popular1.jpg")} style={styles.imageBG}>
                </ImageBackground>
                <View style={styles.col1}>
                    {/* <MaterialCommunityIcons style={{ alignSelf: 'center', color: 'yellow', shadowColor: 'black', shadowRadius: 5, shadowOpacity: 0.2, padding: 0 }} name="trophy-award" size={60} color="black" /> */}
                    <Text style={styles.text}>TOP 10</Text>
                </View>
                <View style={styles.col2}>
                    <View style={{ width: '70%', marginLeft: 'auto', marginRight: 'auto' }}>
                        <View style={{ flexDirection: 'row', marginTop: 15, marginBottom: 15, height: 36, position: 'relative' }}>
                            <Animated.View style={{ position: 'absolute', width: '50%', height: '100%', top: 0, left: 0, backgroundColor: 'white', borderRadius: 4, transform: [{ translateX }] }} />
                            <TouchableOpacity
                                style={{ flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 4, borderWidth: 1, borderColor: 'white', borderRightWidth: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                                onLayout={event => this.setState({ xStall: event.nativeEvent.layout.x })}
                                onPress={() => this.setState({ active: 0 }, () => this.handleSlide(xStall))}
                            >
                                <Text style={{ color: active === 0 ? "tomato" : "white", fontWeight: 'bold' }}>Stall</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 4, borderWidth: 1, borderColor: 'white', borderLeftWidth: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                                onLayout={event => this.setState({ xFood: event.nativeEvent.layout.x })}
                                onPress={() => this.setState({ active: 1 }, () => this.handleSlide(xFood))}
                            >
                                <Text style={{ color: active === 1 ? "tomato" : "white", fontWeight: 'bold' }}>Food</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {(active === 0) ?
                        <Animated.View
                            style={{ flex: 1, height: '100%', transform: [{ translateX: translateXStall }] }}
                            onLayout={event => this.setState({ translateY: event.nativeEvent.layout.height })}
                        >
                            <FlatList
                                ItemSeparatorComponent={this.FlatListItemSeparator}
                                showsVerticalScrollIndicator={false}
                                style={{ width: '100%', alignSelf: 'center', backgroundColor: 'tomato' }}
                                data={top10StallSorted}
                                renderItem={({ item, index }) => {
                                    return (
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
                                            <View style={styles.row}>
                                                <View style={styles.col2_1}>
                                                    <Text style={styles.textCol2}>{index + 1}. {item.stallName}</Text>
                                                    <Text style={styles.textCol3}>{item.address}</Text>
                                                    <Text style={styles.textCol2}>
                                                        <AntDesign name="star" size={15} color="#FDCC0D" />
                                                        {item.overallStallRating.toFixed(2)}</Text>
                                                </View>
                                                <View style={styles.col2_2}>
                                                    <Image style={styles.image} source={{uri: item.image}}></Image>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                }}
                                keyExtractor={(item) => item.stallId}
                            />

                        </Animated.View>
                        :
                        <Animated.View style={{ flex: 1, transform: [{ translateX: translateXFood }] }}>

                            <FlatList
                                ItemSeparatorComponent={this.FlatListItemSeparator}
                                showsVerticalScrollIndicator={false}
                                style={{ width: '100%', alignSelf: 'center', backgroundColor: 'tomato' }}
                                data={top10FoodSorted}
                                renderItem={({ item, index }) => {
                                    return (
                                        <TouchableOpacity onPress={() => {
                                            this.props.navigation.navigate('FoodModal', {
                                                foodName: item.foodName,
                                                //firebaseId: item.id,
                                                foodId: item.foodId,
                                                foodRating: item.overallFoodRating,
                                                foodDesc: item.desc,
                                                foodPrice: item.price,
                                                refId: item.refId,
                                                image: item.image,
                                                stallId: item.stallId,
                                            })
                                        }}>
                                            <View style={styles.row}>
                                                <View style={styles.col2_1}>
                                                    <Text style={styles.textCol2}>{index + 1}. {item.foodName}</Text>
                                                    <Text style={styles.textCol3}>{item.stallName}</Text>
                                                    <Text style={styles.textCol2}>
                                                        <AntDesign name="star" size={15} color="#FDCC0D" />
                                                        {item.overallFoodRating}</Text>
                                                </View>
                                                <View style={styles.col2_2}>
                                                    <Image style={styles.image} source={{uri: item.image}}></Image>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                }}
                                keyExtractor={(item) => item.foodId}
                            />

                        </Animated.View>
                    }
                </View>
            </View >
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    imageBG: {
        flex: 1,
        resizeMode: "cover",
        justifyContent: "center",
        opacity: 0.8,
        fontFamily: 'Avenir',
    },
    filterText: {
        width: '100%',
        marginLeft: 10,
        padding: 5,
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold'
    },
    viewMoreText: {
        width: '100%',
        marginLeft: 10,
        padding: 5,
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
        textAlign: 'right'
    },
    text: {
        color: "grey",
        fontSize: 45,
        fontWeight: "bold",
        alignSelf: 'center',
        color: 'white',
        shadowColor: 'black',
        shadowOpacity: 0.5,
        shadowRadius: 5,
        fontFamily: 'Marker Felt'
    },
    col1: {
        flex: 1,
        marginTop: 20,
        justifyContent: 'center',
        width: '100%',
        height: '20%',
        backgroundColor: '#00000000',
        position: 'absolute',
        flexDirection: 'row'

    },
    col2: {
        width: '100%',
        height: '80%',
        justifyContent: 'center',
        backgroundColor: 'tomato',
        position: 'absolute', //Here is the trick
        bottom: 0, //Here is the trick
    },
    row: {
        width: '90%',
        alignSelf: 'center',
        flex: 1,
        paddingVertical: 25,
        paddingHorizontal: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderColor: 'tomato',
        // borderRadius: 20,
        // borderWidth: 1,
        marginTop: 10,
        backgroundColor: 'white',
        borderRadius: 10

    },
    textCol2: {
        fontSize: 15.5,
        fontWeight: 'bold',
        lineHeight: 40,
        textAlign: 'left'
    },
    textCol3: {
        fontSize: 13,
        fontWeight: 'bold',
        lineHeight: 20,
        fontFamily: 'Avenir',
        textAlign: 'left',
        color: '#696969',
        marginTop: -7
    },
    image: {
        width: 90,
        height: 90,
        borderRadius: 0,
        overflow: "hidden"
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22
    },
    modalView: {
        width: 300,
        height: 300,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5
    },
    openButton: {
        backgroundColor: "#F194FF",
        borderRadius: 20,
        padding: 10,
        elevation: 2
    },
    textStyle: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center"
    },
    modalText: {
        marginBottom: 15,
        textAlign: "center"
    }
});