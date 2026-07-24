import { prisma } from "@/lib/db/prisma";
import type { User } from "@/app/generated/prisma/client";

export type CreateUserInput = {
  name: string;
  email: string;
  passwordHash: string;
};

export const userRepository = {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  async create(data: CreateUserInput): Promise<User> {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
      },
    });
  },
};
