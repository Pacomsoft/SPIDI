import NextAuth from 'next-auth';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';

export interface ISessionWithToken {
  accessToken?: string;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`,
      authorization: {
        params: {
          prompt: "login", // Force re-authentication
          scope: 'openid profile email offline_access .default',
        },
      },
    }),
  ],
  callbacks: {
    jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.userId = account.providerAccountId;
      }
      return token;
    },
    session({ session, token }) {
      (session as typeof session & ISessionWithToken).accessToken =
        (token.accessToken as string | undefined);
      if (session.user && 'id' in session.user) {
        session.user.id = `${token.userId ?? ''}`;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
});
