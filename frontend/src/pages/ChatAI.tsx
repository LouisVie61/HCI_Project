import { useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpenText, Bot, File, FileImage, FileText, FileVideo, LoaderCircle, MessageSquareText, Paperclip, Plus, SendHorizonal, Sparkles, Trash2, UserRound, X } from "lucide-react";

import { API_BASE_URL } from "../api/client";
import { Button } from "../components/ui/button";
import { useAuth, useChat } from "../hooks";
import { cn } from "../lib/utils";
import { ChatAttachment, ChatAttachmentKind, ChatConversationSummary, ChatMessage, ComposerAttachment } from "../types";

const STARTER_PROMPTS = ['Giải thích ký hiệu "xin chào" theo cách dễ hiểu cho người mới.', "Lập cho tôi kế hoạch học flashcard ngôn ngữ ký hiệu trong 7 ngày.", "Tạo một đoạn hội thoại ngắn để luyện giao tiếp cơ bản bằng ký hiệu.", "Cho tôi 5 mẹo để ghi nhớ từ vựng ký hiệu nhanh hơn."];

const SIDEBAR_NOTES = [
  {
    icon: Sparkles,
    title: "Giải thích đơn giản",
    description: "Phù hợp cho người mới học, trả lời bằng tiếng Việt tự nhiên.",
  },
  {
    icon: BookOpenText,
    title: "Học theo ngữ cảnh",
    description: "Có thể xin ví dụ hội thoại, flashcard và lộ trình luyện tập.",
  },
  {
    icon: MessageSquareText,
    title: "Giữ mạch hội thoại",
    description: "AI nhận cả lịch sử chat để trả lời có ngữ cảnh hơn.",
  },
  {
    icon: Paperclip,
    title: "Nhận ảnh và tệp",
    description: "Có thể dán ảnh trực tiếp hoặc tải lên ảnh, video, file văn bản và tài liệu.",
  },
];

const MAX_COMPOSER_ATTACHMENTS = 5;

const formatTime = (timestamp: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));

const formatConversationTime = (timestamp: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));

