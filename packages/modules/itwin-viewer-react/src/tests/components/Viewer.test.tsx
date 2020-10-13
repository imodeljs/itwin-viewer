/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import "@testing-library/jest-dom/extend-expect";

import { IModelApp } from "@bentley/imodeljs-frontend";
import { I18N } from "@bentley/imodeljs-i18n";
import { ColorTheme, UiFramework } from "@bentley/ui-framework";
import { render, waitFor } from "@testing-library/react";
import React from "react";

import { Viewer } from "../../";
import * as IModelService from "../../services/iModel/IModelService";
import Initializer from "../../services/Initializer";
import { ai } from "../../services/telemetry/TelemetryService";
import {
  IModelBackend,
  IModelBackendHost,
  IModelBackendOptions,
} from "../../types";
import MockOidcClient from "../mocks/MockOidcClient";

jest.mock("@bentley/imodeljs-i18n");
jest.mock("../../services/auth/AuthorizationClient");
jest.mock("../../services/iModel/IModelService");
jest.mock("@bentley/ui-framework");
jest.mock("@bentley/presentation-frontend");

jest.mock("@microsoft/applicationinsights-react-js", () => ({
  ReactPlugin: jest.fn(),
  withAITracking: (
    reactPlugin: any | undefined,
    component: any,
    componentName?: string,
    className?: string
  ) => component,
}));

