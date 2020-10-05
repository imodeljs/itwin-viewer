/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import {
  ExternalServerExtensionLoader,
  IModelApp,
} from "@bentley/imodeljs-frontend";
import { ColorTheme, UiFramework } from "@bentley/ui-framework";
import React from "react";
import ReactDOM from "react-dom";

import IModelLoader from "../../components/iModel/IModelLoader";
import AuthorizationClient from "../../services/auth/AuthorizationClient";
import Initializer from "../../services/Initializer";
import { ItwinViewer } from "../../services/ItwinViewer";
import { ai } from "../../services/telemetry/TelemetryService";
import {
  IModelBackend,
  IModelBackendHost,
  IModelBackendOptions,
} from "../../types";
import MockAuthorizationClient from "../mocks/MockAuthorizationClient";
import MockOidcClient from "../mocks/MockOidcClient";

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
jest.mock("@bentley/presentation-frontend");
jest.mock("@bentley/imodeljs-frontend", () => {
  return {
    IModelApp: {
      startup: jest.fn().mockResolvedValue(true),
      extensionAdmin: {
        addExtensionLoaderFront: jest.fn(),
        loadExtension: jest.fn().mockResolvedValue(true),
      },
      telemetry: {
        addClient: jest.fn(),
      },
      i18n: {
        registerNamespace: jest.fn().mockReturnValue({
          readFinished: jest.fn().mockResolvedValue(true),
        }),
        languageList: jest.fn().mockReturnValue(["en-US"]),
      },
    },
    SnapMode: {},
    ActivityMessageDetails: jest.fn(),
    PrimitiveTool: jest.fn(),
    NotificationManager: jest.fn(),
    ExternalServerExtensionLoader: jest.fn(),
    Tool: jest.fn(),
  };
});
jest.mock("../../services/telemetry/TelemetryService");

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

  it("initializes iModel.js with the passed in oidc client", async () => {
    jest.spyOn(Initializer, "initialize");
    new ItwinViewer({
      elementId: "viewerRoot",
      authConfig: {
        oidcClient: MockAuthorizationClient.oidcClient,
      },
    });
    await Initializer.initialized;
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

  it("renders the viewer for the proper contextId and iModelId on the element whose id is passed to the constructor", async () => {
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
      contextId: mockProjectId,
      iModelId: mockiModelId,
      changeSetId: undefined,
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

  it("queries the iModel with the provided changeSetId", async () => {
    const mockProjectId = "mockProjectId";
    const mockiModelId = "mockImodelId";
    const elementId = "viewerRoot";
    const changeSetId = "123";

    const viewer = new ItwinViewer({
      elementId: elementId,
      authConfig: {
        oidcClient: MockAuthorizationClient.oidcClient,
      },
    });

    await viewer.load(mockProjectId, mockiModelId, changeSetId);

    expect(React.createElement).toHaveBeenCalledWith(IModelLoader, {
      contextId: mockProjectId,
      iModelId: mockiModelId,
      changeSetId: changeSetId,
    });
  });

  it("loads the extension with the passed in version and args", async () => {
    const elementId = "viewerRoot";

    const viewer = new ItwinViewer({
      elementId: elementId,
      authConfig: {
        oidcClient: MockAuthorizationClient.oidcClient,
      },
    });

    await viewer.addExtension(
      "SampleExtension",
      "2",
      "http://extensionhome.com",
      ["one", "two"]
    );

    expect(
      IModelApp.extensionAdmin.addExtensionLoaderFront
    ).toHaveBeenCalledWith(
      new ExternalServerExtensionLoader("http://extensionhome.com")
    );

    expect(
      IModelApp.extensionAdmin.loadExtension
    ).toHaveBeenCalledWith("SampleExtension", "2", ["one", "two"]);
  });

  it("instantiates an instance of the Telemetry Service when an app insights key is provided", async () => {
    const appInsightsKey = "123";
    const elementId = "viewerRoot";

    const viewer = new ItwinViewer({
      elementId,
      authConfig: {
        oidcClient: MockAuthorizationClient.oidcClient,
      },
      appInsightsKey,
    });

    await Initializer.initialized;

    expect(ai.initialize).toHaveBeenCalledWith(appInsightsKey);
  });

  it("does not instantiate an instance of the Telemetry Service when an app insights key is not provided", async () => {
    const elementId = "viewerRoot";

    const viewer = new ItwinViewer({
      elementId,
      authConfig: {
        oidcClient: MockAuthorizationClient.oidcClient,
      },
    });

    await Initializer.initialized;

    expect(ai.initialize).not.toHaveBeenCalledWith();
  });

  it("adds the iModel.js telemetry client when the imjs key is provided", async () => {
    const elementId = "viewerRoot";
    const appInsightsKey = "123";
    const imjsAppInsightsKey = "456";

    const viewer = new ItwinViewer({
      elementId,
      authConfig: {
        oidcClient: MockAuthorizationClient.oidcClient,
      },
      appInsightsKey,
      imjsAppInsightsKey,
    });
    await Initializer.initialized;

    expect(IModelApp.telemetry.addClient).toHaveBeenCalledTimes(2);
  });

  it("does not add the iModel.js telemetry client when the imjs key is not provided", async () => {
    const elementId = "viewerRoot";
    const appInsightsKey = "123";

    const viewer = new ItwinViewer({
      elementId,
      authConfig: {
        oidcClient: MockAuthorizationClient.oidcClient,
      },
      appInsightsKey,
    });
    await Initializer.initialized;

    expect(IModelApp.telemetry.addClient).toHaveBeenCalledTimes(1);
  });
});
