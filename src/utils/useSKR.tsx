import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { useConnection } from "./ConnectionProvider";
import { SKR_MINT } from "./constants";

async function getSKRBalance(
  connection: any,
  walletAddress: PublicKey
): Promise<{ balance: number; rawBalance: bigint; hasToken: boolean }> {
  try {
    const ata = getAssociatedTokenAddressSync(SKR_MINT, walletAddress);
    const accountInfo = await connection.getTokenAccountBalance(ata);

    return {
      balance: accountInfo.value.uiAmount ?? 0,
      rawBalance: BigInt(accountInfo.value.amount),
      hasToken: (accountInfo.value.uiAmount ?? 0) > 0,
    };
  } catch {
    return { balance: 0, rawBalance: BigInt(0), hasToken: false };
  }
}

export function useSKR(walletAddress: PublicKey | null) {
  const { connection } = useConnection();

  const query = useQuery({
    queryKey: ["skr-balance", walletAddress?.toBase58()],
    queryFn: () => getSKRBalance(connection, walletAddress!),
    enabled: !!walletAddress,
    staleTime: 30 * 1000,
  });

  return {
    balance: query.data?.balance ?? 0,
    rawBalance: query.data?.rawBalance ?? BigInt(0),
    hasToken: query.data?.hasToken ?? false,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
