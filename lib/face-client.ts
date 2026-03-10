import {
  EMBEDDING_DIMENSION,
  FACE_DETECTOR_SCORE_THRESHOLD,
} from "@/lib/config";

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
const DETECTOR_INPUT_SIZES = [512, 416, 320] as const;

async function getFaceApi() {
  if (!faceApiPromise) {
    faceApiPromise = import("face-api.js");
  }
  return faceApiPromise;
}

function detectorOptions(faceApi: FaceApiModule, inputSize: number) {
  return new faceApi.TinyFaceDetectorOptions({
    inputSize,
    scoreThreshold: FACE_DETECTOR_SCORE_THRESHOLD,
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
    score >= 0.62 &&
    widthRatio >= 0.16 &&
    heightRatio >= 0.22 &&
    areaRatio >= 0.045 &&
    centerX >= 0.22 &&
    centerX <= 0.78 &&
    centerY >= 0.16 &&
    centerY <= 0.84
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

  for (const inputSize of DETECTOR_INPUT_SIZES) {
    const detections = (await faceApi
      .detectAllFaces(video, detectorOptions(faceApi, inputSize))
      .withFaceLandmarks()) as unknown as FaceDetectionWithLandmarks[];

    if (detections.length > 0) {
      return detections;
    }
  }

  return [];
}

export async function captureSingleFaceEmbedding(video: HTMLVideoElement): Promise<number[]> {
  await loadFaceModels();
  const faceApi = await getFaceApi();

  let detections: FaceDetectionWithDescriptor[] = [];

  for (const inputSize of DETECTOR_INPUT_SIZES) {
    detections = (await faceApi
      .detectAllFaces(video, detectorOptions(faceApi, inputSize))
      .withFaceLandmarks()
      .withFaceDescriptors()) as unknown as FaceDetectionWithDescriptor[];

    if (detections.length > 0) {
      break;
    }
  }

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
