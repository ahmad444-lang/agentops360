import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Bot,
  DollarSign,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    PAUSED: "bg-yellow-100 text-yellow-700",
    RETIRED: "bg-gray-100 text-gray-700",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

function riskBadge(risk: string) {
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

export default async function DashboardPage() {
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

  const agents = await prisma.agent.findMany({
    where: { companyId: company.id },
    include: { owner: true },
    orderBy: { createdAt: "asc" },
  });

  const approvals = await prisma.approval.findMany({
    where: { agent: { companyId: company.id } },
  });

  const totalAgents = agents.length;
  const activeAgents = agents.filter((agent) => agent.status === "ACTIVE").length;
  const highRiskAgents = agents.filter((agent) => agent.riskLevel === "HIGH").length;
  const monthlyCost = agents.reduce(
    (sum, agent) => sum + agent.estimatedMonthlyCost,
    0
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-400">AgentOps360</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              AI Agent Control Dashboard
            </h1>
            <p className="mt-2 text-slate-400">
              Demo workspace for {company.name} — AI agents, approvals, risk,
              cost, and audit logs.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-3 text-right">
            <p className="text-sm text-slate-400">Company</p>
            <p className="font-semibold">{company.name}</p>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <Bot className="h-6 w-6 text-cyan-400" />
            <p className="mt-4 text-sm text-slate-400">Total Agents</p>
            <p className="mt-1 text-3xl font-bold">{totalAgents}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <CheckCircle2 className="h-6 w-6 text-green-400" />
            <p className="mt-4 text-sm text-slate-400">Active Agents</p>
            <p className="mt-1 text-3xl font-bold">{activeAgents}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <ShieldAlert className="h-6 w-6 text-red-400" />
            <p className="mt-4 text-sm text-slate-400">High Risk Agents</p>
            <p className="mt-1 text-3xl font-bold">{highRiskAgents}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <DollarSign className="h-6 w-6 text-emerald-400" />
            <p className="mt-4 text-sm text-slate-400">Monthly AI Cost</p>
            <p className="mt-1 text-3xl font-bold">${monthlyCost.toFixed(2)}</p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-5">
            <h2 className="text-lg font-semibold">Agents Needing Attention</h2>
            <p className="mt-1 text-sm text-slate-400">
              High risk, paused, ya approvals pending walay agents.
            </p>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-2">
            {agents
              .filter(
                (agent) =>
                  agent.riskLevel === "HIGH" ||
                  agent.status === "PAUSED" ||
                  approvals.some(
                    (approval) =>
                      approval.agentId === agent.id && approval.status === "PENDING"
                  )
              )
              .map((agent) => (
                <Link
                  key={agent.id}
                  href={`/agents/${agent.id}`}
                  className="block rounded-xl border border-slate-800 bg-slate-950 p-4 transition hover:border-cyan-400 hover:bg-slate-900"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{agent.name}</p>
                    {riskBadge(agent.riskLevel)}
                  </div>

                  <p className="mt-2 text-sm text-slate-400">
                    Status: {agent.status} • Risk Score: {agent.riskScore}/100
                  </p>
                </Link>
              ))}
          </div>
        </section>

      </div>
    </main>
  );
}