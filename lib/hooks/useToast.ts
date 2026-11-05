"use client";

import { useCallback, useRef, useState } from "react";

interface ToastState {
  message: string | null;
  onUndo: (() => void) | null;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({ message: null, onUndo: null });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string, options?: { onUndo?: () => void; duration?: number }) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ message, onUndo: options?.onUndo ?? null });
      timerRef.current = setTimeout(() => {
        setToast({ message: null, onUndo: null });
      }, options?.duration ?? 3000);
    },
    []
  );

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message: null, onUndo: null });
  }, []);

  return { toast, show, hide };
}
