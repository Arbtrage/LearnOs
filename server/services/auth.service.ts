import bcrypt from "bcryptjs";
import { userRepository } from "@/server/repositories/user.repository";

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export class AuthService {
  static async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new Error("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    return userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });
  }

  static async validateCredentials(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user?.passwordHash) {
      return null;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return null;
    }

    return user;
  }
}
