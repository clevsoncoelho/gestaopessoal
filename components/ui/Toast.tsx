"use client";

import { AnimatePresence, motion } from "framer-motion";

interface ToastProps {
  message: string | null;
  onUndo?: (() => void) | null;
}

export function Toast({ message, onUndo }: ToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-28 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-indigo-500/20 bg-[#0f0f1e] px-5 py-3 text-xs shadow-xl shadow-black/40"
        >
          <span className="text-slate-200">{message}</span>
          {onUndo && (
            <button
              onClick={onUndo}
              className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 font-semibold text-indigo-400 transition hover:bg-indigo-500/20"
            >
              Desfazer
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
