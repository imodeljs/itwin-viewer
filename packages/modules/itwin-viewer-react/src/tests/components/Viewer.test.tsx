/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import "@testing-library/jest-dom/extend-expect";

import { IModelApp } from "@bentley/imodeljs-frontend";
import { render } from "@testing-library/react";
import React from "react";

import { Viewer } from "../../";
import Initializer from "../../services/Initializer";
import {
  IModelBackend,
  IModelBackendHost,
  IModelBackendOptions,
} from "../../types";
import MockOidcClient from "../mocks/MockOidcClient";

jest.mock("../../services/Initializer", () => ({
  __esModule: true,
  default: {
    initialize: jest.fn().mockResolvedValue(true),
    initialized: Promise.resolve(),
  },
}));
jest.mock("../../services/auth/AuthorizationClient");
jest.mock("../../services/iModel/IModelService");
jest.mock("@bentley/ui-framework");
jest.mock("@bentley/presentation-frontend");
jest.mock("../../store/rootReducer");

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
    },
    SnapMode: {},
    ActivityMessageDetails: jest.fn(),
    PrimitiveTool: jest.fn(),
    NotificationManager: jest.fn(),
    ExternalServerExtensionLoader: jest.fn(),
  };
});

const mockProjectId = "123";
const mockIModelId = "456";
const oidcClient = new MockOidcClient();

describe("Viewer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads the model loader for the specified projectId and iModelId", async () => {
    const { getByTestId } = render(
      <Viewer
        projectId={mockProjectId}
        iModelId={mockIModelId}
        authConfig={{ getUserManagerFunction: oidcClient.getUserManager }}
      />
    );

    // TODO Broken
    const viewerContainer = getByTestId("loader-wrapper");

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
      },
    ];

    const { getByTestId } = render(
      <Viewer
        projectId={mockProjectId}
        iModelId={mockIModelId}
        authConfig={{ getUserManagerFunction: oidcClient.getUserManager }}
        extensions={extensions}
      />
    );

    // TODO Broken
    // await waitFor(() => getByTestId("loader-wrapper"));

    expect(
      IModelApp.extensionAdmin.addExtensionLoaderFront
    ).toHaveBeenCalledTimes(2);

    expect(IModelApp.extensionAdmin.loadExtension).toHaveBeenCalledTimes(3);
  });

  it("initializes the viewer with the provided backend configuration", async () => {
    const backendConfig: IModelBackendOptions = {
      hostedBackend: {
        title: IModelBackend.GeneralPurpose,
        version: "v2.0",
        hostType: IModelBackendHost.K8S,
      },
    };

    const { getByTestId } = render(
      <Viewer
        projectId={mockProjectId}
        iModelId={mockIModelId}
        authConfig={{ getUserManagerFunction: oidcClient.getUserManager }}
        backend={backendConfig}
      />
    );

    // TODO Broken
    const viewerContainer = getByTestId("loader-wrapper");

    expect(viewerContainer).toBeInTheDocument();

    expect(Initializer.initialize).toHaveBeenCalledWith(
      { authorizationClient: {} },
      undefined,
      backendConfig
    );
  });
});
