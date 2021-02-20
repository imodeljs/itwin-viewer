/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Range3d } from "@bentley/geometry-core";
import { Cartographic } from "@bentley/imodeljs-common";
import { IModelApp } from "@bentley/imodeljs-frontend";
import { BlankViewer, ViewerExtension } from "@bentley/itwin-viewer-react";
import React, { useState } from "react";
import { useLocation } from "react-router";

import { GeometryDecorator } from "../../decorators/GeometryDecorator";
import { TestUiProvider, TestUiProvider2 } from "../../providers";
import { oidcClient } from "../../services/auth/AuthInstances";
import { Header } from "./";
import styles from "./Home.module.scss";

export const BlankConnectionHome: React.FC = () => {
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

  const iModelAppInit = () => {
    const decorator = new GeometryDecorator();
    IModelApp.viewManager.addDecorator(decorator);
    decorator.drawBase();
  };

  return (
    <div className={styles.home}>
      <Header handleLoginToggle={toggleLogin} loggedIn={loggedIn} />
      {loggedIn && (
        <BlankViewer
          authConfig={{ getUserManagerFunction: oidcClient.getUserManager }}
          blankConnection={{
            name: "GeometryConnection",
            location: Cartographic.fromDegrees(0, 0, 0),
            extents: new Range3d(-30, -30, -30, 30, 30, 30),
          }}
          extensions={extensions}
          productId={productId}
          onIModelAppInit={iModelAppInit}
          uiProviders={[new TestUiProvider(), new TestUiProvider2()]}
        />
      )}
    </div>
  );
};
