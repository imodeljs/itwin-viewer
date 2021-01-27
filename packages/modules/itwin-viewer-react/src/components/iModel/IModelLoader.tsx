/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import "./IModelLoader.scss";

import { ClientRequestContext, Config } from "@bentley/bentleyjs-core";
import {
  IModelApp,
  IModelConnection,
  MessageBoxIconType,
  MessageBoxType,
  SnapshotConnection,
  ViewState,
} from "@bentley/imodeljs-frontend";
import { UrlDiscoveryClient } from "@bentley/itwin-client";
import { useErrorManager } from "@bentley/itwin-error-handling-react";
import {
  BackstageActionItem,
  BackstageItemUtilities,
  BackstageStageLauncher,
} from "@bentley/ui-abstract";
import {
  FrameworkVersion,
  IModelViewportControlOptions,
  StateManager,
  SyncUiEventDispatcher,
  UiFramework,
} from "@bentley/ui-framework";
import { withAITracking } from "@microsoft/applicationinsights-react-js";
import React, { useEffect, useState } from "react";
import { Provider } from "react-redux";

import {
  getDefaultViewIds,
  openImodel,
} from "../../services/iModel/IModelService";
import { SelectionScopeClient } from "../../services/iModel/SelectionScopeClient";
import { ViewCreator } from "../../services/iModel/ViewCreator";
import Initializer from "../../services/Initializer";
import { ai } from "../../services/telemetry/TelemetryService";
import {
  ItwinViewerUi,
  ViewerBackstageItem,
  ViewerFrontstage,
} from "../../types";
import { DefaultFrontstage } from "../app-ui/frontstages/DefaultFrontstage";
import { IModelBusy, IModelViewer } from "./";

export interface ModelLoaderProps {
  contextId?: string;
  iModelId?: string;
  changeSetId?: string;
  uiConfig?: ItwinViewerUi;
  appInsightsKey?: string;
  onIModelConnected?: (iModel: IModelConnection) => void;
  snapshotPath?: string;
  frontstages?: ViewerFrontstage[];
  backstageItems?: ViewerBackstageItem[];
  uiFrameworkVersion?: FrameworkVersion;
  viewportOptions?: IModelViewportControlOptions;
}

