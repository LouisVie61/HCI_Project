import { Camera } from 'lucide-react';
import { NoticeState, PanelShell } from '../components/dashboard/DashboardShell';
import { useSignToText } from '../hooks';

export const SignRecognition = () => {
  const { videoRef, canvasRef, detectedText, loading, error, isDetecting, startDetection, stopDetection } =
    useSignToText();

  return (
    <PanelShell
      eyebrow="Camera"
      title="Nhận diện ký hiệu"
      description="Mở camera để chuẩn bị nhận diện ký hiệu. Khi model/backend hoàn chỉnh, kết quả sẽ hiện bên cạnh."
      action={
        <button
          type="button"
          onClick={isDetecting ? stopDetection : startDetection}
          className={`inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold text-white transition ${
            isDetecting ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-950 hover:bg-emerald-700'
          }`}
        >
          <Camera className="size-4" />
          {isDetecting ? 'Tắt camera' : 'Mở camera'}
        </button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="relative min-h-[360px] overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950">
          <video ref={videoRef} autoPlay playsInline muted className="h-full min-h-[360px] w-full object-cover" />
          <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
          {!isDetecting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-center text-white">
              <div className="mb-5 flex size-16 items-center justify-center rounded-3xl bg-white/10">
                <Camera className="size-8" />
              </div>
              <h3 className="text-xl font-semibold">Camera đang tắt</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">
                Nhấn mở camera để bắt đầu phiên nhận diện thử nghiệm.
              </p>
            </div>
          )}
        </div>

        <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Kết quả nhận diện</p>
          <div className="mt-4 rounded-3xl bg-slate-50 p-5">
            <p className="text-2xl font-semibold text-slate-950">{detectedText || 'Chưa có kết quả'}</p>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {loading
                ? 'Đang phân tích khung hình...'
                : 'Kết quả sẽ được cập nhật khi nhận được dữ liệu từ module nhận diện.'}
            </p>
          </div>
          {error && (
            <div className="mt-4">
              <NoticeState tone="danger" title="Lỗi camera" message={error} />
            </div>
          )}
        </aside>
      </div>
    </PanelShell>
  );
};
