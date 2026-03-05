import { PublicKey } from "@solana/web3.js";

export const SKR_MINT = new PublicKey(
  "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3"
);

export const SGT_MINT_AUTHORITY = new PublicKey(
  "GT2zuHVaZQYZSyQMgJPLzvkmyztfyXg2NJunqFp4p3A4"
);

export const SGT_GROUP_MINT = new PublicKey(
  "GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te"
);

export const SGT_METADATA_ADDRESS = new PublicKey(
  "GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te"
);

export const TOKEN_2022_PROGRAM = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

export const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

// Replace with your actual treasury wallet before launch
export const TREASURY_WALLET = new PublicKey(
  "11111111111111111111111111111111" // PLACEHOLDER - replace with your wallet
);

export const PROTOCOL_FEE_BPS = 500; // 5% = 500 basis points
export const SKR_DECIMALS = 6;
export const PROOF_VERSION = "1";
export const MAX_MEMO_SIZE = 566; // Solana memo program limit
export const MIN_VOUCH_AMOUNT = 1;
export const MAX_VOUCH_AMOUNT = 1000;

export const SOLANA_EXPLORER_BASE = "https://explorer.solana.com";

export function explorerURL(signature: string, cluster: string = "mainnet-beta") {
  const params = cluster === "mainnet-beta" ? "" : `?cluster=${cluster}`;
  return `${SOLANA_EXPLORER_BASE}/tx/${signature}${params}`;
}
