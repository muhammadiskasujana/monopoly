import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertGoogleUser } from "@/lib/users";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  })],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/" },
  callbacks: {
    async signIn({ user, account }) {
      if (!account?.providerAccountId || !user.email) return false;
      await upsertGoogleUser({ ...user, id: account.providerAccountId });
      return true;
    },
    async jwt({ token, account }) {
      if (account?.providerAccountId) token.userId = account.providerAccountId;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = String(token.userId || token.sub || "");
      return session;
    },
  },
});
