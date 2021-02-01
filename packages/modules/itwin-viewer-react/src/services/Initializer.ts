/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { ClientRequestContext } from "@bentley/bentleyjs-core";
import { Config } from "@bentley/bentleyjs-core";
import { FrontendApplicationInsightsClient } from "@bentley/frontend-application-insights-client";
import {
  BentleyCloudRpcParams,
  RpcInterface,
  RpcInterfaceDefinition,
} from "@bentley/imodeljs-common";
import { IModelApp, IModelAppOptions } from "@bentley/imodeljs-frontend";
import { I18N } from "@bentley/imodeljs-i18n";
import { UrlDiscoveryClient } from "@bentley/itwin-client";
import { Presentation } from "@bentley/presentation-frontend";
import { PropertyGridManager } from "@bentley/property-grid-react";
import { TreeWidget } from "@bentley/tree-widget-react";
import { UiItemsManager } from "@bentley/ui-abstract";
import { UiComponents } from "@bentley/ui-components";
import { UiCore } from "@bentley/ui-core";
import {
  AppNotificationManager,
  ConfigurableUiManager,
  FrameworkReducer,
  FrameworkUiAdmin,
  StateManager,
  UiFramework,
} from "@bentley/ui-framework";

import { initRpc } from "../config/rpc";
import { IModelBackendOptions, ItwinViewerInitializerParams } from "../types";
import { ai, trackEvent } from "./telemetry/TelemetryService";

// initialize required iModel.js services
class Initializer {
  private static _initialized: Promise<void>;
  private static _initializing = false;
  private static _iModelDataErrorMessage: string | undefined;
  private static _synchronizerRootUrl: string | undefined;

