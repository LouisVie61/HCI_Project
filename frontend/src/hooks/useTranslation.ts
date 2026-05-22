import { useState, useCallback, useRef } from 'react';
import { translationApi } from '../api/endpoints';
import { languageDetectionService } from '../services/translation/languageDetection.service';
import { signMtService, type SignedLanguageCode, type SpokenLanguageCode } from '../services/translation/signmt.service';

const MAX_INPUT_CHARS = 500;

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
