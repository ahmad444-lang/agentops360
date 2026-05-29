import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.agentRun.deleteMany();
  await prisma.dataSource.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const company = await prisma.company.create({
    data: {
      name: "PakMart E-commerce",
      industry: "E-commerce / Customer Support",
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: "Ahmad Razza",
      email: "admin@agentops360.com",
      role: "Admin",
      companyId: company.id,
    },
  });

  const ticketAgent = await prisma.agent.create({
    data: {
      name: "Ticket Triage Agent",
      description:
        "Classifies customer complaints into urgent, refund, delivery, billing, and normal support categories.",
      department: "Customer Support",
      ownerId: admin.id,
      companyId: company.id,
      status: "ACTIVE",
      riskLevel: "MEDIUM",
      riskScore: 62,
      instructions:
        "Read customer complaints, classify issue type, detect urgency, and create a manager summary.",
      toolsAllowed: ["Read Tickets", "Create Summary", "Tag Priority"],
      dataAccess: ["Customer Complaints CSV", "Support Tickets"],
      approvalRequired: true,
      monthlyCostLimit: 100,
      estimatedMonthlyCost: 28.5,
      lastRunAt: new Date(),
    },
  });

  const refundAgent = await prisma.agent.create({
    data: {
      name: "Refund Review Agent",
      description:
        "Detects refund requests and prepares approval recommendations for managers.",
      department: "Operations",
      ownerId: admin.id,
      companyId: company.id,
      status: "ACTIVE",
      riskLevel: "HIGH",
      riskScore: 86,
      instructions:
        "Review refund-related complaints and prepare refund approval requests. Never approve refunds directly.",
      toolsAllowed: ["Read Orders", "Analyze Refunds", "Request Approval"],
      dataAccess: ["Orders", "Refund Requests", "Customer Complaints"],
      approvalRequired: true,
      monthlyCostLimit: 150,
      estimatedMonthlyCost: 42.2,
      lastRunAt: new Date(),
    },
  });

  const salesAgent = await prisma.agent.create({
    data: {
      name: "Sales Report Agent",
      description:
        "Generates daily and weekly sales summaries for business managers.",
      department: "Sales",
      ownerId: admin.id,
      companyId: company.id,
      status: "ACTIVE",
      riskLevel: "LOW",
      riskScore: 34,
      instructions:
        "Analyze sales data and generate daily sales summary with top products and revenue trends.",
      toolsAllowed: ["Read Sales Data", "Generate Report"],
      dataAccess: ["Sales CSV", "Product Data"],
      approvalRequired: false,
      monthlyCostLimit: 80,
      estimatedMonthlyCost: 15.9,
      lastRunAt: new Date(),
    },
  });

  const inventoryAgent = await prisma.agent.create({
    data: {
      name: "Inventory Alert Agent",
      description:
        "Monitors stock levels and alerts managers about low inventory products.",
      department: "Inventory",
      ownerId: admin.id,
      companyId: company.id,
      status: "PAUSED",
      riskLevel: "LOW",
      riskScore: 29,
      instructions:
        "Check inventory data and report products that are close to out-of-stock.",
      toolsAllowed: ["Read Inventory", "Create Alert"],
      dataAccess: ["Inventory CSV"],
      approvalRequired: false,
      monthlyCostLimit: 60,
      estimatedMonthlyCost: 9.4,
      lastRunAt: new Date(),
    },
  });

  const qaAgent = await prisma.agent.create({
    data: {
      name: "Support QA Agent",
      description:
        "Reviews support replies and flags risky, rude, incomplete, or policy-breaking responses.",
      department: "Quality Assurance",
      ownerId: admin.id,
      companyId: company.id,
      status: "ACTIVE",
      riskLevel: "MEDIUM",
      riskScore: 58,
      instructions:
        "Review support replies and score them for tone, quality, accuracy, and policy compliance.",
      toolsAllowed: ["Read Support Replies", "Score Quality", "Flag Risk"],
      dataAccess: ["Support Replies", "Customer Tickets"],
      approvalRequired: true,
      monthlyCostLimit: 120,
      estimatedMonthlyCost: 31.7,
      lastRunAt: new Date(),
    },
  });

  const complaintsSource = await prisma.dataSource.create({
    data: {
      name: "Customer Complaints Dataset",
      type: "MOCK",
      companyId: company.id,
      description: "Mock customer complaints for PakMart demo.",
      rowCount: 120,
    },
  });

  const salesSource = await prisma.dataSource.create({
    data: {
      name: "Sales Dataset",
      type: "MOCK",
      companyId: company.id,
      description: "Mock daily sales records for PakMart demo.",
      rowCount: 450,
    },
  });

  const ticketRun = await prisma.agentRun.create({
    data: {
      agentId: ticketAgent.id,
      dataSourceId: complaintsSource.id,
      input: "Analyze last 120 customer complaints.",
      output:
        "Found 120 complaints. 31 delivery delays, 18 refund requests, 11 billing issues, and 8 urgent complaints.",
      summary:
        "Most complaints are related to delivery delays. Lahore and Karachi have the highest issue volume.",
      tokensUsed: 18450,
      costUsd: 0.42,
      status: "completed",
    },
  });

  await prisma.agentRun.create({
    data: {
      agentId: salesAgent.id,
      dataSourceId: salesSource.id,
      input: "Generate daily sales report.",
      output:
        "Total sales: $8,420. Top products: Wireless Earbuds, Smart Watch, Phone Case.",
      summary:
        "Daily sales are healthy, but electronics conversion dropped compared to previous day.",
      tokensUsed: 9200,
      costUsd: 0.18,
      status: "completed",
    },
  });

  await prisma.approval.createMany({
    data: [
      {
        companyId: company.id,
        agentId: refundAgent.id,
        title: "Approve refund for Order #PKM-1024",
        description:
          "Refund Review Agent recommends refund approval because the customer received a damaged product.",
        actionType: "REFUND_APPROVAL",
        riskLevel: "HIGH",
        status: "PENDING",
        requestedBy: "Refund Review Agent",
      },
      {
        companyId: company.id,
        agentId: ticketAgent.id,
        runId: ticketRun.id,
        title: "Escalate urgent complaint batch",
        description:
          "Ticket Triage Agent found 8 urgent complaints that should be escalated to the support manager.",
        actionType: "ESCALATE_TICKETS",
        riskLevel: "MEDIUM",
        status: "PENDING",
        requestedBy: "Ticket Triage Agent",
      },
      {
        companyId: company.id,
        agentId: refundAgent.id,
        title: "Reject refund for Order #PKM-0991",
        description:
          "Refund request does not meet policy. Customer submitted claim after allowed return window.",
        actionType: "REFUND_REJECTION",
        riskLevel: "MEDIUM",
        status: "APPROVED",
        requestedBy: "Refund Review Agent",
        reviewedBy: "Ahmad Razza",
        reviewedAt: new Date(),
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        companyId: company.id,
        agentId: ticketAgent.id,
        action: "AGENT_RUN_COMPLETED",
        message:
          "Ticket Triage Agent analyzed 120 customer complaints and generated support summary.",
        riskLevel: "MEDIUM",
        metadata: { rowsProcessed: 120 },
      },
      {
        companyId: company.id,
        agentId: refundAgent.id,
        action: "APPROVAL_REQUESTED",
        message:
          "Refund Review Agent requested manager approval for Order #PKM-1024.",
        riskLevel: "HIGH",
        metadata: { orderId: "PKM-1024" },
      },
      {
        companyId: company.id,
        agentId: salesAgent.id,
        action: "AGENT_RUN_COMPLETED",
        message:
          "Sales Report Agent generated daily sales report from sales dataset.",
        riskLevel: "LOW",
        metadata: { revenue: 8420 },
      },
      {
        companyId: company.id,
        agentId: inventoryAgent.id,
        action: "AGENT_PAUSED",
        message:
          "Inventory Alert Agent was paused by admin due to temporary data source maintenance.",
        riskLevel: "LOW",
        metadata: { reason: "Data source maintenance" },
      },
      {
        companyId: company.id,
        agentId: qaAgent.id,
        action: "AGENT_CREATED",
        message:
          "Support QA Agent was created for monitoring customer support reply quality.",
        riskLevel: "MEDIUM",
        metadata: { department: "Quality Assurance" },
      },
    ],
  });

  console.log("Seed completed successfully.");
  console.log({
    company: company.name,
    admin: admin.email,
    agents: 5,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });