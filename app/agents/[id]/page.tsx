import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { Bot, Database, ShieldAlert, Wrench, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

async function checkAgentsAccess() {
  const cookieStore = await cookies();
  const isVerified =
    cookieStore.get("agentops_agents_pin")?.value === "verified";

  if (!isVerified) {
    redirect("/agents/security");
  }
}

function badge(text: string) {
  const styles: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    PAUSED: "bg-yellow-100 text-yellow-700",
    RETIRED: "bg-gray-100 text-gray-700",
    LOW: "bg-blue-100 text-blue-700",
    MEDIUM: "bg-orange-100 text-orange-700",
    HIGH: "bg-red-100 text-red-700",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[text]}`}>
      {text}
    </span>
  );
}

function jsonToArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  return [];
}

async function runDemoAgent(formData: FormData) {
  "use server";

  await checkAgentsAccess();

  const agentId = String(formData.get("agentId"));
  const dataSourceId = String(formData.get("dataSourceId") ?? "");

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
  });

  if (!agent) {
    throw new Error("Agent not found.");
  }

  const dataSource = dataSourceId
    ? await prisma.dataSource.findUnique({
        where: { id: dataSourceId },
      })
    : null;

  const tokensUsed = Math.floor(8000 + Math.random() * 12000);
  const costUsd = Number((tokensUsed * 0.00002).toFixed(2));

  const run = await prisma.agentRun.create({
    data: {
      agentId: agent.id,
      dataSourceId: dataSource?.id,
      input: `Run ${agent.name} on ${dataSource?.name ?? "demo data"}`,
      output: `${agent.name} processed ${
        dataSource?.name ?? "demo data"
      } successfully.`,
      summary: `${agent.name} analyzed ${
        dataSource?.name ?? "demo data"
      }, generated insights, and saved an audit trail.`,
      tokensUsed,
      costUsd,
      status: "completed",
    },
  });

  await prisma.agent.update({
    where: { id: agent.id },
    data: {
      lastRunAt: new Date(),
      estimatedMonthlyCost: agent.estimatedMonthlyCost + costUsd,
    },
  });

  await prisma.auditLog.create({
    data: {
      companyId: agent.companyId,
      agentId: agent.id,
      action: "AGENT_RUN_COMPLETED",
      message: `${agent.name} ran on ${
        dataSource?.name ?? "demo data"
      }. Tokens: ${tokensUsed}. Cost: $${costUsd}.`,
      riskLevel: agent.riskLevel,
      metadata: {
        runId: run.id,
        dataSourceId: dataSource?.id ?? null,
        tokensUsed,
        costUsd,
      },
    },
  });

  if (agent.approvalRequired && agent.riskLevel !== "LOW") {
    await prisma.approval.create({
      data: {
        companyId: agent.companyId,
        agentId: agent.id,
        runId: run.id,
        title: `Review output from ${agent.name}`,
        description: `${agent.name} processed ${
          dataSource?.name ?? "demo data"
        } and requires human review due to ${agent.riskLevel} risk level.`,
        actionType: "REVIEW_AGENT_OUTPUT",
        riskLevel: agent.riskLevel,
        status: "PENDING",
        requestedBy: agent.name,
      },
    });
  }

  revalidatePath(`/agents/${agent.id}`);
  revalidatePath("/agents");
  revalidatePath("/dashboard");
  revalidatePath("/approvals");
  revalidatePath("/logs");

  redirect(`/agents/${agent.id}`);
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await checkAgentsAccess();

  const { id } = await params;

  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      company: true,
      owner: true,
      runs: {
        include: { dataSource: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!agent) {
    notFound();
  }

  const dataSources = await prisma.dataSource.findMany({
    where: {
      companyId: agent.companyId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const tools = jsonToArray(agent.toolsAllowed);
  const dataAccess = jsonToArray(agent.dataAccess);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Link href="/agents" className="text-sm font-medium text-cyan-400">
          ← Back to Agents
        </Link>

        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold">{agent.name}</h1>
              {badge(agent.status)}
              {badge(agent.riskLevel)}
            </div>

            <p className="mt-3 max-w-3xl text-slate-400">
              {agent.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <form action={runDemoAgent} className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="agentId" value={agent.id} />

              <select
                name="dataSourceId"
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white"
                defaultValue=""
              >
                <option value="">Demo Data</option>

                {dataSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>

              <button className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
                Run Agent
              </button>
            </form>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-3 text-right">
              <p className="text-sm text-slate-400">Workspace</p>
              <p className="font-semibold">{agent.company.name}</p>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <Bot className="h-6 w-6 text-cyan-400" />
            <p className="mt-4 text-sm text-slate-400">Department</p>
            <p className="mt-1 text-xl font-bold">{agent.department}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <ShieldAlert className="h-6 w-6 text-red-400" />
            <p className="mt-4 text-sm text-slate-400">Risk Score</p>
            <p className="mt-1 text-3xl font-bold">{agent.riskScore}/100</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <Activity className="h-6 w-6 text-green-400" />
            <p className="mt-4 text-sm text-slate-400">Runs</p>
            <p className="mt-1 text-3xl font-bold">{agent.runs.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Owner</p>
            <p className="mt-1 text-xl font-bold">{agent.owner.name}</p>
            <p className="mt-2 text-sm text-slate-500">
              Approval: {agent.approvalRequired ? "Required" : "Not Required"}
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">Agent Instructions</h2>
          <p className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-7 text-slate-300">
            {agent.instructions}
          </p>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-cyan-400" />
              <h2 className="text-lg font-semibold">Allowed Tools</h2>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {tools.map((tool) => (
                <span
                  key={tool}
                  className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300"
                >
                  {tool}
                </span>
              ))}

              {tools.length === 0 && (
                <p className="text-sm text-slate-500">No tools selected.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-cyan-400" />
              <h2 className="text-lg font-semibold">Data Access</h2>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {dataAccess.map((source) => (
                <span
                  key={source}
                  className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300"
                >
                  {source}
                </span>
              ))}

              {dataAccess.length === 0 && (
                <p className="text-sm text-slate-500">No data access selected.</p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">Recent Runs</h2>

          <div className="mt-4 space-y-3">
            {agent.runs.length === 0 && (
              <p className="text-sm text-slate-400">
                No runs for this agent yet.
              </p>
            )}

            {agent.runs.map((run) => (
              <div
                key={run.id}
                className="rounded-xl border border-slate-800 bg-slate-950 p-4"
              >
                <p className="text-sm font-semibold">
                  {run.dataSource?.name ?? "Demo Data"}
                </p>
                <p className="mt-2 text-sm text-slate-400">{run.summary}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Tokens: {run.tokensUsed.toLocaleString()} • Cost: $
                  {run.costUsd.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">Recent Activity</h2>

          <div className="mt-4 space-y-3">
            {agent.auditLogs.length === 0 && (
              <p className="text-sm text-slate-400">
                No activity logs for this agent yet.
              </p>
            )}

            {agent.auditLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-slate-800 bg-slate-950 p-4"
              >
                <p className="text-sm font-semibold">{log.action}</p>
                <p className="mt-2 text-sm text-slate-400">{log.message}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}