"use client";

import { useEffect, useState } from "react";

type ToastMessageProps = {
  message: string;
  autoHideMs?: number;
  className?: string;
};

export default function ToastMessage({
  message,
  autoHideMs = 4500,
  className = "border-emerald-200 bg-emerald-50 text-emerald-800",
}: ToastMessageProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, autoHideMs);
    return () => window.clearTimeout(timer);
  }, [autoHideMs]);

  if (!visible) return null;

  return (
    <div className={`rounded-xl border p-4 text-sm shadow-sm ${className}`} role="status">
      {message}
    </div>
  );
}
