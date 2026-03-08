import React from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { Text } from "react-native-paper";
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import { useAuthorization } from "../utils/useAuthorization";
import { useSeeker } from "../utils/useSeeker";
import { useSKR } from "../utils/useSKR";
import { useProofStore } from "../utils/useProofStore";
import { useGetBalance } from "../components/account/account-data-access";
import { SignInFeature } from "../components/sign-in/sign-in-feature";
import { Colors } from "../utils/theme";
import { ellipsify } from "../utils/ellipsify";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

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
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.welcomeContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroGlowPrimary} />
        <View style={styles.heroGlowSecondary} />
        <View style={styles.heroGlowTertiary} />

        <View style={styles.eyebrow}>
          <MaterialCommunityIcon
            name="shield-check-outline"
            size={13}
            color={Colors.verified}
          />
          <Text style={styles.eyebrowText}>Mobile Proof of Authenticity</Text>
        </View>

        <View style={styles.heroPanel}>
          <View style={styles.logoOrb}>
            <View style={styles.logoOrbCore} />
          </View>
          <Text style={styles.logo}>PROOF</Text>
          <Text style={styles.tagline}>Blockchain-verified photo authenticity</Text>
          <Text style={styles.pitch}>
            Make every image feel verifiable. Capture it, hash it, and anchor a
            timestamped proof on Solana before anyone can question where it came
            from.
          </Text>

          <View style={styles.heroStats}>
            <HeroMetric label="Private" value="On device" />
            <HeroMetric label="Proof" value="SHA-256" />
            <HeroMetric label="Anchor" value="Solana" />
          </View>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureCardTitle}>Why it feels trustworthy</Text>
          <FeatureRow
            icon="shield-check-outline"
            text="Every proof binds the image, timestamp, device, and optional GPS together."
          />
          <FeatureRow
            icon="link-variant"
            text="Only the proof fingerprint goes on-chain, not the actual photo."
          />
          <FeatureRow
            icon="account-group-outline"
            text="SKR vouching adds social trust and a replayable public trail."
          />
          <FeatureRow
            icon="cellphone-check"
            text="Seeker devices unlock a stronger authenticity signal."
            last
          />
        </View>

        <SignInFeature />

        <View style={styles.walletRow}>
          <WalletBadge label="Phantom" />
          <WalletBadge label="Solflare" />
          <WalletBadge label="Seeker" />
        </View>

        <Text style={styles.walletSupport}>
          Photos stay on the phone. Only proofs touch the chain.
        </Text>
      </ScrollView>
    );
  }

  const solBalance = balanceQuery.data
    ? (balanceQuery.data / LAMPORTS_PER_SOL).toFixed(4)
    : "...";
  const provedCount = proofs.filter((p) => p.signature).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.dashContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.dashboardHero}>
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
          <View style={styles.seekerCardHeader}>
            <MaterialCommunityIcon
              name="check-decagram"
              size={20}
              color={Colors.seekerBadge}
            />
            <Text style={styles.seekerCardTitle}>Seeker Verified</Text>
          </View>
          <Text style={styles.seekerCardText}>
            Your Seeker Genesis Token was detected. You have access to Proof+
            signals including device attestation and stronger feed presence.
          </Text>
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>How it works</Text>
        <Step num="1" text="Take a photo in the Prove tab." />
        <Step num="2" text="Proof hashes the image together with metadata." />
        <Step num="3" text="The proof fingerprint is anchored via Solana Memo." />
        <Step num="4" text="Anyone can compare the image hash to the chain record." last />
      </View>
    </ScrollView>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroMetric}>
      <Text style={styles.heroMetricValue}>{value}</Text>
      <Text style={styles.heroMetricLabel}>{label}</Text>
    </View>
  );
}

function WalletBadge({ label }: { label: string }) {
  return (
    <View style={styles.walletBadge}>
      <Text style={styles.walletBadgeText}>{label}</Text>
    </View>
  );
}

function FeatureRow({
  icon,
  text,
  last,
}: {
  icon: string;
  text: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.featureRow, last && { marginBottom: 0 }]}>
      <View style={styles.featureIconWrap}>
        <MaterialCommunityIcon
          name={icon as any}
          size={17}
          color={Colors.verified}
        />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statAccent, { backgroundColor: accent }]} />
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
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
          backgroundColor: active ? bgColor : "rgba(255,255,255,0.03)",
          borderColor: active ? color : "rgba(255,255,255,0.08)",
        },
      ]}
    >
      <View
        style={[
          styles.pillDot,
          { backgroundColor: active ? color : "#444" },
        ]}
      />
      <Text style={[styles.pillText, { color: active ? color : "#555" }]}>
        {label}
      </Text>
    </View>
  );
}

