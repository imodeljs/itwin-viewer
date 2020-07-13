/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { FrontendAuthorizationClient } from "@bentley/frontend-authorization-client";
import {
  Extension,
  ExternalServerExtensionLoader,
  IModelApp,
} from "@bentley/imodeljs-frontend";
import { ErrorBoundary } from "@bentley/itwin-error-handling-react";
import React from "react";
import ReactDOM from "react-dom";

import { AuthorizationOptions } from "../";
import IModelLoader from "../components/iModel/IModelLoader";
import AuthorizationClient from "../services/auth/AuthorizationClient";
import { ItwinViewerParams } from "../types";
import Initializer from "./Initializer";
import { trackEvent } from "./telemetry/TelemetryService";

export const getAuthClient = (
  authOptions: AuthorizationOptions
): FrontendAuthorizationClient => {
  if (authOptions.oidcClient) {
    return authOptions.oidcClient;
  }
  if (authOptions.getUserManagerFunction) {
    return new AuthorizationClient(authOptions.getUserManagerFunction);
  }
  //TODO localize
  throw new Error(
    "Please supply an OIDC client or a function to get your client's user manager"
  );
};

export class ItwinViewer {
  elementId: string;
  initialized: boolean;

  constructor(options: ItwinViewerParams) {
    if (!options.elementId) {
      //TODO localize
      throw new Error("Please supply a root elementId as the first parameter"); //TODO localize
    }
    this.elementId = options.elementId;
    this.initialized = false;
    const authClient = getAuthClient(options.authOptions);
    Initializer.initialize(
      { authorizationClient: authClient },
      options.appInsightsKey,
      options.backendOptions
    ).catch((error) => {
      throw error;
    });
  }

  /** load a model in the viewer once iTwinViewerApp is ready */
  load = async (
    projectId: string,
    iModelId: string,
    namedVersionId?: string
  ) => {
    trackEvent("iTwinViewer.Viewer.Load");
    // ensure iModel.js initialization completes
    await Initializer.initialized;
    // render the viewer for the given iModel on the given element
    ReactDOM.render(
      React.createElement(
        ErrorBoundary,
        {},
        React.createElement(IModelLoader, {
          projectId: projectId,
          iModelId: iModelId,
          namedVersionId: namedVersionId,
        })
      ),
      document.getElementById(this.elementId)
    );
  };

  /**
   * load an extension into the viewer instance
   */
  addExtension = (
    extensionName: string,
    version?: string,
    url?: string
  ): Promise<Extension | undefined> => {
    if (url) {
      IModelApp.extensionAdmin.addExtensionLoaderFront(
        new ExternalServerExtensionLoader(url)
      );
    }
    return IModelApp.extensionAdmin.loadExtension(extensionName, version);
  };
}
