import { StyleSheet, View } from "react-native";
import { Appbar, Text } from "react-native-paper";
import { TopBarWalletMenu } from "./top-bar-ui";
import { useNavigation } from "@react-navigation/core";
import { Colors } from "../../utils/theme";

export function TopBar() {
  const navigation = useNavigation();

  return (
    <Appbar.Header mode="small" style={styles.topBar}>
      <View style={styles.brand}>
        <Text style={styles.brandText}>PROOF</Text>
      </View>

      <View style={styles.actions}>
        <TopBarWalletMenu />
        <Appbar.Action
          icon="cog"
          iconColor={Colors.dimText}
          onPress={() => navigation.navigate("Settings")}
        />
      </View>
    </Appbar.Header>
  );
}

const styles = StyleSheet.create({
  topBar: {
    backgroundColor: "#0A0A0F",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    height: 64,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
  },
  brandText: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.verified,
    letterSpacing: 3,
    textShadowColor: "rgba(0, 229, 255, 0.35)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 6,
  },
});