function Step({
  num,
  text,
  last,
}: {
  num: string;
  text: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.step, last && { marginBottom: 0 }]}>
      <View style={styles.stepCircle}>
        <Text style={styles.stepNum}>{num}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07080F",
  },
  welcomeContent: {
    paddingHorizontal: 22,
    paddingTop: 30,
    paddingBottom: 114,
    flexGrow: 1,
  },
  heroGlowPrimary: {
    position: "absolute",
    top: 38,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(0, 229, 255, 0.12)",
  },
  heroGlowSecondary: {
    position: "absolute",
    top: 140,
    right: -60,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255, 179, 0, 0.07)",
  },
  heroGlowTertiary: {
    position: "absolute",
    top: 290,
    alignSelf: "center",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(0, 229, 255, 0.05)",
  },
  eyebrow: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.14)",
    backgroundColor: "rgba(7,14,22,0.76)",
    marginBottom: 16,
  },
  eyebrowText: {
    color: "#A6DDE4",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  heroPanel: {
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    backgroundColor: "rgba(12, 14, 24, 0.86)",
    marginBottom: 18,
  },
  logoOrb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignSelf: "center",
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,229,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.22)",
  },
  logoOrbCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.verified,
    shadowColor: Colors.verified,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    fontSize: 52,
    fontWeight: "900",
    color: Colors.verified,
    letterSpacing: 7,
    textAlign: "center",
    textShadowColor: "rgba(0, 229, 255, 0.55)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 26,
  },
  tagline: {
    fontSize: 11,
    color: "#7A8098",
    textAlign: "center",
    marginTop: 10,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  pitch: {
    fontSize: 17,
    color: "#D8D9E7",
    textAlign: "center",
    lineHeight: 27,
    marginTop: 22,
    marginBottom: 22,
    paddingHorizontal: 8,
  },
  heroStats: {
    flexDirection: "row",
    gap: 10,
  },
  heroMetric: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  heroMetricValue: {
    color: "#F3F7FF",
    fontSize: 14,
    fontWeight: "800",
  },
  heroMetricLabel: {
    color: "#6D7286",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  featureCard: {
    backgroundColor: "rgba(255,255,255,0.022)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  featureCardTitle: {
    color: "#F4F6FF",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
    gap: 12,
  },
  featureIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "rgba(0, 229, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.14)",
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    color: "#BFC5D8",
    fontSize: 14,
    flex: 1,
    lineHeight: 21,
    fontWeight: "500",
    paddingTop: 6,
  },
  walletRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  walletBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.02)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  walletBadgeText: {
    color: "#9DA3B7",
    fontSize: 11,
    fontWeight: "700",
  },
  walletSupport: {
    textAlign: "center",
    color: "#555C72",
    fontSize: 12,
    marginTop: 16,
    letterSpacing: 0.3,
    lineHeight: 18,
  },
  dashContent: {
    padding: 18,
    paddingBottom: 112,
  },
  dashboardHero: {
    backgroundColor: "rgba(12, 14, 24, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },
  dashTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#F0F4FF",
    letterSpacing: -0.4,
  },
  walletAddr: {
    fontSize: 13,
    color: "#626981",
    fontFamily: "monospace",
    marginTop: 4,
    marginBottom: 16,
  },
  pillRow: {
    flexDirection: "row",
    gap: 8,
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
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#10131D",
    borderRadius: 18,
    paddingTop: 0,
    paddingBottom: 15,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    overflow: "hidden",
  },
  statAccent: {
    width: "100%",
    height: 3,
    marginBottom: 14,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#60677E",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  seekerCard: {
    backgroundColor: "rgba(255, 179, 0, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 179, 0, 0.22)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  seekerCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  seekerCardTitle: {
    color: Colors.seekerBadge,
    fontSize: 15,
    fontWeight: "700",
  },
  seekerCardText: {
    color: "#C6B48A",
    fontSize: 13,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: "#10131D",
    borderRadius: 20,
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  infoCardTitle: {
    color: "#F0F4FF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 14,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 229, 255, 0.09)",
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  stepNum: {
    color: Colors.verified,
    fontWeight: "800",
    fontSize: 13,
  },
  stepText: {
    color: "#A8B0C4",
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});