const Loader: React.FC<ModelLoaderProps> = React.memo(
  ({
    iModelId,
    contextId,
    changeSetId,
    uiConfig,
    onIModelConnected,
    snapshotPath,
    frontstages,
    backstageItems,
    uiFrameworkVersion,
    viewportOptions,
  }: ModelLoaderProps) => {
    const [error, setError] = useState<Error>();
    const [finalFrontstages, setFinalFrontstages] = useState<
      ViewerFrontstage[]
    >();
    const [finalBackstageItems, setFinalBackstageItems] = useState<
      ViewerBackstageItem[]
    >();
    const [viewState, setViewState] = useState<ViewState>();
    const [connected, setConnected] = useState<boolean>(false);

    // trigger error boundary when fatal error is thrown
    const errorManager = useErrorManager({});
    useEffect(() => {
      setError(errorManager.fatalError);
    }, [errorManager.fatalError]);

    useEffect(() => {
      const getModelConnection = async () => {
        // first check to see if some other frontstage is defined as the default
        // allow fronstages other than the default viewport to continue to render if so
        if (frontstages) {
          const defaultFrontstages = frontstages.filter(
            (frontstage) => frontstage.default
          );
          if (defaultFrontstages.length > 0) {
            // there should only be one, but check if any default frontstage requires an iModel connection
            let requiresConnection = false;
            for (let i = 0; i < defaultFrontstages.length; i++) {
              if (defaultFrontstages[i].requiresIModelConnection) {
                requiresConnection = true;
                break;
              }
            }
            if (!requiresConnection) {
              // allow to continue to render
              setConnected(true);
              return;
            }
          }
        }
        if (!(contextId && iModelId) && !snapshotPath) {
          throw new Error(
            "Please provide a valid contextId and iModelId or a local snapshotPath"
          );
        }

        setConnected(false);
        let imodelConnection: IModelConnection | undefined;
        // create a new imodelConnection for the passed project and imodel ids
        if (snapshotPath) {
          imodelConnection = await SnapshotConnection.openFile(snapshotPath);
        } else if (contextId && iModelId) {
          imodelConnection = await openImodel(contextId, iModelId, changeSetId);
        }
        if (imodelConnection) {
          // Tell the SyncUiEventDispatcher and StateManager about the iModelConnection
          UiFramework.setIModelConnection(imodelConnection);
          SyncUiEventDispatcher.initializeConnectionEvents(imodelConnection);

          if (onIModelConnected) {
            onIModelConnected(imodelConnection);
          }

          const viewIds = await getDefaultViewIds(imodelConnection);

          if (viewIds.length === 0 && contextId && iModelId) {
            // no valid view data in the model. Direct the user to the synchronization portal
            const msgDiv = document.createElement("div");
            const msg = await Initializer.getIModelDataErrorMessage(
              contextId,
              iModelId,
              IModelApp.i18n.translateWithNamespace(
                "iTwinViewer",
                "iModels.emptyIModelError"
              )
            );
            msgDiv.innerHTML = msg;
            // this can and should be async. No need to wait on it
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            IModelApp.notifications.openMessageBox(
              MessageBoxType.Ok,
              msgDiv,
              MessageBoxIconType.Critical
            );
          }

          // attempt to construct a default viewState
          const savedViewState = await ViewCreator.createDefaultView(
            imodelConnection,
            undefined,
            viewIds.length > 0 ? viewIds[0] : undefined
          );

          // Should not be undefined
          if (!savedViewState) {
            throw new Error("No default view state for the imodel!");
          }

          // Set default view state
          UiFramework.setDefaultViewState(savedViewState);

          // TODO revist for snapshots once settings are removed
          if (!snapshotPath) {
            await SelectionScopeClient.initializeSelectionScope();
            SelectionScopeClient.setupSelectionScopeHandler();
          }

          setViewState(savedViewState);

          setConnected(true);
        }
      };

      getModelConnection().catch((error) => {
        errorManager.throwFatalError(error);
      });
    }, [contextId, iModelId, snapshotPath, frontstages, backstageItems]);

    useEffect(() => {
      const allBackstageItems: ViewerBackstageItem[] = [];
      if (backstageItems) {
        backstageItems.forEach((backstageItem) => {
          // check for label i18n key and translate if needed
          if (backstageItem.labeli18nKey) {
            let newItem;
            if ((backstageItem as BackstageStageLauncher).stageId) {
              newItem = BackstageItemUtilities.createStageLauncher(
                (backstageItem as BackstageStageLauncher).stageId,
                backstageItem.groupPriority,
                backstageItem.itemPriority,
                IModelApp.i18n.translate(backstageItem.labeli18nKey),
                backstageItem.subtitle,
                backstageItem.icon
              );
            } else {
              newItem = BackstageItemUtilities.createActionItem(
                backstageItem.id,
                backstageItem.groupPriority,
                backstageItem.itemPriority,
                (backstageItem as BackstageActionItem).execute,
                IModelApp.i18n.translate(backstageItem.labeli18nKey),
                backstageItem.subtitle,
                backstageItem.icon
              );
            }
            allBackstageItems.push(newItem);
          } else {
            allBackstageItems.push(backstageItem);
          }
        });
      }

      if (viewState) {
        allBackstageItems.unshift({
          stageId: "DefaultFrontstage",
          id: "DefaultFrontstage",
          groupPriority: 100,
          itemPriority: 10,
          label: IModelApp.i18n.translate(
            "iTwinViewer:backstage.mainFrontstage"
          ),
        });
      }

      setFinalBackstageItems(allBackstageItems);
    }, [backstageItems, viewState]);

    useEffect(() => {
      let allFrontstages: ViewerFrontstage[] = [];
      if (frontstages) {
        allFrontstages = [...frontstages];
      }

      if (viewState) {
        // initialize the DefaultFrontstage that contains the views that we want
        const defaultFrontstageProvider = new DefaultFrontstage(
          [viewState],
          uiConfig,
          viewportOptions
        );

        // add the default frontstage first so that it's default status can be overridden
        allFrontstages.unshift({
          provider: defaultFrontstageProvider,
          default: true,
        });
      }

      setFinalFrontstages(allFrontstages);
    }, [frontstages, viewState]);

    if (error) {
      throw error;
    } else {
      return finalFrontstages &&
        finalBackstageItems &&
        connected &&
        StateManager.store ? (
        <div className="itwin-viewer-container">
          <Provider store={StateManager.store}>
            <IModelViewer
              frontstages={finalFrontstages}
              backstageItems={finalBackstageItems}
              uiFrameworkVersion={uiFrameworkVersion}
            />
          </Provider>
        </div>
      ) : (
        <IModelBusy />
      );
    }
  }
);

const TrackedLoader = withAITracking(ai.reactPlugin, Loader, "IModelLoader");

const IModelLoader: React.FC<ModelLoaderProps> = (props: ModelLoaderProps) => {
  if (props.appInsightsKey) {
    return <TrackedLoader {...props} />;
  } else {
    return <Loader {...props} />;
  }
};

export default IModelLoader;
