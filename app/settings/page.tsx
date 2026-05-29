import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Settings, LockKeyhole, Building2, DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const company = await prisma.company.findFirst({
    include: {
      users: true,
      agents: true,
    },
  });

  if (!company) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <h1 className="text-2xl font-bold">No company data found</h1>
        <p className="mt-2 text-slate-300">
          Run <code>npx prisma db seed</code> to insert demo data.
        </p>
      </main>
    );
  }

  const totalMonthlyLimit = company.agents.reduce(
    (sum, agent) => sum + agent.monthlyCostLimit,
    0
  );

  const estimatedMonthlyCost = company.agents.reduce(
    (sum, agent) => sum + agent.estimatedMonthlyCost,
    0
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-cyan-400">AgentOps360</p>
          <h1 className="mt-2 text-3xl font-bold">Settings</h1>
          <p className="mt-2 text-slate-400">
            Workspace, security aur cost settings ka overview.
          </p>
        </div>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-cyan-400" />
              <h2 className="text-lg font-semibold">Company</h2>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="text-slate-500">Name</p>
                <p className="mt-1 font-medium">{company.name}</p>
              </div>

              <div>
                <p className="text-slate-500">Industry</p>
                <p className="mt-1 font-medium">{company.industry}</p>
              </div>

              <div>
                <p className="text-slate-500">Users</p>
                <p className="mt-1 font-medium">{company.users.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center gap-3">
              <LockKeyhole className="h-6 w-6 text-yellow-400" />
              <h2 className="text-lg font-semibold">Security</h2>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="text-slate-500">Agents PIN</p>
                <p className="mt-1 font-medium">Enabled</p>
              </div>

              <div>
                <p className="text-slate-500">Demo PIN</p>
                <p className="mt-1 font-medium">4321</p>
              </div>

              <p className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-slate-400">
                Production version mein yahan PIN change, roles, login aur
                permissions add honge.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-emerald-400" />
              <h2 className="text-lg font-semibold">Cost Control</h2>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="text-slate-500">Total Monthly Limit</p>
                <p className="mt-1 font-medium">
                  ${totalMonthlyLimit.toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Estimated Monthly Cost</p>
                <p className="mt-1 font-medium">
                  ${estimatedMonthlyCost.toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Agents</p>
                <p className="mt-1 font-medium">{company.agents.length}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-cyan-400" />
            <h2 className="text-lg font-semibold">Production Settings Roadmap</h2>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              "Change agents security PIN",
              "Add user roles: Admin, Manager, Viewer",
              "Set global monthly AI budget",
              "Configure OpenAI/Gemini API key",
              "Enable email/Slack alerts",
              "Export audit logs for compliance",
            ].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}