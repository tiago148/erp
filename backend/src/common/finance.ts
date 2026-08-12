import { PrismaService } from '../prisma/prisma.service';

export async function getOrCreateCategory(
  prisma: PrismaService,
  name: string,
  type: 'INCOME' | 'EXPENSE',
) {
  const existing = await prisma.client.financeCategory.findFirst({
    where: { name, type },
  });
  if (existing) return existing;
  return prisma.client.financeCategory.create({ data: { name, type } });
}
