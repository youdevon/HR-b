import type { ReactNode } from "react";
import {
  formErrorAlertClass,
  formFieldErrorClass,
  formHelperClass,
  formLabelClass,
  formSuccessAlertClass,
} from "@/lib/ui/form-styles";
import { cn } from "@/lib/utils/cn";

export function FormLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <span className={formLabelClass}>
      {children}
      {required ? (
        <span className="ml-0.5 text-red-600" aria-hidden="true">
          *
        </span>
      ) : null}
    </span>
  );
}

export function FormHelperText({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn(formHelperClass, className)}>{children}</p>;
}

export function FormFieldError({ children }: { children: ReactNode }) {
  return <p className={formFieldErrorClass}>{children}</p>;
}

export function FormErrorAlert({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(formErrorAlertClass, className)}>{children}</div>;
}

export function FormSuccessAlert({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(formSuccessAlertClass, className)}>{children}</div>;
}

export function FormActions({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex flex-col-reverse flex-wrap gap-3 border-t border-neutral-200 pt-6 sm:flex-row sm:justify-end">
      {children}
    </div>
  );
}
