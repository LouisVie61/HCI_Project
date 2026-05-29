import type { HandLandmarks, Keypoint } from './mediapipe';

export interface GesturePrediction {
  label: string;
  text: string;
  confidence: number;
}

interface MotionSample {
  x: number;
  y: number;
  t: number;
}

const FINGER_TIPS = {
  thumb: 4,
  index: 8,
  middle: 12,
  ring: 16,
  pinky: 20,
};

const FINGER_PIPS = {
  index: 6,
  middle: 10,
  ring: 14,
  pinky: 18,
};

const FINGER_MCPS = {
  index: 5,
  middle: 9,
  ring: 13,
  pinky: 17,
};

const distance = (a: Keypoint, b: Keypoint) => Math.hypot(a.x - b.x, a.y - b.y, (a.z - b.z) * 0.4);

const palmSize = (points: Keypoint[]) => Math.max(distance(points[0], points[9]), 0.001);

const palmCenter = (points: Keypoint[]) => {
  const palmPoints = [points[0], points[5], points[9], points[13], points[17]];
  const total = palmPoints.reduce(
    (sum, point) => ({
      x: sum.x + point.x,
      y: sum.y + point.y,
      z: sum.z + point.z,
    }),
    { x: 0, y: 0, z: 0 },
  );

  return {
    x: total.x / palmPoints.length,
    y: total.y / palmPoints.length,
    z: total.z / palmPoints.length,
    visibility: 1,
  };
};

const isFingerExtended = (points: Keypoint[], finger: keyof typeof FINGER_PIPS) => {
  const wrist = points[0];
  const tip = points[FINGER_TIPS[finger]];
  const pip = points[FINGER_PIPS[finger]];
  const mcp = points[FINGER_MCPS[finger]];
  const scale = palmSize(points);
  const tipReach = distance(wrist, tip);
  const pipReach = distance(wrist, pip);
  const mcpReach = distance(wrist, mcp);
  const verticalExtension = tip.y < pip.y - scale * 0.08;
  const reachExtension = tipReach > pipReach + scale * 0.08 && tipReach > mcpReach + scale * 0.18;

  return verticalExtension || reachExtension;
};

const isFingerCurled = (points: Keypoint[], finger: keyof typeof FINGER_PIPS) => {
  const tip = points[FINGER_TIPS[finger]];
  const pip = points[FINGER_PIPS[finger]];
  const mcp = points[FINGER_MCPS[finger]];
  const center = palmCenter(points);
  const scale = palmSize(points);
  const tipNearPalm = distance(tip, center) < scale * 0.9;
  const foldedDown = tip.y > pip.y - scale * 0.03 || distance(tip, mcp) < distance(pip, mcp) + scale * 0.25;

  return tipNearPalm || foldedDown;
};

const isThumbExtended = (points: Keypoint[], handedness: 'Left' | 'Right') => {
  const thumbTip = points[FINGER_TIPS.thumb];
  const thumbIp = points[3];
  return handedness === 'Right' ? thumbTip.x < thumbIp.x : thumbTip.x > thumbIp.x;
};

