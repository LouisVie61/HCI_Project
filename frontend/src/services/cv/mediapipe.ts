import { FilesetResolver, GestureRecognizer, HandLandmarker } from '@mediapipe/tasks-vision';
import { detectGesture, type GesturePrediction } from './gestureRules';

export interface Keypoint {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface HandLandmarks {
  landmarks: Keypoint[];
  handedness: 'Left' | 'Right';
  confidence: number;
}

export type RecognitionMode = 'gesture-model' | 'rule-fallback';

export interface SignRecognitionFrame {
  hands: HandLandmarks[];
  prediction: GesturePrediction | null;
  mode: RecognitionMode;
}

export interface MediaPipeInitStatus {
  mode: RecognitionMode;
  warning: string | null;
}

const DEFAULT_GESTURE_MODEL_URL = '/models/gesture_recognizer.task';
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const HAND_LANDMARKER_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

const HAND_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
];

export const mediapipeService = {
  vision: null as Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>> | null,
  gestureRecognizer: null as GestureRecognizer | null,
  handLandmarker: null as HandLandmarker | null,
  lastVideoTime: -1,
  mode: 'rule-fallback' as RecognitionMode,
  gestureModelError: null as string | null,

  getGestureModelUrl() {
    return import.meta.env.VITE_GESTURE_MODEL_URL || DEFAULT_GESTURE_MODEL_URL;
  },

  async loadVision() {
    if (!this.vision) {
      this.vision = await FilesetResolver.forVisionTasks(WASM_URL);
    }
    return this.vision;
  },

  async init(): Promise<MediaPipeInitStatus> {
    if (this.gestureRecognizer) {
      return { mode: 'gesture-model', warning: null };
    }

    const vision = await this.loadVision();
    const modelUrl = this.getGestureModelUrl();

    if (!this.gestureModelError) {
      try {
        this.gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelUrl,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
        });
        this.mode = 'gesture-model';
        return { mode: this.mode, warning: null };
      } catch (error: any) {
        this.gestureModelError =
          `Could not load GestureRecognizer model from ${modelUrl}. ` +
          'Using local rule-based fallback until you add a trained .task model.';
        console.warn(this.gestureModelError, error);
      }
    }

    if (!this.handLandmarker) {
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: HAND_LANDMARKER_MODEL_URL,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    }

    this.mode = 'rule-fallback';
    return { mode: this.mode, warning: this.gestureModelError };
  },

  recognize(video: HTMLVideoElement): SignRecognitionFrame {
    if (!this.gestureRecognizer) {
      const hands = this.detectHands(video);
      return {
        hands,
        prediction: detectGesture(hands[0] ?? null),
        mode: 'rule-fallback',
      };
    }

    if (video.readyState < 2 || video.currentTime === this.lastVideoTime) {
      return { hands: [], prediction: null, mode: 'gesture-model' };
    }

    this.lastVideoTime = video.currentTime;
    const result = this.gestureRecognizer.recognizeForVideo(video, performance.now());
    const hands = result.landmarks.map((landmarks, index) => {
      const handedness = result.handedness[index]?.[0];
      return {
        landmarks: landmarks.map((landmark) => ({
          x: landmark.x,
          y: landmark.y,
          z: landmark.z,
          visibility: 1,
        })),
        handedness: handedness?.categoryName === 'Left' ? 'Left' : 'Right',
        confidence: handedness?.score ?? 0,
      } satisfies HandLandmarks;
    });

    const topGesture = result.gestures[0]?.[0];
    const label = topGesture?.categoryName?.trim();
    const confidence = topGesture?.score ?? 0;
    const prediction =
      label && label !== 'None'
        ? {
            label,
            text: label,
            confidence,
          }
        : null;

    return { hands, prediction, mode: 'gesture-model' };
  },

  async initHandLandmarkerOnly() {
    if (this.handLandmarker) {
      return;
    }

    const vision = await this.loadVision();

    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: HAND_LANDMARKER_MODEL_URL,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
  },

  detectHands(video: HTMLVideoElement): HandLandmarks[] {
    if (!this.handLandmarker || video.readyState < 2 || video.currentTime === this.lastVideoTime) {
      return [];
    }

    this.lastVideoTime = video.currentTime;
    const result = this.handLandmarker.detectForVideo(video, performance.now());

    return result.landmarks.map((landmarks, index) => {
      const handedness = result.handedness[index]?.[0];
      return {
        landmarks: landmarks.map((landmark) => ({
          x: landmark.x,
          y: landmark.y,
          z: landmark.z,
          visibility: 1,
        })),
        handedness: handedness?.categoryName === 'Left' ? 'Left' : 'Right',
        confidence: handedness?.score ?? 0,
      };
    });
  },

  drawLandmarks(
    ctx: CanvasRenderingContext2D,
    hands: HandLandmarks[],
    width: number,
    height: number,
  ) {
    ctx.clearRect(0, 0, width, height);

    hands.forEach((hand) => {
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.9)';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';

      HAND_CONNECTIONS.forEach(([start, end]) => {
        const a = hand.landmarks[start];
        const b = hand.landmarks[end];
        if (!a || !b) return;

        ctx.beginPath();
        ctx.moveTo(a.x * width, a.y * height);
        ctx.lineTo(b.x * width, b.y * height);
        ctx.stroke();
      });

      hand.landmarks.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x * width, point.y * height, index === 0 ? 5 : 4, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  },

  cleanup() {
    this.gestureRecognizer?.close();
    this.handLandmarker?.close();
    this.gestureRecognizer = null;
    this.handLandmarker = null;
    this.lastVideoTime = -1;
    this.mode = 'rule-fallback';
  },
};

export default mediapipeService;
