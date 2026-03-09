import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CourseLibraryScreen from './src/screens/CourseLibraryScreen';
import CourseDetailScreen from './src/screens/CourseDetailScreen';
import VideoLessonScreen from './src/screens/VideoLessonScreen';
import QuizScreen from './src/screens/QuizScreen';
import CertificateScreen from './src/screens/CertificateScreen';
import JobsMockupScreen from './src/screens/JobsMockupScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome">
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen as any}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen as any}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CourseLibrary"
          component={CourseLibraryScreen as any}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CourseDetail"
          component={CourseDetailScreen as any}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="VideoLesson"
          component={VideoLessonScreen as any}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Quiz"
          component={QuizScreen as any}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Certificate"
          component={CertificateScreen as any}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="JobsMockup"
          component={JobsMockupScreen as any}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Progress"
          component={ProgressScreen as any}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
