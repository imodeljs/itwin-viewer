/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import "./IModelLoader.scss";

import { IModelConnection, StandardViewId } from "@bentley/imodeljs-frontend";
import { useErrorManager } from "@bentley/itwin-error-handling-react";
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
import { ItwinViewerUi } from "../../types";
import { DefaultFrontstage } from "../app-ui/frontstages/DefaultFrontstage";
import { IModelBusy, IModelViewer } from "./";

interface ViewerProps {
  imodel?: IModelConnection;
  frontstageProvider?: DefaultFrontstage;
}

export interface ModelLoaderProps {
  contextId: string;
  iModelId: string;
  changeSetId?: string;
  uiConfig?: ItwinViewerUi;
  appInsightsKey?: string;
}

const Loader = React.memo(
  ({ iModelId, contextId, changeSetId, uiConfig }: ModelLoaderProps) => {
    const [error, setError] = useState<Error>();
    const [viewerProps, setViewerProps] = useState<ViewerProps>();

    // trigger error boundary when fatal error is thrown
    const errorManager = useErrorManager({});
    useEffect(() => {
      setError(errorManager.fatalError);
    }, [errorManager.fatalError]);

    useEffect(() => {
      const getModelConnection = async () => {
        if (!contextId || !iModelId) {
          throw new Error("No contextId or iModelId provided!");
        }
        // create a new imodelConnection for the passed project and imodel ids
        const imodelConnection = await openImodel(
          contextId,
          iModelId,
          changeSetId
        );
        if (imodelConnection) {
          // TODO revist this logic for the viewer
          // pass the default viewids to the frontstage.
          // currently we pass the first 2 spatial views to support split screen
          // this logic will likely change when we have proper use cases
          const viewIds = await getDefaultViewIds(imodelConnection);
          // attempt to construct a default viewState
          const savedViewState = await ViewCreator.createDefaultView(
            imodelConnection,
            undefined,
            viewIds.length > 0 ? viewIds[0] : undefined,
            {
              displayEnvironment: false,
              standardViewRotation: StandardViewId.Top,
            }
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

          // We create a FrontStage that contains the views that we want.
          // Passed as a prop but must adhere to the signature of the review and approval MainFrontstage class
          const frontstageProvider = new DefaultFrontstage(
            [savedViewState],
            uiConfig
          );

          await SelectionScopeClient.initializeSelectionScope();
          SelectionScopeClient.setupSelectionScopeHandler();

          setViewerProps({
            imodel: imodelConnection,
            frontstageProvider: frontstageProvider,
          });
        }
      };
      getModelConnection().catch((error) => {
        errorManager.throwFatalError(error);
      });
    }, [contextId, iModelId]);

    if (error) {
      throw error;
    } else {
      return viewerProps?.imodel && viewerProps?.frontstageProvider ? (
        <div className="itwin-viewer-container">
          <Provider store={StateManager.store}>
            <IModelViewer
              iModel={viewerProps.imodel}
              frontstage={viewerProps.frontstageProvider}
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

const IModelLoader = (props: ModelLoaderProps) => {
  if (props.appInsightsKey) {
    return <TrackedLoader {...props} />;
  } else {
    return <Loader {...props} />;
  }
};

export default IModelLoader;
