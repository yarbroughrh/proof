import { useCallback } from "react";
import {
  PublicKey,
  TransactionMessage,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import { useConnection } from "./ConnectionProvider";
import { useMobileWallet } from "./useMobileWallet";
import { MEMO_PROGRAM_ID, PROOF_VERSION, MAX_MEMO_SIZE } from "./constants";
import { simulateTransaction } from "./safety";

export interface ProofPayload {
  hash: string;
  timestamp: number;
  lat: number | null;
  lng: number | null;
  device: string;
  isSeeker: boolean;
}

const SHA256_HEX_REGEX = /^[a-f0-9]{64}$/;

function validatePayload(payload: ProofPayload): void {
  if (!SHA256_HEX_REGEX.test(payload.hash)) {
    throw new Error("Invalid hash format: expected 64-char hex SHA-256");
  }

  if (!Number.isFinite(payload.timestamp) || payload.timestamp <= 0) {
    throw new Error("Invalid timestamp");
  }

  const now = Date.now();
  if (payload.timestamp > now + 60000) {
    throw new Error("Timestamp is in the future");
  }

  if (payload.lat != null && (payload.lat < -90 || payload.lat > 90)) {
    throw new Error("Invalid latitude");
  }
  if (payload.lng != null && (payload.lng < -180 || payload.lng > 180)) {
    throw new Error("Invalid longitude");
  }

  if (!payload.device || payload.device.length > 64) {
    throw new Error("Invalid device identifier");
  }
}

function buildMemoData(payload: ProofPayload): string {
  const obj = {
    p: "proof",
    v: PROOF_VERSION,
    h: payload.hash,
    t: payload.timestamp,
    ...(payload.lat != null && { lat: Math.round(payload.lat * 100000) / 100000 }),
    ...(payload.lng != null && { lng: Math.round(payload.lng * 100000) / 100000 }),
    d: payload.device.slice(0, 32),
    ...(payload.isSeeker && { skr: true }),
  };
  const json = JSON.stringify(obj);

  if (Buffer.byteLength(json, "utf-8") > MAX_MEMO_SIZE) {
    throw new Error("Proof payload exceeds memo size limit");
  }

  return json;
}

export function useProofAnchor() {
  const { connection } = useConnection();
  const { signAndSendTransaction } = useMobileWallet();

  const anchorProof = useCallback(
    async (
      payerAddress: PublicKey,
      payload: ProofPayload
    ): Promise<string> => {
      validatePayload(payload);

      const memoData = buildMemoData(payload);
      const memoInstruction = new TransactionInstruction({
        keys: [{ pubkey: payerAddress, isSigner: true, isWritable: true }],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(memoData, "utf-8"),
      });

      const {
        context: { slot: minContextSlot },
        value: latestBlockhash,
      } = await connection.getLatestBlockhashAndContext();

      const message = new TransactionMessage({
        payerKey: payerAddress,
        recentBlockhash: latestBlockhash.blockhash,
        instructions: [memoInstruction],
      }).compileToLegacyMessage();

      const transaction = new VersionedTransaction(message);

      const sim = await simulateTransaction(connection, transaction);
      if (!sim.success) {
        throw new Error(`Transaction would fail: ${sim.error}`);
      }

      const signature = await signAndSendTransaction(transaction, minContextSlot);

      await connection.confirmTransaction(
        { signature, ...latestBlockhash },
        "confirmed"
      );

      return signature;
    },
    [connection, signAndSendTransaction]
  );

  return { anchorProof };
}