  /** initialize rpc */
  private static async _initializeRpc(
    backendOptions?: IModelBackendOptions,
    isDesktop?: boolean,
    additionalRpcInterfaces?: RpcInterfaceDefinition<RpcInterface>[]
  ): Promise<void> {
    // if rpc params for a custom backend are provided, initialized with those
    if (
      backendOptions?.customBackend &&
      backendOptions.customBackend.rpcParams
    ) {
      return initRpc(
        backendOptions.customBackend.rpcParams,
        isDesktop,
        additionalRpcInterfaces
      );
    }
    const rpcParams = await this._getHostedConnectionInfo(backendOptions);
    if (rpcParams) {
      return initRpc(rpcParams, isDesktop, additionalRpcInterfaces);
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

  public static async getSynchronizerUrl(
    contextId: string,
    iModelId: string
  ): Promise<string> {
    if (!this._synchronizerRootUrl) {
      const urlDiscoveryClient = new UrlDiscoveryClient();
      this._synchronizerRootUrl = await urlDiscoveryClient.discoverUrl(
        new ClientRequestContext(),
        "itwinbridgeportal",
        Config.App.get("imjs_buddi_resolve_url_using_region")
      );
    }
    const portalUrl = `${this._synchronizerRootUrl}/${contextId}/${iModelId}`;
    return IModelApp.i18n.translateWithNamespace(
      "iTwinViewer",
      "iModels.synchronizerLink",
      {
        bridgePortal: portalUrl,
      }
    );
  }

  /** expose initialized promise */
  public static get initialized(): Promise<void> {
    return this._initialized;
  }

  /** Message to display when there are iModel data-related errors */
  public static async getIModelDataErrorMessage(
    contextId: string,
    iModelId: string,
    prefix?: string
  ): Promise<string> {
    if (this._iModelDataErrorMessage !== undefined) {
      return prefix
        ? `${prefix} ${this._iModelDataErrorMessage}`
        : this._iModelDataErrorMessage;
    }
    const synchronizerPortalUrl = await this.getSynchronizerUrl(
      contextId,
      iModelId
    );
    return prefix
      ? `${prefix} ${synchronizerPortalUrl}`
      : synchronizerPortalUrl;
  }

  /** shutdown IModelApp */
  static async shutdown(): Promise<void> {
    await IModelApp.shutdown();
  }

  /** add required values to Config.App */
  static setupEnv(options?: IModelBackendOptions): void {
    Config.App.merge({
      imjs_buddi_url:
        options?.buddiServer !== undefined
          ? options.buddiServer
          : "https://buddi.bentley.com/WebService",
      imjs_buddi_resolve_url_using_region:
        options?.buddiRegion !== undefined ? options.buddiRegion : 0,
    });
  }

  /** initialize required iModel.js services */
  public static async initialize(
    iModelAppOptions?: IModelAppOptions,
    viewerOptions?: ItwinViewerInitializerParams
  ): Promise<void> {
    // IModelApp is already initialized.
    // Potentially a second viewer
    if (IModelApp.initialized && !this._initializing) {
      this._initialized = Promise.resolve();
      return;
    } else if (this._initializing) {
      // in the process of initializing, so return
      return;
    } else {
      // start initializing
      this._initializing = true;
    }

    this._initialized = new Promise(async (resolve, reject) => {
      try {
        const appOptions = iModelAppOptions ? { ...iModelAppOptions } : {};

        // Use the AppNotificationManager subclass from ui-framework to get prompts and messages
        appOptions.notifications = new AppNotificationManager();

        // Set FrameworkUiAdmin as default uiAdmin which is used to display context menus, (toolbars, card, tool setting) popups and dialogs.
        appOptions.uiAdmin = new FrameworkUiAdmin();

        // Initialize state manager for extensions to have access to extending the redux store
        // This will setup a singleton store inside the StoreManager class.
        new StateManager({
          frameworkState: FrameworkReducer,
        });

        // Set the GPRID to the iTwinViewer. Revisit exposing if we need to use the app's version instead
        appOptions.applicationId = viewerOptions?.productId ?? "3098";

        // if ITWIN_VIEWER_HOME is defined, the viewer is likely being served from another origin
        const viewerHome = (window as any).ITWIN_VIEWER_HOME;
        if (viewerHome) {
          console.log(`resources served from: ${viewerHome}`);
        }

        appOptions.i18n = new I18N("iModelJs", {
          urlTemplate: viewerOptions?.i18nUrlTemplate
            ? viewerOptions.i18nUrlTemplate
            : viewerHome && `${viewerHome}/locales/{{lng}}/{{ns}}.json`,
        });

        this.setupEnv(viewerOptions?.backend);

        await IModelApp.startup(appOptions);

        // execute the iModelApp initialization callback if provided
        if (viewerOptions?.onIModelAppInit) {
          viewerOptions.onIModelAppInit();
        }

        // Add iModelJS ApplicationInsights telemetry client if a key is provided
        if (viewerOptions?.imjsAppInsightsKey) {
          const imjsApplicationInsightsClient = new FrontendApplicationInsightsClient(
            viewerOptions.imjsAppInsightsKey
          );
          IModelApp.telemetry.addClient(imjsApplicationInsightsClient);
        }

        // Add the app's telemetry client if a key was provided
        if (viewerOptions?.appInsightsKey) {
          ai.initialize(viewerOptions?.appInsightsKey);
          IModelApp.telemetry.addClient(ai);
        }

        // initialize localization for the app
        const viewerNamespace = "iTwinViewer";
        let i18nNamespaces = [viewerNamespace];
        if (viewerOptions?.additionalI18nNamespaces) {
          i18nNamespaces = i18nNamespaces.concat(
            viewerOptions.additionalI18nNamespaces
          );
        }
        const i18nPromises = i18nNamespaces.map(
          async (ns) => IModelApp.i18n.registerNamespace(ns).readFinished
        );

        await Promise.all(i18nPromises);

        // initialize UiCore
        await UiCore.initialize(IModelApp.i18n);

        // initialize UiComponents
        await UiComponents.initialize(IModelApp.i18n);

        // initialize UiFramework
        // Use undefined so that UiFramework uses StateManager
        await UiFramework.initialize(undefined, IModelApp.i18n);

        // initialize Presentation
        await Presentation.initialize({
          activeLocale: IModelApp.i18n.languageList()[0],
        });

        // allow uiAdmin to open key-in palette when Ctrl+F2 is pressed - good for manually loading extensions
        IModelApp.uiAdmin.updateFeatureFlags({ allowKeyinPalette: true });

        ConfigurableUiManager.initialize();

        // initialize RPC communication
        await Initializer._initializeRpc(
          viewerOptions?.backend,
          viewerOptions?.desktopApp,
          viewerOptions?.additionalRpcInterfaces
        );

        if (viewerOptions?.appInsightsKey) {
          trackEvent("iTwinViewer.Viewer.Initialized");
        }

        await PropertyGridManager.initialize(IModelApp.i18n);

        await TreeWidget.initialize(IModelApp.i18n);

        // override the defaut daa error message
        this._iModelDataErrorMessage = viewerOptions?.iModelDataErrorMessage;

        viewerOptions?.uiProviders?.forEach((uiProvider) => {
          UiItemsManager.register(uiProvider);
        });

        console.log("iModel.js initialized");

        this._initializing = false;
        resolve();
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  }
}

export default Initializer;
