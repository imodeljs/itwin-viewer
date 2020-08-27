/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/** Clone of core BasicNavigationWidget with conditional tooling
 */
import {
  CommonToolbarItem,
  ToolbarOrientation,
  ToolbarUsage,
} from "@bentley/ui-abstract";
import {
  CoreTools,
  NavigationWidgetComposer,
  ToolbarComposer,
  ToolbarHelper,
} from "@bentley/ui-framework";
import * as React from "react";

import { ViewNavigationTools } from "../../../types";
import { useUiVisibility } from "./BasicToolWidget";

export interface BasicNavigationWidgetProps {
  config?: ViewNavigationTools;
}

/** Basic Navigation Widget that provides standard tools to manipulate views containing element data.
 * Supports the specification of additional horizontal and vertical toolbar items through props.
 */
export function BasicNavigationWidget({ config }: BasicNavigationWidgetProps) {
  const getHorizontalToolbarItems = React.useCallback((): CommonToolbarItem[] => {
    if (config?.hideDefaultHorizontalItems) {
      return [];
    }
    const items: CommonToolbarItem[] = ToolbarHelper.createToolbarItemsFromItemDefs(
      [
        CoreTools.rotateViewCommand,
        CoreTools.panViewCommand,
        CoreTools.fitViewCommand,
        CoreTools.windowAreaCommand,
        CoreTools.viewUndoCommand,
        CoreTools.viewRedoCommand,
      ]
    );
    return items;
  }, [config]);

  const getVerticalToolbarItems = React.useCallback((): CommonToolbarItem[] => {
    if (config?.hideDefaultVerticalItems) {
      return [];
    }
    const items: CommonToolbarItem[] = [];
    items.push(
      ToolbarHelper.createToolbarItemFromItemDef(10, CoreTools.walkViewCommand),
      ToolbarHelper.createToolbarItemFromItemDef(
        20,
        CoreTools.toggleCameraViewCommand
      )
    );
    return items;
  }, [config]);

  const [horizontalItems, setHorizontalItems] = React.useState(() =>
    getHorizontalToolbarItems()
  );
  const [verticalItems, setVerticalItems] = React.useState(() =>
    getVerticalToolbarItems()
  );

  const isInitialMount = React.useRef(true);
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      setHorizontalItems(getHorizontalToolbarItems());
      setVerticalItems(getVerticalToolbarItems());
    }
  }, [getHorizontalToolbarItems, getVerticalToolbarItems]);

  const uiIsVisible = useUiVisibility();
  const className = !uiIsVisible ? "nz-hidden" : "";

  return (
    <NavigationWidgetComposer
      className={className}
      horizontalToolbar={
        <ToolbarComposer
          items={horizontalItems}
          usage={ToolbarUsage.ViewNavigation}
          orientation={ToolbarOrientation.Horizontal}
        />
      }
      verticalToolbar={
        <ToolbarComposer
          items={verticalItems}
          usage={ToolbarUsage.ViewNavigation}
          orientation={ToolbarOrientation.Vertical}
        />
      }
    />
  );
}
