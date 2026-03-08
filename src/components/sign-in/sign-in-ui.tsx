import { useState, useCallback } from "react";
import { Alert, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Text } from "react-native-paper";
import { alertAndLog } from "../../utils/alertAndLog";
import { useMobileWallet } from "../../utils/useMobileWallet";
import { Colors } from "../../utils/theme";

export function ConnectButton() {
  const { connect } = useMobileWallet();
  const [loading, setLoading] = useState(false);

  const handlePress = useCallback(async () => {
    if (loading) return;

    Alert.alert(
      "Connect Wallet",
      "Proof will request read-only access to your wallet address. " +
        "It will NEVER have access to your private keys or be able to move funds without your explicit approval.\n\n" +
        "Only connect if you opened this app yourself.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Connect",
          onPress: async () => {
            try {
              setLoading(true);
              await connect();
            } catch (err: any) {
              alertAndLog(
                "Error during connect",
                err instanceof Error ? err.message : err
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }, [loading, connect]);

  return (
    <TouchableOpacity
      style={[styles.button, loading && styles.buttonDisabled]}
      onPress={handlePress}
      disabled={loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color="#001116" size="small" />
      ) : (
        <Text style={styles.label}>Connect Wallet</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.verified,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.verified,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  label: {
    color: "#001116",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
