/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { ColorTheme, UiFramework } from "@bentley/ui-framework";
import React from "react";
import ReactDOM from "react-dom";

import IModelLoader from "../../components/iModel/IModelLoader";
import AuthorizationClient from "../../services/auth/AuthorizationClient";
import Initializer from "../../services/Initializer";
import { ItwinViewer } from "../../services/ItwinViewer";
import {
  IModelBackend,
  IModelBackendHost,
  IModelBackendOptions,
} from "../../types";
import MockAuthorizationClient from "../mocks/MockAuthorizationClient";
import MockOidcClient from "../mocks/MockOidcClient";

jest.mock("../../services/Initializer", () => ({
  __esModule: true,
  default: {
    initialize: jest.fn().mockResolvedValue(true),
    initialized: Promise.resolve(),
  },
}));
jest.mock("../../services/auth/AuthorizationClient");
jest.mock("@microsoft/applicationinsights-react-js", () => ({
  ReactPlugin: jest.fn(),
  withAITracking: (
    reactPlugin: any | undefined,
    component: any,
    componentName?: string,
    className?: string
  ) => component,
}));
jest.mock("@bentley/ui-framework");

describe("iTwinViewer", () => {
  beforeAll(() => {
    const viewerRoot = document.createElement("div");
    viewerRoot.id = "viewerRoot";
    document.body.append(viewerRoot);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    MockAuthorizationClient.initialize().catch((error) => console.error(error));
  });

  it("throws and error when an either an oidc client or user manager is not provided", () => {
    let errorMessage;
    try {
      new ItwinViewer({ elementId: "viewerRoot", authConfig: {} });
    } catch (error) {
      errorMessage = error.message;
    }
    expect(errorMessage).toEqual(
      "Please supply an OIDC client or a function to get your client's user manager"
    ); //TODO localize
  });

  it("initializes iModel.js with the passed in oidc client", () => {
    new ItwinViewer({
      elementId: "viewerRoot",
      authConfig: {
        oidcClient: MockAuthorizationClient.oidcClient,
      },
    });
    expect(Initializer.initialize).toHaveBeenCalledWith(
      {
        authorizationClient: MockAuthorizationClient.oidcClient,
      },
      { appInsightsKey: undefined, backend: undefined, productId: undefined }
    );
  });

  it("creates a new AuthorizationClient using the passed oidc user manager", () => {
    const oidcClient = new MockOidcClient();
    new ItwinViewer({
      elementId: "viewerRoot",
      authConfig: {
        getUserManagerFunction: oidcClient.getUserManager,
      },
    });
    expect(AuthorizationClient).toHaveBeenCalledWith(oidcClient.getUserManager);
  });

  it("renders the viewer for the proper projectId and iModelId on the element whose id is passed to the constructor", async () => {
    const mockProjectId = "mockProjectId";
    const mockiModelId = "mockImodelId";
    const elementId = "viewerRoot";

    jest.spyOn(React, "createElement");
    jest.spyOn(ReactDOM, "render");

    const viewer = new ItwinViewer({
      elementId,
      authConfig: {
        oidcClient: MockAuthorizationClient.oidcClient,
      },
    });
    await viewer.load(mockProjectId, mockiModelId);
    expect(React.createElement).toHaveBeenCalledWith(IModelLoader, {
      projectId: mockProjectId,
      iModelId: mockiModelId,
      namedVersionId: undefined,
    });
    expect(ReactDOM.render).toHaveBeenCalledWith(
      expect.anything(),
      document.getElementById(elementId)
    );
  });

  it("initializes iModel.js with the passed in backend configuration", () => {
    const backendConfig: IModelBackendOptions = {
      hostedBackend: {
        title: IModelBackend.GeneralPurpose,
        version: "v2.0",
        hostType: IModelBackendHost.K8S,
      },
    };

    new ItwinViewer({
      elementId: "viewerRoot",
      authConfig: {
        oidcClient: MockAuthorizationClient.oidcClient,
      },
      backend: backendConfig,
    });

    expect(Initializer.initialize).toHaveBeenCalledWith(
      {
        authorizationClient: MockAuthorizationClient.oidcClient,
      },
      {
        appInsightsKey: undefined,
        backend: backendConfig,
        productId: undefined,
      }
    );
  });

  it("sets the theme to the provided theme", async () => {
    const mockProjectId = "mockProjectId";
    const mockiModelId = "mockImodelId";
    const elementId = "viewerRoot";

    const viewer = new ItwinViewer({
      elementId: elementId,
      authConfig: {
        oidcClient: MockAuthorizationClient.oidcClient,
      },
      theme: ColorTheme.Dark,
    });

    await viewer.load(mockProjectId, mockiModelId);

    expect(UiFramework.setColorTheme).toHaveBeenCalledWith(ColorTheme.Dark);
  });
});
