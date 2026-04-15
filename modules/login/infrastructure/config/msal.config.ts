import { PublicClientApplication, type Configuration } from '@azure/msal-browser';

const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_CLIENT_ID ?? '',
    authority: process.env.NEXT_PUBLIC_AUTHORITY ?? `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_TENANT_ID}`,
    redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI ?? '/validate_token',
    postLogoutRedirectUri: '/login',
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const LOGIN_SCOPES = ['User.Read', 'GroupMember.Read.All'];
