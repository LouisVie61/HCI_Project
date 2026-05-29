import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Loader2, Search } from 'lucide-react';
import { NoticeState, PanelShell } from '../components/dashboard/DashboardShell';
import { SkeletonPoseViewer } from '../components/translator/SkeletonPoseViewer';
import { aslDictionaryService, type AslDictionaryEntry } from '../services/aslDictionary.service';
import { signMtService } from '../services/translation/signmt.service';

const normalize = (value: string) => value.trim().toLowerCase();

const isPlaceholderGestureValue = (value?: string) => {
  const normalized = value?.trim().toLowerCase() ?? '';

  return (
    !normalized ||
    normalized === 'unverified' ||
    normalized === 'none' ||
    normalized.includes('unverified disabled') ||
    normalized.includes('chưa có mô tả asl đủ tin cậy') ||
    normalized.includes('không dùng thông tin handshape/location')
  );
};

const getDisplayGesture = (entry: AslDictionaryEntry) => {
  const fallback = entry._previousGestureSynthetic;
  const useFallback = (current?: string, fallbackValue?: string) =>
    isPlaceholderGestureValue(current) && fallbackValue ? fallbackValue : current || fallbackValue || 'Not available';

  const currentSteps = entry.gesture.stepsVi ?? [];
  const fallbackSteps = fallback?.stepsVi ?? [];
  const shouldUseFallbackSteps =
    fallbackSteps.length > 0 && (currentSteps.length === 0 || currentSteps.some((step) => isPlaceholderGestureValue(step)));

  const currentDescription = entry.gesture.howToSignVi || entry.gesture.descriptionVi;
  const description = isPlaceholderGestureValue(currentDescription) && fallback?.descriptionVi
    ? fallback.descriptionVi
    : currentDescription;

  const usedFallback = Boolean(
    fallback &&
      (isPlaceholderGestureValue(entry.gesture.handshape) ||
        isPlaceholderGestureValue(entry.gesture.location) ||
        isPlaceholderGestureValue(entry.gesture.palmOrientation) ||
        isPlaceholderGestureValue(entry.gesture.movement) ||
        isPlaceholderGestureValue(currentDescription) ||
        shouldUseFallbackSteps),
  );

  return {
    handshape: useFallback(entry.gesture.handshape, fallback?.handshape),
    location: useFallback(entry.gesture.location, fallback?.location),
    palmOrientation: useFallback(entry.gesture.palmOrientation, fallback?.palmOrientation),
    movement: useFallback(entry.gesture.movement, fallback?.movement),
    description: description || fallback?.descriptionVi || 'Not available',
    stepsVi: shouldUseFallbackSteps ? fallbackSteps : currentSteps,
    usedFallback,
  };
};

