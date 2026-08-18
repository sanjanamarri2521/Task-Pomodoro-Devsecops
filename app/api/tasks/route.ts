import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  const tasks = await prisma.task.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const { title } = await request.json();
  const task = await prisma.task.create({ data: { title } });
  return NextResponse.json(task);
}