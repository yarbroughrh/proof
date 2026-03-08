import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import {
  Alert,
  Dimensions,
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import { Text, IconButton } from "react-native-paper";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { useIsFocused } from "@react-navigation/native";
import * as Location from "expo-location";
import { useAuthorization } from "../utils/useAuthorization";
import { useSeeker } from "../utils/useSeeker";
import { useProofStore, ProofRecord } from "../utils/useProofStore";
import { useProofAnchor } from "../utils/useProofAnchor";
import { hashPhotoWithMetadata } from "../utils/hashPhoto";
import { useCluster } from "../components/cluster/cluster-data-access";
import { Colors } from "../utils/theme";

const SCREEN_W = Dimensions.get("window").width;
const SCREEN_H = Dimensions.get("window").height;
const HANDLE_HIT = 32;
const MIN_BOX = 60;

type CropBox = { x: number; y: number; w: number; h: number };
type DragHandle = "tl" | "tr" | "bl" | "br" | "move" | null;

function CropEditor({
  uri,
  onDone,
  onCancel,
}: {
  uri: string;
  onDone: (croppedUri: string) => void;
  onCancel: () => void;
}) {
  const [imgNatural, setImgNatural] = useState({ w: 1, h: 1 });
  const [containerSize, setContainerSize] = useState({ w: SCREEN_W, h: SCREEN_H });
  const [applying, setApplying] = useState(false);
  const [box, setBox] = useState<CropBox>({ x: 0, y: 0, w: 100, h: 100 });
  const boxRef = useRef<CropBox>({ x: 0, y: 0, w: 100, h: 100 });
  const dragRef = useRef<{
    handle: DragHandle;
    sx: number;
    sy: number;
    sb: CropBox;
  } | null>(null);

  useEffect(() => {
    ImageManipulator.manipulateAsync(uri, [], {})
      .then((r) => setImgNatural({ w: r.width, h: r.height }))
      .catch(() =>
        Image.getSize(uri, (w, h) => setImgNatural({ w, h }), () => {})
      );
  }, [uri]);

  const displayRect = useMemo(() => {
    const { w: cw, h: ch } = containerSize;
    if (imgNatural.w <= 1 || cw <= 1 || ch <= 1) return { x: 0, y: 0, w: cw, h: ch };
    const ia = imgNatural.w / imgNatural.h;
    const ca = cw / ch;
    if (ia > ca) {
      const dh = cw / ia;
      return { x: 0, y: (ch - dh) / 2, w: cw, h: dh };
    } else {
      const dw = ch * ia;
      return { x: (cw - dw) / 2, y: 0, w: dw, h: ch };
    }
  }, [imgNatural, containerSize]);

  // Reset box to cover most of the actual image area once dimensions are known
  useEffect(() => {
    if (imgNatural.w <= 1) return;
    const inset = 24;
    const size = Math.max(MIN_BOX, Math.min(
      displayRect.w - inset * 2,
      displayRect.h - inset * 2,
    ));
    const next: CropBox = {
      x: displayRect.x + (displayRect.w - size) / 2,
      y: displayRect.y + (displayRect.h - size) / 2,
      w: size,
      h: size,
    };
    boxRef.current = next;
    setBox(next);
  }, [displayRect, imgNatural.w]);

  const getHandle = (tx: number, ty: number): DragHandle => {
    const { x, y, w, h } = boxRef.current;
    if (Math.abs(tx - x) < HANDLE_HIT && Math.abs(ty - y) < HANDLE_HIT) return "tl";
    if (Math.abs(tx - (x + w)) < HANDLE_HIT && Math.abs(ty - y) < HANDLE_HIT) return "tr";
    if (Math.abs(tx - x) < HANDLE_HIT && Math.abs(ty - (y + h)) < HANDLE_HIT) return "bl";
    if (Math.abs(tx - (x + w)) < HANDLE_HIT && Math.abs(ty - (y + h)) < HANDLE_HIT) return "br";
    if (tx > x + HANDLE_HIT && tx < x + w - HANDLE_HIT &&
        ty > y + HANDLE_HIT && ty < y + h - HANDLE_HIT) return "move";
    return null;
  };

  const onTouchStart = (e: any) => {
    const { locationX: tx, locationY: ty } = e.nativeEvent;
    const handle = getHandle(tx, ty);
    if (handle) {
      dragRef.current = { handle, sx: tx, sy: ty, sb: { ...boxRef.current } };
    }
  };

  const onTouchMove = (e: any) => {
    if (!dragRef.current) return;
    const { locationX: tx, locationY: ty } = e.nativeEvent;
    const { handle, sx, sy, sb } = dragRef.current;
    const dx = tx - sx;
    const dy = ty - sy;
    const { x: rx, y: ry, w: rw, h: rh } = displayRect;
    let { x, y, w, h } = sb;

    if (handle === "move") {
      x = Math.max(rx, Math.min(rx + rw - w, x + dx));
      y = Math.max(ry, Math.min(ry + rh - h, y + dy));
    } else if (handle === "tl") {
      const nx = Math.max(rx, Math.min(x + w - MIN_BOX, x + dx));
      const ny = Math.max(ry, Math.min(y + h - MIN_BOX, y + dy));
      w = w + (x - nx); h = h + (y - ny); x = nx; y = ny;
    } else if (handle === "tr") {
      const ny = Math.max(ry, Math.min(y + h - MIN_BOX, y + dy));
      h = h + (y - ny); y = ny;
      w = Math.max(MIN_BOX, Math.min(rx + rw - x, w + dx));
    } else if (handle === "bl") {
      const nx = Math.max(rx, Math.min(x + w - MIN_BOX, x + dx));
      w = w + (x - nx); x = nx;
      h = Math.max(MIN_BOX, Math.min(ry + rh - y, h + dy));
    } else if (handle === "br") {
      w = Math.max(MIN_BOX, Math.min(rx + rw - x, w + dx));
      h = Math.max(MIN_BOX, Math.min(ry + rh - y, h + dy));
    }

    const next: CropBox = { x, y, w, h };
    boxRef.current = next;
    setBox(next);
  };

  const onTouchEnd = () => { dragRef.current = null; };

  const apply = () => {
    Alert.alert(
      "Use this crop?",
      "The proof will be created from this cropped version.",
      [
        { text: "Keep editing", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setApplying(true);
            try {
              const { x: bx, y: by, w: bw, h: bh } = boxRef.current;
              const { x: rx, y: ry, w: rw, h: rh } = displayRect;
              const { w: iw, h: ih } = imgNatural;
              const scaleX = iw / rw;
              const scaleY = ih / rh;
              const cropX = Math.max(0, Math.round((bx - rx) * scaleX));
              const cropY = Math.max(0, Math.round((by - ry) * scaleY));
              const cropW = Math.min(Math.round(bw * scaleX), iw - cropX);
              const cropH = Math.min(Math.round(bh * scaleY), ih - cropY);
              const result = await ImageManipulator.manipulateAsync(
                uri,
                [{ crop: { originX: cropX, originY: cropY, width: Math.max(1, cropW), height: Math.max(1, cropH) } }],
                { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG }
              );
              onDone(result.uri);
            } catch {
              onCancel();
            } finally {
              setApplying(false);
            }
          },
        },
      ]
    );
  };

  const { x, y, w, h } = box;

  return (
    <View style={cs.root}>
      {/* toolbar in normal layout flow — not absolute — so flex:1 below is accurate */}
      <View style={cs.toolbar}>
        <TouchableOpacity style={cs.cancelBtn} onPress={onCancel}>
          <Text style={cs.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={cs.applyBtn} onPress={apply} disabled={applying}>
          {applying
            ? <ActivityIndicator color="#000" size="small" />
            : <Text style={cs.applyText}>Apply</Text>
          }
        </TouchableOpacity>
      </View>

      {/* image fills exactly the space below toolbar — touch coords == image coords */}
      <View
        style={{ flex: 1 }}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setContainerSize({ w: width, h: height });
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="contain" />

        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={[cs.shade, { top: 0, left: 0, right: 0, height: y }]} />
          <View style={[cs.shade, { top: y + h, left: 0, right: 0, bottom: 0 }]} />
          <View style={[cs.shade, { top: y, left: 0, width: x, height: h }]} />
          <View style={[cs.shade, { top: y, left: x + w, right: 0, height: h }]} />
          <View style={[cs.cropBorder, { top: y, left: x, width: w, height: h }]} />
          <View style={[cs.gridLine, { top: y, left: x + w / 3, width: 1, height: h }]} />
          <View style={[cs.gridLine, { top: y, left: x + (2 * w) / 3, width: 1, height: h }]} />
          <View style={[cs.gridLine, { top: y + h / 3, left: x, width: w, height: 1 }]} />
          <View style={[cs.gridLine, { top: y + (2 * h) / 3, left: x, width: w, height: 1 }]} />
          {([
            { cx: x, cy: y }, { cx: x + w, cy: y },
            { cx: x, cy: y + h }, { cx: x + w, cy: y + h },
          ] as { cx: number; cy: number }[]).map(({ cx, cy }, i) => (
            <View key={i} style={[cs.handle, { top: cy - 11, left: cx - 11 }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

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
  const [zoom, setZoom] = useState(0);
  const [showCrop, setShowCrop] = useState(false);
  const [includeGPS, setIncludeGPS] = useState(true);
  const pinchRef = useRef<number | null>(null);
  const isFocused = useIsFocused();

  const { selectedAccount } = useAuthorization();
  const { selectedCluster } = useCluster();
  const seekerInfo = useSeeker(selectedAccount?.publicKey ?? null);
  const { addProof, updateProofSignature } = useProofStore();
  const { anchorProof } = useProofAnchor();

  const handlePinchStart = useCallback((e: any) => {
    const touches = e.nativeEvent.touches;
    if (touches.length === 2) {
      pinchRef.current = Math.hypot(
        touches[1].pageX - touches[0].pageX,
        touches[1].pageY - touches[0].pageY
      );
    }
  }, []);

  const handlePinchMove = useCallback((e: any) => {
    const touches = e.nativeEvent.touches;
    if (touches.length === 2 && pinchRef.current !== null) {
      const dist = Math.hypot(
        touches[1].pageX - touches[0].pageX,
        touches[1].pageY - touches[0].pageY
      );
      const delta = (dist - pinchRef.current) / 500;
      setZoom((prev) => Math.min(1, Math.max(0, prev + delta)));
      pinchRef.current = dist;
    }
  }, []);

  const handlePinchEnd = useCallback(() => { pinchRef.current = null; }, []);

  const flipCamera = useCallback(() => {
    setFacing((f) => (f === "back" ? "front" : "back"));
    setZoom(0);
    setFlash("off");
  }, []);

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current || !selectedAccount) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, exif: true });
      if (photo?.uri) {
        const normalized = await ImageManipulator.manipulateAsync(
          photo.uri,
          [],
          {
            compress: 0.95,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );
        setCapturedUri(normalized.uri);
      }
    } catch (err) {
      console.error("Camera capture failed:", err);
    }
  }, [selectedAccount]);

  const proveAndAnchor = useCallback(async () => {
    if (!capturedUri || !selectedAccount) return;
    setIsProcessing(true);
    try {
      let lat: number | null = null;
      let lng: number | null = null;
      if (includeGPS) {
        setStatusText("Getting location...");
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            lat = loc.coords.latitude;
            lng = loc.coords.longitude;
          }
        } catch {}
      }

      const timestamp = Date.now();
      const device = Platform.constants ? (Platform.constants as any).Model || "Android" : "Android";

      setStatusText("Hashing photo + metadata...");
      const hash = await hashPhotoWithMetadata({ uri: capturedUri, timestamp, latitude: lat, longitude: lng, device });

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
        cluster: selectedCluster.network,
        walletAddress: selectedAccount.publicKey.toBase58(),
        isSeeker: seekerInfo.isVerifiedSeeker,
        shared: shareToFeed,
        tips: [],
      };

      await addProof(record);

      const locationNote = lat != null
        ? `• Location (approx): ${lat.toFixed(2)}, ${lng?.toFixed(2)}\n`
        : includeGPS
          ? "• Location unavailable\n"
          : "• Location not included\n";

      await new Promise<void>((resolve, reject) => {
        Alert.alert(
          "Anchor on Solana",
          `This will publish a proof record on the Solana blockchain.\n\nWhat becomes public & immutable:\n• Proof fingerprint (SHA-256 hash)\n• Timestamp\n${locationNote}\nNetwork: ${selectedCluster.network}\nCost: ~0.000005 SOL`,
          [
            { text: "Cancel", style: "cancel", onPress: () => reject(new Error("Cancelled")) },
            { text: "Anchor", onPress: () => resolve() },
          ]
        );
      });

      setStatusText("Anchoring on Solana...");
      const signature = await anchorProof(selectedAccount.publicKey, {
        hash, timestamp, lat, lng, device, isSeeker: seekerInfo.isVerifiedSeeker,
      });

      await updateProofSignature({ id: proofId, signature });
      setStatusText("Proved!");
      setTimeout(() => { setCapturedUri(null); setStatusText(""); }, 1500);
    } catch (err: any) {
      console.error("Proof failed:", err);
      setStatusText("Failed — saved locally");
      setTimeout(() => { setCapturedUri(null); setStatusText(""); }, 2000);
    } finally {
      setIsProcessing(false);
    }
  }, [capturedUri, selectedAccount, seekerInfo, addProof, updateProofSignature, anchorProof, selectedCluster, shareToFeed, includeGPS]);

  if (!permission) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.verified} /></View>;

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

  if (capturedUri && showCrop) {
    return (
      <CropEditor
        uri={capturedUri}
        onDone={(uri) => { setCapturedUri(uri); setShowCrop(false); }}
        onCancel={() => setShowCrop(false)}
      />
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
            <View style={styles.previewTopBar}>
              <TouchableOpacity style={styles.cropIconBtn} onPress={() => setShowCrop(true)}>
                <Text style={styles.cropIconText}>✂ Crop</Text>
              </TouchableOpacity>
              <View style={styles.previewTopRight}>
                <TouchableOpacity
                  style={[styles.shareBtn, shareToFeed && styles.shareBtnActive]}
                  onPress={() => setShareToFeed(!shareToFeed)}
                >
                  <Text style={[styles.shareText, shareToFeed && styles.shareTextActive]}>
                    {shareToFeed ? "Sharing to Feed" : "Private"}
                  </Text>
                </TouchableOpacity>
                {seekerInfo.isSeekerUI && (
                  <View style={styles.seekerBadge}>
                    <Text style={styles.seekerBadgeText}>SEEKER+</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.previewMidBar}>
              <TouchableOpacity
                style={[styles.gpsBtn, includeGPS && styles.gpsBtnActive]}
                onPress={() => setIncludeGPS(!includeGPS)}
              >
                <Text style={[styles.gpsBtnText, includeGPS && styles.gpsBtnTextActive]}>
                  {includeGPS ? "Location On" : "Location Off"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.previewActions}>
              <TouchableOpacity
                style={styles.discardBtn}
                onPress={() => {
                  setCapturedUri(null);
                  setShowCrop(false);
                }}
              >
                <Text style={styles.discardText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.proveBtn} onPress={proveAndAnchor}>
                <Text style={styles.proveText}>Prove It</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isFocused ? (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flash}
          enableTorch={facing === "back" && flash === "on"}
          zoom={zoom}
        >
          <View
            style={styles.cameraOverlay}
            onTouchStart={handlePinchStart}
            onTouchMove={handlePinchMove}
            onTouchEnd={handlePinchEnd}
          >
            <View style={styles.topControls}>
              {facing === "back" ? (
                <IconButton
                  icon={flash === "off" ? "flash-off" : "flash"}
                  iconColor={flash === "on" ? Colors.verified : "#fff"}
                  size={24}
                  onPress={() => setFlash(flash === "off" ? "on" : "off")}
                />
              ) : (
                <View style={{ width: 48 }} />
              )}
              {zoom > 0.01 && (
                <View style={styles.zoomPill}>
                  <Text style={styles.zoomText}>{(1 + zoom * 4).toFixed(1)}x</Text>
                </View>
              )}
              <IconButton icon="camera-flip" iconColor="#fff" size={24} onPress={flipCamera} />
            </View>
            <View style={styles.bottomControls}>
              <View style={styles.captureRing}>
                <TouchableOpacity style={styles.captureBtn} onPress={takePhoto} />
              </View>
            </View>
          </View>
        </CameraView>
      ) : (
        <View style={styles.cameraPaused} />
      )}
    </View>
  );
}

