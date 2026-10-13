import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { FicTrainingDetailsScreen } from '../screens/Home/FicTrainingDetailsScreen';
import { CandidateDashboardScreen } from '../screens/Home/CandidateDashboardScreen';
import { ItTrainingScreen } from '../screens/Home/ItTrainingScreen';
import { JobsScreen } from '../screens/Jobs/JobsScreen';
import { JobDetailsScreen } from '../screens/Jobs/JobDetailsScreen';
import { ApplyScreen } from '../screens/Apply/ApplyScreen';
import { ApplicationSuccessScreen } from '../screens/Apply/ApplicationSuccessScreen';
import { COLORS } from '../styles/globalStyles';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CandidateDashboard"
        component={CandidateDashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FicTrainingDetails"
        component={FicTrainingDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ItTraining"
        component={ItTrainingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Jobs"
        component={JobsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JobDetails"
        component={JobDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Apply"
        component={ApplyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ApplicationSuccess"
        component={ApplicationSuccessScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};
