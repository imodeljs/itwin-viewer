/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Config } from "@bentley/bentleyjs-core";
import {
  IModelApp,
  RemoteBriefcaseConnection,
} from "@bentley/imodeljs-frontend";
import { UrlDiscoveryClient } from "@bentley/itwin-client";
import { BackstageItemUtilities } from "@bentley/ui-abstract";
import { FrontstageProps, FrontstageProvider } from "@bentley/ui-framework";
import { render, waitFor } from "@testing-library/react";
import React from "react";

import IModelLoader from "../../../components/iModel/IModelLoader";
import * as IModelServices from "../../../services/iModel/IModelService";
import { ViewerBackstageItem, ViewerFrontstage } from "../../../types";

jest.mock("@bentley/ui-framework");
jest.mock("@bentley/ui-abstract");
jest.mock("@microsoft/applicationinsights-react-js", () => ({
  ReactPlugin: jest.fn(),
  withAITracking: (
    reactPlugin: any | undefined, // eslint-disable-line no-unused-vars
    component: any,
    componentName?: string, // eslint-disable-line no-unused-vars
    className?: string // eslint-disable-line no-unused-vars
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
        translate: jest.fn(),
        translateWithNamespace: jest.fn(),
      },
      uiAdmin: {
        updateFeatureFlags: jest.fn(),
      },
      notifications: {
        openMessageBox: jest.fn(),
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
    SnapshotConnection: {
      openFile: jest.fn(),
    },
    MessageBoxType: {
      Ok: 1,
    },
    MessageBoxIconType: {
      Critical: 1,
    },
  };
});
jest.mock("../../../services/iModel/IModelService");
jest.mock("@bentley/itwin-client");
jest.mock("../../../services/iModel/ViewCreator", () => {
  return {
    ViewCreator: {
      createDefaultView: jest.fn().mockResolvedValue({}),
    },
  };
});
jest.mock("../../../services/iModel/SelectionScopeClient");

class Frontstage1Provider extends FrontstageProvider {
  public get frontstage(): React.ReactElement<FrontstageProps> {
    return <div></div>;
  }
}

class Frontstage2Provider extends FrontstageProvider {
  public get frontstage(): React.ReactElement<FrontstageProps> {
    return <div></div>;
  }
}

const mockContextId = "mockContextId";
const mockIModelId = "mockIModelId";

describe("IModelLoader", () => {
  beforeEach(() => {
    jest.spyOn(IModelServices, "getDefaultViewIds").mockResolvedValue([]);
    jest
      .spyOn(IModelServices, "openImodel")
      .mockResolvedValue({} as RemoteBriefcaseConnection);
    jest
      .spyOn(UrlDiscoveryClient.prototype, "discoverUrl")
      .mockResolvedValue("https://test.com");
    jest.spyOn(Config.App, "get").mockReturnValue(1);
  });

  it("adds backstage items and translates their labels", async () => {
    const fs1 = new Frontstage1Provider();
    const fs2 = new Frontstage2Provider();
    const frontstages: ViewerFrontstage[] = [
      {
        provider: fs1,
      },
      {
        provider: fs2,
      },
    ];

    const actionItem = {
      id: "bs1",
      execute: jest.fn(),
      groupPriority: 100,
      itemPriority: 1,
      label: "",
      labeli18nKey: "bs1Key",
    };

    const stageLauncher = {
      id: "bs2",
      stageId: "bs2",
      groupPriority: 100,
      itemPriority: 2,
      label: "",
      labeli18nKey: "bs2Key",
    };

    const backstageItems: ViewerBackstageItem[] = [actionItem, stageLauncher];

    const { getByTestId } = render(
      <IModelLoader
        frontstages={frontstages}
        backstageItems={backstageItems}
        contextId={mockContextId}
        iModelId={mockIModelId}
      />
    );

    await waitFor(() => getByTestId("loader-wrapper"));

    // these calls will be doubled. items will be set first without a viewState and reset with one additional translation for the default frontstage once we have a viewState
    expect(BackstageItemUtilities.createStageLauncher).toHaveBeenCalledTimes(2);
    expect(BackstageItemUtilities.createActionItem).toHaveBeenCalledTimes(2);
    expect(IModelApp.i18n.translate).toHaveBeenCalledTimes(5);
  });

  it("notifies the user when the model has no data", async () => {
    const { getByTestId } = render(
      <IModelLoader contextId={mockContextId} iModelId={mockIModelId} />
    );

    await waitFor(() => getByTestId("loader-wrapper"));

    expect(IModelApp.notifications.openMessageBox).toHaveBeenCalled();
  });
});
