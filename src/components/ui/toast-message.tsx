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
  className = "border-green-200 bg-green-50 text-green-700",
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
    <div className={`rounded-2xl border p-4 text-sm shadow-sm ${className}`} role="status">
      {message}
    </div>
  );
}
