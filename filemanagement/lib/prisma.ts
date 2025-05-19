import { PrismaClient } from '@/lib/generated/prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

let prismaInstance: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prismaInstance = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prismaInstance = global.prisma;
}

export const prisma = prismaInstance;