import React from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useProofStore, ProofRecord } from "../utils/useProofStore";
import { Colors } from "../utils/theme";

const COLUMN_COUNT = 2;
const SCREEN_WIDTH = Dimensions.get("window").width;
const ITEM_GAP = 8;
const ITEM_WIDTH = (SCREEN_WIDTH - ITEM_GAP * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

function ProofThumbnail({ proof }: { proof: ProofRecord }) {
  const nav = useNavigation<any>();

  return (
    <TouchableOpacity
      style={styles.thumbContainer}
      onPress={() => nav.navigate("ProofDetail", { proofId: proof.id })}
      activeOpacity={0.8}
    >
      <Image source={{ uri: proof.imageUri }} style={styles.thumbImage} />
      <View style={styles.thumbOverlay}>
        <View style={styles.thumbBadgeRow}>
          {proof.signature ? (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>PROVED</Text>
            </View>
          ) : (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>LOCAL</Text>
            </View>
          )}
          {proof.isSeeker && (
            <View style={styles.seekerBadge}>
              <Text style={styles.seekerText}>SKR</Text>
            </View>
          )}
        </View>
        <Text style={styles.thumbDate}>
          {new Date(proof.timestamp).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function GalleryScreen() {
  const { proofs, isLoading } = useProofStore();

  if (isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Loading...</Text>
      </View>
    );
  }

  if (!proofs.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📷</Text>
        <Text style={styles.emptyTitle}>No proofs yet</Text>
        <Text style={styles.emptyText}>
          Take a photo in the Camera tab to create your first proof
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Proofs</Text>
      <Text style={styles.subheader}>{proofs.length} verified moments</Text>
      <FlatList
        data={proofs}
        keyExtractor={(item) => item.id}
        numColumns={COLUMN_COUNT}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => <ProofThumbnail proof={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
    paddingTop: 8,
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    color: "#E8E8F0",
    paddingHorizontal: 16,
  },
  subheader: {
    fontSize: 14,
    color: Colors.dimText,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  grid: {
    paddingHorizontal: ITEM_GAP,
    paddingBottom: 20,
  },
  row: {
    gap: ITEM_GAP,
    marginBottom: ITEM_GAP,
  },
  thumbContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.25,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#1A1A2E",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    padding: 8,
  },
  thumbBadgeRow: {
    flexDirection: "row",
    gap: 4,
  },
  verifiedBadge: {
    backgroundColor: Colors.verifiedBg,
    borderWidth: 1,
    borderColor: Colors.verified,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  verifiedText: {
    color: Colors.verified,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  pendingBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pendingText: {
    color: "#aaa",
    fontSize: 9,
    fontWeight: "700",
  },
  seekerBadge: {
    backgroundColor: Colors.seekerBadgeBg,
    borderWidth: 1,
    borderColor: Colors.seekerBadge,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  seekerText: {
    color: Colors.seekerBadge,
    fontSize: 9,
    fontWeight: "700",
  },
  thumbDate: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A0A0F",
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: "#E8E8F0",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyText: {
    color: Colors.dimText,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
