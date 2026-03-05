import {
  DarkTheme as NavigationDarkTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { HomeNavigator } from "./HomeNavigator";
import { SettingsScreen } from "../screens/SettingsScreen";
import ProofDetailScreen from "../screens/ProofDetailScreen";
import { StatusBar } from "expo-status-bar";
import { Colors } from "../utils/theme";

type RootStackParamList = {
  HomeStack: undefined;
  Settings: undefined;
  ProofDetail: { proofId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

const Stack = createNativeStackNavigator();

const AppStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="HomeStack"
      screenOptions={{
        headerStyle: { backgroundColor: "#0A0A0F" },
        headerTintColor: Colors.verified,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen
        name="HomeStack"
        component={HomeNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
      <Stack.Screen
        name="ProofDetail"
        component={ProofDetailScreen}
        options={{ title: "Proof Details" }}
      />
    </Stack.Navigator>
  );
};

export interface NavigationProps
  extends Partial<React.ComponentProps<typeof NavigationContainer>> {}

export const AppNavigator = (props: NavigationProps) => {
  const theme = {
    ...NavigationDarkTheme,
    colors: {
      ...NavigationDarkTheme.colors,
      background: "#0A0A0F",
      card: "#0A0A0F",
      text: "#E8E8F0",
      border: "#1A1A2E",
      primary: Colors.verified,
    },
  };

  return (
    <NavigationContainer theme={theme} {...props}>
      <StatusBar style="light" />
      <AppStack />
    </NavigationContainer>
  );
};
