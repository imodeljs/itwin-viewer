/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { FrontendAuthorizationClient } from "@bentley/frontend-authorization-client";
import { BentleyCloudRpcParams } from "@bentley/imodeljs-common";
import { UserManager } from "oidc-client";

/**
 * List of possible hosted backends that the iTwin Viewer can use
 */
export enum IModelBackend {
  GeneralPurpose = "general-purpose-imodeljs-backend",
  DesignReview = "navigator-backend",
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
  title: IModelBackend;
  /* SF/K8S */
  hostType: IModelBackendHost;
  /* in the form "vx.x" */
  version: string;
}

/**
 * Custom rpc configuration
 */
export interface CustomBackendConfig {
  rpcParams: BentleyCloudRpcParams;
}

/**
 * Authorization options. Must provide one.
 */
export interface AuthorizationOptions {
  /** provide an existing iModel.js authorization client */
  oidcClient?: FrontendAuthorizationClient;
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
}

export interface ItwinViewerInitializerParams {
  /** optional Azure Application Insights key for telemetry */
  appInsightsKey?: string;
  /** options to override the default backend (design-review) */
  backend?: IModelBackendOptions;
  /** GPRID for the consuming application. Will default to the iTwin Viewer GPRID */
  productId?: string;
}
