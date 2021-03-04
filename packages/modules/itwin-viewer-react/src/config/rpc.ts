/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import {
  BentleyCloudRpcManager,
  BentleyCloudRpcParams,
  ElectronRpcManager,
  ElectronRpcParams,
  IModelReadRpcInterface,
  IModelTileRpcInterface,
  RpcInterface,
  RpcInterfaceDefinition,
  SnapshotIModelRpcInterface,
} from "@bentley/imodeljs-common";
import { PresentationRpcInterface } from "@bentley/presentation-common";

const getSupportedRpcs = (
  additionalRpcInterfaces: RpcInterfaceDefinition<RpcInterface>[]
) => {
  return [
    IModelReadRpcInterface,
    IModelTileRpcInterface,
    PresentationRpcInterface,
    SnapshotIModelRpcInterface,
    ...additionalRpcInterfaces,
  ];
};

export const initRpc = (
  rpcParams: BentleyCloudRpcParams | ElectronRpcParams,
  isDesktop = false,
  additionalRpcInterfaces?: RpcInterfaceDefinition<RpcInterface>[]
) => {
  if (isDesktop) {
    ElectronRpcManager.initializeClient(
      rpcParams as ElectronRpcParams,
      getSupportedRpcs(additionalRpcInterfaces || [])
    );
  } else {
    BentleyCloudRpcManager.initializeClient(
      rpcParams as BentleyCloudRpcParams,
      getSupportedRpcs(additionalRpcInterfaces || [])
    );
  }
};
