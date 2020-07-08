/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import {
  BrowserAuthorizationCallbackHandler,
  BrowserAuthorizationClient,
  BrowserAuthorizationClientConfiguration,
} from "@bentley/frontend-authorization-client";
import { FrontendRequestContext } from "@bentley/imodeljs-frontend";

class MockAuthorizationClient {
  private static _oidcClient: BrowserAuthorizationClient;

  public static get oidcClient(): BrowserAuthorizationClient {
    return this._oidcClient;
  }

  public static async initialize() {
    const scope =
      "openid email profile organization imodelhub context-registry-service:read-only product-settings-service general-purpose-imodeljs-backend imodeljs-router";
    const clientId = "imodeljs-spa-samples-2686";
    const redirectUri = "http://localhost:3000/signin-callback";
    const postSignoutRedirectUri = "http://localhost:3000/logout";
    const authority = "https://qa-imsoidc.bentley.com";

    const oidcConfiguration: BrowserAuthorizationClientConfiguration = {
      clientId,
      redirectUri,
      postSignoutRedirectUri,
      scope,
      responseType: "code",
      authority,
    };
    await BrowserAuthorizationCallbackHandler.handleSigninCallback(
      oidcConfiguration.redirectUri
    );
    this._oidcClient = new BrowserAuthorizationClient(oidcConfiguration);
  }

  public static async signIn() {
    await this.oidcClient.signIn(new FrontendRequestContext());
  }

  public static async signOut() {
    await this.oidcClient.signOut(new FrontendRequestContext());
  }
}

export default MockAuthorizationClient;
