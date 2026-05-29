import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Activity, Bot, Database, DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RunsPage() {
  const runs = await prisma.agentRun.findMany({
    include: {
      agent: true,
      dataSource: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalRuns = runs.length;
  const totalTokens = runs.reduce((sum, run) => sum + run.tokensUsed, 0);
  const totalCost = runs.reduce((sum, run) => sum + run.costUsd, 0);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <p className="text-sm font-medium text-cyan-400">AgentOps360</p>
        <h1 className="mt-2 text-3xl font-bold">Agent Runs</h1>
        <p className="mt-2 text-slate-400">
          AI agents ne recently kya tasks run kiye, kis data source par, aur
          kitna cost/tokens use hua.
        </p>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <Activity className="h-6 w-6 text-cyan-400" />
            <p className="mt-4 text-sm text-slate-400">Total Runs</p>
            <p className="mt-1 text-3xl font-bold">{totalRuns}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <Bot className="h-6 w-6 text-green-400" />
            <p className="mt-4 text-sm text-slate-400">Tokens Used</p>
            <p className="mt-1 text-3xl font-bold">
              {totalTokens.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <DollarSign className="h-6 w-6 text-emerald-400" />
            <p className="mt-4 text-sm text-slate-400">Run Cost</p>
            <p className="mt-1 text-3xl font-bold">${totalCost.toFixed(2)}</p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-5">
            <h2 className="text-lg font-semibold">Run History</h2>
            <p className="mt-1 text-sm text-slate-400">
              Har agent run ka full record.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="px-5 py-4">Agent</th>
                  <th className="px-5 py-4">Data Source</th>
                  <th className="px-5 py-4">Summary</th>
                  <th className="px-5 py-4">Tokens</th>
                  <th className="px-5 py-4">Cost</th>
                  <th className="px-5 py-4">Time</th>
                </tr>
              </thead>

              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-b border-slate-800">
                    <td className="px-5 py-4">
                      <Link
                        href={`/agents/${run.agent.id}`}
                        className="font-medium text-cyan-400 hover:text-cyan-300"
                      >
                        {run.agent.name}
                      </Link>
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-slate-500" />
                        {run.dataSource?.name ?? "Demo Data"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="max-w-xl text-slate-300">{run.summary}</p>
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {run.tokensUsed.toLocaleString()}
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      ${run.costUsd.toFixed(2)}
                    </td>

                    <td className="px-5 py-4 text-slate-400">
                      {run.createdAt.toLocaleString()}
                    </td>
                  </tr>
                ))}

                {runs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-slate-400">
                      No agent runs yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}