jest.mock("@bentley/imodeljs-frontend", () => {
  return {
    IModelApp: {
      startup: jest.fn(),
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
    RemoteBriefcaseConnection: {
      open: jest.fn(),
    },
  };
});

jest.mock("../../services/telemetry/TelemetryService");

const mockProjectId = "123";
const mockIModelId = "456";
const oidcClient = new MockOidcClient();

describe("Viewer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads the model loader for the specified contextId and iModelId", async () => {
    const { getByTestId } = render(
      <Viewer
        contextId={mockProjectId}
        iModelId={mockIModelId}
        authConfig={{ getUserManagerFunction: oidcClient.getUserManager }}
      />
    );

    const viewerContainer = await waitFor(() => getByTestId("loader-wrapper"));

    expect(viewerContainer).toBeInTheDocument();
  });

  it("loads the specified extensions and only registers each unique url once", async () => {
    const extensions = [
      {
        name: "Extension1",
        url: "http://localhost:3001",
      },
      {
        name: "Extension2",
        url: "http://localhost:3002",
      },
      {
        name: "Extension3",
        url: "http://localhost:3001",
        version: "2",
        args: ["one", "two"],
      },
    ];

    const { getByTestId } = render(
      <Viewer
        contextId={mockProjectId}
        iModelId={mockIModelId}
        authConfig={{ getUserManagerFunction: oidcClient.getUserManager }}
        extensions={extensions}
      />
    );

    await waitFor(() => getByTestId("loader-wrapper"));

    expect(
      IModelApp.extensionAdmin.addExtensionLoaderFront
    ).toHaveBeenCalledTimes(2);

    expect(IModelApp.extensionAdmin.loadExtension).toHaveBeenCalledTimes(3);
    expect(
      IModelApp.extensionAdmin.loadExtension
    ).toHaveBeenCalledWith("Extension3", "2", ["one", "two"]);
  });

  it("initializes the viewer with the provided backend configuration", async () => {
    jest.spyOn(Initializer, "initialize");

    const backendConfig: IModelBackendOptions = {
      hostedBackend: {
        title: IModelBackend.GeneralPurpose,
        version: "v2.0",
        hostType: IModelBackendHost.K8S,
      },
    };

    const { getByTestId } = render(
      <Viewer
        contextId={mockProjectId}
        iModelId={mockIModelId}
        authConfig={{ getUserManagerFunction: oidcClient.getUserManager }}
        backend={backendConfig}
        productId={"0000"}
      />
    );

    const viewerContainer = await waitFor(() => getByTestId("loader-wrapper"));

    expect(viewerContainer).toBeInTheDocument();

    expect(Initializer.initialize).toHaveBeenCalledWith(
      { authorizationClient: {} },
      {
        appInsightsKey: undefined,
        backend: backendConfig,
        imjsAppInsightsKey: undefined,
        productId: "0000",
      }
    );
  });

  it("sets the theme to the provided theme", async () => {
    const { getByTestId } = render(
      <Viewer
        contextId={mockProjectId}
        iModelId={mockIModelId}
        authConfig={{ getUserManagerFunction: oidcClient.getUserManager }}
        productId={"0000"}
        theme={ColorTheme.Dark}
      />
    );

    await waitFor(() => getByTestId("loader-wrapper"));

    expect(UiFramework.setColorTheme).toHaveBeenCalledWith(ColorTheme.Dark);
  });

  it("queries the iModel with the provided changeSetId", async () => {
    const { getByTestId } = render(
      <Viewer
        contextId={mockProjectId}
        iModelId={mockIModelId}
        authConfig={{ getUserManagerFunction: oidcClient.getUserManager }}
        productId={"0000"}
        changeSetId={"123"}
      />
    );

    await waitFor(() => getByTestId("loader-wrapper"));

    expect(IModelService.openImodel).toHaveBeenCalledWith(
      mockProjectId,
      mockIModelId,
      "123"
    );
  });

  it("instantiates an instance of the Telemetry Service when an app insights key is provided", async () => {
    const appInsightsKey = "123";
    const { getByTestId } = render(
      <Viewer
        contextId={mockProjectId}
        iModelId={mockIModelId}
        authConfig={{ getUserManagerFunction: oidcClient.getUserManager }}
        appInsightsKey={appInsightsKey}
      />
    );

    await waitFor(() => getByTestId("loader-wrapper"));

    expect(ai.initialize).toHaveBeenCalledWith(appInsightsKey);
  });

  it("does not instantiate an instance of the Telemetry Service when an app insights key is not provided", async () => {
    const { getByTestId } = render(
      <Viewer
        contextId={mockProjectId}
        iModelId={mockIModelId}
        authConfig={{ getUserManagerFunction: oidcClient.getUserManager }}
      />
    );

    await waitFor(() => getByTestId("loader-wrapper"));

    expect(ai.initialize).not.toHaveBeenCalled();
  });

  it("adds the iModel.js telemetry client when the imjs key is provided", async () => {
    const appInsightsKey = "123";
    const imjsAppInsightsKey = "456";
    const { getByTestId } = render(
      <Viewer
        contextId={mockProjectId}
        iModelId={mockIModelId}
        authConfig={{ getUserManagerFunction: oidcClient.getUserManager }}
        appInsightsKey={appInsightsKey}
        imjsAppInsightsKey={imjsAppInsightsKey}
      />
    );

    await waitFor(() => getByTestId("loader-wrapper"));

    expect(IModelApp.telemetry.addClient).toHaveBeenCalledTimes(2);
  });

  it("does not add the iModel.js telemetry client when the imjs key is not provided", async () => {
    const appInsightsKey = "123";
    const { getByTestId } = render(
      <Viewer
        contextId={mockProjectId}
        iModelId={mockIModelId}
        authConfig={{ getUserManagerFunction: oidcClient.getUserManager }}
        appInsightsKey={appInsightsKey}
      />
    );

    await waitFor(() => getByTestId("loader-wrapper"));

    expect(IModelApp.telemetry.addClient).toHaveBeenCalledTimes(1);
  });

  it("overrides the i18n url template", async () => {
    const i18nUrlTemplate = "host/route";

    const { getByTestId } = render(
      <Viewer
        contextId={mockProjectId}
        iModelId={mockIModelId}
        authConfig={{ getUserManagerFunction: oidcClient.getUserManager }}
        i18nUrlTemplate={i18nUrlTemplate}
      />
    );

    await waitFor(() => getByTestId("loader-wrapper"));

    expect(I18N).toHaveBeenCalledWith("iModelJs", {
      urlTemplate: i18nUrlTemplate,
    });
  });
});