export const AslDictionary = () => {
  const [entries, setEntries] = useState<AslDictionaryEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<AslDictionaryEntry | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const detailPanelRef = useRef<HTMLDivElement | null>(null);
  const [detailPanelHeight, setDetailPanelHeight] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;

    const loadDictionary = async () => {
      try {
        setLoading(true);
        const dataset = await aslDictionaryService.getDataset();
        if (ignore) return;

        setEntries(dataset.entries);
        setSelectedEntry(dataset.entries[0] ?? null);
        setError(null);
      } catch (err: any) {
        if (!ignore) {
          setError(err?.message || 'Could not load ASL dictionary.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadDictionary();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const element = detailPanelRef.current;
    if (!element) return;

    const updateHeight = () => {
      setDetailPanelHeight(element.offsetHeight);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(element);

    window.addEventListener('resize', updateHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [selectedEntry]);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(entries.map((entry) => entry.category))).sort()],
    [entries],
  );

  const filteredEntries = useMemo(() => {
    const normalizedQuery = normalize(query);

    return entries.filter((entry) => {
      const matchesCategory = category === 'all' || entry.category === category;
      const searchableText = normalize(entry.gloss);

      return matchesCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [category, entries, query]);

  const poseUrl = selectedEntry
    ? signMtService.getSpokenToSignedPoseUrl(selectedEntry.english, 'en', 'ase')
    : null;

  const videoUrl = selectedEntry
    ? signMtService.getSpokenToSignedVideoUrl(selectedEntry.english, 'en', 'ase')
    : null;

  const lifeprintUrl = selectedEntry
    ? `https://www.lifeprint.com/asl101/pages-signs/${selectedEntry.english[0]?.toLowerCase()}/${encodeURIComponent(
        selectedEntry.english.toLowerCase().replace(/\s+/g, '-'),
      )}.htm`
    : null;

  const handspeakUrl = selectedEntry
    ? `https://www.handspeak.com/word/search/index.php?id=${encodeURIComponent(selectedEntry.english)}`
    : null;

  const sourceUrls = selectedEntry?.gesture.sourceUrls ?? [];
  const displayGesture = selectedEntry ? getDisplayGesture(selectedEntry) : null;

  return (
    <PanelShell
      eyebrow="Dictionary"
      title="ASL Dictionary"
      description=""
    >
      <div className="grid items-stretch gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <section
          className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
          style={detailPanelHeight ? { height: detailPanelHeight } : undefined}
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search word..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
            </label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === 'all' ? 'All categories' : item}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4 text-sm font-medium text-slate-500">
              <Loader2 className="size-4 animate-spin" />
              Loading dictionary...
            </div>
          ) : error ? (
            <div className="mt-5">
              <NoticeState tone="danger" title="Khong tai duoc tu dien" message={error} />
            </div>
          ) : (
            <>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                <span>{filteredEntries.length} results</span>
                <span>{entries.length} words</span>
              </div>
              <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {filteredEntries.map((entry) => {
                  const active = selectedEntry?.id === entry.id;

                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setSelectedEntry(entry)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        active
                          ? 'border-slate-950 bg-slate-950 text-white'
                          : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold">{entry.gloss}</p>
                          <p className={`mt-1 text-xs ${active ? 'text-slate-300' : 'text-slate-500'}`}>
                            {entry.difficulty}
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-white/10 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
                          {entry.category}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <section className="min-h-0">
          <div
            ref={detailPanelRef}
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
          >
            {selectedEntry ? (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-3xl font-semibold text-slate-950">
                      {selectedEntry.gloss}
                    </p>
                  </div>
                  {videoUrl ? (
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <BookOpen className="size-4" />
                      Open video
                    </a>
                  ) : null}
                </div>

                <div className="mt-5 aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  {poseUrl ? <SkeletonPoseViewer src={poseUrl} /> : null}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <InfoTile label="Handshape" value={displayGesture?.handshape ?? selectedEntry.gesture.handshape} />
                  <InfoTile label="Location" value={displayGesture?.location ?? selectedEntry.gesture.location} />
                  <InfoTile label="Palm orientation" value={displayGesture?.palmOrientation ?? selectedEntry.gesture.palmOrientation} />
                  <InfoTile label="Movement" value={displayGesture?.movement ?? selectedEntry.gesture.movement} />
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">How to sign</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {displayGesture?.description ?? selectedEntry.gesture.howToSignVi ?? selectedEntry.gesture.descriptionVi}
                  </p>
                  {displayGesture?.stepsVi.length ? (
                    <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600">
                      {displayGesture.stepsVi.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  ) : null}
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Reference lookup</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    You can check the original sources for this entry or look it up on popular ASL reference sites like Lifeprint or HandSpeak.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sourceUrls.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Source
                      </a>
                    ))}
                    {lifeprintUrl ? (
                      <a
                        href={lifeprintUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Lifeprint
                      </a>
                    ) : null}
                    {handspeakUrl ? (
                      <a
                        href={handspeakUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        HandSpeak
                      </a>
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-[420px] items-center justify-center text-center text-sm text-slate-500">
                Select a word to preview its pose.
              </div>
            )}
          </div>

        </section>
      </div>
    </PanelShell>
  );
};

const InfoTile = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl bg-slate-50 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
  </div>
);
