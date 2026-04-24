import { requireGuest } from "@/lib/auth/guards";

export default async function LoginPage() {
  await requireGuest();

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 p-6">
      <section className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Sign in</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Access the HR Management System.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-600">
          Login form will be connected to Supabase Auth next.
        </div>
      </section>
    </main>
  );
}