import React from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { Text } from "react-native-paper";
import { useAuthorization } from "../utils/useAuthorization";
import { useSeeker } from "../utils/useSeeker";
import { useSKR } from "../utils/useSKR";
import { useProofStore } from "../utils/useProofStore";
import { useGetBalance } from "../components/account/account-data-access";
import { SignInFeature } from "../components/sign-in/sign-in-feature";
import { Colors } from "../utils/theme";
import { ellipsify } from "../utils/ellipsify";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, accent ? { color: accent } : null]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function StatusPill({
  label,
  active,
  color,
  bgColor,
}: {
  label: string;
  active: boolean;
  color: string;
  bgColor: string;
}) {
  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: active ? bgColor : "rgba(255,255,255,0.05)",
          borderColor: active ? color : "#333",
        },
      ]}
    >
      <View
        style={[
          styles.pillDot,
          { backgroundColor: active ? color : "#555" },
        ]}
      />
      <Text style={[styles.pillText, { color: active ? color : "#555" }]}>
        {label}
      </Text>
    </View>
  );
}

export function HomeScreen() {
  const { selectedAccount } = useAuthorization();
  const seekerInfo = useSeeker(selectedAccount?.publicKey ?? null);
  const skrInfo = useSKR(selectedAccount?.publicKey ?? null);
  const { proofs } = useProofStore();
  const balanceQuery = useGetBalance({
    address: selectedAccount?.publicKey!,
  });

  if (!selectedAccount) {
    return (
      <View style={styles.welcomeContainer}>
        <Text style={styles.logo}>PROOF</Text>
        <Text style={styles.tagline}>
          Blockchain-verified photo authenticity
        </Text>
        <Text style={styles.subtitle}>
          In the age of AI, prove your photos are real.{"\n"}
          Anchor them on Solana the instant you take them.
        </Text>

        <View style={styles.featureList}>
          <FeatureItem icon="📸" text="Capture and hash photos instantly" />
          <FeatureItem icon="⛓" text="Anchor proof on Solana via Memo" />
          <FeatureItem icon="🔍" text="Anyone can verify authenticity" />
          <FeatureItem icon="📱" text="Seeker+ exclusive features" />
        </View>

        <SignInFeature />
      </View>
    );
  }

  const solBalance = balanceQuery.data
    ? (balanceQuery.data / LAMPORTS_PER_SOL).toFixed(4)
    : "...";
  const provedCount = proofs.filter((p) => p.signature).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.dashTitle}>Dashboard</Text>
      <Text style={styles.walletAddr}>
        {ellipsify(selectedAccount.publicKey.toBase58(), 6)}
      </Text>

      <View style={styles.pillRow}>
        <StatusPill
          label="Seeker"
          active={seekerInfo.isSeekerUI}
          color={Colors.seekerBadge}
          bgColor={Colors.seekerBadgeBg}
        />
        <StatusPill
          label="SKR Holder"
          active={skrInfo.hasToken}
          color={Colors.skrToken}
          bgColor={Colors.skrTokenBg}
        />
      </View>

      <View style={styles.statsRow}>
        <StatCard label="SOL" value={solBalance} accent={Colors.verified} />
        <StatCard
          label="SKR"
          value={skrInfo.balance > 0 ? skrInfo.balance.toLocaleString() : "0"}
          accent={Colors.skrToken}
        />
        <StatCard
          label="Proofs"
          value={provedCount.toString()}
          accent={Colors.seekerBadge}
        />
      </View>

      {seekerInfo.isVerifiedSeeker && (
        <View style={styles.seekerCard}>
          <Text style={styles.seekerCardTitle}>Seeker Verified</Text>
          <Text style={styles.seekerCardText}>
            Your Seeker Genesis Token was detected. You have access to Proof+
            features including device attestation and enhanced metadata.
          </Text>
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>How it works</Text>
        <Step num="1" text="Take a photo in the Camera tab" />
        <Step num="2" text="Proof hashes it with SHA-256 + metadata" />
        <Step num="3" text="Hash is anchored on Solana via Memo program" />
        <Step num="4" text="Anyone can verify the photo's authenticity" />
      </View>
    </ScrollView>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function Step({ num, text }: { num: string; text: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{num}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  welcomeContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: "#0A0A0F",
    justifyContent: "center",
  },
  logo: {
    fontSize: 42,
    fontWeight: "900",
    color: Colors.verified,
    letterSpacing: 6,
    textAlign: "center",
  },
  tagline: {
    fontSize: 14,
    color: Colors.dimText,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 15,
    color: "#C0C0D0",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  featureList: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 28,
    textAlign: "center",
  },
  featureText: {
    color: "#C0C0D0",
    fontSize: 14,
  },
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  dashTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#E8E8F0",
  },
  walletAddr: {
    fontSize: 13,
    color: Colors.dimText,
    fontFamily: "monospace",
    marginTop: 2,
    marginBottom: 16,
  },
  pillRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  pillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1A1A2E",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#E8E8F0",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.dimText,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  seekerCard: {
    backgroundColor: Colors.seekerBadgeBg,
    borderWidth: 1,
    borderColor: Colors.seekerBadge,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  seekerCardTitle: {
    color: Colors.seekerBadge,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  seekerCardText: {
    color: "#C0C0D0",
    fontSize: 13,
    lineHeight: 19,
  },
  infoCard: {
    backgroundColor: "#1A1A2E",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  infoCardTitle: {
    color: "#E8E8F0",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.verified,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 13,
  },
  stepText: {
    color: "#C0C0D0",
    fontSize: 14,
    flex: 1,
  },
});
