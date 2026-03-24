import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'

import WelcomeScreen from './src/screens/WelcomeScreen'
import LoginScreen from './src/screens/LoginScreen'
import HomeScreen from './src/screens/HomeScreen'
import CourseLibraryScreen from './src/screens/CourseLibraryScreen'
import CourseDetailScreen from './src/screens/CourseDetailScreen'
import VideoLessonScreen from './src/screens/VideoLessonScreen'
import QuizScreen from './src/screens/QuizScreen'
import CertificateScreen from './src/screens/CertificateScreen'
import JobsScreen from './src/screens/JobsScreen'
import ProgressScreen from './src/screens/ProgressScreen'
import SupportScreen from './src/screens/SupportScreen'
import SettingsScreen from './src/screens/SettingsScreen'
import { RootStackParamList } from './src/types/navigation'
import { colors } from './src/theme'

const Stack = createNativeStackNavigator<RootStackParamList>()

function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background }
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen as any} />
        <Stack.Screen name="Home" component={HomeScreen as any} />
        <Stack.Screen name="CourseLibrary" component={CourseLibraryScreen as any} />
        <Stack.Screen name="CourseDetail" component={CourseDetailScreen as any} />
        <Stack.Screen name="VideoLesson" component={VideoLessonScreen as any} />
        <Stack.Screen name="Quiz" component={QuizScreen as any} />
        <Stack.Screen name="Certificate" component={CertificateScreen as any} />
        <Stack.Screen name="Jobs" component={JobsScreen as any} />
        <Stack.Screen name="Progress" component={ProgressScreen as any} />
        <Stack.Screen name="Support" component={SupportScreen as any} />
        <Stack.Screen name="Settings" component={SettingsScreen as any} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default App
