import { View, StyleSheet } from "react-native";
import { ConnectButton } from "./sign-in-ui";

export function SignInFeature() {
  return (
    <View style={styles.wrapper}>
      <ConnectButton />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 4,
  },
});
