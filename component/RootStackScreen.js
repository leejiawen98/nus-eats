import React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginContainer from '../container/LoginContainer';
import SignUp from '../container/SignUp';
import HawkerPage from '../container/HawkerPage';
import StallPage from '../container/StallPage';
import FoodModal from '../container/FoodModal';
import ReviewScreen from '../container/ReviewScreen';
import AddReviewScreen from '../container/AddReviewScreen';
import ImageViewer from '../container/ImageViewer';
import NeedToLogin from '../container/NeedToLogin';

import TabNavigator from './TabNavigator'

const RootStack = createStackNavigator();

const RootStackScreen = ({navigation}) => (
    <NavigationContainer>
        <RootStack.Navigator headerMode= 'none' screenOptions={{gestureEnabled: false}}>
            <RootStack.Screen name ="Home" children = {TabNavigator} independent = {true} options={{title: ''}}/>
            <RootStack.Screen name ="Login" component= {LoginContainer} options={{headerShown: false}}/>
            <RootStack.Screen name ="SignUp" component= {SignUp} options={{title: ''}}/>
            <RootStack.Screen name ="Hawker" component= {HawkerPage}/>
            <RootStack.Screen name ="Stall" component= {StallPage}/>
            <RootStack.Screen name= "FoodModal" component= {FoodModal} />
            <RootStack.Screen name= "Review" component= {ReviewScreen} />
            <RootStack.Screen name= "AddReview" component= {AddReviewScreen} />
            <RootStack.Screen name= "ImageViewer" component= {ImageViewer} />
            <RootStack.Screen name = "NeedToLogin" component ={NeedToLogin} />
        </RootStack.Navigator>  
    </NavigationContainer>
);

export default RootStackScreen;