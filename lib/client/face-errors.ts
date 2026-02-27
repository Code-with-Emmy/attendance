export function toUserFacingFaceError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  const normalized = message.toLowerCase();

  if (normalized.includes("no face detected")) {
    return "No face detected. Keep your face centered and try again.";
  }

  if (normalized.includes("multiple faces detected")) {
    return "Multiple faces detected. Ensure only one person is in front of the camera.";
  }

  if (normalized.includes("liveness") || normalized.includes("blink") || normalized.includes("head turn")) {
    return `Liveness failed. ${message}`;
  }

  if (normalized.includes("no enrolled face")) {
    return "No enrolled face found for this user. Enroll your face first.";
  }

  if (normalized.includes("did not match enrollment") || normalized.includes("face mismatch")) {
    return "Face mismatch. Try again with better lighting and camera alignment.";
  }

  return message;
}
