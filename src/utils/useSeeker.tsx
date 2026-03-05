import { Platform } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import {
  unpackMint,
  getMetadataPointerState,
  getTokenGroupMemberState,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { useConnection } from "./ConnectionProvider";
import { SGT_MINT_AUTHORITY, SGT_GROUP_MINT, SGT_METADATA_ADDRESS } from "./constants";

function isSeekerDevice(): boolean {
  if (Platform.OS !== "android") return false;
  try {
    const model = (Platform.constants as any)?.Model;
    return model === "Seeker";
  } catch {
    return false;
  }
}

async function verifySGTOwnership(
  connection: any,
  walletAddress: PublicKey
): Promise<{ hasSGT: boolean; sgtMint: string | null }> {
  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletAddress,
      { programId: TOKEN_2022_PROGRAM_ID }
    );

    if (!tokenAccounts.value.length) {
      return { hasSGT: false, sgtMint: null };
    }

    const mintPubkeys = tokenAccounts.value
      .map((acc: any) => {
        try {
          return new PublicKey(acc.account.data.parsed.info.mint);
        } catch {
          return null;
        }
      })
      .filter(Boolean) as PublicKey[];

    const BATCH_SIZE = 100;
    for (let i = 0; i < mintPubkeys.length; i += BATCH_SIZE) {
      const batch = mintPubkeys.slice(i, i + BATCH_SIZE);
      const mintInfos = await connection.getMultipleAccountsInfo(batch);

      for (let j = 0; j < mintInfos.length; j++) {
        const info = mintInfos[j];
        if (!info) continue;

        try {
          const mint = unpackMint(batch[j], info, TOKEN_2022_PROGRAM_ID);
          const mintAuthority = mint.mintAuthority?.toBase58();
          if (mintAuthority !== SGT_MINT_AUTHORITY.toBase58()) continue;

          const metaPointer = getMetadataPointerState(mint);
          const hasCorrectMeta =
            metaPointer?.authority?.toBase58() === SGT_MINT_AUTHORITY.toBase58() &&
            metaPointer?.metadataAddress?.toBase58() === SGT_METADATA_ADDRESS.toBase58();

          const groupState = getTokenGroupMemberState(mint);
          const hasCorrectGroup =
            groupState?.group?.toBase58() === SGT_GROUP_MINT.toBase58();

          if (hasCorrectMeta && hasCorrectGroup) {
            return { hasSGT: true, sgtMint: mint.address.toBase58() };
          }
        } catch {
          continue;
        }
      }
    }

    return { hasSGT: false, sgtMint: null };
  } catch (error) {
    console.log("SGT verification error:", error);
    return { hasSGT: false, sgtMint: null };
  }
}

export function useSeeker(walletAddress: PublicKey | null) {
  const { connection } = useConnection();
  const isSeekerHardware = isSeekerDevice();

  const sgtQuery = useQuery({
    queryKey: ["sgt-check", walletAddress?.toBase58()],
    queryFn: () => verifySGTOwnership(connection, walletAddress!),
    enabled: !!walletAddress,
    staleTime: 5 * 60 * 1000,
  });

  const hasSGT = sgtQuery.data?.hasSGT ?? false;

  return {
    isSeekerHardware,
    hasSGT,
    sgtMint: sgtQuery.data?.sgtMint ?? null,
    isVerifiedSeeker: hasSGT,
    isSeekerUI: isSeekerHardware || hasSGT,
    isLoading: sgtQuery.isLoading,
  };
}
