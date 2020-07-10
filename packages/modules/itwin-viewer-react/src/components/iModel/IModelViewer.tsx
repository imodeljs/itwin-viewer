/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { IModelConnection } from "@bentley/imodeljs-frontend";
import {
  ConfigurableUiContent,
  FrameworkVersion,
  FrontstageManager,
  ThemeManager,
} from "@bentley/ui-framework";
import React, { useEffect } from "react";

import { AppBackstageComposer } from "../app-ui/backstage/AppBackstageComposer";
import { DefaultFrontstage } from "../app-ui/frontstages/DefaultFrontstage";

interface ModelProps {
  iModel: IModelConnection;
  frontstage: DefaultFrontstage;
}

export const IModelViewer = ({ frontstage }: ModelProps) => {
  useEffect(() => {
    // Need to call setActiveFrontstageDef in the useEffect as required by iModelJs at this time for proper widget initialization
    // First render will call this twice (on render and in useEffect), but it's necessary for now
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    FrontstageManager.setActiveFrontstageDef(frontstage.frontstageDef);
  }, [frontstage]);

  // N.B. make checks to see if we really need to add the fronstage (initializes the fronstagedef) or set it active. When threads are created
  // this is called multiple times and we lose opened XSection/Profile views because the content layout resets (briefly until the thread
  // restores its snapshot).
  if (
    !frontstage.frontstageDef ||
    !FrontstageManager.findFrontstageDef(frontstage.frontstageDef.id)
  ) {
    FrontstageManager.addFrontstageProvider(frontstage);
  }
  if (
    !FrontstageManager.activeFrontstageDef ||
    (frontstage.frontstageDef &&
      FrontstageManager.activeFrontstageDef.id !== frontstage.frontstageDef.id)
  ) {
    // Need to set here so that the activefrontstagedef is set prior to rendering the model
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    FrontstageManager.setActiveFrontstageDef(frontstage.frontstageDef);
  }

  const frameworkVersion =
    (process.env.REACT_APP_FRAMEWORK_VERSION as FrameworkVersion) || "1";

  return (
    <ThemeManager>
      <FrameworkVersion version={frameworkVersion}>
        <ConfigurableUiContent appBackstage={<AppBackstageComposer />} />
      </FrameworkVersion>
    </ThemeManager>
  );
};
