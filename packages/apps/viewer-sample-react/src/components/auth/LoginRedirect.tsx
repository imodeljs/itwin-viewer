/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { FrontendRequestContext } from "@bentley/imodeljs-frontend";
import React, { useEffect, useState } from "react";
import { Redirect } from "react-router-dom";

import {
  AuthorizationClient,
  AuthType,
  AuthTypeKey,
  oidcClient,
  RedirectKey,
} from "../../services/auth";

export const LoginRedirect = () => {
  const [isAuthVerified, setIsAuthVerified] = useState(false);
  const [redirectPath, setRedirectPath] = useState("/");

  const displayMessage = "Validating login...";

  useEffect(() => {
    if (sessionStorage.getItem(AuthTypeKey) === AuthType.OIDC) {
      oidcClient
        .getUserManager()
        .signinRedirectCallback()
        .then(() => {
          setRedirectPath(sessionStorage.getItem(RedirectKey) ?? "/");
          setIsAuthVerified(true);
        })
        .catch((error) => {
          console.error(error);
        });
    } else if (sessionStorage.getItem(AuthTypeKey) === AuthType.IMODELJS) {
      AuthorizationClient.initializeOidc()
        .then(() => {
          AuthorizationClient.oidcClient
            .signInSilent(new FrontendRequestContext())
            .then(() => {
              setRedirectPath(sessionStorage.getItem(RedirectKey) ?? "/");
              setIsAuthVerified(true);
            })
            .catch((error) => {
              console.error(error);
            });
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, []);

  return (
    <div>
      {isAuthVerified ? (
        <Redirect to={redirectPath} />
      ) : (
        <p>{displayMessage}</p>
      )}
    </div>
  );
};
