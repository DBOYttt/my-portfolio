"use client";

import { useRef } from "react";

interface ConfirmDeleteButtonProps {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label?: string;
}

export default function ConfirmDeleteButton({
  action,
  id,
  label,
}: ConfirmDeleteButtonProps) {
  const formRef = useRef<HTMLFormElement>(null);

  function handleClick() {
    if (!window.confirm(`Delete this ${label ?? "item"}? This cannot be undone.`)) return;
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="button"
        onClick={handleClick}
        className="text-xs py-1 px-2 text-red-400 hover:text-red-300 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors"
      >
        Delete
      </button>
    </form>
  );
}
