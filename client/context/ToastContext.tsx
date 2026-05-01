import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let _counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    timers.current.delete(id);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = ++_counter;
      setToasts((prev) => [...prev, { id, message, type }]);
      const timer = setTimeout(() => removeToast(id), 4000);
      timers.current.set(id, timer);
    },
    [removeToast]
  );

  const colors: Record<ToastType, string> = {
    success: "bg-#1C9690 text-white",
    error: "bg-red-500 text-white",
    info: "bg-slate-700 text-white",
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-20 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto max-w-sm w-full rounded-2xl px-4 py-3 text-sm font-medium shadow-xl animate-in slide-in-from-bottom-3 fade-in ${colors[t.type]}`}
            onClick={() => removeToast(t.id)}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}
