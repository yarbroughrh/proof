# Proof

**Blockchain-verified photo authenticity for Solana Mobile.**

In the age of AI deepfakes, how do you know a photo is real? Proof anchors your photos on the Solana blockchain the instant you take them — creating an immutable, verifiable record that this photo existed at this time, in this place, unaltered.

Built for the [MONOLITH Solana Mobile Hackathon](https://solanamobile.radiant.nexus/) by RadiantsDAO.

## How It Works

1. **Capture** — Take a photo with the in-app camera
2. **Hash** — SHA-256 hash is computed over the image + timestamp + GPS + device ID
3. **Anchor** — Hash is written to Solana via the Memo program (~$0.00025 per proof)
4. **Verify** — Anyone can re-hash the original image and compare it to the on-chain record

## Features

### Core Proof System
- Camera capture with real-time SHA-256 hashing
- Metadata cryptographically bound to image (timestamp, GPS, device — changing any field changes the hash)
- On-chain anchoring via Solana Memo program
- Gallery of proved photos with verification details
- Solana Explorer deep links for every proof

### SKR Token Integration
- **Tiered access** — Hold SKR to unlock the community feed (1+ Holder, 100+ Pro, 1,000+ Whale)
- **Vouching** — Stake SKR on a proof's authenticity (community-verified trust)
- **Trust scores** — Computed from total SKR vouched + unique vouchers + Seeker bonus
- **On-chain vouch binding** — Every vouch includes a Memo with the proof hash, making trust scores cryptographically verifiable
- **Protocol fee** — 5% on vouches supports ongoing development

### Seeker / SGT Integration
- Detects Seeker hardware via `Platform.constants.Model`
- Verifies Seeker Genesis Token (SGT) ownership on-chain for trust-level features
- SGT-verified proofs receive a base trust bonus in the feed
- Device model detection is cosmetic only — trust features require on-chain SGT proof

### Wallet Support
- Solana Seeker Seed Vault (primary)
- Phantom
- Jupiter
- Any MWA-compatible wallet
- Wallet URI persistence for automatic reconnection

### Security
- Private keys never touch app code (MWA wallet handles all signing)
- Auth tokens stored in Android Keystore via SecureStore
- Transaction simulation before every send (catches failures before spending SOL)
- Anti-phishing confirmation dialogs on wallet connect
- Input validation on all hashes, coordinates, amounts, and memo sizes
- Self-vouch and duplicate-vouch protection
- Treasury guard blocks app launch if fee wallet is misconfigured

## Tech Stack

| Library | Version | Purpose |
|---|---|---|
| React Native | 0.76 | Mobile framework |
| Expo SDK | 52 | Build tooling and native modules |
| Mobile Wallet Adapter | 2.2 | Wallet connection protocol |
| @solana/web3.js | 1.78 | Solana RPC and transactions |
| @solana/spl-token | 0.4 | SKR token transfers and SGT verification |
| expo-camera | 16.0 | Photo capture |
| expo-location | 18.0 | GPS coordinates |
| expo-crypto | 14.0 | SHA-256 hashing |
| expo-secure-store | 14.0 | Encrypted auth storage |
| React Native Paper | 5.12 | Material Design components |
| React Navigation | 6 | Screen navigation |
| React Query | 5.24 | Async state management |

## Quick Start

### Prerequisites
- Node.js 18+
- Android Studio with SDK 34+
- JDK 17+ (bundled with Android Studio)

### Install
```bash
git clone https://github.com/yarbroughrh/proof.git
cd proof
npm install
```

### Run on Android
```bash
# Generate native project
npx expo prebuild --platform android

# Build and run (starts Metro automatically)
npx expo run:android
```

### Open in Android Studio
```bash
npx expo prebuild --platform android
# Then open the /android folder in Android Studio
# Start Metro separately: npx expo start --dev-client
```

### Build Release APK
```bash
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease
# APK at: android/app/build/outputs/apk/release/app-release.apk
```

## Architecture

```
src/
├── screens/
│   ├── HomeScreen.tsx          # Dashboard + wallet connect
│   ├── CameraScreen.tsx        # Capture + hash + anchor flow
│   ├── GalleryScreen.tsx       # Grid of proved photos
│   ├── FeedScreen.tsx          # SKR-gated community feed with vouching
│   └── ProofDetailScreen.tsx   # Full proof details + explorer link
├── utils/
│   ├── useAuthorization.tsx    # MWA wallet auth + SecureStore
│   ├── useMobileWallet.tsx     # Sign, send, disconnect with wallet URI
│   ├── useProofAnchor.tsx      # Memo program proof transactions
│   ├── useProofStore.tsx       # AsyncStorage proof records
│   ├── useSeeker.tsx           # SGT verification + device detection
│   ├── useSKR.tsx              # SKR balance queries
│   ├── useSKRTransfer.tsx      # Vouch transfers with fee split + memo binding
│   ├── hashPhoto.ts            # SHA-256 over image + metadata
│   ├── safety.ts               # Treasury guard + tx simulation
│   ├── constants.ts            # Addresses, limits, config
│   └── theme.ts                # Dark theme colors
├── components/
│   ├── sign-in/                # Connect + SIWS with anti-phishing
│   ├── top-bar/                # PROOF branding + wallet menu
│   ├── cluster/                # Network selector
│   └── account/                # Balance + token display
└── navigators/
    ├── AppNavigator.tsx         # Root stack
    └── HomeNavigator.tsx        # Bottom tabs (Home, Prove, Gallery, Feed)
```

## On-Chain Data Format

### Proof Memo
```json
{
  "p": "proof",
  "v": "1",
  "h": "a1b2c3...64char_sha256",
  "t": 1709567890000,
  "lat": 37.77493,
  "lng": -122.41942,
  "d": "Seeker",
  "skr": true
}
```

### Vouch Memo
```json
{
  "p": "proof-vouch",
  "h": "a1b2c3...64char_sha256",
  "a": 5,
  "to": "creator_wallet_address"
}
```

## License

MIT
