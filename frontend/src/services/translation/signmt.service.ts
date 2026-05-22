export type SpokenLanguageCode = 'auto' | 'en' | 'es' | 'fr' | 'de' | 'vi';
export type SignedLanguageCode = 'ase' | 'bfi' | 'fsl' | 'gsg';

export interface LanguageOption<T extends string> {
  value: T;
  label: string;
}

const VIDEO_API = 'https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_video';
const POSE_API = 'https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose';

const SIGNMT_SUPPORTED_SPOKEN = new Set(['en', 'es', 'fr', 'de']);

export const spokenLanguageOptions: LanguageOption<SpokenLanguageCode>[] = [
  { value: 'auto', label: 'Auto detect' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'vi', label: 'Vietnamese (fallback)' },
];

export const signedLanguageOptions: LanguageOption<SignedLanguageCode>[] = [
  { value: 'ase', label: 'American Sign Language' },
  { value: 'bfi', label: 'British Sign Language' },
  { value: 'fsl', label: 'French Sign Language' },
  { value: 'gsg', label: 'German Sign Language' },
];

class SignMtService {
  normalizeSpokenLanguage(language: string): string {
    return SIGNMT_SUPPORTED_SPOKEN.has(language) ? language : 'en';
  }

  getSpokenToSignedVideoUrl(text: string, spokenLanguage: string, signedLanguage: string): string {
    const params = new URLSearchParams({
      text,
      spoken: this.normalizeSpokenLanguage(spokenLanguage),
      signed: signedLanguage,
    });

    return `${VIDEO_API}?${params.toString()}`;
  }

  getSpokenToSignedPoseUrl(text: string, spokenLanguage: string, signedLanguage: string): string {
    const params = new URLSearchParams({
      text,
      spoken: this.normalizeSpokenLanguage(spokenLanguage),
      signed: signedLanguage,
    });

    return `${POSE_API}?${params.toString()}`;
  }
}

export const signMtService = new SignMtService();
