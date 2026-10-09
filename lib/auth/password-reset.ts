import { hashPassword } from "@/lib/auth/password";
import { hashPasswordResetToken } from "@/lib/auth/password-reset-token";
import { prisma } from "@/lib/db/prisma";

export async function completePasswordReset({
  email,
  password,
  token,
}: {
  email: string;
  password: string;
  token: string;
}) {
  const passwordHash = await hashPassword(password);
  const tokenHash = hashPasswordResetToken(token);

  return prisma.$transaction(async (transaction) => {
    const claimed = await transaction.verificationToken.deleteMany({
      where: {
        expires: { gte: new Date() },
        identifier: email,
        token: tokenHash,
      },
    });

    if (claimed.count !== 1) {
      return false;
    }

    await transaction.user.update({
      data: { passwordHash },
      where: { email },
    });

    return true;
  });
}
