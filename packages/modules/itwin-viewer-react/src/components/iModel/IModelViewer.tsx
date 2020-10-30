/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { BackstageItem, BackstageItemUtilities } from "@bentley/ui-abstract";
import {
  ConfigurableUiContent,
  FrameworkVersion,
  FrontstageManager,
  FrontstageProvider,
  ThemeManager,
} from "@bentley/ui-framework";
import React, { useEffect, useState } from "react";

import { ViewerFrontstage } from "../../types";
import AppBackstageComposer from "../app-ui/backstage/AppBackstageComposer";

interface ModelProps {
  frontstages: ViewerFrontstage[];
}

export const IModelViewer: React.FC<ModelProps> = ({
  frontstages,
}: ModelProps) => {
  const [backstageItems, setBackstageItems] = useState<BackstageItem[]>([]);

  useEffect(() => {
    let defaultFrontstage: FrontstageProvider | undefined;
    const backstageLaunchers = new Array<BackstageItem>();
    let newItemPriority = 20;
    frontstages.forEach((viewerFrontstage) => {
      // register the provider
      if (
        !FrontstageManager.findFrontstageDef(
          viewerFrontstage.provider.frontstageDef?.id
        )
      ) {
        FrontstageManager.addFrontstageProvider(viewerFrontstage.provider);
      }
      // override the default (last wins)
      if (viewerFrontstage.default) {
        defaultFrontstage = viewerFrontstage.provider;
      }

      // add a backstage item for the frontstage
      backstageLaunchers.push(
        BackstageItemUtilities.createStageLauncher(
          viewerFrontstage.id,
          viewerFrontstage.groupPriority ?? 100,
          viewerFrontstage.itemPriority ?? newItemPriority,
          viewerFrontstage.label,
          viewerFrontstage.subtitle,
          viewerFrontstage.icon,
          viewerFrontstage.overrides
        )
      );

      newItemPriority = newItemPriority + 10;
    });
    // set the active frontstage to the current defaul
    if (defaultFrontstage) {
      FrontstageManager.setActiveFrontstageDef(
        defaultFrontstage.frontstageDef
      ).catch((err) => console.error(err));
    }
    // set the backstage items for the composer
    setBackstageItems(backstageLaunchers);
  }, [frontstages]);

  const frameworkVersion =
    (process.env.REACT_APP_FRAMEWORK_VERSION as FrameworkVersion) || "1";

  // there will always be at least one (for the default frontstage). Wait for it to be loaded into the list before rendering the content
  return backstageItems.length > 0 ? (
    <ThemeManager>
      <FrameworkVersion version={frameworkVersion}>
        <ConfigurableUiContent
          appBackstage={<AppBackstageComposer items={backstageItems} />}
        />
      </FrameworkVersion>
    </ThemeManager>
  ) : null;
};
