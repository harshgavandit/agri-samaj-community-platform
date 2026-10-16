"use client";
import { useEffect, useRef } from "react";
import Feedback from "./Feedback";
export default function Modal({
  children,
  title,
  onClose,
  error,
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
  error?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="bg-transparent p-4 max-w-3xl w-full max-h-[100dvh] backdrop:bg-navy-950/60 backdrop:backdrop-blur-sm"
    >
      <Feedback message={error || ""} />
      {children}
    </dialog>
  );
}
