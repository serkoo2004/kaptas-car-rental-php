import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/validations/auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    maxAge: 30 * 24 * 60 * 60,
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          select: {
            email: true,
            failedLoginCount: true,
            id: true,
            lockedUntil: true,
            name: true,
            passwordHash: true,
            role: true,
            status: true,
          },
          where: { email: parsed.data.email },
        });

        if (
          !user?.passwordHash ||
          user.status !== "ACTIVE" ||
          (user.lockedUntil && user.lockedUntil > new Date())
        ) {
          return null;
        }

        const isValid = await verifyPassword(
          parsed.data.password,
          user.passwordHash,
        );

        if (!isValid) {
          const failedLoginCount = user.failedLoginCount + 1;

          await prisma.user.update({
            data: {
              failedLoginCount,
              lockedUntil:
                failedLoginCount >= 5
                  ? new Date(Date.now() + 15 * 60 * 1000)
                  : null,
            },
            where: { id: user.id },
          });

          return null;
        }

        await prisma.user.update({
          data: {
            failedLoginCount: 0,
            lastLoginAt: new Date(),
            lockedUntil: null,
          },
          where: { id: user.id },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
    ...(process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET
      ? [
          AppleProvider({
            clientId: process.env.AUTH_APPLE_ID,
            clientSecret: process.env.AUTH_APPLE_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const dbUser = await (user?.email
        ? prisma.user.findUnique({
            select: { email: true, id: true, name: true, role: true, status: true },
            where: { email: user.email },
          })
        : token.userId
          ? prisma.user.findUnique({
              select: { email: true, id: true, name: true, role: true, status: true },
              where: { id: token.userId as string },
            })
          : Promise.resolve(null)
      ).catch(() => null);

      if (dbUser) {
        token.email = dbUser.email;
        token.name = dbUser.name;
        token.role = dbUser?.role;
        token.status = dbUser?.status;
        token.userId = dbUser.id;
      } else if (token.userId) {
        token.email = undefined;
        token.name = undefined;
        token.role = undefined;
        token.status = "SUSPENDED";
      } else if (user) {
        token.userId = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email ?? session.user.email;
        session.user.name = token.name ?? session.user.name;
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
        session.user.status = token.status as string;
      }

      return session;
    },
  },
};
