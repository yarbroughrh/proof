import { useCallback } from "react";
import {
  PublicKey,
  TransactionMessage,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  getAccount,
} from "@solana/spl-token";
import { useConnection } from "./ConnectionProvider";
import { useMobileWallet } from "./useMobileWallet";
import { simulateTransaction } from "./safety";
import {
  SKR_MINT,
  SKR_DECIMALS,
  TREASURY_WALLET,
  PROTOCOL_FEE_BPS,
  MEMO_PROGRAM_ID,
  MIN_VOUCH_AMOUNT,
  MAX_VOUCH_AMOUNT,
} from "./constants";

async function ensureATA(
  connection: any,
  payer: PublicKey,
  owner: PublicKey,
  instructions: TransactionInstruction[]
) {
  const ata = getAssociatedTokenAddressSync(SKR_MINT, owner);
  try {
    await getAccount(connection, ata);
  } catch {
    instructions.push(
      createAssociatedTokenAccountInstruction(payer, ata, owner, SKR_MINT)
    );
  }
  return ata;
}

export function useSKRTransfer() {
  const { connection } = useConnection();
  const { signAndSendTransaction } = useMobileWallet();

  const vouchSKR = useCallback(
    async (
      senderAddress: PublicKey,
      recipientAddress: PublicKey,
      amount: number,
      proofHash: string
    ): Promise<{ signature: string; feeAmount: number; creatorAmount: number }> => {
      if (senderAddress.equals(recipientAddress)) {
        throw new Error("Cannot vouch for your own proof");
      }

      if (amount < MIN_VOUCH_AMOUNT || amount > MAX_VOUCH_AMOUNT) {
        throw new Error(
          `Vouch amount must be between ${MIN_VOUCH_AMOUNT} and ${MAX_VOUCH_AMOUNT} SKR`
        );
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Invalid vouch amount");
      }

      if (!/^[a-f0-9]{64}$/.test(proofHash)) {
        throw new Error("Invalid proof hash for vouch binding");
      }

      const feeAmount = (amount * PROTOCOL_FEE_BPS) / 10000;
      const creatorAmount = amount - feeAmount;

      const rawFee = BigInt(Math.floor(feeAmount * 10 ** SKR_DECIMALS));
      const rawCreator = BigInt(Math.floor(creatorAmount * 10 ** SKR_DECIMALS));

      if (rawFee + rawCreator <= BigInt(0)) {
        throw new Error("Amount too small after fee calculation");
      }

      const senderATA = getAssociatedTokenAddressSync(SKR_MINT, senderAddress);
      const instructions: TransactionInstruction[] = [];

      const recipientATA = await ensureATA(
        connection, senderAddress, recipientAddress, instructions
      );

      const treasuryATA = await ensureATA(
        connection, senderAddress, TREASURY_WALLET, instructions
      );

      instructions.push(
        createTransferInstruction(senderATA, recipientATA, senderAddress, rawCreator)
      );

      if (rawFee > BigInt(0)) {
        instructions.push(
          createTransferInstruction(senderATA, treasuryATA, senderAddress, rawFee)
        );
      }

      const vouchMemo = JSON.stringify({
        p: "proof-vouch",
        h: proofHash,
        a: amount,
        to: recipientAddress.toBase58(),
      });

      instructions.push(
        new TransactionInstruction({
          keys: [{ pubkey: senderAddress, isSigner: true, isWritable: true }],
          programId: MEMO_PROGRAM_ID,
          data: Buffer.from(vouchMemo, "utf-8"),
        })
      );

      const {
        context: { slot: minContextSlot },
        value: latestBlockhash,
      } = await connection.getLatestBlockhashAndContext();

      const message = new TransactionMessage({
        payerKey: senderAddress,
        recentBlockhash: latestBlockhash.blockhash,
        instructions,
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

      return { signature, feeAmount, creatorAmount };
    },
    [connection, signAndSendTransaction]
  );

  return { vouchSKR };
}
