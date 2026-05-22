const VIETNAMESE_PATTERN =
  /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;

class LanguageDetectionService {
  async detectSpokenLanguage(text: string): Promise<string> {
    const normalizedText = text.trim();
    if (!normalizedText) {
      return 'en';
    }

    if (VIETNAMESE_PATTERN.test(normalizedText)) {
      return 'vi';
    }
    if (/[ñáéíóúü¿¡]/i.test(normalizedText)) {
      return 'es';
    }
    if (/[çœæàâêîôûëïü]/i.test(normalizedText)) {
      return 'fr';
    }
    if (/[äöüß]/i.test(normalizedText)) {
      return 'de';
    }

    return 'en';
  }
}

export const languageDetectionService = new LanguageDetectionService();
