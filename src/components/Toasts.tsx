import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X, type LucideIcon } from "lucide-react";

export type ToastKind = "success" | "danger" | "info";

export interface ToastInput {
  message: string;
  kind?: ToastKind;
  action?: { label: string; onClick: () => void };
}

interface ToastItem extends ToastInput {
  id: number;
  kind: ToastKind;
}

const ToastCtx = createContext<{ push: (t: ToastInput) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const KIND: Record<ToastKind, { border: string; color: string; Icon: LucideIcon }> = {
  success: { border: "rgba(87,227,155,0.42)", color: "#57e39b", Icon: CheckCircle2 },
  danger: { border: "rgba(255,122,108,0.42)", color: "#ff7a6c", Icon: AlertTriangle },
  info: { border: "rgba(139,163,146,0.35)", color: "#a9bdae", Icon: Info },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (t: ToastInput) => {
      const id = ++idRef.current;
      setItems((prev) => [
        ...prev.slice(-3),
        { id, kind: t.kind ?? "info", message: t.message, action: t.action },
      ]);
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), t.action ? 6500 : 4000),
      );
    },
    [dismiss],
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[70] flex w-[min(92vw,390px)] flex-col gap-2.5">
        {items.map((t) => {
          const k = KIND[t.kind];
          return (
            <div
              key={t.id}
              role="status"
              className="toast-in pointer-events-auto flex items-center gap-3 rounded-[11px] border px-4 py-3 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.7)]"
              style={{
                borderColor: k.border,
                background: "linear-gradient(180deg, #15271e, #101d16)",
              }}
            >
              <k.Icon size={17} strokeWidth={2} style={{ color: k.color }} className="shrink-0" />
              <p className="flex-1 text-[13.5px] leading-snug text-moss-200">{t.message}</p>
              {t.action && (
                <button
                  onClick={() => {
                    t.action?.onClick();
                    dismiss(t.id);
                  }}
                  className="shrink-0 rounded-md border border-mint-400/40 px-2.5 py-1 text-xs font-semibold text-mint-400 transition-colors hover:bg-mint-400/10"
                >
                  {t.action.label}
                </button>
              )}
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="icon-btn h-7 w-7 shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