const cs = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#0A0A0F",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  shade: { position: "absolute", backgroundColor: "rgba(0,0,0,0.6)" },
  cropBorder: { position: "absolute", borderWidth: 2, borderColor: Colors.verified },
  gridLine: { position: "absolute", backgroundColor: "rgba(255,255,255,0.18)" },
  handle: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.verified,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 6,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  cancelText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  applyBtn: {
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: 24,
    backgroundColor: Colors.verified,
    minWidth: 90,
    alignItems: "center",
  },
  applyText: { color: "#001116", fontWeight: "800", fontSize: 14 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0A0A0F", padding: 32 },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: "space-between" },
  topControls: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 18, paddingHorizontal: 10 },
  zoomPill: { backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  zoomText: { color: "#fff", fontSize: 13, fontWeight: "700", letterSpacing: 0.3 },
  bottomControls: { alignItems: "center", paddingBottom: 98 },
  captureRing: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: "rgba(0, 229, 255, 0.8)", justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.2)" },
  captureBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#fff" },
  preview: { flex: 1, resizeMode: "contain", backgroundColor: "#000" },
  cameraPaused: { flex: 1, backgroundColor: "#000" },
  previewTopBar: {
    position: "absolute",
    top: 20,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewTopRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  previewMidBar: {
    position: "absolute",
    top: 66,
    left: 16,
    right: 16,
    alignItems: "flex-start",
  },
  cropIconBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  cropIconText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  shareBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  shareBtnActive: { borderColor: Colors.skrToken, backgroundColor: Colors.skrTokenBg },
  shareText: { color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: "600" },
  shareTextActive: { color: Colors.skrToken },
  gpsBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  gpsBtnActive: {
    borderColor: Colors.verified,
    backgroundColor: "rgba(0,229,255,0.12)",
  },
  gpsBtnText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "700",
  },
  gpsBtnTextActive: {
    color: Colors.verified,
  },
  previewActions: { position: "absolute", bottom: 96, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 14 },
  discardBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 28, borderWidth: 1, borderColor: "rgba(255,255,255,0.8)", backgroundColor: "rgba(0,0,0,0.4)" },
  discardText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  proveBtn: { paddingHorizontal: 30, paddingVertical: 12, borderRadius: 28, backgroundColor: Colors.verified },
  proveText: { color: "#000", fontSize: 16, fontWeight: "700" },
  processingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center" },
  statusText: { color: Colors.verified, fontSize: 16, fontWeight: "600", marginTop: 12 },
  seekerBadge: {
    backgroundColor: Colors.seekerBadgeBg,
    borderWidth: 1,
    borderColor: Colors.seekerBadge,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  seekerBadgeText: { color: Colors.seekerBadge, fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  permText: { color: "#E8E8F0", fontSize: 16, textAlign: "center", marginBottom: 16 },
  permButton: { backgroundColor: Colors.verified, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24 },
  permButtonText: { color: "#000", fontWeight: "700", fontSize: 15 },
});