export const detectGesture = (hand: HandLandmarks | null): GesturePrediction | null => {
  if (!hand || hand.landmarks.length < 21) {
    return null;
  }

  const points = hand.landmarks;
  const scale = palmSize(points);
  const index = isFingerExtended(points, 'index');
  const middle = isFingerExtended(points, 'middle');
  const ring = isFingerExtended(points, 'ring');
  const pinky = isFingerExtended(points, 'pinky');
  const thumb = isThumbExtended(points, hand.handedness);
  const extendedCount = [thumb, index, middle, ring, pinky].filter(Boolean).length;
  const extendedFourFingers = [index, middle, ring, pinky].filter(Boolean).length;
  const indexOnly = index && isFingerCurled(points, 'middle') && isFingerCurled(points, 'ring') && isFingerCurled(points, 'pinky');
  const victoryShape = index && middle && isFingerCurled(points, 'ring') && isFingerCurled(points, 'pinky');
  const thumbIndexDistance = distance(points[FINGER_TIPS.thumb], points[FINGER_TIPS.index]) / scale;
  const indexMiddleSpread = distance(points[FINGER_TIPS.index], points[FINGER_TIPS.middle]) / scale;

  if (thumbIndexDistance < 0.28 && middle && ring && pinky) {
    return { label: 'OK', text: 'OK', confidence: 0.9 };
  }

  if (thumb && index && !middle && !ring && pinky) {
    return { label: 'I LOVE YOU', text: 'I love you', confidence: 0.88 };
  }

  if (victoryShape && indexMiddleSpread > 0.32) {
    return { label: 'V SIGN', text: 'victory', confidence: 0.84 };
  }

  if (indexOnly) {
    return { label: 'POINT', text: 'point', confidence: 0.82 };
  }

  if (extendedFourFingers >= 4 || extendedCount >= 4) {
    return { label: 'OPEN PALM / STOP', text: 'stop', confidence: 0.82 };
  }

  if (extendedCount <= 1 && !index && !middle && !ring && !pinky) {
    return { label: 'FIST', text: 'yes', confidence: 0.74 };
  }

  return { label: 'UNKNOWN', text: '', confidence: 0.35 };
};

export class GestureStabilizer {
  private history: GesturePrediction[] = [];

  constructor(
    private readonly windowSize = 12,
    private readonly acceptCount = 8,
  ) {}

  push(prediction: GesturePrediction | null): GesturePrediction | null {
    if (prediction && prediction.label !== 'UNKNOWN') {
      this.history.push(prediction);
    } else {
      this.history.push({ label: 'UNKNOWN', text: '', confidence: 0 });
    }

    this.history = this.history.slice(-this.windowSize);

    const counts = new Map<string, { count: number; prediction: GesturePrediction }>();
    this.history.forEach((item) => {
      if (item.label === 'UNKNOWN') return;
      const current = counts.get(item.label) ?? { count: 0, prediction: item };
      counts.set(item.label, { count: current.count + 1, prediction: item });
    });

    const winner = [...counts.values()].sort((a, b) => b.count - a.count)[0];
    if (!winner || winner.count < this.acceptCount) {
      return null;
    }

    return winner.prediction;
  }

  reset() {
    this.history = [];
  }
}

export class MotionGestureDetector {
  private samples: MotionSample[] = [];

  push(hand: HandLandmarks | null, staticPrediction: GesturePrediction | null): GesturePrediction | null {
    if (!hand || hand.landmarks.length < 21) {
      this.reset();
      return null;
    }

    const now = Date.now();
    const center = palmCenter(hand.landmarks);
    this.samples.push({ ...center, t: now });
    this.samples = this.samples.filter((sample) => now - sample.t < 1000).slice(-24);

    if (this.samples.length < 8) {
      return null;
    }

    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const xs = this.samples.map((sample) => sample.x);
    const ys = this.samples.map((sample) => sample.y);
    const horizontalRange = Math.max(...xs) - Math.min(...xs);
    const verticalRange = Math.max(...ys) - Math.min(...ys);
    const horizontalTravel = Math.abs(last.x - first.x);
    const verticalTravel = Math.abs(last.y - first.y);
    const label = staticPrediction?.label ?? '';

    if (label.includes('OPEN PALM') && horizontalRange > 0.16 && verticalRange < 0.16) {
      return { label: 'HELLO', text: 'hello', confidence: 0.86 };
    }

    if (label === 'POINT' && horizontalRange > 0.14 && verticalRange < 0.12) {
      return { label: 'NO', text: 'no', confidence: 0.82 };
    }

    if (label === 'FIST' && verticalRange > 0.11 && horizontalRange < 0.14 && verticalTravel > horizontalTravel) {
      return { label: 'YES', text: 'yes', confidence: 0.82 };
    }

    return null;
  }

  reset() {
    this.samples = [];
  }
}
