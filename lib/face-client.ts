import { EMBEDDING_DIMENSION } from "@/lib/config";

export type FaceApiModule = typeof import("face-api.js");

type FaceDetectionWithLandmarks = {
  detection: {
    score: number;
    box: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
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
    scoreThreshold: 0.65,
  });
}

export function isFaceWellPositioned(
  video: HTMLVideoElement,
  detection: FaceDetectionWithLandmarks,
) {
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  if (!videoWidth || !videoHeight) {
    return true;
  }

  const {
    score,
    box: { x, y, width, height },
  } = detection.detection;

  const widthRatio = width / videoWidth;
  const heightRatio = height / videoHeight;
  const areaRatio = (width * height) / (videoWidth * videoHeight);
  const centerX = (x + width / 2) / videoWidth;
  const centerY = (y + height / 2) / videoHeight;

  return (
    score >= 0.72 &&
    widthRatio >= 0.18 &&
    heightRatio >= 0.28 &&
    areaRatio >= 0.07 &&
    centerX >= 0.24 &&
    centerX <= 0.76 &&
    centerY >= 0.2 &&
    centerY <= 0.8
  );
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

  if (!isFaceWellPositioned(video, detections[0])) {
    throw new Error(
      "Move closer and center your face fully inside the frame before continuing.",
    );
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
