/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
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

describe("iTwinViewer", () => {
  beforeAll(() => {
    const viewerRoot = document.createElement("div");
    viewerRoot.id = "viewerRoot";
    document.body.append(viewerRoot);
  });

  beforeEach(() => {
    MockAuthorizationClient.initialize().catch((error) => console.error(error));
  });

  it("throws and error when an either an oidc client or user manager is not provided", () => {
    let errorMessage;
    try {
      new ItwinViewer({ elementId: "viewerRoot", authOptions: {} });
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
      authOptions: {
        oidcClient: MockAuthorizationClient.oidcClient,
      },
    });
    expect(Initializer.initialize).toHaveBeenCalledWith(
      {
        authorizationClient: MockAuthorizationClient.oidcClient,
      },
      undefined,
      undefined
    );
  });

  it("creates a new AuthorizationClient using the passed oidc user manager", () => {
    const oidcClient = new MockOidcClient();
    new ItwinViewer({
      elementId: "viewerRoot",
      authOptions: {
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
      authOptions: {
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
      authOptions: {
        oidcClient: MockAuthorizationClient.oidcClient,
      },
      backendOptions: backendConfig,
    });

    expect(Initializer.initialize).toHaveBeenCalledWith(
      {
        authorizationClient: MockAuthorizationClient.oidcClient,
      },
      undefined,
      backendConfig
    );
  });
});
