"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalWrapperProps {
  children: React.ReactNode;
}

export default function ModalWrapper({ children }: ModalWrapperProps) {
  const router = useRouter();

  useEffect(() => {
    // Prevent background scrolling while modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleClose = () => {
    router.back();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-20">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-zinc-950/85 backdrop-blur-sm"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative z-10 flex h-full max-h-[85vh] w-full max-w-4xl flex-col rounded-xl border border-zinc-850 bg-zinc-900/90 text-slate-100 shadow-2xl backdrop-blur-md"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Modal Content Scrollable Area */}
          <div className="overflow-y-auto p-6 sm:p-8">
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
