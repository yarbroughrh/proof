import { Connection, VersionedTransaction } from "@solana/web3.js";
import { TREASURY_WALLET } from "./constants";

const PLACEHOLDER_PUBKEY = "11111111111111111111111111111111";

export function isTreasuryConfigured(): boolean {
  return TREASURY_WALLET.toBase58() !== PLACEHOLDER_PUBKEY;
}

export async function simulateTransaction(
  connection: Connection,
  transaction: VersionedTransaction
): Promise<{ success: boolean; error: string | null; unitsConsumed: number }> {
  try {
    const result = await connection.simulateTransaction(transaction, {
      sigVerify: false,
    });

    if (result.value.err) {
      return {
        success: false,
        error: JSON.stringify(result.value.err),
        unitsConsumed: result.value.unitsConsumed ?? 0,
      };
    }

    return {
      success: true,
      error: null,
      unitsConsumed: result.value.unitsConsumed ?? 0,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message ?? "Simulation failed",
      unitsConsumed: 0,
    };
  }
}
