import React, { useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { Text, IconButton } from "react-native-paper";
import { useAuthorization } from "../utils/useAuthorization";
import { useSKR } from "../utils/useSKR";
import { useProofStore, ProofRecord, TipRecord } from "../utils/useProofStore";
import { useSKRTransfer } from "../utils/useSKRTransfer";
import { Colors } from "../utils/theme";
import { ellipsify } from "../utils/ellipsify";
import { PublicKey } from "@solana/web3.js";
import { PROTOCOL_FEE_BPS } from "../utils/constants";
import { getDemoProofs } from "../utils/demoData";

const SCREEN_WIDTH = Dimensions.get("window").width;

const SKR_TIERS = {
  NONE: { min: 0, label: "No SKR", tipAmounts: [] as number[] },
  BASIC: { min: 1, label: "SKR Holder", tipAmounts: [1, 5] },
  PRO: { min: 100, label: "SKR Pro", tipAmounts: [1, 5, 10, 25] },
  WHALE: { min: 1000, label: "SKR Whale", tipAmounts: [1, 5, 10, 25, 100] },
};

function getTier(balance: number) {
  if (balance >= SKR_TIERS.WHALE.min) return SKR_TIERS.WHALE;
  if (balance >= SKR_TIERS.PRO.min) return SKR_TIERS.PRO;
  if (balance >= SKR_TIERS.BASIC.min) return SKR_TIERS.BASIC;
  return SKR_TIERS.NONE;
}

function FeedCard({
  proof,
  onVouch,
  isTipping,
  currentWallet,
  tipAmounts,
  isBoosted,
}: {
  proof: ProofRecord;
  onVouch: (proof: ProofRecord, amount: number) => void;
  isTipping: string | null;
  currentWallet: string | null;
  tipAmounts: number[];
  isBoosted: boolean;
}) {
  const isOwn = currentWallet === proof.walletAddress;
  const totalVouched = proof.tips.reduce((sum, t) => sum + t.amount, 0);
  const uniqueVouchers = new Set(proof.tips.map((t) => t.from)).size;
  const timeSince = getTimeSince(proof.timestamp);
  const trustScore = totalVouched + uniqueVouchers * 5 + (proof.isSeeker ? 10 : 0);
  const hasVouched = proof.tips.some((t) => t.from === currentWallet);

  return (
    <View style={[styles.card, isBoosted && styles.boostedCard]}>
      {isBoosted && (
        <View style={styles.boostedBanner}>
          <Text style={styles.boostedText}>TRUSTED</Text>
        </View>
      )}
      <View style={styles.cardHeader}>
        <View style={styles.authorRow}>
          <View style={[styles.avatarCircle, isBoosted && styles.boostedAvatar]}>
            <Text style={styles.avatarText}>
              {proof.walletAddress.slice(0, 2)}
            </Text>
          </View>
          <View>
            <Text style={styles.authorAddr}>
              {ellipsify(proof.walletAddress, 4)}
            </Text>
            <Text style={styles.timeText}>{timeSince}</Text>
          </View>
        </View>
        <View style={styles.badgeRow}>
          <View style={styles.trustPill}>
            <Text style={styles.trustPillText}>{trustScore} trust</Text>
          </View>
          {proof.isSeeker && (
            <View style={styles.seekerPill}>
              <Text style={styles.seekerPillText}>SEEKER</Text>
            </View>
          )}
        </View>
      </View>

      <Image source={{ uri: proof.imageUri }} style={styles.cardImage} />

      <View style={styles.cardFooter}>
        <View style={styles.tipInfo}>
          <Text style={styles.tipTotal}>
            {totalVouched > 0 ? `${totalVouched} SKR staked` : "No vouches yet"}
          </Text>
          {uniqueVouchers > 0 && (
            <Text style={styles.tipCount}>
              {uniqueVouchers} voucher{uniqueVouchers !== 1 ? "s" : ""}
            </Text>
          )}
        </View>

        {!isOwn && tipAmounts.length > 0 && !hasVouched && (
          <View style={styles.tipButtons}>
            {tipAmounts.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.tipBtn,
                  isTipping === proof.id && styles.tipBtnDisabled,
                ]}
                onPress={() => onVouch(proof, amount)}
                disabled={isTipping === proof.id}
              >
                <Text style={styles.tipBtnText}>{amount}</Text>
                <Text style={styles.tipBtnLabel}>VOUCH</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {!isOwn && hasVouched && (
          <View style={styles.vouchedBadge}>
            <Text style={styles.vouchedText}>You vouched</Text>
          </View>
        )}
        {isOwn && (
          <View style={styles.ownBadge}>
            <Text style={styles.ownBadgeText}>Your proof</Text>
          </View>
        )}
      </View>

      {proof.latitude != null && proof.longitude != null && (
        <View style={styles.locationRow}>
          <IconButton
            icon="map-marker"
            iconColor={Colors.dimText}
            size={14}
            style={{ margin: 0 }}
          />
          <Text style={styles.locationText}>
            {proof.latitude.toFixed(3)}, {proof.longitude.toFixed(3)}
          </Text>
        </View>
      )}
    </View>
  );
}

function SKRGateScreen({ balance }: { balance: number }) {
  const nextTier =
    balance === 0 ? SKR_TIERS.BASIC : balance < 100 ? SKR_TIERS.PRO : SKR_TIERS.WHALE;

  return (
    <View style={styles.gateContainer}>
      <View style={styles.gateIcon}>
        <Text style={{ fontSize: 56 }}>🔒</Text>
      </View>
      <Text style={styles.gateTitle}>SKR Required</Text>
      <Text style={styles.gateText}>
        Hold SKR tokens to unlock the community feed, vouch for authentic
        proofs, and earn reputation as a trusted verifier.
      </Text>

      <View style={styles.tierCard}>
        <Text style={styles.tierCardTitle}>SKR Holder Tiers</Text>

        <View style={styles.tierRow}>
          <View style={[styles.tierDot, { backgroundColor: Colors.skrToken }]} />
          <View style={styles.tierInfo}>
            <Text style={styles.tierName}>Holder (1+ SKR)</Text>
            <Text style={styles.tierPerks}>View feed, vouch 1-5 SKR per proof</Text>
          </View>
        </View>

        <View style={styles.tierRow}>
          <View style={[styles.tierDot, { backgroundColor: Colors.verified }]} />
          <View style={styles.tierInfo}>
            <Text style={styles.tierName}>Pro (100+ SKR)</Text>
            <Text style={styles.tierPerks}>Vouch up to 25 SKR, higher trust weight</Text>
          </View>
        </View>

        <View style={styles.tierRow}>
          <View style={[styles.tierDot, { backgroundColor: Colors.seekerBadge }]} />
          <View style={styles.tierInfo}>
            <Text style={styles.tierName}>Whale (1,000+ SKR)</Text>
            <Text style={styles.tierPerks}>Vouch up to 100 SKR, max trust weight</Text>
          </View>
        </View>
      </View>

      <View style={styles.currentTierBox}>
        <Text style={styles.currentTierLabel}>YOUR BALANCE</Text>
        <Text style={styles.currentTierValue}>{balance.toLocaleString()} SKR</Text>
        {balance > 0 && (
          <Text style={styles.currentTierNext}>
            {nextTier.min - balance} more SKR to reach {nextTier.label}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const { selectedAccount } = useAuthorization();
  const skrInfo = useSKR(selectedAccount?.publicKey ?? null);
  const { sharedProofs, addTip } = useProofStore();
  const { vouchSKR } = useSKRTransfer();
  const [tippingId, setTippingId] = useState<string | null>(null);
  const [filterSeeker, setFilterSeeker] = useState(false);

  const tier = getTier(skrInfo.balance);

  const allFeedProofs = useMemo(() => {
    const demo = getDemoProofs();
    const userWallet = selectedAccount?.publicKey.toBase58() ?? "";
    const deduped = demo.filter(
      (d) => !sharedProofs.some((s) => s.id === d.id)
    );
    return [...sharedProofs, ...deduped];
  }, [sharedProofs, selectedAccount]);

  const sortedProofs = useMemo(() => {
    let proofs = [...allFeedProofs];
    if (filterSeeker) {
      proofs = proofs.filter((p) => p.isSeeker);
    }
    proofs.sort((a, b) => {
      const aTips = a.tips.reduce((s, t) => s + t.amount, 0);
      const bTips = b.tips.reduce((s, t) => s + t.amount, 0);
      if (bTips !== aTips) return bTips - aTips;
      return b.timestamp - a.timestamp;
    });
    return proofs;
  }, [allFeedProofs, filterSeeker]);

  const handleVouch = useCallback(
    async (proof: ProofRecord, amount: number) => {
      if (!selectedAccount) return;

      if (proof.isDemo) {
        Alert.alert(
          "Demo Proof",
          "This is a demo entry. Vouching is disabled for demo proofs — only real on-chain proofs can be vouched.",
          [{ text: "OK" }]
        );
        return;
      }

      if (selectedAccount.publicKey.toBase58() === proof.walletAddress) {
        Alert.alert("Can't Vouch", "You cannot vouch for your own proof.", [
          { text: "OK" },
        ]);
        return;
      }

      const alreadyVouched = proof.tips.some(
        (t) => t.from === selectedAccount.publicKey.toBase58()
      );
      if (alreadyVouched) {
        Alert.alert(
          "Already Vouched",
          "You've already vouched for this proof. One vouch per proof per wallet.",
          [{ text: "OK" }]
        );
        return;
      }

      if (skrInfo.balance < amount) {
        Alert.alert(
          "Insufficient SKR",
          `You need ${amount} SKR. Balance: ${skrInfo.balance.toLocaleString()} SKR`,
          [{ text: "OK" }]
        );
        return;
      }

      const feePercent = PROTOCOL_FEE_BPS / 100;
      const creatorGets = amount - (amount * PROTOCOL_FEE_BPS) / 10000;
      const recipientShort = `${proof.walletAddress.slice(0, 4)}…${proof.walletAddress.slice(-4)}`;

      Alert.alert(
        "Confirm Vouch",
        `Stake ${amount} SKR on this proof?\n\n` +
          `To: ${recipientShort}\n` +
          `Creator receives: ${creatorGets.toFixed(1)} SKR\n` +
          `Protocol fee (${feePercent}%): ${(amount - creatorGets).toFixed(1)} SKR\n` +
          `Network: ${proof.cluster ?? "mainnet-beta"}\n\n` +
          `Note: a small SOL fee (~0.002 SOL) may be charged if token accounts need to be created.\n\n` +
          `This cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Vouch",
            onPress: async () => {
              setTippingId(proof.id);
              try {
                const recipientPubkey = new PublicKey(proof.walletAddress);
                const { signature: txSignature } = await vouchSKR(
                  selectedAccount.publicKey,
                  recipientPubkey,
                  amount,
                  proof.hash
                );

                const tip: TipRecord = {
                  from: selectedAccount.publicKey.toBase58(),
                  amount,
                  txSignature,
                  timestamp: Date.now(),
                };

                await addTip({ proofId: proof.id, tip });
                skrInfo.refetch();

                Alert.alert(
                  "Vouched!",
                  `You staked ${amount} SKR on this proof's authenticity.`,
                  [{ text: "Done" }]
                );
              } catch (err: any) {
                console.error("Vouch failed:", err);
                Alert.alert(
                  "Vouch Failed",
                  err?.message || "Transaction was rejected or failed.",
                  [{ text: "OK" }]
                );
              } finally {
                setTippingId(null);
              }
            },
          },
        ]
      );
    },
    [selectedAccount, skrInfo, vouchSKR, addTip]
  );

  if (!selectedAccount) {
    return (
      <View style={styles.gateContainer}>
        <Text style={styles.gateTitle}>Connect Wallet</Text>
        <Text style={styles.gateText}>
          Connect your wallet on the Home tab to access the community feed.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.header}>Community Feed</Text>
          <Text style={styles.subheader}>
            {sortedProofs.length} proved moment
            {sortedProofs.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.tierBadge}>
            <Text style={styles.tierBadgeText}>{tier.label}</Text>
          </View>
          <View style={styles.balancePill}>
            <Text style={styles.balanceText}>
              {skrInfo.balance.toLocaleString()} SKR
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, !filterSeeker && styles.filterChipActive]}
          onPress={() => setFilterSeeker(false)}
        >
          <Text
            style={[
              styles.filterChipText,
              !filterSeeker && styles.filterChipTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterSeeker && styles.filterChipActive]}
          onPress={() => setFilterSeeker(true)}
        >
          <Text
            style={[
              styles.filterChipText,
              filterSeeker && styles.filterChipTextActive,
            ]}
          >
            Seeker Only
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sortedProofs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const totalTips = item.tips.reduce((s, t) => s + t.amount, 0);
          return (
            <FeedCard
              proof={item}
              onVouch={handleVouch}
              isTipping={tippingId}
              currentWallet={selectedAccount.publicKey.toBase58()}
              tipAmounts={tier.tipAmounts}
              isBoosted={totalTips >= 10}
            />
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      />
    </View>
  );
}

