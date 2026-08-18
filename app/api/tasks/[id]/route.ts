import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { completed } = await request.json();
  const task = await prisma.task.update({
    where: { id },
    data: { completed },
  });
  return NextResponse.json(task);
}