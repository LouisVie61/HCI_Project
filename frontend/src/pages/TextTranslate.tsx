import { FormEvent, useState } from 'react';
import { Download, Languages, RefreshCw } from 'lucide-react';
import { LoadingState, NoticeState, PanelShell } from '../components/dashboard/DashboardShell';
import { SkeletonPoseViewer } from '../components/translator/SkeletonPoseViewer';
import { ViewerSelector, type ViewerMode } from '../components/translator/ViewerSelector';
import { useTextToSign } from '../hooks';
import { signedLanguageOptions, type SignedLanguageCode } from '../services/translation/signmt.service';

export const TextTranslate = () => {
  const {
    text,
    setText,
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
    maxInputChars,
  } = useTextToSign();
  const [viewerMode, setViewerMode] = useState<ViewerMode>('video');
  const [mediaError, setMediaError] = useState<string | null>(null);

  const hasOutput = Boolean(videoUrl || poseUrl);
  const characterCount = text.length;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setMediaError(null);
    void translate();
  };

  const renderOutput = () => {
    if (loading) {
      return (
        <div className="flex aspect-video items-center justify-center rounded-[28px] border border-slate-200 bg-white">
          <LoadingState label="Generating sign language output..." />
        </div>
      );
    }

    if (!hasOutput) {
      return (
        <div className="flex aspect-video items-center justify-center rounded-[28px] border border-slate-200 bg-slate-50 px-6 text-center">
          <p className="max-w-sm text-sm leading-6 text-slate-500">
          </p>
        </div>
      );
    }

    if (viewerMode === 'pose' && poseUrl) {
      return (
        <div className="aspect-video overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100">
          <SkeletonPoseViewer src={poseUrl} />
        </div>
      );
    }

    if (videoUrl) {
      return (
        <div className="aspect-video overflow-hidden rounded-[28px] border border-slate-200 bg-black">
          <video
            key={videoUrl}
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            controls
            onError={() => setMediaError('unable to load video')}
            className="h-full w-full object-contain"
          />
        </div>
      );
    }

    return (
      <div className="flex aspect-video items-center justify-center rounded-[28px] border border-slate-200 bg-slate-50">
        <NoticeState tone="neutral" title="No output yet" message="Unavailable" />
      </div>
    );
  };

  return (
    <PanelShell
      eyebrow="Translator"
      title="Text to Sign Language"
      description="Enter text in any language."
      action={
        <ViewerSelector
          value={viewerMode}
          onChange={setViewerMode}
        />
      }
    >
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={handleSubmit} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <label htmlFor="translate-text" className="text-sm font-semibold text-slate-700">
            Text to translate
          </label>
          <textarea
            id="translate-text"
            value={text}
            maxLength={maxInputChars}
            onChange={(event) => setText(event.target.value)}
            placeholder="Example: Hello, how are you today?"
            className="mt-3 min-h-44 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
          />
          <div className="mt-2 flex justify-end text-xs font-medium text-slate-400">
            {characterCount} / {maxInputChars}
          </div>

          <div className="mt-5 grid gap-4">
            <label className="text-sm font-semibold text-slate-700">
              Signed language
              <select
                value={signedLanguage}
                onChange={(event) => setSignedLanguage(event.target.value as SignedLanguageCode)}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              >
                {signedLanguageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Detected input language: <span className="font-semibold text-slate-950">{detectedLanguage}</span>
          </div>

          {error && (
            <div className="mt-4">
              <NoticeState tone="danger" title="Could not translate" message={error} />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? <RefreshCw className="size-4 animate-spin" /> : <Languages className="size-4" />}
            {loading ? 'Translating...' : 'Translate to sign language'}
          </button>
        </form>

        <section className="space-y-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Sign Language Animation</h3>
                <p className="mt-1 text-sm text-slate-500"></p>
              </div>
              {videoUrl ? (
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Download className="size-4" />
                  Open video
                </a>
              ) : null}
            </div>
            {renderOutput()}
            {mediaError ? (
              <div className="mt-4">
                <NoticeState tone="danger" title="Could not load media" message={mediaError} />
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </PanelShell>
  );
};
