/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { BlankConnectionProps } from "@bentley/imodeljs-frontend";
import { ErrorBoundary } from "@bentley/itwin-error-handling-react";
import React, { useEffect, useState } from "react";

import Initializer from "../services/Initializer";
import { getAuthClient } from "../services/ItwinViewer";
import {
  BlankConnectionViewState,
  ItwinViewerCommonParams,
  ItwinViewerUi,
  ViewerExtension,
} from "../types";
import IModelLoader from "./iModel/IModelLoader";

export interface BlankViewerProps extends ItwinViewerCommonParams {
  blankConnection: BlankConnectionProps;
  viewStateOptions?: BlankConnectionViewState;
  extensions?: ViewerExtension[];
}

export const BlankViewer: React.FC<BlankViewerProps> = ({
  authConfig,
  extensions,
  appInsightsKey,
  backend,
  productId,
  theme,
  defaultUiConfig,
  imjsAppInsightsKey,
  onIModelConnected,
  i18nUrlTemplate,
  desktopApp,
  frontstages,
  backstageItems,
  onIModelAppInit,
  uiFrameworkVersion,
  viewportOptions,
  additionalI18nNamespaces,
  additionalRpcInterfaces,
  uiProviders,
  toolAdmin,
  blankConnection,
  viewStateOptions,
}: BlankViewerProps) => {
  const [iModelJsInitialized, setIModelJsInitialized] = useState<boolean>(
    false
  );
  const [uiConfig, setUiConfig] = useState<ItwinViewerUi>();

  useEffect(() => {
    if (!iModelJsInitialized) {
      const authClient = getAuthClient(authConfig);
      Initializer.initialize(
        { authorizationClient: authClient, toolAdmin },
        {
          appInsightsKey,
          backend,
          productId,
          imjsAppInsightsKey,
          i18nUrlTemplate,
          desktopApp,
          onIModelAppInit,
          additionalI18nNamespaces,
          additionalRpcInterfaces,
        }
      )
        .then(() => {
          Initializer.initialized
            .then(() => setIModelJsInitialized(true))
            .catch((error) => {
              throw error;
            });
        })
        .catch((error) => {
          throw error;
        });
    }
    return Initializer.cancel;
  }, [authConfig]);

  useEffect(() => {
    // hide the property grid and treeview by default, but allow to be overridden via props
    const defaultBlankViewerUiConfig: ItwinViewerUi = {
      hidePropertyGrid: true,
      hideTreeView: true,
    };
    const blankViewerUiConfig = {
      ...defaultBlankViewerUiConfig,
      ...defaultUiConfig,
    };
    setUiConfig(blankViewerUiConfig);
  }, [defaultUiConfig]);

  return iModelJsInitialized ? (
    <ErrorBoundary>
      <IModelLoader
        defaultUiConfig={uiConfig}
        appInsightsKey={appInsightsKey}
        onIModelConnected={onIModelConnected}
        frontstages={frontstages}
        backstageItems={backstageItems}
        uiFrameworkVersion={uiFrameworkVersion}
        viewportOptions={viewportOptions}
        blankConnection={blankConnection}
        blankConnectionViewState={viewStateOptions}
        uiProviders={uiProviders}
        theme={theme}
        extensions={extensions}
      />
    </ErrorBoundary>
  ) : null;
};
