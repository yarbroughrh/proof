import "./src/polyfills";

import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";

import { ConnectionProvider } from "./src/utils/ConnectionProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PaperProvider } from "react-native-paper";
import { AppNavigator } from "./src/navigators/AppNavigator";
import { ClusterProvider } from "./src/components/cluster/cluster-data-access";
import { ProofTheme } from "./src/utils/theme";
import { isTreasuryConfigured } from "./src/utils/safety";

const queryClient = new QueryClient();

function TreasuryError() {
  return (
    <View style={styles.errorScreen}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Configuration Required</Text>
      <Text style={styles.errorText}>
        Treasury wallet is not configured. The developer must set a real wallet
        address in constants.ts before the app can process transactions safely.
      </Text>
    </View>
  );
}

export default function App() {
  if (!isTreasuryConfigured()) {
    return (
      <SafeAreaView style={styles.shell}>
        <PaperProvider theme={ProofTheme}>
          <TreasuryError />
        </PaperProvider>
      </SafeAreaView>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ClusterProvider>
        <ConnectionProvider config={{ commitment: "processed" }}>
          <SafeAreaView style={styles.shell}>
            <PaperProvider theme={ProofTheme}>
              <AppNavigator />
            </PaperProvider>
          </SafeAreaView>
        </ConnectionProvider>
      </ClusterProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: "#0A0A0F",
  },
  errorScreen: {
    flex: 1,
    backgroundColor: "#0A0A0F",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    color: "#FF5252",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  errorText: {
    color: "#A0A0B8",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
});
