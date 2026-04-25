"use client";

import { useState } from "react";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  confirmFieldName?: string;
  confirmLabel?: string;
  buttonLabel?: string;
  buttonClassName?: string;
  checkboxClassName?: string;
  labelClassName?: string;
};

export default function DeleteUserAccountForm({
  action,
  confirmFieldName = "confirm_delete",
  confirmLabel = "I understand this will remove the user's login access.",
  buttonLabel = "Delete User Account",
  buttonClassName = "rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 disabled:cursor-not-allowed disabled:opacity-60",
  checkboxClassName = "mt-0.5 h-4 w-4 rounded border-red-300 text-red-700",
  labelClassName = "flex items-start gap-2 text-sm text-red-800",
}: Props) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <form action={action} className="space-y-3">
      <label className={labelClassName}>
        <input
          type="checkbox"
          name={confirmFieldName}
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className={checkboxClassName}
        />
        <span>{confirmLabel}</span>
      </label>

      <button
        type="submit"
        disabled={!confirmed}
        className={buttonClassName}
      >
        {buttonLabel}
      </button>
    </form>
  );
}
