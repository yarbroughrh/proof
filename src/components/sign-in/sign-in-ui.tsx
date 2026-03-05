import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { Button } from "react-native-paper";
import { alertAndLog } from "../../utils/alertAndLog";
import { useAuthorization } from "../../utils/useAuthorization";
import { useMobileWallet } from "../../utils/useMobileWallet";

export function ConnectButton() {
  const { authorizeSession } = useAuthorization();
  const { connect } = useMobileWallet();
  const [authorizationInProgress, setAuthorizationInProgress] = useState(false);

  const handleConnectPress = useCallback(async () => {
    if (authorizationInProgress) return;

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
              setAuthorizationInProgress(true);
              await connect();
            } catch (err: any) {
              alertAndLog(
                "Error during connect",
                err instanceof Error ? err.message : err
              );
            } finally {
              setAuthorizationInProgress(false);
            }
          },
        },
      ]
    );
  }, [authorizationInProgress, connect]);

  return (
    <Button
      mode="contained"
      disabled={authorizationInProgress}
      onPress={handleConnectPress}
      style={{ flex: 1 }}
    >
      Connect
    </Button>
  );
}

export function SignInButton() {
  const { authorizeSession } = useAuthorization();
  const { signIn } = useMobileWallet();
  const [signInInProgress, setSignInInProgress] = useState(false);

  const handleSignInPress = useCallback(async () => {
    if (signInInProgress) return;

    Alert.alert(
      "Sign In With Solana",
      "You will sign a message to verify wallet ownership. " +
        "This does NOT authorize any transactions or token transfers.\n\n" +
        "Only sign in if you opened this app yourself.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign In",
          onPress: async () => {
            try {
              setSignInInProgress(true);
              await signIn({
                domain: "proof.solana.app",
                statement:
                  "Sign in to Proof — blockchain photo authenticity",
                uri: "https://proof.solana.app",
              });
            } catch (err: any) {
              alertAndLog(
                "Error during sign in",
                err instanceof Error ? err.message : err
              );
            } finally {
              setSignInInProgress(false);
            }
          },
        },
      ]
    );
  }, [signInInProgress, signIn]);

  return (
    <Button
      mode="outlined"
      disabled={signInInProgress}
      onPress={handleSignInPress}
      style={{ marginLeft: 4, flex: 1 }}
    >
      Sign in
    </Button>
  );
}
