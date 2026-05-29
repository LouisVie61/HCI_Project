import { useState, useCallback, useEffect, useRef } from 'react';
import { translationApi } from '../api/endpoints';
import { GestureStabilizer, MotionGestureDetector, type GesturePrediction } from '../services/cv/gestureRules';
import { mediapipeService, type RecognitionMode } from '../services/cv/mediapipe';
import { languageDetectionService } from '../services/translation/languageDetection.service';
import { signMtService, type SignedLanguageCode, type SpokenLanguageCode } from '../services/translation/signmt.service';

const MAX_INPUT_CHARS = 500;
const SIGN_CONFIDENCE_THRESHOLD = 0.7;

export const useTextToSign = () => {
  const [text, setText] = useState('');
  const [spokenLanguage, setSpokenLanguage] = useState<SpokenLanguageCode>('auto');
  const [signedLanguage, setSignedLanguage] = useState<SignedLanguageCode>('ase');
  const [detectedLanguage, setDetectedLanguage] = useState('en');
  const [englishText, setEnglishText] = useState('');
  const [englishTranslationWarning, setEnglishTranslationWarning] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [poseUrl, setPoseUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translate = useCallback(async (inputText?: string) => {
    const textToTranslate = (inputText ?? text).trim().slice(0, MAX_INPUT_CHARS);
    if (!textToTranslate) {
      setError('Please enter text to translate');
      setEnglishText('');
      setEnglishTranslationWarning(null);
      setVideoUrl(null);
      setPoseUrl(null);
      return;
    }

    setLoading(true);
    setError(null);
    setEnglishText('');
    setEnglishTranslationWarning(null);
    setVideoUrl(null);
    setPoseUrl(null);

    try {
      const detectedSpokenLanguage =
        spokenLanguage === 'auto'
          ? await languageDetectionService.detectSpokenLanguage(textToTranslate)
          : spokenLanguage;

      setDetectedLanguage(detectedSpokenLanguage);

      const englishResult = await translationApi.toEnglish(textToTranslate, detectedSpokenLanguage);
      const translatedEnglishText =
        !englishResult.error && englishResult.data?.translated_text
          ? englishResult.data.translated_text.trim()
          : textToTranslate;

      if (englishResult.error) {
        setEnglishTranslationWarning(`English translation failed: ${englishResult.error}`);
      } else if (englishResult.data?.used_fallback) {
        setEnglishTranslationWarning(englishResult.data.error || 'English translation failed, so the original text is being used.');
      }

      if (englishResult.data?.source_language) {
        setDetectedLanguage(englishResult.data.source_language);
      }

      setEnglishText(translatedEnglishText);
      setVideoUrl(signMtService.getSpokenToSignedVideoUrl(translatedEnglishText, 'en', signedLanguage));
      setPoseUrl(signMtService.getSpokenToSignedPoseUrl(translatedEnglishText, 'en', signedLanguage));
    } catch (err: any) {
      setError(err?.message || 'Translation failed');
    } finally {
      setLoading(false);
    }
  }, [signedLanguage, spokenLanguage, text]);

  return {
    text,
    setText,
    spokenLanguage,
    setSpokenLanguage,
    signedLanguage,
    setSignedLanguage,
    detectedLanguage,
    englishText,
    englishTranslationWarning,
    videoUrl,
    poseUrl,
    loading,
    error,
    translate,
    maxInputChars: MAX_INPUT_CHARS,
  };
};

interface SignPredictionRecord {
  sign: string;
  score: number;
  timestamp: number;
}

export interface SignSessionSummary {
  sign: string;
  count: number;
}

const summarizeSignSession = (records: SignPredictionRecord[]): SignSessionSummary[] => {
  const compressed: SignPredictionRecord[] = [];

  records.forEach((record) => {
    const previous = compressed[compressed.length - 1];
    if (!previous || previous.sign !== record.sign) {
      compressed.push(record);
    }
  });

  const counts = new Map<string, number>();
  compressed.forEach((record) => {
    counts.set(record.sign, (counts.get(record.sign) ?? 0) + 1);
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([sign, count]) => ({ sign, count }));
};

export const useSignToText = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detectedText, setDetectedText] = useState('');
  const [currentGesture, setCurrentGesture] = useState<GesturePrediction | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [sessionSummary, setSessionSummary] = useState<SignSessionSummary[]>([]);
  const [predictionCount, setPredictionCount] = useState(0);
  const [recognitionMode, setRecognitionMode] = useState<RecognitionMode>('rule-fallback');
  const [modelWarning, setModelWarning] = useState<string | null>(null);
  const [cameraHint, setCameraHint] = useState('Mo camera va dua ban tay vao khung hinh.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const animationRef = useRef<number | null>(null);
  const stabilizerRef = useRef(new GestureStabilizer());
  const motionDetectorRef = useRef(new MotionGestureDetector());
  const lastAcceptedRef = useRef('');
  const lastAcceptedAtRef = useRef(0);
  const detectedRecordsRef = useRef<SignPredictionRecord[]>([]);

  const stopLoop = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const runDetectionLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      return;
    }

    const rect = video.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(Math.floor(rect.width * dpr), 1);
    canvas.height = Math.max(Math.floor(rect.height * dpr), 1);
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const recognition = mediapipeService.recognize(video);
      const { hands, prediction } = recognition;
      mediapipeService.drawLandmarks(ctx, hands, rect.width, rect.height);
      const hand = hands[0] ?? null;
      const motionPrediction = motionDetectorRef.current.push(hand, prediction);
      const finalPrediction = motionPrediction ?? prediction;

      if (!hand) {
        setCameraHint('Chua thay ban tay. Hay dua tay vao giua khung hinh.');
      } else {
        const handSize = Math.abs(hand.landmarks[0].y - hand.landmarks[9].y);
        setCameraHint(handSize < 0.08 ? 'Tay hoi xa camera. Hay dua tay lai gan hon.' : 'Giu ky hieu on dinh trong khoang 1 giay.');
      }

      setCurrentGesture(finalPrediction);
      const acceptedPrediction =
        finalPrediction && finalPrediction.confidence >= SIGN_CONFIDENCE_THRESHOLD ? finalPrediction : null;
      const stablePrediction = stabilizerRef.current.push(acceptedPrediction);
      const now = Date.now();

      if (acceptedPrediction?.text) {
        detectedRecordsRef.current.push({
          sign: acceptedPrediction.text,
          score: acceptedPrediction.confidence,
          timestamp: now,
        });
        setPredictionCount(detectedRecordsRef.current.length);
      }

      if (
        stablePrediction?.text &&
        (stablePrediction.label !== lastAcceptedRef.current || now - lastAcceptedAtRef.current > 1800)
      ) {
        lastAcceptedRef.current = stablePrediction.label;
        lastAcceptedAtRef.current = now;
        setDetectedText(stablePrediction.text);
        setTranscript((prev) => [...prev, stablePrediction.text].slice(-24));
      }
    }

    animationRef.current = requestAnimationFrame(runDetectionLoop);
  }, []);

  const startDetection = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const initStatus = await mediapipeService.init();
      setRecognitionMode(initStatus.mode);
      setModelWarning(initStatus.warning);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      stabilizerRef.current.reset();
      motionDetectorRef.current.reset();
      detectedRecordsRef.current = [];
      lastAcceptedRef.current = '';
      lastAcceptedAtRef.current = 0;
      setDetectedText('');
      setCurrentGesture(null);
      setCameraHint('Dang nhan dien. Hay dua ban tay vao khung hinh.');
      setTranscript([]);
      setSessionSummary([]);
      setPredictionCount(0);
      setIsDetecting(true);
      runDetectionLoop();
    } catch (err: any) {
      setError(err?.message || 'Failed to access camera');
      setIsDetecting(false);
    } finally {
      setLoading(false);
    }
  }, [runDetectionLoop]);

  const stopDetection = useCallback(() => {
    stopLoop();
    setIsDetecting(false);
    setSessionSummary(summarizeSignSession(detectedRecordsRef.current));
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [stopLoop]);

  const clearTranscript = useCallback(() => {
    setTranscript([]);
    setSessionSummary([]);
    setPredictionCount(0);
    detectedRecordsRef.current = [];
    setDetectedText('');
    setCameraHint('Mo camera va dua ban tay vao khung hinh.');
    lastAcceptedRef.current = '';
    lastAcceptedAtRef.current = 0;
    stabilizerRef.current.reset();
    motionDetectorRef.current.reset();
  }, []);

  const undoLastTranscript = useCallback(() => {
    setTranscript((prev) => {
      const next = prev.slice(0, -1);
      setDetectedText(next[next.length - 1] ?? '');
      return next;
    });
  }, []);

  const copyTranscript = useCallback(async () => {
    const text = transcript.join(' ').trim();
    if (!text) return;
    await navigator.clipboard.writeText(text);
  }, [transcript]);

  const speakTranscript = useCallback(() => {
    const text = transcript.join(' ').trim();
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }, [transcript]);

  useEffect(() => stopDetection, [stopDetection]);

  const detectSign = useCallback(async (keypoints: any) => {
    setLoading(true);
    setError(null);

    try {
      const result = await translationApi.signToText(keypoints);

      if (result.error) {
        setError(result.error);
        return;
      }

      const data = result.data as any;
      setDetectedText(data.text || '');
    } catch (err: any) {
      setError(err?.message || 'Detection failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    videoRef,
    canvasRef,
    detectedText,
    setDetectedText,
    currentGesture,
    transcript,
    sessionSummary,
    predictionCount,
    recognitionMode,
    modelWarning,
    cameraHint,
    confidenceThreshold: SIGN_CONFIDENCE_THRESHOLD,
    clearTranscript,
    undoLastTranscript,
    copyTranscript,
    speakTranscript,
    loading,
    error,
    isDetecting,
    startDetection,
    stopDetection,
    detectSign,
  };
};
