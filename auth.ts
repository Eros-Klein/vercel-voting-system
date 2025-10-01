import NextAuth from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    KeycloakProvider({
      clientId: "htlleonding-service",
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || "not-needed-for-public-client",
      issuer: "https://auth.htl-leonding.ac.at/realms/htlleonding",
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.name = profile.name || profile.preferred_username;
        token.email = profile.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  trustHost: true
})

