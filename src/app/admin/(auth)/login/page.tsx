import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Admin Login" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; callbackUrl?: string };
}) {
  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: searchParams.callbackUrl ?? "/admin",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect(`/admin/login?error=CredentialsSignin`);
      }
      throw error; // IMPORTANT: re-throw — Next.js redirects via throw
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-mono text-cyan-400 text-sm mb-2">&gt; admin</p>
          <h1 className="text-2xl font-bold text-slate-100">Sign in</h1>
        </div>
        <div className="card p-6">
          <LoginForm action={login} error={searchParams.error} />
        </div>
      </div>
    </div>
  );
}
