import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";

const AGENT_SECURITY_PIN = "4321";

async function verifyPin(formData: FormData) {
  "use server";

  const pin = String(formData.get("pin") ?? "");

  if (pin !== AGENT_SECURITY_PIN) {
    redirect("/agents/security?error=invalid");
  }

  const cookieStore = await cookies();

  cookieStore.set("agentops_agents_pin", "verified", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 30,
  });

  redirect("/agents");
}

export default async function AgentsSecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const hasError = params.error === "invalid";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950">
          <LockKeyhole className="h-7 w-7" />
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm font-medium text-cyan-400">
            AgentOps360 Security
          </p>
          <h1 className="mt-2 text-2xl font-bold">Enter Security PIN</h1>
          <p className="mt-2 text-sm text-slate-400">
            Agents management page protected hai kyunkay yahan AI agents ko
            pause ya activate kiya ja sakta hai.
          </p>
        </div>

        <form action={verifyPin} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300">
              Security PIN
            </label>
            <input
              name="pin"
              type="password"
              placeholder="Enter PIN"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
              required
            />
          </div>

          {hasError && (
            <p className="rounded-xl border border-red-900 bg-red-950 px-4 py-3 text-sm text-red-200">
              Wrong PIN. Please try again.
            </p>
          )}

          <button className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
            Unlock Agents Page
          </button>
        </form>

        <div className="mt-5 text-center">
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
          Demo PIN: <span className="font-semibold text-white">4321</span>
        </div>
      </div>
    </main>
  );
}