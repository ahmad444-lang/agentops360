import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const agent = await prisma.agent.findUnique({
      where: { id: body.agentId },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const dataSource = body.dataSourceId
      ? await prisma.dataSource.findUnique({
          where: { id: body.dataSourceId },
        })
      : null;

    const tokensUsed = Math.floor(8000 + Math.random() * 12000);
    const costUsd = Number((tokensUsed * 0.00002).toFixed(2));

    const run = await prisma.agentRun.create({
      data: {
        agentId: agent.id,
        dataSourceId: dataSource?.id,
        input: `Run ${agent.name} on ${dataSource?.name ?? "demo data"}`,
        output: `${agent.name} processed ${dataSource?.name ?? "demo data"} successfully.`,
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

    return NextResponse.json({ run });
  } catch {
    return NextResponse.json(
      { error: "Failed to run agent" },
      { status: 500 }
    );
  }
}