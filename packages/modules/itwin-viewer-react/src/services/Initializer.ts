/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ClientRequestContext } from "@bentley/bentleyjs-core";
import { Config } from "@bentley/bentleyjs-core";
import { BentleyCloudRpcParams } from "@bentley/imodeljs-common";
import { IModelApp, IModelAppOptions } from "@bentley/imodeljs-frontend";
import { I18N } from "@bentley/imodeljs-i18n";
import { UrlDiscoveryClient } from "@bentley/itwin-client";
import { Presentation } from "@bentley/presentation-frontend";
import { UiComponents } from "@bentley/ui-components";
import { UiCore } from "@bentley/ui-core";
import { AppNotificationManager, UiFramework } from "@bentley/ui-framework";

import { AppUi } from "../components/app-ui/AppUi";
import { initRpc } from "../config/rpc";
import store from "../store";
import { IModelBackendOptions } from "../types";
import { ai, trackEvent } from "./telemetry/TelemetryService";

// initialize required iModel.js services
class Initializer {
  private static _initialized: Promise<void>;

  /** initialize rpc */
  private static async _initializeRpc(
    backendOptions?: IModelBackendOptions
  ): Promise<void> {
    // if rpc params for a custom backend are provided, initialized with those
    if (
      backendOptions?.customBackend &&
      backendOptions.customBackend.rpcParams
    ) {
      return initRpc(backendOptions.customBackend.rpcParams);
    }
    const rpcParams = await this._getHostedConnectionInfo(backendOptions);
    if (rpcParams) {
      return initRpc(rpcParams);
    }
  }

  /** get rpc connection info */
  private static async _getHostedConnectionInfo(
    backendOptions?: IModelBackendOptions
  ): Promise<BentleyCloudRpcParams | undefined> {
    const urlClient = new UrlDiscoveryClient();
    const requestContext = new ClientRequestContext();

    if (backendOptions?.hostedBackend) {
      if (!backendOptions.hostedBackend.hostType) {
        //TODO localize
        throw new Error("Please provide a host type for the iModel.js backend");
      }
      if (!backendOptions.hostedBackend.title) {
        //TODO localize
        throw new Error("Please provide the title for the iModel.js backend");
      }
      if (!backendOptions.hostedBackend.version) {
        //TODO localize
        throw new Error("Please provide a version for the iModel.js backend");
      }
      const orchestratorUrl = await urlClient.discoverUrl(
        requestContext,
        `iModelJsOrchestrator.${backendOptions.hostedBackend.hostType}`,
        backendOptions.buddiRegion
      );
      return {
        info: {
          title: backendOptions.hostedBackend.title,
          version: backendOptions.hostedBackend.version,
        },
        uriPrefix: orchestratorUrl,
      };
    } else {
      const orchestratorUrl = await urlClient.discoverUrl(
        requestContext,
        "iModelJsOrchestrator.K8S",
        backendOptions?.buddiRegion
      );
      return {
        info: { title: "general-purpose-imodeljs-backend", version: "v2.0" },
        uriPrefix: orchestratorUrl,
      };
    }
  }

  /** expose initialized promise */
  public static get initialized(): Promise<void> {
    return this._initialized;
  }

  /** shutdown IModelApp */
  static async shutdown() {
    await IModelApp.shutdown();
  }

  /** add required values to Config.App */
  static setupEnv(options?: IModelBackendOptions) {
    /* eslint-disable @typescript-eslint/camelcase */
    Config.App.merge({
      imjs_buddi_url: options?.buddiServer
        ? options.buddiServer
        : process.env.REACT_APP_BUDDI_SERVER ??
          "https://buddi.bentley.com/WebService",
      imjs_buddi_resolve_url_using_region: options?.buddiRegion
        ? options.buddiRegion
        : process.env.REACT_APP_BUDDI_REGION ?? 0,
    });
    /* eslint-enable @typescript-eslint/camelcase */
  }

  /** initialize required iModel.js services */
  public static async initialize(
    iModelAppOptions?: IModelAppOptions,
    appInsightsKey?: string,
    backendOptions?: IModelBackendOptions
  ): Promise<void> {
    // IModelApp is already initialized.
    // Potentially a second viewer
    if (IModelApp.initialized) {
      return;
    }

    this._initialized = new Promise(async (resolve, reject) => {
      try {
        iModelAppOptions = iModelAppOptions ?? {};

        // Use the AppNotificationManager subclass from ui-framework to get prompts and messages
        iModelAppOptions.notifications = new AppNotificationManager();

        // Set the GPRID to the iTwinViewer. Revisit exposing if we need to use the app's version instead
        iModelAppOptions.applicationId = "3098";

        // if ITWIN_VIEWER_HOME is defined, the viewer is likely being served from another origin
        const viewerHome = (window as any).ITWIN_VIEWER_HOME;
        if (viewerHome) {
          console.log(`resources served from: ${viewerHome}`);
          iModelAppOptions.i18n = new I18N("iModelJs", {
            urlTemplate: `${viewerHome}/locales/{{lng}}/{{ns}}.json`,
          });
        }

        this.setupEnv(backendOptions);
        ai.initialize(appInsightsKey);
        await IModelApp.startup(iModelAppOptions);

        // initialize localization for the app
        await IModelApp.i18n.registerNamespace("iTwinViewer").readFinished;

        // initialize UiCore
        await UiCore.initialize(IModelApp.i18n);

        // initialize UiComponents
        await UiComponents.initialize(IModelApp.i18n);

        // initialize UiFramework
        await UiFramework.initialize(store, IModelApp.i18n, "iModelCore");

        // initialize Presentation
        await Presentation.initialize({
          activeLocale: IModelApp.i18n.languageList()[0],
        });

        AppUi.initialize();

        // initialize RPC communication
        await Initializer._initializeRpc(backendOptions);

        trackEvent("iTwinViewer.Viewer.Initialized");
        console.log("iModel.js initialized");

        resolve();
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  }
}

export default Initializer;