function getTimeSince(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  header: {
    fontSize: 30,
    fontWeight: "700",
    color: "#E8E8F0",
  },
  subheader: {
    fontSize: 13,
    color: Colors.dimText,
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 4,
    marginTop: 4,
  },
  tierBadge: {
    backgroundColor: "rgba(0, 229, 255, 0.1)",
    borderWidth: 1,
    borderColor: Colors.verified,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tierBadgeText: {
    color: Colors.verified,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  balancePill: {
    backgroundColor: Colors.skrTokenBg,
    borderWidth: 1,
    borderColor: Colors.skrToken,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  balanceText: {
    color: Colors.skrToken,
    fontSize: 12,
    fontWeight: "700",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  filterChipActive: {
    borderColor: Colors.verified,
    backgroundColor: "rgba(0, 229, 255, 0.1)",
  },
  filterChipText: {
    color: "#666",
    fontSize: 12,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: Colors.verified,
  },
  list: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 102,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.softBorder,
    overflow: "hidden",
  },
  boostedCard: {
    borderColor: Colors.seekerBadge,
    borderWidth: 2,
  },
  boostedBanner: {
    backgroundColor: Colors.seekerBadgeBg,
    paddingVertical: 4,
    alignItems: "center",
  },
  boostedText: {
    color: Colors.seekerBadge,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.verified,
    justifyContent: "center",
    alignItems: "center",
  },
  boostedAvatar: {
    backgroundColor: Colors.seekerBadge,
  },
  avatarText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 13,
    textTransform: "uppercase",
  },
  authorAddr: {
    color: "#E8E8F0",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  timeText: {
    color: Colors.dimText,
    fontSize: 11,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 4,
  },
  seekerPill: {
    backgroundColor: Colors.seekerBadgeBg,
    borderWidth: 1,
    borderColor: Colors.seekerBadge,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  seekerPillText: {
    color: Colors.seekerBadge,
    fontSize: 9,
    fontWeight: "700",
  },
  provedPill: {
    backgroundColor: Colors.verifiedBg,
    borderWidth: 1,
    borderColor: Colors.verified,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  provedPillText: {
    color: Colors.verified,
    fontSize: 9,
    fontWeight: "700",
  },
  cardImage: {
    width: SCREEN_WIDTH - 34,
    aspectRatio: 4 / 3,
    resizeMode: "contain",
    backgroundColor: "#000",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  tipInfo: {
    flex: 1,
  },
  tipTotal: {
    color: Colors.skrToken,
    fontSize: 15,
    fontWeight: "700",
  },
  tipCount: {
    color: Colors.dimText,
    fontSize: 11,
    marginTop: 1,
  },
  tipButtons: {
    flexDirection: "row",
    gap: 6,
  },
  tipBtn: {
    backgroundColor: "rgba(165, 214, 167, 0.08)",
    borderWidth: 1,
    borderColor: Colors.skrToken,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 44,
  },
  tipBtnDisabled: {
    opacity: 0.4,
  },
  tipBtnText: {
    color: Colors.skrToken,
    fontSize: 14,
    fontWeight: "700",
  },
  tipBtnLabel: {
    color: Colors.skrToken,
    fontSize: 8,
    fontWeight: "600",
    opacity: 0.7,
    marginTop: 1,
  },
  trustPill: {
    backgroundColor: "rgba(0, 229, 255, 0.08)",
    borderWidth: 1,
    borderColor: Colors.verified,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  trustPillText: {
    color: Colors.verified,
    fontSize: 9,
    fontWeight: "700",
  },
  vouchedBadge: {
    backgroundColor: Colors.skrTokenBg,
    borderWidth: 1,
    borderColor: Colors.skrToken,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  vouchedText: {
    color: Colors.skrToken,
    fontSize: 12,
    fontWeight: "600",
  },
  ownBadge: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ownBadgeText: {
    color: Colors.dimText,
    fontSize: 12,
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 2,
  },
  locationText: {
    color: Colors.dimText,
    fontSize: 11,
  },
  gateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A0A0F",
    padding: 28,
  },
  gateIcon: {
    marginBottom: 8,
  },
  gateTitle: {
    color: "#E8E8F0",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  gateText: {
    color: Colors.dimText,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 24,
  },
  tierCard: {
    width: "100%",
    backgroundColor: "#1A1A2E",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
  },
  tierCardTitle: {
    color: "#E8E8F0",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 14,
  },
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
  },
  tierDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    color: "#E8E8F0",
    fontSize: 14,
    fontWeight: "600",
  },
  tierPerks: {
    color: Colors.dimText,
    fontSize: 12,
    marginTop: 1,
  },
  currentTierBox: {
    width: "100%",
    backgroundColor: "#1A1A2E",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: "center",
  },
  currentTierLabel: {
    color: Colors.dimText,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  currentTierValue: {
    color: Colors.skrToken,
    fontSize: 28,
    fontWeight: "700",
    marginVertical: 4,
  },
  currentTierNext: {
    color: Colors.dimText,
    fontSize: 12,
  },
});
