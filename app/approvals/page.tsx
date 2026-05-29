import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  XCircle,
  ShieldAlert,
  ClipboardCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

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

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

async function approveRequest(formData: FormData) {
  "use server";

  const approvalId = String(formData.get("approvalId"));

  const approval = await prisma.approval.update({
    where: { id: approvalId },
    data: {
      status: "APPROVED",
      reviewedBy: "Ahmad Razza",
      reviewedAt: new Date(),
    },
    include: {
      agent: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      companyId: approval.companyId,
      agentId: approval.agentId,
      action: "APPROVAL_APPROVED",
      message: `${approval.title} was approved by admin.`,
      riskLevel: approval.riskLevel,
      metadata: {
        approvalId: approval.id,
        agentName: approval.agent.name,
        actionType: approval.actionType,
      },
    },
  });

  revalidatePath("/approvals");
  revalidatePath("/dashboard");
  revalidatePath("/agents");
}

async function rejectRequest(formData: FormData) {
  "use server";

  const approvalId = String(formData.get("approvalId"));

  const approval = await prisma.approval.update({
    where: { id: approvalId },
    data: {
      status: "REJECTED",
      reviewedBy: "Ahmad Razza",
      reviewedAt: new Date(),
    },
    include: {
      agent: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      companyId: approval.companyId,
      agentId: approval.agentId,
      action: "APPROVAL_REJECTED",
      message: `${approval.title} was rejected by admin.`,
      riskLevel: approval.riskLevel,
      metadata: {
        approvalId: approval.id,
        agentName: approval.agent.name,
        actionType: approval.actionType,
      },
    },
  });

  revalidatePath("/approvals");
  revalidatePath("/dashboard");
  revalidatePath("/agents");
}

export default async function ApprovalsPage() {
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

  const approvals = await prisma.approval.findMany({
    where: { companyId: company.id },
    include: {
      agent: true,
      run: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const pendingApprovals = approvals.filter(
    (approval) => approval.status === "PENDING"
  );

  const approvedApprovals = approvals.filter(
    (approval) => approval.status === "APPROVED"
  );

  const rejectedApprovals = approvals.filter(
    (approval) => approval.status === "REJECTED"
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link href="/dashboard" className="text-sm font-medium text-cyan-400">
              ← Back to Dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Human Approval Center
            </h1>
            <p className="mt-2 text-slate-400">
              Yahan risky AI agent actions ko approve ya reject kiya jata hai.
              AI direct sensitive action nahi leta.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-3 text-right">
            <p className="text-sm text-slate-400">Workspace</p>
            <p className="font-semibold">{company.name}</p>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <ClipboardCheck className="h-6 w-6 text-cyan-400" />
            <p className="mt-4 text-sm text-slate-400">Total Requests</p>
            <p className="mt-1 text-3xl font-bold">{approvals.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <Clock className="h-6 w-6 text-yellow-400" />
            <p className="mt-4 text-sm text-slate-400">Pending</p>
            <p className="mt-1 text-3xl font-bold">{pendingApprovals.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <CheckCircle2 className="h-6 w-6 text-green-400" />
            <p className="mt-4 text-sm text-slate-400">Approved</p>
            <p className="mt-1 text-3xl font-bold">{approvedApprovals.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <XCircle className="h-6 w-6 text-red-400" />
            <p className="mt-4 text-sm text-slate-400">Rejected</p>
            <p className="mt-1 text-3xl font-bold">{rejectedApprovals.length}</p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-5">
            <h2 className="text-lg font-semibold">Pending Approval Requests</h2>
            <p className="mt-1 text-sm text-slate-400">
              In requests par manager decision lega. Approve ya reject karne ke
              baad audit log save hoga.
            </p>
          </div>

          <div className="grid gap-4 p-5 lg:grid-cols-2">
            {pendingApprovals.length === 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-slate-400">
                No pending approvals right now.
              </div>
            )}

            {pendingApprovals.map((approval) => (
              <div
                key={approval.id}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{approval.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Requested by {approval.requestedBy}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {riskBadge(approval.riskLevel)}
                    {statusBadge(approval.status)}
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-400">
                  {approval.description}
                </p>

                <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-slate-500">AI Agent</p>
                    <p className="mt-1 font-medium">{approval.agent.name}</p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-slate-500">Action Type</p>
                    <p className="mt-1 font-medium">{approval.actionType}</p>
                  </div>
                </div>

               <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
  <form action={approveRequest}>
    <input type="hidden" name="approvalId" value={approval.id} />
    <button
      type="submit"
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-400 px-4 py-3 text-sm font-bold text-black hover:bg-green-300"
    >
      <CheckCircle2 className="h-4 w-4" />
      Approve Request
    </button>
  </form>

  <form action={rejectRequest}>
    <input type="hidden" name="approvalId" value={approval.id} />
    <button
      type="submit"
      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-red-400 bg-red-950 px-4 py-3 text-sm font-bold text-red-200 hover:bg-red-900"
    >
      <XCircle className="h-4 w-4" />
      Reject Request
    </button>
  </form>
</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-5">
            <h2 className="text-lg font-semibold">All Approval History</h2>
            <p className="mt-1 text-sm text-slate-400">
              Past aur current approval decisions ka full record.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="px-5 py-4">Request</th>
                  <th className="px-5 py-4">Agent</th>
                  <th className="px-5 py-4">Risk</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Reviewed By</th>
                  <th className="px-5 py-4">Created</th>
                </tr>
              </thead>

              <tbody>
                {approvals.map((approval) => (
                  <tr key={approval.id} className="border-b border-slate-800">
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{approval.title}</p>
                      <p className="mt-1 max-w-lg text-xs text-slate-400">
                        {approval.description}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {approval.agent.name}
                    </td>
                    <td className="px-5 py-4">{riskBadge(approval.riskLevel)}</td>
                    <td className="px-5 py-4">{statusBadge(approval.status)}</td>
                    <td className="px-5 py-4 text-slate-300">
                      {approval.reviewedBy ?? "Not reviewed"}
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {approval.createdAt.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-1 h-5 w-5 text-cyan-400" />
            <div>
              <h2 className="font-semibold">Why this matters</h2>
              <p className="mt-2 text-sm text-slate-400">
                Company AI agents ko free hand nahi deti. Sensitive actions
                jaise refund approval, customer escalation, ya risky decision
                pehle human manager ke paas aate hain. Is se company ke paas
                control, accountability aur audit proof hota hai.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}