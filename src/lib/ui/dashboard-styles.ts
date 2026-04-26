import { cn } from "@/lib/utils/cn";
import {
  formInputClass,
  formPrimaryButtonClass,
  formSecondaryButtonClass,
  formErrorAlertClass,
  formSuccessAlertClass,
} from "@/lib/ui/form-styles";

/** Max width + horizontal padding for all dashboard route content (used in dashboard layout). */
export const dashboardMainInnerClass =
  "mx-auto w-full min-w-0 max-w-7xl p-4 sm:p-6";

/** Text inputs and native selects in list filters (aligned with `formInputClass`). */
export const dashboardFieldClass = cn(formInputClass, "placeholder:text-neutral-400");

/** Secondary actions (Search, Clear, outline links styled as buttons). */
export const dashboardButtonSecondaryClass = formSecondaryButtonClass;

/** Primary actions (New …, submit). */
export const dashboardButtonPrimaryClass = formPrimaryButtonClass;

/** Outline header actions with minimum tap width (Show all, etc.). */
export const dashboardHeaderActionSecondaryClass = cn(
  dashboardButtonSecondaryClass,
  "min-w-36 w-full sm:w-auto",
);

export const dashboardHeaderActionPrimaryClass = cn(
  dashboardButtonPrimaryClass,
  "min-w-36 w-full sm:w-auto",
);

/** Default panel wrapping filters or tables. */
export const dashboardPanelClass = "rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm";

/** Slightly roomier panels (e.g. overview cards). */
export const dashboardPanelMdClass = cn(dashboardPanelClass, "p-5 sm:p-6");

/** Empty / zero-result states. */
export const dashboardEmptyCardClass =
  "rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600 shadow-sm";

/** Table header row (placed on `<tr>`). */
export const dashboardTableHeadRowClass =
  "border-b border-neutral-200 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500";

export const dashboardTableHeadCellClass = "px-4 py-3";

export const dashboardTableCellClass = "px-4 py-3 text-sm text-neutral-700";

/** Non-clickable body rows. */
export const dashboardTableBodyRowClass =
  "border-b border-neutral-100 transition hover:bg-neutral-50";

/** Inline success banner (forms, admin messages). */
export const dashboardAlertSuccessClass = formSuccessAlertClass;

/** Inline error banner. */
export const dashboardAlertErrorClass = formErrorAlertClass;
