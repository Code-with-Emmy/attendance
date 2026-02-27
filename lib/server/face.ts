import { EMBEDDING_DIMENSION } from "@/lib/config";

export function toEmbeddingArray(raw: unknown): number[] | null {
  if (!Array.isArray(raw)) {
    return null;
  }

  if (raw.length !== EMBEDDING_DIMENSION) {
    return null;
  }

  const parsed = raw.map((value) => Number(value));
  if (parsed.some((n) => !Number.isFinite(n))) {
    return null;
  }

  return parsed;
}

export function euclideanDistance(a: number[], b: number[]) {
  if (a.length !== b.length) {
    throw new Error("Embedding dimensions do not match");
  }

  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}
