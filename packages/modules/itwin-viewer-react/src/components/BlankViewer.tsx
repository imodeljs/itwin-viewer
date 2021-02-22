/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { BlankConnectionProps } from "@bentley/imodeljs-frontend";
import { ErrorBoundary } from "@bentley/itwin-error-handling-react";
import React, { useEffect, useState } from "react";

import { useExtensions, useTheme } from "../hooks";
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
  blankConnection,
  viewStateOptions,
}: BlankViewerProps) => {
  const [iModelJsInitialized, setIModelJsInitialized] = useState<boolean>(
    false
  );
  const [uiConfig, setUiConfig] = useState<ItwinViewerUi>();
  const extensionsLoaded = useExtensions(iModelJsInitialized, extensions);
  useTheme(iModelJsInitialized, theme);

  useEffect(() => {
    if (!iModelJsInitialized) {
      const authClient = getAuthClient(authConfig);
      Initializer.initialize(
        { authorizationClient: authClient },
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
          uiProviders,
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

  return iModelJsInitialized && extensionsLoaded ? (
    <ErrorBoundary>
      <IModelLoader
        uiConfig={uiConfig}
        appInsightsKey={appInsightsKey}
        onIModelConnected={onIModelConnected}
        frontstages={frontstages}
        backstageItems={backstageItems}
        uiFrameworkVersion={uiFrameworkVersion}
        viewportOptions={viewportOptions}
        blankConnection={blankConnection}
        blankConnectionViewState={viewStateOptions}
      />
    </ErrorBoundary>
  ) : null;
};
