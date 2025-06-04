import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MovieSelectionScreen from '../screens/MovieSelectionScreen';
import MyListsScreen from '../screens/MyListsScreen';
import EditListScreen from '../screens/EditListScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Profile: undefined;
  MovieSelection: { selectedListID?: number };
  MyLists: undefined;
  EditList: { listID: number; listName: string };
  // Add other screens here as we create them
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="MovieSelection" component={MovieSelectionScreen} />
        <Stack.Screen name="MyLists" component={MyListsScreen} />
        <Stack.Screen name="EditList" component={EditListScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 