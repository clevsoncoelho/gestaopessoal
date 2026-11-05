"use client";

import { type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-30 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-elevated w-full max-w-lg rounded-[28px] p-5"
        >
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/20" />
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10"
            >
              ✕
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
