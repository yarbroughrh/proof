import React from "react";
import {
  StyleSheet,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Text, IconButton } from "react-native-paper";
import * as Clipboard from "expo-clipboard";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useProofStore } from "../utils/useProofStore";
import { explorerURL } from "../utils/constants";
import { Colors } from "../utils/theme";
import { ellipsify } from "../utils/ellipsify";
import { useAuthorization } from "../utils/useAuthorization";

function DetailRow({
  label,
  value,
  copyable,
  mono,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  mono?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.detailValueRow}>
        <Text
          style={[styles.detailValue, mono && styles.mono]}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {value}
        </Text>
        {copyable && (
          <IconButton
            icon="content-copy"
            iconColor={Colors.dimText}
            size={16}
            onPress={() => Clipboard.setStringAsync(value)}
            style={{ margin: 0, marginLeft: 4 }}
          />
        )}
      </View>
    </View>
  );
}

export default function ProofDetailScreen() {
  const route = useRoute<any>();
  const nav = useNavigation();
  const { proofs, toggleShared } = useProofStore();
  const { selectedAccount } = useAuthorization();
  const proof = proofs.find((p) => p.id === route.params?.proofId);

  if (!proof) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>Proof not found</Text>
      </View>
    );
  }

  const dateStr = new Date(proof.timestamp).toLocaleString();
  const hasLocation = proof.latitude != null && proof.longitude != null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image source={{ uri: proof.imageUri }} style={styles.image} />

      <View style={styles.badgeRow}>
        {proof.signature ? (
          <View style={styles.provedBadge}>
            <Text style={styles.provedBadgeText}>ON-CHAIN PROOF</Text>
          </View>
        ) : (
          <View style={styles.localBadge}>
            <Text style={styles.localBadgeText}>LOCAL ONLY</Text>
          </View>
        )}
        {proof.isSeeker && (
          <View style={styles.seekerBadge}>
            <Text style={styles.seekerBadgeText}>SEEKER VERIFIED</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Proof Details</Text>
        <DetailRow label="SHA-256 Hash" value={proof.hash} copyable mono />
        <DetailRow label="Timestamp" value={dateStr} />
        <DetailRow label="Device" value={proof.deviceModel} />
        {hasLocation && (
          <DetailRow
            label="Location"
            value={`${proof.latitude!.toFixed(5)}, ${proof.longitude!.toFixed(5)}`}
          />
        )}
        <DetailRow
          label="Wallet"
          value={ellipsify(proof.walletAddress, 6)}
          copyable
        />
      </View>

      {proof.signature && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Solana Transaction</Text>
          <DetailRow
            label="Signature"
            value={ellipsify(proof.signature, 8)}
            copyable
          />
          <DetailRow label="Network" value={proof.cluster} />

          <TouchableOpacity
            style={styles.explorerBtn}
            onPress={() =>
              Linking.openURL(explorerURL(proof.signature!, proof.cluster))
            }
          >
            <Text style={styles.explorerBtnText}>View on Solana Explorer</Text>
          </TouchableOpacity>
        </View>
      )}

      {proof.tips.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Tips ({proof.tips.reduce((s, t) => s + t.amount, 0)} SKR)
          </Text>
          {proof.tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipFrom}>{ellipsify(tip.from, 4)}</Text>
              <Text style={styles.tipAmount}>{tip.amount} SKR</Text>
            </View>
          ))}
        </View>
      )}

      {selectedAccount?.publicKey.toBase58() === proof.walletAddress &&
        proof.signature && (
          <TouchableOpacity
            style={[styles.shareToggle, proof.shared && styles.shareToggleActive]}
            onPress={() => toggleShared(proof.id)}
          >
            <Text
              style={[
                styles.shareToggleText,
                proof.shared && styles.shareToggleTextActive,
              ]}
            >
              {proof.shared ? "Shared to Feed" : "Share to Feed"}
            </Text>
          </TouchableOpacity>
        )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>How Verification Works</Text>
        <Text style={styles.explainerText}>
          The SHA-256 hash of this photo was computed on your device and anchored
          to the Solana blockchain via the Memo program. Anyone can re-hash the
          original image and compare it to the on-chain record to verify the
          photo has not been tampered with.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
  },
  content: {
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A0A0F",
  },
  image: {
    width: "100%",
    height: 320,
    resizeMode: "cover",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  provedBadge: {
    backgroundColor: Colors.verifiedBg,
    borderWidth: 1,
    borderColor: Colors.verified,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  provedBadgeText: {
    color: Colors.verified,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  localBadge: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  localBadgeText: {
    color: "#888",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  seekerBadge: {
    backgroundColor: Colors.seekerBadgeBg,
    borderWidth: 1,
    borderColor: Colors.seekerBadge,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  seekerBadgeText: {
    color: Colors.seekerBadge,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#1A1A2E",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardTitle: {
    color: "#E8E8F0",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    color: Colors.dimText,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValueRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailValue: {
    color: "#E8E8F0",
    fontSize: 14,
    flex: 1,
  },
  mono: {
    fontFamily: "monospace",
    fontSize: 13,
  },
  explorerBtn: {
    backgroundColor: Colors.verified,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  explorerBtnText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 14,
  },
  explainerText: {
    color: Colors.dimText,
    fontSize: 13,
    lineHeight: 20,
  },
  tipRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  tipFrom: {
    color: Colors.dimText,
    fontSize: 12,
    fontFamily: "monospace",
  },
  tipAmount: {
    color: Colors.skrToken,
    fontSize: 14,
    fontWeight: "700",
  },
  shareToggle: {
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.dimText,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  shareToggleActive: {
    borderColor: Colors.skrToken,
    backgroundColor: Colors.skrTokenBg,
  },
  shareToggleText: {
    color: Colors.dimText,
    fontSize: 14,
    fontWeight: "600",
  },
  shareToggleTextActive: {
    color: Colors.skrToken,
  },
});
