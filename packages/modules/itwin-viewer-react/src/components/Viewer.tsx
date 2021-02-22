/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { ErrorBoundary } from "@bentley/itwin-error-handling-react";
import React, { useEffect, useState } from "react";

import { useExtensions, useTheme, useUiProviders } from "../hooks";
import Initializer from "../services/Initializer";
import { getAuthClient } from "../services/ItwinViewer";
import { ItwinViewerCommonParams, ViewerExtension } from "../types";
import IModelLoader from "./iModel/IModelLoader";

export interface ViewerProps extends ItwinViewerCommonParams {
  contextId?: string;
  iModelId?: string;
  extensions?: ViewerExtension[];
  changeSetId?: string;
  snapshotPath?: string;
}

export const Viewer: React.FC<ViewerProps> = ({
  authConfig,
  extensions,
  iModelId,
  contextId,
  appInsightsKey,
  backend,
  productId,
  theme,
  changeSetId,
  defaultUiConfig,
  imjsAppInsightsKey,
  onIModelConnected,
  i18nUrlTemplate,
  snapshotPath,
  desktopApp,
  frontstages,
  backstageItems,
  onIModelAppInit,
  uiFrameworkVersion,
  viewportOptions,
  additionalI18nNamespaces,
  additionalRpcInterfaces,
  uiProviders,
}: ViewerProps) => {
  const [iModelJsInitialized, setIModelJsInitialized] = useState<boolean>(
    false
  );
  const extensionsLoaded = useExtensions(iModelJsInitialized, extensions);
  useTheme(iModelJsInitialized, theme);
  useUiProviders(iModelJsInitialized, uiProviders);

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

  return iModelJsInitialized && extensionsLoaded ? (
    <ErrorBoundary>
      <IModelLoader
        contextId={contextId}
        iModelId={iModelId}
        changeSetId={changeSetId}
        uiConfig={defaultUiConfig}
        appInsightsKey={appInsightsKey}
        onIModelConnected={onIModelConnected}
        snapshotPath={snapshotPath}
        frontstages={frontstages}
        backstageItems={backstageItems}
        uiFrameworkVersion={uiFrameworkVersion}
        viewportOptions={viewportOptions}
      />
    </ErrorBoundary>
  ) : null;
};
