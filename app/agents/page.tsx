import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import {
  Bot,
  CirclePause,
  PlayCircle,
  ShieldAlert,
  Database,
  Wrench,
  DollarSign,
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

function jsonToStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  return [];
}

async function pauseAgent(formData: FormData) {
  "use server";

  const agentId = String(formData.get("agentId"));

  const agent = await prisma.agent.update({
    where: { id: agentId },
    data: { status: "PAUSED" },
  });

  await prisma.auditLog.create({
    data: {
      companyId: agent.companyId,
      agentId: agent.id,
      action: "AGENT_PAUSED",
      message: `${agent.name} was paused by admin from Agents Management page.`,
      riskLevel: agent.riskLevel,
      metadata: {
        source: "agents_page",
      },
    },
  });

  revalidatePath("/agents");
  revalidatePath("/dashboard");
}

async function activateAgent(formData: FormData) {
  "use server";

  const agentId = String(formData.get("agentId"));

  const agent = await prisma.agent.update({
    where: { id: agentId },
    data: { status: "ACTIVE" },
  });

  await prisma.auditLog.create({
    data: {
      companyId: agent.companyId,
      agentId: agent.id,
      action: "AGENT_ACTIVATED",
      message: `${agent.name} was activated by admin from Agents Management page.`,
      riskLevel: agent.riskLevel,
      metadata: {
        source: "agents_page",
      },
    },
  });

  revalidatePath("/agents");
  revalidatePath("/dashboard");
}

export default async function AgentsPage() {
  const cookieStore = await cookies();
  const isVerified =
    cookieStore.get("agentops_agents_pin")?.value === "verified";

  if (!isVerified) {
    redirect("/agents/security");
  }

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
    include: {
      owner: true,
      runs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      approvals: {
        where: { status: "PENDING" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const activeAgents = agents.filter((agent) => agent.status === "ACTIVE").length;
  const pausedAgents = agents.filter((agent) => agent.status === "PAUSED").length;
  const highRiskAgents = agents.filter((agent) => agent.riskLevel === "HIGH").length;
  const totalCost = agents.reduce(
    (sum, agent) => sum + agent.estimatedMonthlyCost,
    0
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <Link href="/dashboard" className="text-sm font-medium text-cyan-400">
              ← Back to Dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              AI Agent Management
            </h1>
            <p className="mt-2 text-slate-400">
              Yahan company ke AI agents ko manage, monitor, pause aur activate
              kiya ja sakta hai.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
  <Link
    href="/agents/new"
    className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
  >
    Create Agent
  </Link>

  <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-3 text-right">
    <p className="text-sm text-slate-400">Workspace</p>
    <p className="font-semibold">{company.name}</p>
  </div>
</div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <Bot className="h-6 w-6 text-cyan-400" />
            <p className="mt-4 text-sm text-slate-400">Total Agents</p>
            <p className="mt-1 text-3xl font-bold">{agents.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <PlayCircle className="h-6 w-6 text-green-400" />
            <p className="mt-4 text-sm text-slate-400">Active Agents</p>
            <p className="mt-1 text-3xl font-bold">{activeAgents}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <CirclePause className="h-6 w-6 text-yellow-400" />
            <p className="mt-4 text-sm text-slate-400">Paused Agents</p>
            <p className="mt-1 text-3xl font-bold">{pausedAgents}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <DollarSign className="h-6 w-6 text-emerald-400" />
            <p className="mt-4 text-sm text-slate-400">Monthly AI Cost</p>
            <p className="mt-1 text-3xl font-bold">${totalCost.toFixed(2)}</p>
          </div>
        </section>

        <section className="mt-8 grid gap-6">
          {agents.map((agent) => {
            const toolsAllowed = jsonToStringArray(agent.toolsAllowed);
            const dataAccess = jsonToStringArray(agent.dataAccess);
            const latestRun = agent.runs[0];

            return (
              <div
                key={agent.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold">{agent.name}</h2>
                      {statusBadge(agent.status)}
                      {riskBadge(agent.riskLevel)}
                    </div>

                    <p className="mt-2 max-w-3xl text-sm text-slate-400">
                      {agent.description}
                    </p>

                    <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-slate-500">Department</p>
                        <p className="mt-1 font-medium">{agent.department}</p>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-slate-500">Owner</p>
                        <p className="mt-1 font-medium">{agent.owner.name}</p>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-slate-500">Risk Score</p>
                        <p className="mt-1 font-medium">
                          {agent.riskScore}/100{" "}
                          {agent.riskLevel === "HIGH" && (
                            <span className="ml-2 text-red-400">
                              High attention needed
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex min-w-52 flex-col gap-3">
                    {agent.status === "ACTIVE" ? (
                      <form action={pauseAgent}>
                        <input type="hidden" name="agentId" value={agent.id} />
                        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-yellow-300">
                          <CirclePause className="h-4 w-4" />
                          Pause Agent
                        </button>
                      </form>
                    ) : (
                      <form action={activateAgent}>
                        <input type="hidden" name="agentId" value={agent.id} />
                        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-green-300">
                          <PlayCircle className="h-4 w-4" />
                          Activate Agent
                        </button>
                      </form>
                    )}
<Link
  href={`/agents/${agent.id}`}
  className="flex w-full items-center justify-center rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
>
  View Details
</Link>
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-sm text-slate-500">Estimated Cost</p>
                      <p className="mt-1 text-lg font-bold">
                        ${agent.estimatedMonthlyCost.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Limit: ${agent.monthlyCostLimit.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 lg:grid-cols-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-cyan-400" />
                      <h3 className="font-medium">Allowed Tools</h3>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {toolsAllowed.map((tool) => (
                        <span
                          key={tool}
                          className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-cyan-400" />
                      <h3 className="font-medium">Data Access</h3>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {dataAccess.map((source) => (
                        <span
                          key={source}
                          className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300"
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-cyan-400" />
                      <h3 className="font-medium">Governance</h3>
                    </div>

                    <div className="mt-3 space-y-2 text-sm text-slate-400">
                      <p>
                        Approval Required:{" "}
                        <span className="font-medium text-white">
                          {agent.approvalRequired ? "Yes" : "No"}
                        </span>
                      </p>
                      <p>
                        Pending Approvals:{" "}
                        <span className="font-medium text-white">
                          {agent.approvals.length}
                        </span>
                      </p>
                      <p>
                        Last Run:{" "}
                        <span className="font-medium text-white">
                          {latestRun
                            ? latestRun.createdAt.toLocaleString()
                            : "No runs yet"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm font-medium text-slate-300">
                    Agent Instructions
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    {agent.instructions}
                  </p>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}