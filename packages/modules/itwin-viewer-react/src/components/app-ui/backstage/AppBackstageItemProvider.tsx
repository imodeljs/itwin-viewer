/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { IModelApp } from "@bentley/imodeljs-frontend";
import { BackstageItem, BackstageItemUtilities } from "@bentley/ui-abstract";

export class AppBackstageItemProvider {
  /** id of provider */
  public readonly id = "itwin-viewer-react.AppBackstageItemProvider";

  private _backstageItems: ReadonlyArray<BackstageItem> | undefined = undefined;

  public get backstageItems(): ReadonlyArray<BackstageItem> {
    if (!this._backstageItems) {
      this._backstageItems = [
        BackstageItemUtilities.createStageLauncher(
          "DefaultFrontstage",
          100,
          10,
          IModelApp.i18n.translate("iTwinViewer:backstage.mainFrontstage"),
          undefined,
          "icon-placeholder"
        ),
      ];
    }
    return this._backstageItems;
  }
}
