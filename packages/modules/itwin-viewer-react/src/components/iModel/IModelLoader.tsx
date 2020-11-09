/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import "./IModelLoader.scss";

import {
  IModelApp,
  IModelConnection,
  SnapshotConnection,
  ViewState,
} from "@bentley/imodeljs-frontend";
import { useErrorManager } from "@bentley/itwin-error-handling-react";
import {
  BackstageActionItem,
  BackstageItemUtilities,
  BackstageStageLauncher,
} from "@bentley/ui-abstract";
import {
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
        if (!(contextId && iModelId) && !snapshotPath) {
          // first check to see if some other frontstage is defined as the default
          // allow fronstages other than the default viewport to continue to render if so
          if (frontstages) {
            const defaultFrontstages = frontstages.filter(
              (frontstage) => frontstage.default
            );
            if (defaultFrontstages.length > 0) {
              setConnected(true);
              return;
            }
          }
          throw new Error(
            "Please provide a valid contextId and iModelId or a local snapshotPath"
          );
        } else {
          setConnected(false);
        }

        let imodelConnection: IModelConnection | undefined;
        // create a new imodelConnection for the passed project and imodel ids
        if (snapshotPath) {
          imodelConnection = await SnapshotConnection.openFile(snapshotPath);
        } else if (contextId && iModelId) {
          imodelConnection = await openImodel(contextId, iModelId, changeSetId);
        }
        if (imodelConnection) {
          if (onIModelConnected) {
            onIModelConnected(imodelConnection);
          }
          // TODO revist this logic for the viewer
          // pass the default viewids to the frontstage.
          // currently we pass the first 2 spatial views to support split screen
          // this logic will likely change when we have proper use cases
          const viewIds = await getDefaultViewIds(imodelConnection);
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

          // Tell the SyncUiEventDispatcher about the iModelConnection
          UiFramework.setIModelConnection(imodelConnection);
          // Set default view state
          UiFramework.setDefaultViewState(savedViewState);

          SyncUiEventDispatcher.initializeConnectionEvents(imodelConnection);

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
          uiConfig
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
      return finalFrontstages && finalBackstageItems && connected ? (
        <div className="itwin-viewer-container">
          <Provider store={StateManager.store}>
            <IModelViewer
              frontstages={finalFrontstages}
              backstageItems={finalBackstageItems}
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
