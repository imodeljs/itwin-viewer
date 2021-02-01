/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { IModelConnection } from "@bentley/imodeljs-frontend";
import { Viewer, ViewerExtension } from "@bentley/itwin-viewer-react";
import React, { useState } from "react";
import { useLocation } from "react-router";

import { TestUiProvider, TestUiProvider2 } from "../../providers";
import { oidcClient } from "../../services/auth/AuthInstances";
import { Header } from "./";
import styles from "./Home.module.scss";

export const UserManagerHome: React.FC = () => {
  const [loggedIn, setLoggedIn] = useState(oidcClient.loggedIn);
  const location = useLocation();
  const extensions: ViewerExtension[] = [
    {
      name: "dialogItemsSample",
      url: "http://localhost:3000",
    },
  ];
  /**
   * This value is for the iTwin Viewer and will be the default if the productId prop is not provided.
   * This is merely an example on how to use the prop to override with your application's GPRID.
   */
  const productId = "3098";

  const toggleLogin = async () => {
    if (!loggedIn) {
      await oidcClient.signIn(location.pathname);
      if (oidcClient.loggedIn) {
        setLoggedIn(true);
      }
    } else {
      await oidcClient.signOut(location.pathname);
      setLoggedIn(false);
    }
  };

  const iModelConnected = (iModel: IModelConnection) => {
    console.log("iModel Connected!");
    console.log(iModel);
  };

  return (
    <div className={styles.home}>
      <Header handleLoginToggle={toggleLogin} loggedIn={loggedIn} />
      {loggedIn && (
        <Viewer
          authConfig={{ getUserManagerFunction: oidcClient.getUserManager }}
          contextId={process.env.IMJS_OIDC_CLIENT_CONTEXT_ID as string}
          iModelId={process.env.IMJS_OIDC_CLIENT_IMODEL_ID as string}
          extensions={extensions}
          productId={productId}
          onIModelConnected={iModelConnected}
          uiProviders={[new TestUiProvider(), new TestUiProvider2()]}
        />
      )}
    </div>
  );
};
