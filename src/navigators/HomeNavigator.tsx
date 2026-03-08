import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { TopBar } from "../components/top-bar/top-bar-feature";
import { HomeScreen } from "../screens/HomeScreen";
import CameraScreen from "../screens/CameraScreen";
import GalleryScreen from "../screens/GalleryScreen";
import FeedScreen from "../screens/FeedScreen";
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import { Colors } from "../utils/theme";

const Tab = createBottomTabNavigator();

export function HomeNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        header: () => <TopBar />,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "rgba(15,16,34,0.96)",
          borderTopColor: "rgba(255,255,255,0.06)",
          borderTopWidth: 1,
          borderRadius: 24,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
          left: 12,
          right: 12,
          bottom: 12,
          elevation: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 14 },
          shadowOpacity: 0.35,
          shadowRadius: 24,
        },
        tabBarActiveTintColor: Colors.verified,
        tabBarInactiveTintColor: "#6B6B80",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
        tabBarItemStyle: {
          borderRadius: 18,
          marginHorizontal: 3,
          marginVertical: 4,
        },
        tabBarActiveBackgroundColor: "rgba(0,229,255,0.08)",
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialCommunityIcon
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          unmountOnBlur: true,
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialCommunityIcon
              name={focused ? "camera" : "camera-outline"}
              size={size}
              color={color}
            />
          ),
          tabBarLabel: "Prove",
        }}
      />
      <Tab.Screen
        name="Gallery"
        component={GalleryScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialCommunityIcon
              name={focused ? "image-multiple" : "image-multiple-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialCommunityIcon
              name={focused ? "earth" : "earth"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
