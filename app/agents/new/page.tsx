import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { Bot, PlusCircle, ShieldAlert } from "lucide-react";
import { RiskLevel } from "@prisma/client";

export const dynamic = "force-dynamic";

async function checkAgentsAccess() {
  const cookieStore = await cookies();
  const isVerified =
    cookieStore.get("agentops_agents_pin")?.value === "verified";

  if (!isVerified) {
    redirect("/agents/security");
  }
}

function calculateRiskScore({
  tools,
  dataAccess,
  approvalRequired,
}: {
  tools: string[];
  dataAccess: string[];
  approvalRequired: boolean;
}) {
  let score = 20;

  if (dataAccess.includes("Customer Complaints")) score += 15;
  if (dataAccess.includes("Support Tickets")) score += 10;
  if (dataAccess.includes("Orders")) score += 20;
  if (dataAccess.includes("Refund Requests")) score += 25;
  if (dataAccess.includes("Sales Data")) score += 8;
  if (dataAccess.includes("Inventory Data")) score += 5;

  if (tools.includes("Read Tickets")) score += 5;
  if (tools.includes("Create Summary")) score += 5;
  if (tools.includes("Analyze Refunds")) score += 15;
  if (tools.includes("Request Approval")) score += 8;
  if (tools.includes("Send Email Draft")) score += 15;
  if (tools.includes("Update Orders")) score += 25;
  if (tools.includes("Approve Refund")) score += 35;

  if (!approvalRequired) score += 20;
  if (approvalRequired) score -= 10;

  return Math.max(0, Math.min(score, 100));
}

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 70) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

async function createAgent(formData: FormData) {
  "use server";

  await checkAgentsAccess();

  const company = await prisma.company.findFirst({
    include: {
      users: true,
    },
  });

  if (!company || company.users.length === 0) {
    throw new Error("Company or admin user not found.");
  }

  const owner = company.users[0];

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const instructions = String(formData.get("instructions") ?? "").trim();
  const monthlyCostLimit = Number(formData.get("monthlyCostLimit") ?? 50);

  const tools = formData.getAll("tools").map(String);
  const dataAccess = formData.getAll("dataAccess").map(String);
  const approvalRequired = formData.get("approvalRequired") === "on";

  if (!name || !description || !department || !instructions) {
    throw new Error("Required fields are missing.");
  }

  const riskScore = calculateRiskScore({
    tools,
    dataAccess,
    approvalRequired,
  });

  const riskLevel = riskLevelFromScore(riskScore);

  const agent = await prisma.agent.create({
    data: {
      name,
      description,
      department,
      instructions,
      ownerId: owner.id,
      companyId: company.id,
      status: "ACTIVE",
      riskScore,
      riskLevel,
      toolsAllowed: tools,
      dataAccess,
      approvalRequired,
      monthlyCostLimit: Number.isNaN(monthlyCostLimit) ? 50 : monthlyCostLimit,
      estimatedMonthlyCost: 0,
    },
  });

  await prisma.auditLog.create({
    data: {
      companyId: company.id,
      agentId: agent.id,
      action: "AGENT_CREATED",
      message: `${agent.name} was created from Agent Builder.`,
      riskLevel: agent.riskLevel,
      metadata: {
        source: "agent_builder",
        toolsAllowed: tools,
        dataAccess,
        approvalRequired,
        riskScore,
      },
    },
  });

  revalidatePath("/agents");
  revalidatePath("/dashboard");
  revalidatePath("/logs");

  redirect("/agents");
}

export default async function NewAgentPage() {
  await checkAgentsAccess();

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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link href="/agents" className="text-sm font-medium text-cyan-400">
              ← Back to Agents
            </Link>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Agent Builder
            </h1>

            <p className="mt-2 text-slate-400">
              Yahan company ke liye naya AI software worker create hoga. System
              uski permissions, data access aur risk score calculate karega.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-3 text-right">
            <p className="text-sm text-slate-400">Workspace</p>
            <p className="font-semibold">{company.name}</p>
          </div>
        </div>

        <form action={createAgent} className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400 text-slate-950">
                <Bot className="h-6 w-6" />
              </div>

              <div>
                <h2 className="text-lg font-semibold">Basic Agent Details</h2>
                <p className="text-sm text-slate-400">
                  Agent ka naam, department aur kaam define karo.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-300">
                  Agent Name
                </label>
                <input
                  name="name"
                  placeholder="Example: Customer Reply Draft Agent"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300">
                  Department
                </label>
                <input
                  name="department"
                  placeholder="Example: Customer Support"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300">
                  Description
                </label>
                <textarea
                  name="description"
                  placeholder="Yeh agent business mein kya kaam karega?"
                  className="mt-2 min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300">
                  Instructions
                </label>
                <textarea
                  name="instructions"
                  placeholder="Example: Customer tickets read karo, urgent cases identify karo, aur reply draft banao. Direct email send na karo."
                  className="mt-2 min-h-36 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300">
                  Monthly Cost Limit
                </label>
                <input
                  name="monthlyCostLimit"
                  type="number"
                  defaultValue={100}
                  min={0}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="font-semibold">Allowed Tools</h2>
              <p className="mt-1 text-sm text-slate-400">
                Agent ko kaunse tools use karne ki permission hogi?
              </p>

              <div className="mt-4 space-y-3 text-sm">
                {[
                  "Read Tickets",
                  "Create Summary",
                  "Analyze Refunds",
                  "Request Approval",
                  "Send Email Draft",
                  "Update Orders",
                  "Approve Refund",
                ].map((tool) => (
                  <label
                    key={tool}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3"
                  >
                    <input
                      type="checkbox"
                      name="tools"
                      value={tool}
                      className="h-4 w-4"
                    />
                    <span>{tool}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="font-semibold">Data Access</h2>
              <p className="mt-1 text-sm text-slate-400">
                Agent kis data ko read kar sakta hai?
              </p>

              <div className="mt-4 space-y-3 text-sm">
                {[
                  "Customer Complaints",
                  "Support Tickets",
                  "Orders",
                  "Refund Requests",
                  "Sales Data",
                  "Inventory Data",
                ].map((source) => (
                  <label
                    key={source}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3"
                  >
                    <input
                      type="checkbox"
                      name="dataAccess"
                      value={source}
                      className="h-4 w-4"
                    />
                    <span>{source}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-1 h-5 w-5 text-yellow-400" />
                <div>
                  <h2 className="font-semibold">Governance Rule</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Sensitive actions ke liye human approval require karo.
                  </p>
                </div>
              </div>

              <label className="mt-4 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  name="approvalRequired"
                  defaultChecked
                  className="h-4 w-4"
                />
                <span>Require human approval</span>
              </label>

              <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
                <PlusCircle className="h-4 w-4" />
                Create AI Agent
              </button>
            </div>
          </section>
        </form>
      </div>
    </main>
  );
}