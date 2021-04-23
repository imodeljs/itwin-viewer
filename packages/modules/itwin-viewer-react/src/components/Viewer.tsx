/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { ErrorBoundary } from "@bentley/itwin-error-handling-react";
import React, { useEffect, useState } from "react";

import Initializer from "../services/Initializer";
import { getAuthClient } from "../services/ItwinViewer";
import { ItwinViewerCommonParams } from "../types";
import IModelLoader from "./iModel/IModelLoader";

export interface ViewerProps extends ItwinViewerCommonParams {
  contextId?: string;
  iModelId?: string;
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
  toolAdmin,
}: ViewerProps) => {
  const [iModelJsInitialized, setIModelJsInitialized] = useState<boolean>(
    false
  );
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
      return Initializer.cancel;
    }
  }, [authConfig]);

  return iModelJsInitialized ? (
    <ErrorBoundary>
      <IModelLoader
        contextId={contextId}
        iModelId={iModelId}
        changeSetId={changeSetId}
        defaultUiConfig={defaultUiConfig}
        appInsightsKey={appInsightsKey}
        onIModelConnected={onIModelConnected}
        snapshotPath={snapshotPath}
        frontstages={frontstages}
        backstageItems={backstageItems}
        uiFrameworkVersion={uiFrameworkVersion}
        viewportOptions={viewportOptions}
        uiProviders={uiProviders}
        theme={theme}
        extensions={extensions}
      />
    </ErrorBoundary>
  ) : null;
};
