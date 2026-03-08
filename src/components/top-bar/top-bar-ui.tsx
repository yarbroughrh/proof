import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import { Button, IconButton, Menu } from "react-native-paper";
import { Account, useAuthorization } from "../../utils/useAuthorization";
import { useMobileWallet } from "../../utils/useMobileWallet";
import { useNavigation } from "@react-navigation/native";
import { ellipsify } from "../../utils/ellipsify";
import { useState } from "react";
import * as Clipboard from "expo-clipboard";
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useCluster } from "../cluster/cluster-data-access";
import { Colors } from "../../utils/theme";
import { alertAndLog } from "../../utils/alertAndLog";

export function TopBarWalletButton({
  selectedAccount,
  openMenu,
}: {
  selectedAccount: Account | null;
  openMenu: () => void;
}) {
  const { connect } = useMobileWallet();

  const handleConnectPress = () => {
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
              await connect();
            } catch (err: any) {
              alertAndLog("Connection failed", err instanceof Error ? err.message : err);
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      style={[
        styles.walletButton,
        selectedAccount ? styles.walletButtonConnected : styles.walletButtonIdle,
      ]}
      onPress={selectedAccount ? openMenu : handleConnectPress}
    >
      <View style={styles.walletIconWrap}>
        <MaterialCommunityIcon
          name="wallet-outline"
          size={14}
          color={selectedAccount ? Colors.verified : "#F4D369"}
        />
      </View>
      <Text
        style={[
          styles.walletLabel,
          selectedAccount ? styles.walletLabelConnected : styles.walletLabelIdle,
        ]}
      >
        {selectedAccount
          ? ellipsify(selectedAccount.publicKey.toBase58(), 4)
          : "Connect"}
      </Text>
    </TouchableOpacity>
  );
}

export function TopBarSettingsButton() {
  const navigation = useNavigation();
  return (
    <IconButton
      icon="cog"
      mode="contained-tonal"
      onPress={() => {
        navigation.navigate("Settings");
      }}
    />
  );
}

export function TopBarWalletMenu() {
  const { selectedAccount } = useAuthorization();
  const { getExplorerUrl } = useCluster();
  const [visible, setVisible] = useState(false);
  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);
  const { disconnect } = useMobileWallet();

  const copyAddressToClipboard = async () => {
    if (selectedAccount) {
      await Clipboard.setStringAsync(selectedAccount.publicKey.toBase58());
    }
    closeMenu();
  };

  const viewExplorer = () => {
    if (selectedAccount) {
      const explorerUrl = getExplorerUrl(
        `account/${selectedAccount.publicKey.toBase58()}`
      );
      Linking.openURL(explorerUrl);
    }
    closeMenu();
  };

  return (
    <Menu
      visible={visible}
      onDismiss={closeMenu}
      anchor={
        <TopBarWalletButton
          selectedAccount={selectedAccount}
          openMenu={openMenu}
        />
      }
    >
      <Menu.Item
        onPress={copyAddressToClipboard}
        title="Copy address"
        leadingIcon="content-copy"
      />
      <Menu.Item
        onPress={viewExplorer}
        title="View Explorer"
        leadingIcon="open-in-new"
      />
      <Menu.Item
        onPress={async () => {
          await disconnect();
          closeMenu();
        }}
        title="Disconnect"
        leadingIcon="link-off"
      />
    </Menu>
  );
}

const styles = StyleSheet.create({
  walletButton: {
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
  },
  walletButtonIdle: {
    backgroundColor: "rgba(255, 179, 0, 0.12)",
    borderColor: "rgba(255, 179, 0, 0.2)",
  },
  walletButtonConnected: {
    backgroundColor: "rgba(0, 229, 255, 0.08)",
    borderColor: "rgba(0, 229, 255, 0.18)",
  },
  walletIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  walletLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  walletLabelIdle: {
    color: "#F6E8B5",
  },
  walletLabelConnected: {
    color: "#D8FCFF",
  },
});
