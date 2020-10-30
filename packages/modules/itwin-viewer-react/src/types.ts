/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { FrontendAuthorizationClient } from "@bentley/frontend-authorization-client";
import {
  BentleyCloudRpcParams,
  ElectronRpcParams,
} from "@bentley/imodeljs-common";
import {
  DesktopAuthorizationClient,
  IModelConnection,
} from "@bentley/imodeljs-frontend";
import {
  BackstageStageLauncher,
  ConditionalStringValue,
} from "@bentley/ui-abstract";
import { ColorTheme, FrontstageProvider } from "@bentley/ui-framework";
import { UserManager } from "oidc-client";

/**
 * List of possible hosted backends that the iTwin Viewer can use
 */
export enum IModelBackend {
  GeneralPurpose = "general-purpose-imodeljs-backend",
}

/**
 * Host type (Service Fabric or Kubernetes)
 */
export enum IModelBackendHost {
  ServiceFabric = "SF",
  K8S = "K8S",
}

/**
 * Hosted backend configuration
 */
export interface HostedBackendConfig {
  /* title for rpc config */
  title: IModelBackend | string;
  /* SF/K8S */
  hostType: IModelBackendHost;
  /* in the form "vx.x" */
  version: string;
}

/**
 * Custom rpc configuration
 */
export interface CustomBackendConfig {
  rpcParams: BentleyCloudRpcParams | ElectronRpcParams;
}

/**
 * Authorization options. Must provide one.
 */
export interface AuthorizationOptions {
  /** provide an existing iModel.js authorization client */
  oidcClient?: FrontendAuthorizationClient | DesktopAuthorizationClient;
  /** reference to a function that returns a pre-configured oidc UserManager */
  getUserManagerFunction?: () => UserManager;
}

/**
 * Backend configuration
 */
export interface IModelBackendOptions {
  hostedBackend?: HostedBackendConfig;
  customBackend?: CustomBackendConfig;
  buddiRegion?: number;
  buddiServer?: string;
}

export interface ViewerFrontstage {
  /** unique id */
  id: string;
  /** frontstage provider to register */
  provider: FrontstageProvider;
  /** label for the backstage launcher */
  label: string | ConditionalStringValue;
  /** should this be the default frontstage? If multiple are defined as default, the last will be used */
  default?: boolean;
  /** priority of the item's group */
  groupPriority?: number;
  /** priority of the item within the group */
  itemPriority?: number;
  /** subtitle for the backstage launcher */
  subtitle?: string | ConditionalStringValue;
  /** icon for the backstage launcher */
  icon?: string | ConditionalStringValue;
  /** overrides for the backstage launcher */
  overrides?: Partial<BackstageStageLauncher>;
}

/**
 * iTwin Viewer parameter list
 */
export interface ItwinViewerParams extends ItwinViewerCommonParams {
  /** id of the html element where the viewer should be rendered */
  elementId: string;
}

export interface ItwinViewerCommonParams extends ItwinViewerInitializerParams {
  /** authorization configuration */
  authConfig: AuthorizationOptions;
  /** color theme */
  theme?: ColorTheme | string;
  /** Default UI configuration */
  defaultUiConfig?: ItwinViewerUi;
  /** Optional callback function when iModel is connected */
  onIModelConnected?: (iModel: IModelConnection) => void;
  /** additional frontstages to register */
  frontstages?: ViewerFrontstage[];
}

export interface ItwinViewerInitializerParams {
  /** optional Azure Application Insights key for telemetry */
  appInsightsKey?: string;
  /** optional iModel.js Application Insights key for telemetry within iModel.js */
  imjsAppInsightsKey?: string;
  /** options to override the default backend (general-purpose-imodeljs-backend) */
  backend?: IModelBackendOptions;
  /** GPRID for the consuming application. Will default to the iTwin Viewer GPRID */
  productId?: string;
  /** urlTemplate for querying i18n json files */
  i18nUrlTemplate?: string;
  /** is this in the context of a desktop/electron app */
  desktopApp?: boolean;
}

/**
 * Configure options for the top left corner item
 */
export interface CornerItem {
  hideDefault?: boolean;
  item?: React.ReactNode;
}

/**
 * Configure options for the content manipulation section
 */
export interface ContentManipulationTools {
  cornerItem?: CornerItem;
  hideDefaultHorizontalItems?: boolean;
  hideDefaultVerticalItems?: boolean;
}

/**
 * Configure options for the navigation section
 */
export interface ViewNavigationTools {
  hideDefaultHorizontalItems?: boolean;
  hideDefaultVerticalItems?: boolean;
}

/**
 * Configure options for the default UI
 */
export interface ItwinViewerUi {
  contentManipulationTools?: ContentManipulationTools;
  navigationTools?: ViewNavigationTools;
  hideToolSettings?: boolean;
  hideTreeView?: boolean;
  hidePropertyGrid?: boolean;
  hideDefaultStatusBar?: boolean;
}
