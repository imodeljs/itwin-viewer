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
  SnapshotIModelRpcInterface,
} from "@bentley/imodeljs-common";
import { PresentationRpcInterface } from "@bentley/presentation-common";

const getSupportedRpcs = () => {
  return [
    IModelReadRpcInterface,
    IModelTileRpcInterface,
    PresentationRpcInterface,
    SnapshotIModelRpcInterface,
  ];
};

export const initRpc = (
  rpcParams: BentleyCloudRpcParams | ElectronRpcParams,
  isDesktop?: boolean
) => {
  if (isDesktop) {
    ElectronRpcManager.initializeClient(
      rpcParams as ElectronRpcParams,
      getSupportedRpcs()
    );
  } else {
    BentleyCloudRpcManager.initializeClient(
      rpcParams as BentleyCloudRpcParams,
      getSupportedRpcs()
    );
  }
};
