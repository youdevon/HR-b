import { cn } from "@/lib/utils/cn";

/** Focus ring shared by native controls in forms and filter bars. */
export const formControlFocusClass =
  "text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200";

/** Disabled native controls (inputs, selects). */
export const formControlDisabledClass =
  "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500";

/** Text inputs, native date, number, time (single-line). */
export const formInputClass = cn(
  "h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm",
  formControlFocusClass,
  formControlDisabledClass
);

/** Native `<select>`. */
export const formSelectClass = formInputClass;

/** Multi-line text. */
export const formTextareaClass = cn(
  "min-h-24 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm",
  formControlFocusClass,
  formControlDisabledClass
);

/** Read-only values that should look non-editable. */
export const formReadOnlyInputClass = cn(
  "h-10 w-full cursor-default rounded-xl border border-neutral-300 bg-neutral-100 px-3 text-sm text-neutral-700",
  "outline-none"
);

/** Checkboxes in forms. */
export const formCheckboxClass =
  "h-4 w-4 shrink-0 rounded border-neutral-300 text-neutral-900 focus:ring-2 focus:ring-neutral-200";

/** Field labels. */
export const formLabelClass = "text-sm font-medium text-neutral-700";

/** Helper / description under fields. */
export const formHelperClass = "text-xs text-neutral-500";

/** Inline validation copy under a field. */
export const formFieldErrorClass = "text-sm text-red-700";

/** Block-level error summary. */
export const formErrorAlertClass =
  "rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm";

/** Block-level success summary. */
export const formSuccessAlertClass =
  "rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 shadow-sm";

/** Primary submit (Save, Create, Apply, etc.). */
export const formPrimaryButtonClass = cn(
  "inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white transition hover:bg-neutral-800",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60"
);

/** Secondary (Cancel, Clear, Back as button). */
export const formSecondaryButtonClass = cn(
  "inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60"
);

/** Destructive confirm (delete, remove account). */
export const formDangerButtonClass = cn(
  "inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-red-300 bg-red-50 px-4 text-sm font-medium text-red-800 transition hover:bg-red-100",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60"
);

/** Bordered row for checkbox + label groups. */
export const formCheckboxRowClass =
  "flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3";

/** Standard footer for action buttons (wraps on small screens). */
export const formActionsRowClass =
  "mt-6 flex flex-col-reverse flex-wrap gap-3 border-t border-neutral-200 pt-6 sm:flex-row sm:justify-end";
