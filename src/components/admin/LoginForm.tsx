"use client";

import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

interface LoginFormProps {
  action: (data: FormData) => Promise<void>;
  error?: string;
}

export default function LoginForm({ action, error }: LoginFormProps) {
  return (
    <form action={action} className="space-y-4">
      {error && (
        <p className="text-red-400 text-sm font-mono text-center">
          {error === "Configuration"
            ? "Server configuration error — contact the site owner."
            : "Invalid email or password."}
        </p>
      )}
      <div>
        <label htmlFor="email" className="block text-sm text-slate-400 mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm text-slate-400 mb-1">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
        />
      </div>
      <SubmitButton />
    </form>
  );
}