const formatFileSize = (sizeBytes: number) => {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(sizeBytes < 10 * 1024 ? 1 : 0)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(sizeBytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
};

const createAttachmentId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `attachment-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const detectAttachmentKind = (file: Pick<File, "type" | "name">): ChatAttachmentKind => {
  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  if (file.type.startsWith("text/")) {
    return "text";
  }

  const lowerName = file.name.toLowerCase();
  if ([".txt", ".md", ".json", ".csv", ".xml", ".yaml", ".yml", ".js", ".ts", ".tsx", ".py"].some((suffix) => lowerName.endsWith(suffix))) {
    return "text";
  }

  return "file";
};

const createComposerAttachment = (file: File): ComposerAttachment => ({
  id: createAttachmentId(),
  file,
  kind: detectAttachmentKind(file),
  preview_url: URL.createObjectURL(file),
});

const revokeComposerAttachment = (attachment: ComposerAttachment) => {
  if (attachment.preview_url?.startsWith("blob:")) {
    URL.revokeObjectURL(attachment.preview_url);
  }
};

const toPreviewAttachment = (attachment: ComposerAttachment): ChatAttachment => ({
  id: attachment.id,
  name: attachment.file.name,
  kind: attachment.kind,
  media_type: attachment.file.type || "application/octet-stream",
  size_bytes: attachment.file.size,
  url: attachment.preview_url,
  text_excerpt: null,
});

const resolveAttachmentUrl = (attachment: ChatAttachment) => {
  if (!attachment.url) {
    return null;
  }

  if (attachment.url.startsWith("blob:") || attachment.url.startsWith("data:") || attachment.url.startsWith("http")) {
    return attachment.url;
  }

  return `${API_BASE_URL}${attachment.url}`;
};

function AttachmentIcon({ kind, className }: { kind: ChatAttachmentKind; className?: string }) {
  if (kind === "image") {
    return <FileImage className={className} />;
  }

  if (kind === "video") {
    return <FileVideo className={className} />;
  }

  if (kind === "text") {
    return <FileText className={className} />;
  }

  return <File className={className} />;
}

function AttachmentCard({ attachment, tone, onRemove }: { attachment: ChatAttachment; tone: "user" | "assistant" | "composer"; onRemove?: () => void }) {
  const resolvedUrl = resolveAttachmentUrl(attachment);
  const isImage = attachment.kind === "image" && resolvedUrl;
  const isVideo = attachment.kind === "video" && resolvedUrl;
  const toneClasses = tone === "user" ? "border-white/15 bg-white/10 text-white" : tone === "composer" ? "border-slate-200 bg-slate-50 text-slate-900" : "border-slate-200 bg-white text-slate-900";
  const mutedTextClass = tone === "user" ? "text-slate-200" : "text-slate-500";
  const actionTextClass = tone === "user" ? "text-white/90 hover:text-white" : "text-cyan-700 hover:text-cyan-900";

  return (
    <div className={cn("relative overflow-hidden rounded-[22px] border", toneClasses)}>
      {onRemove ? (
        <button type="button" onClick={onRemove} className={cn("absolute right-2 top-2 z-10 inline-flex size-8 items-center justify-center rounded-full border backdrop-blur transition-colors", tone === "user" ? "border-white/20 bg-slate-950/60 text-white hover:bg-slate-950/80" : "border-slate-200 bg-white/90 text-slate-500 hover:text-slate-900")}>
          <X className="size-4" />
        </button>
      ) : null}

      {isImage ? <img src={resolvedUrl} alt={attachment.name} className="h-40 w-full object-cover" /> : null}
      {isVideo ? <video src={resolvedUrl} controls preload="metadata" className="h-40 w-full bg-slate-950 object-cover" /> : null}

      <div className="p-3">
        <div className="flex items-start gap-3">
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-2xl", tone === "user" ? "bg-white/10 text-white" : "bg-white text-cyan-700 shadow-sm")}>
            <AttachmentIcon kind={attachment.kind} className="size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{attachment.name}</p>
            <p className={cn("mt-1 text-xs", mutedTextClass)}>
              {attachment.kind.toUpperCase()} • {formatFileSize(attachment.size_bytes)}
            </p>
          </div>
        </div>

        {attachment.text_excerpt ? <p className={cn("mt-3 max-h-24 overflow-hidden whitespace-pre-wrap text-xs leading-5", mutedTextClass)}>{attachment.text_excerpt}</p> : null}

        {resolvedUrl && !isVideo ? (
          <a href={resolvedUrl} target="_blank" rel="noreferrer" className={cn("mt-3 inline-flex text-xs font-medium transition-colors", actionTextClass)}>
            Mở tệp
          </a>
        ) : null}
      </div>
    </div>
  );
}

function AttachmentGrid({ attachments, tone, onRemove }: { attachments: ChatAttachment[]; tone: "user" | "assistant" | "composer"; onRemove?: (attachmentId: string) => void }) {
  if (!attachments.length) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {attachments.map((attachment) => (
        <AttachmentCard key={attachment.id} attachment={attachment} tone={tone} onRemove={onRemove ? () => onRemove(attachment.id) : undefined} />
      ))}
    </div>
  );
}

function ConversationItem({ active, conversation, disabled, onDelete, onSelect }: { active: boolean; conversation: ChatConversationSummary; disabled: boolean; onDelete: (conversationId: string) => void | Promise<unknown>; onSelect: (conversationId: string) => void | Promise<unknown> }) {
  return (
    <div className={cn("group flex items-start gap-2 rounded-[20px] p-2 transition-colors", active ? "bg-slate-950 text-white" : "hover:bg-slate-100/90")}>
      <button type="button" onClick={() => void onSelect(conversation.id)} disabled={disabled} className="min-w-0 flex-1 rounded-[18px] px-3 py-2 text-left disabled:cursor-not-allowed">
        <p className={cn("truncate text-sm font-medium", active ? "text-white" : "text-slate-900")}>{conversation.title}</p>
        <p className={cn("mt-1 truncate text-xs", active ? "text-slate-300" : "text-slate-500")}>{conversation.last_message_preview || "Chưa có phản hồi nào."}</p>
        <p className="mt-2 text-[11px] text-slate-400">{formatConversationTime(conversation.updated_at)}</p>
      </button>

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={(event) => {
          event.stopPropagation();
          void onDelete(conversation.id);
        }}
        disabled={disabled}
        className={cn("mt-1", active ? "text-slate-300 hover:text-white" : "text-slate-500 hover:text-red-600")}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.sender === "user";
  const attachments = message.attachments ?? [];

  if (!message.content.trim() && !attachments.length) {
    return null;
  }

  return (
    <div className={cn("flex items-end gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser ? (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-950 text-cyan-50 shadow-sm">
          <Bot className="size-5" />
        </div>
      ) : null}

      <div className={cn("max-w-[min(85%,48rem)] rounded-[26px] px-5 py-4 shadow-sm", isUser ? "rounded-br-md bg-slate-950 text-white" : "rounded-bl-md border border-slate-200 bg-stone-50 text-slate-900")}>
        {attachments.length ? (
          <div className={cn(message.content.trim() ? "mb-4" : "mb-0")}>
            <AttachmentGrid attachments={attachments} tone={isUser ? "user" : "assistant"} />
          </div>
        ) : null}
        {message.content.trim() ? <p className="whitespace-pre-wrap text-[15px] leading-7">{message.content}</p> : null}
        <p className={cn("mt-3 text-xs", isUser ? "text-slate-300" : "text-slate-500")}>{formatTime(message.timestamp)}</p>
      </div>

      {isUser ? (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-200 text-amber-900 shadow-sm">
          <UserRound className="size-5" />
        </div>
      ) : null}
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex items-end gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-950 text-cyan-50 shadow-sm">
        <Bot className="size-5" />
      </div>
      <div className="rounded-[26px] rounded-bl-md border border-slate-200 bg-stone-50 px-5 py-4 text-slate-500 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="size-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
          <span className="size-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
          <span className="size-2 animate-bounce rounded-full bg-slate-400" />
        </div>
      </div>
    </div>
  );
}

export const ChatAI = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { messages, conversations, activeConversationId, loading, loadingHistory, error, sendMessage, selectConversation, startNewConversation, deleteConversation } = useChat();
  const [input, setInput] = useState("");
  const [composerAttachments, setComposerAttachments] = useState<ComposerAttachment[]>([]);
  const [composerError, setComposerError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const composerAttachmentsRef = useRef<ComposerAttachment[]>([]);
  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId) || null;

  useEffect(() => {
    composerAttachmentsRef.current = composerAttachments;
  }, [composerAttachments]);

  useEffect(() => {
    return () => {
      composerAttachmentsRef.current.forEach(revokeComposerAttachment);
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, loadingHistory]);

  const clearComposer = () => {
    composerAttachmentsRef.current.forEach(revokeComposerAttachment);
    composerAttachmentsRef.current = [];
    setComposerAttachments([]);
    setComposerError(null);
  };

  const handleNewConversation = () => {
    clearComposer();
    setInput("");
    startNewConversation();
  };

  const addComposerFiles = (files: File[]) => {
    const nonEmptyFiles = files.filter((file) => file.size > 0);
    if (!nonEmptyFiles.length) {
      setComposerError("Không có tệp hợp lệ để đính kèm.");
      return;
    }

    setComposerAttachments((current) => {
      const existingKeys = new Set(current.map((attachment) => `${attachment.file.name}:${attachment.file.size}:${attachment.file.lastModified}`));
      const uniqueFiles = nonEmptyFiles.filter((file) => {
        const key = `${file.name}:${file.size}:${file.lastModified}`;
        if (existingKeys.has(key)) {
          return false;
        }

        existingKeys.add(key);
        return true;
      });

      const slotsLeft = Math.max(0, MAX_COMPOSER_ATTACHMENTS - current.length);
      const acceptedFiles = uniqueFiles.slice(0, slotsLeft);

      if (!acceptedFiles.length) {
        setComposerError(current.length >= MAX_COMPOSER_ATTACHMENTS ? `Chỉ có thể đính kèm tối đa ${MAX_COMPOSER_ATTACHMENTS} tệp mỗi lượt.` : "Các tệp này đã có sẵn trong khung gửi.");
        return current;
      }

      setComposerError(uniqueFiles.length > acceptedFiles.length ? `Chỉ giữ tối đa ${MAX_COMPOSER_ATTACHMENTS} tệp trong một lượt gửi.` : null);
      return [...current, ...acceptedFiles.map(createComposerAttachment)];
    });
  };

  const removeComposerAttachment = (attachmentId: string) => {
    setComposerAttachments((current) => {
      const target = current.find((attachment) => attachment.id === attachmentId);
      if (target) {
        revokeComposerAttachment(target);
      }

      return current.filter((attachment) => attachment.id !== attachmentId);
    });
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    addComposerFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedFiles = Array.from(event.clipboardData.files ?? []);
    if (!pastedFiles.length) {
      return;
    }

    event.preventDefault();
    addComposerFiles(pastedFiles);
  };

  const handleSubmit = async (nextValue?: string) => {
    const nextMessage = nextValue ?? input;
    if (!nextMessage.trim() && !composerAttachments.length) {
      return;
    }

    const sent = await sendMessage(nextMessage, composerAttachments);
    if (!sent) {
      return;
    }

    clearComposer();
    setInput("");
  };

  const handleKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await handleSubmit();
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,_rgba(8,145,178,0.18),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#fff9f0_100%)] text-slate-900 min-[960px]:h-[100dvh] min-[960px]:overflow-hidden">
      <div className="mx-auto flex min-h-[100dvh] max-w-[1500px] flex-col gap-4 px-3 py-3 min-[960px]:h-full min-[960px]:min-h-0 min-[960px]:flex-row min-[960px]:px-4 min-[960px]:py-4">
        <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur min-[960px]:h-full min-[960px]:w-[300px] min-[960px]:min-h-0 min-[960px]:p-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-950 px-4 py-2 text-sm font-semibold text-cyan-50">
              <Bot className="size-4" /> GPT-5 Nano
            </div>
            <h1 className="mt-5 text-[28px] font-semibold tracking-tight text-slate-950">Chat AI cho học ngôn ngữ ký hiệu</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">Giao diện theo kiểu ChatGPT, lưu thread và hỗ trợ ảnh, video, file ngay trong cuộc trò chuyện.</p>
          </div>

          <Button onClick={handleNewConversation} disabled={loading} className="mt-6 justify-start rounded-2xl bg-slate-950 text-white hover:bg-slate-800">
            <Plus className="mr-2 size-4" />
            Cuộc chat mới
          </Button>

          <div className="mt-6 min-h-0 flex-1 overflow-hidden rounded-[26px] border border-slate-200 bg-slate-50/80 p-3">
            <div className="mb-3 flex items-center justify-between px-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Lịch sử chat</p>
              {loadingHistory ? <LoaderCircle className="size-4 animate-spin text-slate-400" /> : <span className="text-[11px] text-slate-400">{conversations.length} thread</span>}
            </div>

            <div className="min-h-0 space-y-1.5 overflow-y-auto pr-1">{conversations.length ? conversations.map((conversation) => <ConversationItem key={conversation.id} active={conversation.id === activeConversationId} conversation={conversation} disabled={loading} onDelete={deleteConversation} onSelect={selectConversation} />) : <div className="rounded-[22px] border border-dashed border-slate-300 bg-white/70 p-4 text-sm leading-6 text-slate-500">Chưa có lịch sử chat. Hãy bắt đầu một cuộc hội thoại mới để lưu lại như ChatGPT.</div>}</div>
          </div>

          <div className="mt-4 rounded-[24px] border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Người dùng hiện tại</p>
            <p className="mt-2 break-all">{user?.email}</p>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-white/70 bg-white/82 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur min-[960px]:min-h-0">
          <header className="shrink-0 border-b border-slate-200/80 px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => navigate("/dashboard")}>
                  <ArrowLeft className="mr-2 size-4" />
                  Dashboard
                </Button>
                <div>
                  <p className="text-sm font-semibold text-slate-950">{activeConversation?.title || "Cuộc chat mới"}</p>
                  <p className="text-sm text-slate-500">OpenRouter • GPT-5 Nano • history thread + streaming + attachments</p>
                </div>
              </div>

              <Button variant="ghost" onClick={() => (activeConversationId ? void deleteConversation(activeConversationId) : handleNewConversation())} disabled={loading || (!activeConversationId && !messages.length && !input && !composerAttachments.length)}>
                <Trash2 className="mr-2 size-4" />
                {activeConversationId ? "Xóa cuộc chat" : "Xóa bản nháp"}
              </Button>
            </div>

            <div className="mt-3 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          </header>

          <section className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
            {loadingHistory ? (
              <div className="flex h-full items-center justify-center">
                <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm text-slate-600 shadow-sm">
                  <LoaderCircle className="size-4 animate-spin" />
                  Đang tải hội thoại...
                </div>
              </div>
            ) : !messages.length ? (
              <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center py-4">
                <div className="rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(241,245,249,0.96))] p-8 shadow-sm">
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-900">
                    <Sparkles className="size-4" /> Sẵn sàng hỗ trợ học tập
                  </div>
                  <h2 className="mt-4 text-3xl font-semibold leading-tight text-slate-950">Hãy bắt đầu như đang nói chuyện với ChatGPT, nhưng tập trung vào học ngôn ngữ ký hiệu.</h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Bạn có thể hỏi về ký hiệu, xin giải thích bài học, nhờ tạo flashcard, hoặc dán ảnh và file để AI đọc ngay trong luồng chat.</p>

                  <div className="mt-8 grid gap-3 md:grid-cols-2">
                    {STARTER_PROMPTS.map((prompt) => (
                      <button key={prompt} type="button" onClick={() => void handleSubmit(prompt)} className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-left text-sm leading-6 text-slate-700 transition-all hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md">
                        {prompt}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {SIDEBAR_NOTES.map((item) => (
                      <div key={item.title} className="rounded-[22px] border border-slate-200 bg-white/90 p-4">
                        <div className="flex items-center gap-3 text-slate-950">
                          <div className="rounded-2xl bg-slate-100 p-2 text-cyan-700">
                            <item.icon className="size-4" />
                          </div>
                          <h2 className="text-sm font-medium">{item.title}</h2>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {loading ? <TypingBubble /> : null}
                <div ref={endRef} />
              </div>
            )}
          </section>

          <footer className="shrink-0 border-t border-slate-200/80 bg-white/72 px-4 py-4 backdrop-blur sm:px-6">
            <div className="mx-auto max-w-4xl">
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileInputChange} />

              {composerError ? <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{composerError}</div> : null}
              {error ? <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

              <div className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm">
                <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => void handleKeyDown(event)} onPaste={handlePaste} placeholder="Nhắn cho AI về ký hiệu, bài giảng, hoặc dán ảnh/tệp trực tiếp vào đây..." rows={3} disabled={loading || loadingHistory} className="min-h-[88px] w-full resize-none border-0 bg-transparent px-2 py-2 text-[15px] leading-7 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed" />

                {composerAttachments.length ? (
                  <div className="border-t border-slate-100 px-2 py-3">
                    <AttachmentGrid attachments={composerAttachments.map(toPreviewAttachment)} tone="composer" onRemove={removeComposerAttachment} />
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 border-t border-slate-100 px-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">Enter để gửi, Shift + Enter để xuống dòng.</p>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={loading || loadingHistory}>
                      <Paperclip className="mr-2 size-4" />
                      Đính kèm
                    </Button>
                    <Button variant="outline" onClick={() => setInput(STARTER_PROMPTS[0])} disabled={loading || loadingHistory}>
                      Gợi ý mẫu
                    </Button>
                    <Button onClick={() => void handleSubmit()} disabled={loading || loadingHistory || (!input.trim() && !composerAttachments.length)}>
                      <SendHorizonal className="mr-2 size-4" />
                      {loading ? "Đang trả lời..." : "Gửi"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
