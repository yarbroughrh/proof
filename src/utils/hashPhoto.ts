import * as FileSystem from "expo-file-system";
import * as Crypto from "expo-crypto";

export interface HashInput {
  uri: string;
  timestamp: number;
  latitude: number | null;
  longitude: number | null;
  device: string;
}

export async function hashPhotoWithMetadata(input: HashInput): Promise<string> {
  const fileInfo = await FileSystem.getInfoAsync(input.uri);
  if (!fileInfo.exists) {
    throw new Error("Photo file does not exist");
  }

  if (fileInfo.size && fileInfo.size > 50 * 1024 * 1024) {
    throw new Error("Photo file exceeds 50MB limit");
  }

  const base64 = await FileSystem.readAsStringAsync(input.uri, {
    encoding: "base64" as any,
  });

  if (!base64 || base64.length === 0) {
    throw new Error("Failed to read photo data");
  }

  const canonical = [
    base64,
    input.timestamp.toString(),
    input.latitude?.toFixed(5) ?? "null",
    input.longitude?.toFixed(5) ?? "null",
    input.device,
  ].join("|");

  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    canonical
  );

  if (!/^[a-f0-9]{64}$/.test(hash)) {
    throw new Error("Hash generation produced invalid output");
  }

  return hash;
}
