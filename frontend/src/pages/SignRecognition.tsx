import { useState } from 'react';
import { Camera, Copy, Eraser, Hand, Loader2, RotateCcw, Square, Volume2 } from 'lucide-react';
import { NoticeState, PanelShell } from '../components/dashboard/DashboardShell';
import { useSignToText } from '../hooks';

const supportedGestures = [
  { label: 'Hello', text: 'hello', guide: 'giu thang ban tay va dua len tran' },
  { label: 'Bye', text: 'bye', guide: 'Mo long ban tay huong ve camera' },
  { label: 'Yes', text: 'yes', guide: 'gio nam dam vao camera' },
  { label: 'No', text: 'no', guide: 'chum 3 ngon cai, tro, giua lai va gap 2 ngon con lai vao' },
  { label: 'OK', text: 'OK', guide: 'like' },
  { label: 'I love you', text: 'I love you', guide: 'spiderman ban to' },
];

export const SignRecognition = () => {
  const [selectedGesture, setSelectedGesture] = useState(supportedGestures[0]);
  const {
    videoRef,
    canvasRef,
    detectedText,
    currentGesture,
    transcript,
    modelWarning,
    cameraHint,
    loading,
    error,
    isDetecting,
    startDetection,
    stopDetection,
    clearTranscript,
    undoLastTranscript,
    copyTranscript,
    speakTranscript,
  } = useSignToText();

  const confidence = currentGesture ? Math.round(currentGesture.confidence * 100) : 0;
  const transcriptText = transcript.join(' ');

  return (
    <PanelShell
      eyebrow="Camera"
      title="Nhan dien ky hieu"
      description="Mo camera, thuc hien ky hieu truoc webcam va xem ket qua duoc chuyen thanh text."
      action={
        <button
          type="button"
          onClick={isDetecting ? stopDetection : startDetection}
          disabled={loading}
          className={`inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isDetecting ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-950 hover:bg-emerald-700'
          }`}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : isDetecting ? <Square className="size-4" /> : <Camera className="size-4" />}
          {loading ? 'Dang khoi tao' : isDetecting ? 'Tat camera' : 'Mo camera'}
        </button>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="relative min-h-[380px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm">
          <video ref={videoRef} autoPlay playsInline muted className="h-full min-h-[380px] w-full scale-x-[-1] object-cover" />
          <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full scale-x-[-1]" />

          {isDetecting && (
            <div className="absolute left-4 top-4 inline-flex max-w-[calc(100%-2rem)] items-center gap-2 rounded-full bg-slate-950/75 px-3 py-2 text-sm font-semibold text-white backdrop-blur">
              <Hand className="size-4 text-emerald-300" />
              {currentGesture?.label && currentGesture.label !== 'UNKNOWN' ? currentGesture.label : 'No stable sign'}
            </div>
          )}

          {!isDetecting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-center text-white">
              <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-white/10">
                <Camera className="size-8" />
              </div>
              <h3 className="text-xl font-semibold">Camera dang tat</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">
                Nhan mo camera, dua ban tay vao khung hinh, giu cu chi on dinh de them ket qua vao transcript.
              </p>
            </div>
          )}

          <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-slate-950/75 px-4 py-3 text-sm font-medium text-white backdrop-blur">
            {isDetecting ? cameraHint : selectedGesture.guide}
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Ket qua</p>
            <p className="mt-3 min-h-9 text-3xl font-semibold text-slate-950">{detectedText || 'Chua co'}</p>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>{currentGesture?.label && currentGesture.label !== 'UNKNOWN' ? currentGesture.label : 'Dang cho cu chi'}</span>
                <span>{confidence}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${confidence}%` }} />
              </div>
            </div>
          </section>

          {modelWarning && (
            <NoticeState
              tone="neutral"
              title="Che do demo"
              message="He thong dang su dung bo nhan dien co ban. Mot so ky hieu ngoai danh sach ho tro co the chua duoc nhan dien."
            />
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-500">Transcript</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={undoLastTranscript}
                  disabled={!transcript.length}
                  title="Xoa tu cuoi"
                  className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RotateCcw className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={copyTranscript}
                  disabled={!transcript.length}
                  title="Copy transcript"
                  className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Copy className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={speakTranscript}
                  disabled={!transcript.length}
                  title="Doc transcript"
                  className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Volume2 className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={clearTranscript}
                  disabled={!transcript.length}
                  title="Xoa transcript"
                  className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Eraser className="size-4" />
                </button>
              </div>
            </div>
            <div className="mt-4 min-h-24 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {transcriptText || 'Transcript se xuat hien tai day.'}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Gesture ho tro</p>
            <div className="mt-3 rounded-2xl bg-emerald-50 p-4">
              <p className="text-base font-semibold text-slate-950">{selectedGesture.label}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{selectedGesture.guide}</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {supportedGestures.map((gesture) => (
                <button
                  type="button"
                  key={gesture.label}
                  onClick={() => setSelectedGesture(gesture)}
                  className={`rounded-xl px-3 py-2 text-left transition ${
                    selectedGesture.label === gesture.label ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <p className={`text-sm font-semibold ${selectedGesture.label === gesture.label ? 'text-white' : 'text-slate-900'}`}>
                    {gesture.label}
                  </p>
                  <p className={`text-xs ${selectedGesture.label === gesture.label ? 'text-slate-300' : 'text-slate-500'}`}>{gesture.text}</p>
                </button>
              ))}
            </div>
          </section>

          {error && <NoticeState tone="danger" title="Loi camera/model" message={error} />}
        </aside>
      </div>
    </PanelShell>
  );
};
