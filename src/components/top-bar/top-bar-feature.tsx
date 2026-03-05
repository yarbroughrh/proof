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
    borderBottomColor: "#1A1A2E",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
  },
  brandText: {
    fontSize: 18,
    fontWeight: "900",
    color: Colors.verified,
    letterSpacing: 3,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
});
