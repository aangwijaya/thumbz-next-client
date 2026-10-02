"use client";

import Link from "next/link";
import { createContext, useContext, useRef, useState } from "react";

interface ToastAction {
  label: string;
  href: string;
}

interface ToastState {
  id: number;
  message: string;
  action?: ToastAction;
}

type ShowToast = (message: string, action?: ToastAction) => void;

const ToastContext = createContext<ShowToast | null>(null);

export function useToast(): ShowToast {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast must be used inside ToastProvider");
  return show;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show: ShowToast = (message, action) => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), message, action });
    timer.current = setTimeout(() => setToast(null), 3200);
  };

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-[60] flex justify-center px-4"
      >
        {toast ? (
          <div
            key={toast.id}
            className="pointer-events-auto flex max-w-full items-center gap-3 rounded-lg bg-ink px-3.5 py-2.5 text-body-sm text-paper shadow-button motion-safe:animate-rise"
          >
            <span>{toast.message}</span>
            {toast.action ? (
              <Link
                href={toast.action.href}
                className="whitespace-nowrap rounded-lg font-semibold text-[#ffb4a8] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
              >
                {toast.action.label}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}
