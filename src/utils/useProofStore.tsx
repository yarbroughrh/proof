import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface TipRecord {
  from: string;
  amount: number;
  txSignature: string;
  timestamp: number;
}

export interface ProofRecord {
  id: string;
  imageUri: string;
  hash: string;
  timestamp: number;
  latitude: number | null;
  longitude: number | null;
  deviceModel: string;
  signature: string | null;
  cluster: string;
  walletAddress: string;
  isSeeker: boolean;
  shared: boolean;
  tips: TipRecord[];
}

const PROOFS_STORAGE_KEY = "proof-records";

async function loadProofs(): Promise<ProofRecord[]> {
  const raw = await AsyncStorage.getItem(PROOFS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as any[];
    return parsed.map((p) => ({
      ...p,
      shared: p.shared ?? false,
      tips: p.tips ?? [],
    }));
  } catch {
    return [];
  }
}

async function saveProofs(proofs: ProofRecord[]): Promise<void> {
  await AsyncStorage.setItem(PROOFS_STORAGE_KEY, JSON.stringify(proofs));
}

export function useProofStore() {
  const queryClient = useQueryClient();

  const { data: proofs = [], isLoading } = useQuery({
    queryKey: ["proofs"],
    queryFn: loadProofs,
  });

  const addProof = useMutation({
    mutationFn: async (proof: ProofRecord) => {
      const existing = await loadProofs();
      const updated = [proof, ...existing];
      await saveProofs(updated);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proofs"] });
    },
  });

  const updateProofSignature = useMutation({
    mutationFn: async ({
      id,
      signature,
    }: {
      id: string;
      signature: string;
    }) => {
      const existing = await loadProofs();
      const updated = existing.map((p) =>
        p.id === id ? { ...p, signature } : p
      );
      await saveProofs(updated);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proofs"] });
    },
  });

  const toggleShared = useMutation({
    mutationFn: async (id: string) => {
      const existing = await loadProofs();
      const updated = existing.map((p) =>
        p.id === id ? { ...p, shared: !p.shared } : p
      );
      await saveProofs(updated);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proofs"] });
    },
  });

  const addTip = useMutation({
    mutationFn: async ({ proofId, tip }: { proofId: string; tip: TipRecord }) => {
      const existing = await loadProofs();
      const updated = existing.map((p) =>
        p.id === proofId ? { ...p, tips: [...p.tips, tip] } : p
      );
      await saveProofs(updated);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proofs"] });
    },
  });

  const deleteProof = useMutation({
    mutationFn: async (id: string) => {
      const existing = await loadProofs();
      const updated = existing.filter((p) => p.id !== id);
      await saveProofs(updated);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proofs"] });
    },
  });

  const sharedProofs = proofs.filter((p) => p.shared && p.signature);

  return {
    proofs,
    sharedProofs,
    isLoading,
    addProof: addProof.mutateAsync,
    updateProofSignature: updateProofSignature.mutateAsync,
    toggleShared: toggleShared.mutateAsync,
    addTip: addTip.mutateAsync,
    deleteProof: deleteProof.mutateAsync,
    isAdding: addProof.isPending,
  };
}
