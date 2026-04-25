"use client";

type ReviewContractCheckboxProps = {
  isReviewed: boolean;
};

export default function ReviewContractCheckbox({
  isReviewed,
}: ReviewContractCheckboxProps) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
      <input
        type="checkbox"
        name="reviewed"
        defaultChecked={isReviewed}
        disabled={isReviewed}
        onChange={(event) => {
          if (!event.currentTarget.checked) return;
          const form = event.currentTarget.form;
          form?.requestSubmit();
        }}
        className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-300 disabled:cursor-default"
      />
      Reviewed
    </label>
  );
}
