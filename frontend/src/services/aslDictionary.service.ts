export interface AslDictionaryEntry {
  id: string;
  gloss: string;
  english: string;
  vietnamese: string;
  category: string;
  definitionVi: string;
  gesture: {
    handshape: string;
    location: string;
    palmOrientation: string;
    movement: string;
    nonManualSignals: string;
    descriptionVi: string;
    howToSignVi?: string;
    stepsVi: string[];
    sourceUrls?: string[];
    sourceNotes?: string;
    verificationStatus?: 'SOURCE_BACKED' | 'UNVERIFIED' | 'PHRASE_COMPOUND' | string;
    confidence?: 'high' | 'medium' | 'low' | string;
  };
  _previousGestureSynthetic?: {
    handshape?: string;
    location?: string;
    palmOrientation?: string;
    movement?: string;
    nonManualSignals?: string;
    descriptionVi?: string;
    stepsVi?: string[];
  };
  difficulty: string;
  tags: string[];
  examples: Array<{
    en: string;
    vi: string;
  }>;
  metadata?: {
    isSynthetic?: boolean;
    accuracyNoteVi?: string;
    createdAt?: string;
    reviewedAt?: string;
    sourceReviewNoteVi?: string;
    gestureVerificationStatus?: string;
    gestureIsSynthetic?: boolean;
  };
}

interface AslDictionaryDataset {
  name: string;
  version: string;
  count: number;
  disclaimerVi?: string;
  entries: AslDictionaryEntry[];
}

const DATASET_URL = '/data/reviewed_asl_dictionary_safe_v1.json';

class AslDictionaryService {
  private cache: AslDictionaryDataset | null = null;

  async getDataset(): Promise<AslDictionaryDataset> {
    if (this.cache) {
      return this.cache;
    }

    const response = await fetch(DATASET_URL);
    if (!response.ok) {
      throw new Error('Could not load ASL dictionary data.');
    }

    const dataset = await response.json();
    this.cache = dataset;
    return dataset;
  }
}

export const aslDictionaryService = new AslDictionaryService();
