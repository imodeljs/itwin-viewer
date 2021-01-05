import {
  BrowserAuthorizationCallbackHandler,
  BrowserAuthorizationClient,
  BrowserAuthorizationClientConfiguration,
} from "@bentley/frontend-authorization-client";
import { FrontendRequestContext } from "@bentley/imodeljs-frontend";

class AuthorizationClient {
  private static _oidcClient: BrowserAuthorizationClient;

  public static get oidcClient(): BrowserAuthorizationClient {
    return this._oidcClient;
  }

  public static async initializeOidc(): Promise<void> {
    if (this._oidcClient) {
      return;
    }

    const scope = process.env.IMJS_AUTH_CLIENT_SCOPES ?? "";
    const clientId = process.env.IMJS_AUTH_CLIENT_CLIENT_ID ?? "";
    const redirectUri = process.env.IMJS_AUTH_CLIENT_REDIRECT_URI ?? "";
    const postSignoutRedirectUri = process.env.IMJS_AUTH_CLIENT_LOGOUT_URI;

    // authority is optional and will default to Production IMS
    const oidcConfiguration: BrowserAuthorizationClientConfiguration = {
      clientId,
      redirectUri,
      postSignoutRedirectUri,
      scope,
      responseType: "code",
    };

    await BrowserAuthorizationCallbackHandler.handleSigninCallback(
      oidcConfiguration.redirectUri
    );

    this._oidcClient = new BrowserAuthorizationClient(oidcConfiguration);
  }

  public static async signIn(): Promise<void> {
    await this.oidcClient.signIn(new FrontendRequestContext());
  }

  public static async signInSilent(): Promise<void> {
    await this.oidcClient.signInSilent(new FrontendRequestContext());
  }

  public static async signOut(): Promise<void> {
    await this.oidcClient.signOut(new FrontendRequestContext());
  }
}

export default AuthorizationClient;
