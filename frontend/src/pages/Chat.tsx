import { FormEvent, useMemo, useState } from 'react';
import { Bot, RefreshCw, Send } from 'lucide-react';
import { LoadingState, NoticeState, PanelShell } from '../components/dashboard/DashboardShell';
import { useChat } from '../hooks';

export const Chat = () => {
  const { messages, loading, error, sendMessage, clearMessages } = useChat();
  const [draft, setDraft] = useState('');

  const starterPrompts = useMemo(
    () => ['Giải thích ký hiệu xin chào', 'Làm sao luyện bảng chữ cái?', 'Gợi ý bài tập 10 phút'],
    []
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    sendMessage(draft.trim());
    setDraft('');
  };

  return (
    <PanelShell
      eyebrow="Assistant"
      title="Chat AI hỗ trợ học"
      description="Đặt câu hỏi về bài học, ký hiệu hoặc cách luyện tập."
      action={
        <button
          type="button"
          onClick={clearMessages}
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw className="size-4" />
          Xóa chat
        </button>
      }
    >
      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="min-h-[420px] space-y-4 p-5">
          {messages.length === 0 && (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <div className="mb-5 flex size-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700">
                <Bot className="size-8" />
              </div>
              <h3 className="text-xl font-semibold text-slate-950">Bạn muốn học gì hôm nay?</h3>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setDraft(prompt)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.sender === 'user';
            return (
              <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[78%] rounded-3xl px-4 py-3 text-sm leading-6 ${
                    isUser ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            );
          })}
          {loading && <LoadingState label="AI đang trả lời..." />}
          {error && <NoticeState tone="danger" title="Không gửi được tin nhắn" message={error} />}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-slate-200 p-4">
          <div className="flex gap-3">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              className="h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            />
            <button
              type="submit"
              disabled={loading || !draft.trim()}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              <Send className="size-4" />
              <span className="hidden sm:inline">Gửi</span>
            </button>
          </div>
        </form>
      </div>
    </PanelShell>
  );
};
