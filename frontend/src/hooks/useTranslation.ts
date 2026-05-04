import { useState, useCallback, useRef } from 'react';
import { translationApi } from '../api/endpoints';

export const useTextToSign = () => {
  const [text, setText] = useState('');
  const [gestures, setGestures] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translate = useCallback(async (inputText?: string) => {
    const textToTranslate = inputText || text;
    if (!textToTranslate.trim()) {
      setError('Please enter text to translate');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await translationApi.textToSign(textToTranslate);

      if (result.error) {
        setError(result.error);
        return;
      }

      const data = result.data as any;
      setGestures(data.gestures || []);
    } catch (err: any) {
      setError(err?.message || 'Translation failed');
    } finally {
      setLoading(false);
    }
  }, [text]);

  return {
    text,
    setText,
    gestures,
    loading,
    error,
    translate,
  };
};

export const useSignToText = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detectedText, setDetectedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const startDetection = useCallback(async () => {
    setIsDetecting(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to access camera');
      setIsDetecting(false);
    }
  }, []);

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
  }, []);

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
    loading,
    error,
    isDetecting,
    startDetection,
    stopDetection,
    detectSign,
  };
};
