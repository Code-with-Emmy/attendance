import { EMBEDDING_DIMENSION } from "@/lib/config";

export type FaceApiModule = typeof import("face-api.js");

type FaceDetectionWithLandmarks = {
  landmarks: {
    getLeftEye: () => Array<{ x: number; y: number }>;
    getRightEye: () => Array<{ x: number; y: number }>;
    getNose: () => Array<{ x: number; y: number }>;
    getJawOutline: () => Array<{ x: number; y: number }>;
    getMouth: () => Array<{ x: number; y: number }>;
  };
};

type FaceDetectionWithDescriptor = FaceDetectionWithLandmarks & {
  descriptor: Float32Array;
};

let faceApiPromise: Promise<FaceApiModule> | null = null;
let modelsLoaded = false;

async function getFaceApi() {
  if (!faceApiPromise) {
    faceApiPromise = import("face-api.js");
  }
  return faceApiPromise;
}

function detectorOptions(faceApi: FaceApiModule) {
  return new faceApi.TinyFaceDetectorOptions({
    inputSize: 416,
    scoreThreshold: 0.5,
  });
}

export async function loadFaceModels() {
  if (modelsLoaded) {
    return;
  }

  const faceApi = await getFaceApi();

  await Promise.all([
    faceApi.nets.tinyFaceDetector.loadFromUri("/models"),
    faceApi.nets.faceLandmark68Net.loadFromUri("/models"),
    faceApi.nets.faceRecognitionNet.loadFromUri("/models"),
  ]);

  modelsLoaded = true;
}

export async function detectFacesWithLandmarks(video: HTMLVideoElement): Promise<FaceDetectionWithLandmarks[]> {
  await loadFaceModels();
  const faceApi = await getFaceApi();

  return (await faceApi
    .detectAllFaces(video, detectorOptions(faceApi))
    .withFaceLandmarks()) as unknown as FaceDetectionWithLandmarks[];
}

export async function captureSingleFaceEmbedding(video: HTMLVideoElement): Promise<number[]> {
  await loadFaceModels();
  const faceApi = await getFaceApi();

  const detections = (await faceApi
    .detectAllFaces(video, detectorOptions(faceApi))
    .withFaceLandmarks()
    .withFaceDescriptors()) as unknown as FaceDetectionWithDescriptor[];

  if (detections.length === 0) {
    throw new Error("No face detected. Make sure your face is centered in view.");
  }

  if (detections.length > 1) {
    throw new Error("Multiple faces detected. Only one face is allowed.");
  }

  const descriptor = Array.from(detections[0].descriptor);

  if (descriptor.length !== EMBEDDING_DIMENSION) {
    throw new Error("Unexpected face embedding size.");
  }

  return descriptor;
}

export function euclideanDistance(a: number[], b: number[]) {
  if (a.length !== b.length) {
    throw new Error("Cannot compare embeddings of different dimensions.");
  }

  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}
