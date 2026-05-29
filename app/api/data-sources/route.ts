import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const company = await prisma.company.findFirst();

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    const dataSource = await prisma.dataSource.create({
      data: {
        name: body.name,
        type: "CSV",
        companyId: company.id,
        description: body.description,
        rowCount: body.rowCount,
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId: company.id,
        agentId: null,
        action: "DATA_SOURCE_UPLOADED",
        message: `${dataSource.name} CSV data source was uploaded.`,
        riskLevel: "LOW",
        metadata: {
          rowCount: dataSource.rowCount,
          columns: body.columns,
        },
      },
    });

    return NextResponse.json({ dataSource });
  } catch {
    return NextResponse.json(
      { error: "Failed to create data source" },
      { status: 500 }
    );
  }
}
export async function GET() {
  try {
    const company = await prisma.company.findFirst();

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    const dataSources = await prisma.dataSource.findMany({
      where: {
        companyId: company.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ dataSources });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch data sources" },
      { status: 500 }
    );
  }
}