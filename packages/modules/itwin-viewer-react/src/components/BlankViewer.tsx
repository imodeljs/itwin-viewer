/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import {
  BlankConnectionProps,
  ExternalServerExtensionLoader,
  IModelApp,
} from "@bentley/imodeljs-frontend";
import { ErrorBoundary } from "@bentley/itwin-error-handling-react";
import { UiFramework } from "@bentley/ui-framework";
import React, { useEffect, useState } from "react";

import Initializer from "../services/Initializer";
import { getAuthClient } from "../services/ItwinViewer";
import {
  BlankConnectionViewState,
  ExtensionInstance,
  ExtensionUrl,
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
  const [extensionUrls, setExtensionUrls] = useState<ExtensionUrl[]>([]);
  const [extensionInstances, setExtensionInstances] = useState<
    ExtensionInstance[]
  >([]);
  const [iModelJsInitialized, setIModelJsInitialized] = useState<boolean>(
    false
  );
  const [extensionsLoaded, setExtensionsLoaded] = useState<boolean>(
    !extensions
  );
  const [uiConfig, setUiConfig] = useState<ItwinViewerUi>();

  useEffect(() => {
    //TODO add the ability to remove extensions?
    const urls = [...extensionUrls];
    const instances = [...extensionInstances];
    let urlsUpdated = false;
    let instancesUpdated = false;
    extensions?.forEach((extension) => {
      const url = extension.url;
      if (url) {
        if (!urls.some((extensionUrl) => extensionUrl.url === url)) {
          urls.push({ url, loaded: false });
          urlsUpdated = true;
        }
      }

      if (
        !instances.some(
          (extensionInstance) => extensionInstance.name === extension.name
        )
      ) {
        instances.push({
          name: extension.name,
          loaded: false,
          version: extension.version,
          args: extension.args,
        });
        instancesUpdated = true;
      }
    });
    if (urlsUpdated) {
      setExtensionUrls(urls);
    }
    if (instancesUpdated) {
      setExtensionInstances(instances);
    }
  }, [extensions]);

  useEffect(() => {
    if (iModelJsInitialized) {
      extensionUrls?.forEach((extensionUrl) => {
        if (!extensionUrl.loaded) {
          IModelApp.extensionAdmin.addExtensionLoaderFront(
            new ExternalServerExtensionLoader(extensionUrl.url)
          );
          extensionUrl.loaded = true;
        }
      });
    }
  }, [extensionUrls, iModelJsInitialized]);

  useEffect(() => {
    if (iModelJsInitialized) {
      extensionInstances?.forEach((extensionInstance) => {
        if (!extensionInstance.loaded) {
          IModelApp.extensionAdmin
            .loadExtension(
              extensionInstance.name,
              extensionInstance.version,
              extensionInstance.args
            )
            .then(() => (extensionInstance.loaded = true))
            .catch((error) => {
              throw error;
            });
        }
      });
      setExtensionsLoaded(true);
    }
  }, [extensionInstances, iModelJsInitialized]);

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
    if (iModelJsInitialized) {
      if (theme) {
        // use the provided theme
        UiFramework.setColorTheme(theme);
      }
    }
  }, [theme, iModelJsInitialized]);

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
