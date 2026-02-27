import { VERIFY_PROOF_TTL_MS } from "@/lib/config";

type VerificationEntry = {
  userId: string;
  ip: string;
  distance: number;
  verifiedAt: number;
};

const store = new Map<string, VerificationEntry>();

function keyFor(userId: string, ip: string) {
  return `${userId}:${ip}`;
}

function prune() {
  const current = Date.now();
  for (const [key, value] of store.entries()) {
    if (current - value.verifiedAt > VERIFY_PROOF_TTL_MS) {
      store.delete(key);
    }
  }
}

export function saveVerification(userId: string, ip: string, distance: number) {
  prune();
  store.set(keyFor(userId, ip), {
    userId,
    ip,
    distance,
    verifiedAt: Date.now(),
  });
}

export function getVerification(userId: string, ip: string) {
  prune();
  return store.get(keyFor(userId, ip)) ?? null;
}

export function clearVerification(userId: string, ip: string) {
  store.delete(keyFor(userId, ip));
}
