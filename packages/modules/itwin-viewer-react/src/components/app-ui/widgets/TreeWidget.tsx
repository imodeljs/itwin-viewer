/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { ConfigurableCreateInfo, WidgetControl } from "@bentley/ui-framework";
import * as React from "react";

import SimpleTreeComponent from "../tree/Tree";

/** A widget control for displaying the Tree React component */
export class TreeWidget extends WidgetControl {
  constructor(info: ConfigurableCreateInfo, options: any) {
    super(info, options);

    if (options.iModelConnection) {
      this.reactElement = (
        <SimpleTreeComponent imodel={options.iModelConnection} />
      );
    }
  }
}
