import React, { useRef, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import { Text, IconButton } from "react-native-paper";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { useAuthorization } from "../utils/useAuthorization";
import { useSeeker } from "../utils/useSeeker";
import { useProofStore, ProofRecord } from "../utils/useProofStore";
import { useProofAnchor } from "../utils/useProofAnchor";
import { hashPhotoWithMetadata } from "../utils/hashPhoto";
import { Colors } from "../utils/theme";

type FlashMode = "off" | "on";

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [shareToFeed, setShareToFeed] = useState(true);

  const { selectedAccount } = useAuthorization();
  const seekerInfo = useSeeker(selectedAccount?.publicKey ?? null);
  const { addProof, updateProofSignature } = useProofStore();
  const { anchorProof } = useProofAnchor();

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current || !selectedAccount) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        exif: true,
      });
      if (photo?.uri) {
        setCapturedUri(photo.uri);
      }
    } catch (err) {
      console.error("Camera capture failed:", err);
    }
  }, [selectedAccount]);

  const proveAndAnchor = useCallback(async () => {
    if (!capturedUri || !selectedAccount) return;

    setIsProcessing(true);
    try {
      setStatusText("Getting location...");
      let lat: number | null = null;
      let lng: number | null = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
        }
      } catch {
        // Location unavailable, continue without it
      }

      const timestamp = Date.now();
      const device = Platform.constants
        ? (Platform.constants as any).Model || "Android"
        : "Android";

      setStatusText("Hashing photo + metadata...");
      const hash = await hashPhotoWithMetadata({
        uri: capturedUri,
        timestamp,
        latitude: lat,
        longitude: lng,
        device,
      });

      const proofId = `${hash.slice(0, 8)}-${timestamp}`;
      const record: ProofRecord = {
        id: proofId,
        imageUri: capturedUri,
        hash,
        timestamp,
        latitude: lat,
        longitude: lng,
        deviceModel: device,
        signature: null,
        cluster: "devnet",
        walletAddress: selectedAccount.publicKey.toBase58(),
        isSeeker: seekerInfo.isVerifiedSeeker,
        shared: shareToFeed,
        tips: [],
      };

      await addProof(record);

      setStatusText("Anchoring on Solana...");
      const signature = await anchorProof(selectedAccount.publicKey, {
        hash,
        timestamp,
        lat,
        lng,
        device,
        isSeeker: seekerInfo.isVerifiedSeeker,
      });

      await updateProofSignature({ id: proofId, signature });

      setStatusText("Proved!");
      setTimeout(() => {
        setCapturedUri(null);
        setStatusText("");
      }, 1500);
    } catch (err: any) {
      console.error("Proof failed:", err);
      setStatusText("Failed — saved locally");
      setTimeout(() => {
        setCapturedUri(null);
        setStatusText("");
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  }, [capturedUri, selectedAccount, seekerInfo, addProof, updateProofSignature, anchorProof]);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.verified} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Camera access is required to prove photos</Text>
        <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
          <Text style={styles.permButtonText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!selectedAccount) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Connect your wallet first</Text>
        <Text style={[styles.permText, { fontSize: 14, marginTop: 4, color: Colors.dimText }]}>
          Go to the Home tab to connect
        </Text>
      </View>
    );
  }

  if (capturedUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedUri }} style={styles.preview} />
        {isProcessing ? (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color={Colors.verified} />
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        ) : statusText ? (
          <View style={styles.processingOverlay}>
            <Text style={[styles.statusText, { fontSize: 24 }]}>{statusText}</Text>
          </View>
        ) : (
          <>
            <View style={styles.shareToggle}>
              <TouchableOpacity
                style={[
                  styles.shareBtn,
                  shareToFeed && styles.shareBtnActive,
                ]}
                onPress={() => setShareToFeed(!shareToFeed)}
              >
                <Text
                  style={[
                    styles.shareText,
                    shareToFeed && styles.shareTextActive,
                  ]}
                >
                  {shareToFeed ? "Sharing to Feed" : "Private Proof"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.previewActions}>
              <TouchableOpacity
                style={styles.discardBtn}
                onPress={() => setCapturedUri(null)}
              >
                <Text style={styles.discardText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.proveBtn} onPress={proveAndAnchor}>
                <Text style={styles.proveText}>Prove It</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        {seekerInfo.isSeekerUI && !isProcessing && !statusText && (
          <View style={styles.seekerBadge}>
            <Text style={styles.seekerBadgeText}>SEEKER+</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
      >
        <View style={styles.cameraOverlay}>
          <View style={styles.topControls}>
            <IconButton
              icon={flash === "off" ? "flash-off" : "flash"}
              iconColor="#fff"
              size={24}
              onPress={() => setFlash(flash === "off" ? "on" : "off")}
            />
            <IconButton
              icon="camera-flip"
              iconColor="#fff"
              size={24}
              onPress={() => setFacing(facing === "back" ? "front" : "back")}
            />
          </View>

          <View style={styles.bottomControls}>
            <View style={styles.captureRing}>
              <TouchableOpacity style={styles.captureBtn} onPress={takePhoto} />
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A0A0F",
    padding: 32,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingHorizontal: 8,
  },
  bottomControls: {
    alignItems: "center",
    paddingBottom: 40,
  },
  captureRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: Colors.verified,
    justifyContent: "center",
    alignItems: "center",
  },
  captureBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
  },
  preview: {
    flex: 1,
    resizeMode: "cover",
  },
  previewActions: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  discardBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#fff",
  },
  discardText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  proveBtn: {
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: Colors.verified,
  },
  proveText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    color: Colors.verified,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  seekerBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: Colors.seekerBadgeBg,
    borderWidth: 1,
    borderColor: Colors.seekerBadge,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  seekerBadgeText: {
    color: Colors.seekerBadge,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  permText: {
    color: "#E8E8F0",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  permButton: {
    backgroundColor: Colors.verified,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  permButtonText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 15,
  },
  shareToggle: {
    position: "absolute",
    bottom: 110,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  shareBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  shareBtnActive: {
    borderColor: Colors.skrToken,
    backgroundColor: Colors.skrTokenBg,
  },
  shareText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "600",
  },
  shareTextActive: {
    color: Colors.skrToken,
  },
});
