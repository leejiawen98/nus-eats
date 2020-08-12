import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import HomeScreen from '../container/HomeScreen';
import PopularScreen from '../container/PopularScreen';
import FindScreen from '../container/FindScreen';
import FavouritesScreen from '../container/FavouritesScreen';
import ProfileScreen from '../container/ProfileScreen';

const Tab = createBottomTabNavigator()

const TabNavigator = () => {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = 'ios-home'
            } else if (route.name === 'Popular') {
              iconName = 'ios-podium'
            } else if (route.name == 'Explore') {
              iconName = 'ios-search'
            } else if (route.name === 'Favourites') {
              iconName = 'ios-heart'
            } else if (route.name === 'Profile') {
              iconName = 'ios-person'
            }
            return <Ionicons name={iconName} size={size} color={color}/>;
          },
        })}
        tabBarOptions={{
          activeTintColor: 'tomato',
          inactiveTintColor: 'gray',
          style: {
            backgroundColor: '#E8E8E8'
          }
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Popular" component={PopularScreen} />
        <Tab.Screen name="Explore" component={FindScreen} />
        <Tab.Screen name="Favourites" component={FavouritesScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    );
}

export default TabNavigator