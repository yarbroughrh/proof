import { ProofRecord, TipRecord } from "./useProofStore";

const HOUR = 3_600_000;
const DAY = 86_400_000;

const W = {
  alice: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  bob: "3Hb9MRczuFpHYtDfbPAqTfKaQrBfDUbJ7C8g3vZJuJkE",
  carol: "9nTKdNLfxPAqMGrF2Rj6aYPvKr8AWLK7ExVpGUqwzBVH",
  dave: "DjYB8kfCPD8ZNFagRzgDYRM5VpReLG3v7qMPzVnAMrHP",
  eve: "5fHmQxwC1WJfKrPGxF8JBz8mvVe4vZGNcTARxjL3eRDF",
  frank: "Bq4rJ7k2fVMCcxPMNLwNJ9U7kGgH3PVFxSNoYem5HBkq",
};

function fakeHash(seed: string): string {
  let h = "";
  for (let i = 0; i < 64; i++) {
    h += ((seed.charCodeAt(i % seed.length) * (i + 7)) % 16).toString(16);
  }
  return h;
}

const DEMO_BASE: Partial<ProofRecord> = { isDemo: true, shared: true };

export function getDemoProofs(): ProofRecord[] {
  const now = Date.now();

  return [
    {
      ...DEMO_BASE,
      id: "demo-sf-seeker",
      imageUri: "https://picsum.photos/seed/solana-proof-sf/800/600",
      hash: fakeHash("golden-gate-sunrise"),
      timestamp: now - 3 * HOUR,
      latitude: 37.8199,
      longitude: -122.4783,
      deviceModel: "Solana Seeker",
      signature: "4Vn8kZr3mPqX2wYbJ9cLdRfN7sT1hUeA6gKvWx5yQoFm",
      cluster: "mainnet-beta",
      walletAddress: W.alice,
      isSeeker: true,
      tips: [
        { from: W.bob, amount: 10, txSignature: "dtx-1a", timestamp: now - 2 * HOUR },
        { from: W.carol, amount: 5, txSignature: "dtx-1b", timestamp: now - HOUR },
        { from: W.dave, amount: 25, txSignature: "dtx-1c", timestamp: now - 45 * 60_000 },
      ],
    } as ProofRecord,

    {
      ...DEMO_BASE,
      id: "demo-nyc-street",
      imageUri: "https://picsum.photos/seed/solana-proof-nyc/800/600",
      hash: fakeHash("times-square-night"),
      timestamp: now - 8 * HOUR,
      latitude: 40.758,
      longitude: -73.9855,
      deviceModel: "Pixel 8 Pro",
      signature: "2Rm5jLpW8nVcY3dKfG7hXsT9qA4bUeN6wMrZx1yCoEv",
      cluster: "mainnet-beta",
      walletAddress: W.bob,
      isSeeker: false,
      tips: [
        { from: W.alice, amount: 5, txSignature: "dtx-2a", timestamp: now - 6 * HOUR },
        { from: W.eve, amount: 1, txSignature: "dtx-2b", timestamp: now - 4 * HOUR },
      ],
    } as ProofRecord,

    {
      ...DEMO_BASE,
      id: "demo-tokyo-seeker",
      imageUri: "https://picsum.photos/seed/solana-proof-tokyo/800/600",
      hash: fakeHash("shibuya-crossing"),
      timestamp: now - 14 * HOUR,
      latitude: 35.6595,
      longitude: 139.7004,
      deviceModel: "Solana Seeker",
      signature: "3QwE8rTy2uIoP5aS7dFgH9jKlZ4xCvBnM1wRtYuOpLk",
      cluster: "mainnet-beta",
      walletAddress: W.carol,
      isSeeker: true,
      tips: [
        { from: W.frank, amount: 10, txSignature: "dtx-3a", timestamp: now - 12 * HOUR },
        { from: W.alice, amount: 10, txSignature: "dtx-3b", timestamp: now - 10 * HOUR },
        { from: W.dave, amount: 5, txSignature: "dtx-3c", timestamp: now - 8 * HOUR },
        { from: W.bob, amount: 25, txSignature: "dtx-3d", timestamp: now - 5 * HOUR },
      ],
    } as ProofRecord,

    {
      ...DEMO_BASE,
      id: "demo-london-fresh",
      imageUri: "https://picsum.photos/seed/solana-proof-ldn/800/600",
      hash: fakeHash("big-ben-morning"),
      timestamp: now - 25 * 60_000,
      latitude: 51.5007,
      longitude: -0.1246,
      deviceModel: "Samsung S24 Ultra",
      signature: "5HnJ3kLmP8qRsT7uVwX2yZaB4cDeF6gGhI9jKlMnOpQ",
      cluster: "mainnet-beta",
      walletAddress: W.dave,
      isSeeker: false,
      tips: [],
    } as ProofRecord,

    {
      ...DEMO_BASE,
      id: "demo-berlin-wall",
      imageUri: "https://picsum.photos/seed/solana-proof-ber/800/600",
      hash: fakeHash("berlin-wall-art"),
      timestamp: now - 1 * DAY,
      latitude: 52.5074,
      longitude: 13.3903,
      deviceModel: "Solana Seeker",
      signature: "6IpK4lMnO9pQrS8tUvW3xYzA5bCdE7fFgH0iJkLmNoP",
      cluster: "mainnet-beta",
      walletAddress: W.eve,
      isSeeker: true,
      tips: [
        { from: W.frank, amount: 5, txSignature: "dtx-5a", timestamp: now - 20 * HOUR },
      ],
    } as ProofRecord,

    {
      ...DEMO_BASE,
      id: "demo-sydney-harbor",
      imageUri: "https://picsum.photos/seed/solana-proof-syd/800/600",
      hash: fakeHash("sydney-opera-sunset"),
      timestamp: now - 2 * DAY,
      latitude: -33.8568,
      longitude: 151.2153,
      deviceModel: "Pixel 9",
      signature: "7JqL5mNoP0qRsT9uVwX4yZaB6cDeF8gGhI1jKlMnOpR",
      cluster: "mainnet-beta",
      walletAddress: W.frank,
      isSeeker: false,
      tips: [
        { from: W.alice, amount: 5, txSignature: "dtx-6a", timestamp: now - 1.5 * DAY },
        { from: W.bob, amount: 10, txSignature: "dtx-6b", timestamp: now - 1 * DAY },
        { from: W.carol, amount: 5, txSignature: "dtx-6c", timestamp: now - 18 * HOUR },
      ],
    } as ProofRecord,
  ];
}
