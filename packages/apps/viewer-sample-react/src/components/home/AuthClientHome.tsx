/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { IModelApp } from "@bentley/imodeljs-frontend";
import {
  IModelBackend,
  IModelBackendHost,
  IModelBackendOptions,
  Viewer,
} from "@bentley/itwin-viewer-react";
import { ColorTheme } from "@bentley/ui-framework";
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router";

import { AuthorizationClient } from "../../services/auth";
import { Header } from "./";
import styles from "./Home.module.scss";

export const AuthClientHome = () => {
  const [loggedIn, setLoggedIn] = useState(
    AuthorizationClient.oidcClient && AuthorizationClient.oidcClient.hasSignedIn
  );
  const location = useLocation();

  const backend: IModelBackendOptions = {
    hostedBackend: {
      title: IModelBackend.DesignReview,
      version: "v3.0",
      hostType: IModelBackendHost.ServiceFabric,
    },
  };

  useEffect(() => {
    if (!AuthorizationClient.oidcClient) {
      AuthorizationClient.initializeOidc()
        .then(() => {
          setLoggedIn(
            IModelApp.authorizationClient
              ? IModelApp.authorizationClient.hasSignedIn &&
                  IModelApp.authorizationClient.isAuthorized
              : false
          );
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      setLoggedIn(
        IModelApp.authorizationClient
          ? IModelApp.authorizationClient.hasSignedIn &&
              IModelApp.authorizationClient.isAuthorized
          : false
      );
    }
  }, []);

  const toggleLogin = async () => {
    if (!loggedIn) {
      await AuthorizationClient.signIn(location.pathname);
      setLoggedIn(
        AuthorizationClient.oidcClient.hasSignedIn &&
          AuthorizationClient.oidcClient.isAuthorized
      );
    } else {
      await AuthorizationClient.signOut(location.pathname);
    }
  };

  return (
    <div className={styles.home}>
      <Header handleLoginToggle={toggleLogin} loggedIn={loggedIn} />
      {loggedIn && (
        <Viewer
          authConfig={{ oidcClient: AuthorizationClient.oidcClient }}
          contextId={process.env.REACT_APP_AUTH_CLIENT_CONTEXT_ID as string}
          iModelId={process.env.REACT_APP_AUTH_CLIENT_IMODEL_ID as string}
          appInsightsKey={process.env.REACT_APP_APPLICATION_INSIGHTS_KEY}
          backend={backend}
          theme={ColorTheme.Dark}
          defaultUiConfig={{
            contentManipulationTools: {
              hideDefaultHorizontalItems: true,
              hideDefaultVerticalItems: true,
              cornerItem: {
                hideDefault: true,
              },
            },
            hideDefaultStatusBar: true,
            hidePropertyGrid: true,
            hideTreeView: true,
            hideToolSettings: true,
            navigationTools: {
              hideDefaultHorizontalItems: true,
              hideDefaultVerticalItems: true,
            },
          }}
        />
      )}
    </div>
  );
};
