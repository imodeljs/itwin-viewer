/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  ExternalServerExtensionLoader,
  IModelApp,
} from "@bentley/imodeljs-frontend";
import React, { useEffect, useState } from "react";

import { AuthorizationOptions } from "../";
import Initializer from "../services/Initializer";
import { getAuthClient } from "../services/ItwinViewer";
import { IModelBackendOptions, ItwinViewerCommonParams } from "../types";
import IModelLoader from "./iModel/IModelLoader";

export interface ViewerExtension {
  name: string;
  url?: string;
  version?: string;
}

export interface ViewerProps extends ItwinViewerCommonParams {
  projectId: string;
  iModelId: string;
  extensions?: ViewerExtension[];
}

interface ExtensionUrl {
  url: string;
  loaded: boolean;
}

interface ExtensionInstance {
  name: string;
  loaded: boolean;
  version?: string;
}

export const Viewer = ({
  authConfig,
  extensions,
  iModelId,
  projectId,
  appInsightsKey,
  backend,
  productId,
}: ViewerProps) => {
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
            .loadExtension(extensionInstance.name, extensionInstance.version)
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
        { appInsightsKey, backend, productId }
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
    <IModelLoader projectId={projectId} iModelId={iModelId} />
  ) : null;
};
