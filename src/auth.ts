import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { findUserByEmail, findUserById } from "@/db/queries";

const configuredSecret = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
if (process.env.VERCEL === "1" && !configuredSecret) {
  throw new Error("AUTH_SECRET must be configured for the deployed app.");
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: configuredSecret || "still-dev-auth-secret",
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;
        try {
          const user = await findUserByEmail(email);
          if (!user) return null;
          const ok = await compare(password, user.passwordHash);
          if (!ok) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            emailConfirmed: Boolean(user.emailVerifiedAt),
            sessionVersion: user.sessionVersion,
          };
        } catch (error) {
          console.error("[auth] credential lookup failed", error);
          return null;
        }
      },
    }),
  ],
  logger: {
    error(error) {
      // Invalid credentials are an expected user-facing outcome. Database and
      // configuration failures are logged by authorize with their context.
      if (String(error) === "CredentialsSignin" || (error as { type?: string })?.type === "CredentialsSignin") return;
      console.error("[auth]", error);
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        const current = await findUserById(user.id);
        token.sub = user.id;
        token.sessionVersion = current?.sessionVersion ?? 0;
        token.emailConfirmed = Boolean(current?.emailVerifiedAt);
      } else if (token.sub) {
        const current = await findUserById(token.sub);
        if (!current || current.sessionVersion !== (token.sessionVersion ?? 0)) return {};
        token.email = current.email;
        token.name = current.name;
        token.emailConfirmed = Boolean(current.emailVerifiedAt);
      }
      if (user?.email) token.email = user.email;
      if (user?.name) token.name = user.name;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.email = token.email ?? session.user.email;
        session.user.name = token.name ?? session.user.name;
        session.user.emailConfirmed = Boolean(token.emailConfirmed);
      }
      return session;
    },
  },
});
