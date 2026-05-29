import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Activity,
  Bot,
  ClipboardList,
  Database,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

function riskBadge(risk?: string | null) {
  if (!risk) {
    return (
      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
        INFO
      </span>
    );
  }

  const styles: Record<string, string> = {
    LOW: "bg-blue-100 text-blue-700",
    MEDIUM: "bg-orange-100 text-orange-700",
    HIGH: "bg-red-100 text-red-700",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${styles[risk]}`}>
      {risk}
    </span>
  );
}

function actionBadge(action: string) {
  const isApproval = action.startsWith("APPROVAL");
  const isAgent = action.startsWith("AGENT");
  const isData = action.startsWith("DATA");

  let style = "bg-slate-800 text-slate-300";

  if (isApproval) style = "bg-purple-100 text-purple-700";
  if (isAgent) style = "bg-cyan-100 text-cyan-700";
  if (isData) style = "bg-emerald-100 text-emerald-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${style}`}>
      {action}
    </span>
  );
}

export default async function LogsPage() {
  const company = await prisma.company.findFirst();

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

  const auditLogs = await prisma.auditLog.findMany({
    where: { companyId: company.id },
    include: {
      agent: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const totalLogs = auditLogs.length;
  const highRiskLogs = auditLogs.filter((log) => log.riskLevel === "HIGH").length;
  const approvalLogs = auditLogs.filter((log) =>
    log.action.startsWith("APPROVAL")
  ).length;
  const agentLogs = auditLogs.filter((log) => log.action.startsWith("AGENT")).length;
  const dataLogs = auditLogs.filter((log) => log.action.startsWith("DATA")).length;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link href="/dashboard" className="text-sm font-medium text-cyan-400">
              ← Back to Dashboard
            </Link>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Audit Logs
            </h1>

            <p className="mt-2 text-slate-400">
              System ka CCTV record — har important AI agent action yahan save hota hai.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-3 text-right">
            <p className="text-sm text-slate-400">Workspace</p>
            <p className="font-semibold">{company.name}</p>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <ClipboardList className="h-6 w-6 text-cyan-400" />
            <p className="mt-4 text-sm text-slate-400">Total Logs</p>
            <p className="mt-1 text-3xl font-bold">{totalLogs}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <ShieldAlert className="h-6 w-6 text-red-400" />
            <p className="mt-4 text-sm text-slate-400">High Risk Logs</p>
            <p className="mt-1 text-3xl font-bold">{highRiskLogs}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <CheckCircle2 className="h-6 w-6 text-purple-400" />
            <p className="mt-4 text-sm text-slate-400">Approval Logs</p>
            <p className="mt-1 text-3xl font-bold">{approvalLogs}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <Bot className="h-6 w-6 text-cyan-400" />
            <p className="mt-4 text-sm text-slate-400">Agent Logs</p>
            <p className="mt-1 text-3xl font-bold">{agentLogs}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <Database className="h-6 w-6 text-emerald-400" />
            <p className="mt-4 text-sm text-slate-400">Data Logs</p>
            <p className="mt-1 text-3xl font-bold">{dataLogs}</p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 lg:col-span-2">
            <div className="border-b border-slate-800 p-5">
              <h2 className="text-lg font-semibold">Full Audit Trail</h2>
              <p className="mt-1 text-sm text-slate-400">
                Har action ka time, agent, risk aur message yahan show hota hai.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="px-5 py-4">Action</th>
                    <th className="px-5 py-4">Agent</th>
                    <th className="px-5 py-4">Risk</th>
                    <th className="px-5 py-4">Message</th>
                    <th className="px-5 py-4">Time</th>
                  </tr>
                </thead>

                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-800">
                      <td className="px-5 py-4">{actionBadge(log.action)}</td>

                      <td className="px-5 py-4 text-slate-300">
                        {log.agent?.name ?? "System"}
                      </td>

                      <td className="px-5 py-4">{riskBadge(log.riskLevel)}</td>

                      <td className="px-5 py-4">
                        <p className="max-w-xl text-slate-300">{log.message}</p>
                      </td>

                      <td className="px-5 py-4 text-slate-400">
                        {log.createdAt.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900">
            <div className="border-b border-slate-800 p-5">
              <h2 className="text-lg font-semibold">Recent Timeline</h2>
              <p className="mt-1 text-sm text-slate-400">
                Latest important actions.
              </p>
            </div>

            <div className="space-y-4 p-5">
              {auditLogs.slice(0, 8).map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-cyan-400" />
                    <p className="text-sm font-semibold">{log.action}</p>
                  </div>

                  <p className="mt-2 text-sm text-slate-400">{log.message}</p>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      {log.agent?.name ?? "System"}
                    </p>
                    {riskBadge(log.riskLevel)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="font-semibold">Why audit logs matter</h2>
          <p className="mt-2 text-sm text-slate-400">
            Jab AI agents business data access karte hain ya risky actions suggest karte hain,
            company ko proof chahiye hota hai ke kis agent ne kab kya kiya. Audit logs se
            security, compliance aur accountability strong hoti hai.
          </p>
        </section>
      </div>
    </main>
  );
}