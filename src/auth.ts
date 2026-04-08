import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { Adapter } from "@auth/core/adapters";
import { prisma } from "@/lib/prisma";

const prismaAdapter: Adapter = {
  async getUser(id) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return { id: user.id, email: user.email, emailVerified: null, name: user.name ?? null, image: null };
  },
  async getUserByEmail(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return { id: user.id, email: user.email, emailVerified: null, name: user.name ?? null, image: null };
  },
  async createSession(data) {
    const session = await prisma.session.create({
      data: {
        sessionToken: data.sessionToken,
        userId: data.userId,
        expires: data.expires,
      },
    });
    return { sessionToken: session.sessionToken, userId: session.userId, expires: session.expires };
  },
  async getSessionAndUser(sessionToken) {
    const result = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });
    if (!result) return null;
    const { user, ...session } = result;
    return {
      session: { sessionToken: session.sessionToken, userId: session.userId, expires: session.expires },
      user: { id: user.id, email: user.email, emailVerified: null, name: user.name ?? null, image: null },
    };
  },
  async updateSession(data) {
    const session = await prisma.session.update({
      where: { sessionToken: data.sessionToken },
      data: { expires: data.expires },
    });
    return { sessionToken: session.sessionToken, userId: session.userId, expires: session.expires };
  },
  async deleteSession(sessionToken) {
    await prisma.session.delete({ where: { sessionToken } });
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: prismaAdapter,
  session: { strategy: "database", maxAge: 24 * 60 * 60 },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user) return null;
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    authorized({ auth: session }) {
      return !!session?.user;
    },
  },
} satisfies NextAuthConfig);
