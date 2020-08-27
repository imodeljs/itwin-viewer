/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/** Clone of core BasicToolWidget with conditional tooling
 */
import {
  CommonToolbarItem,
  ToolbarOrientation,
  ToolbarUsage,
} from "@bentley/ui-abstract";
import {
  BackstageAppButton,
  CoreTools,
  SelectionContextToolDefinitions,
  ToolbarComposer,
  ToolbarHelper,
  ToolWidgetComposer,
  UiFramework,
  UiVisibilityEventArgs,
} from "@bentley/ui-framework";
import * as React from "react";

import { ContentManipulationTools } from "../../../types";

export function useUiVisibility() {
  const [uiIsVisible, setUiIsVisible] = React.useState(
    UiFramework.getIsUiVisible()
  );
  React.useEffect(() => {
    const handleUiVisibilityChanged = (args: UiVisibilityEventArgs): void =>
      setUiIsVisible(args.visible);
    UiFramework.onUiVisibilityChanged.addListener(handleUiVisibilityChanged);
    return () => {
      UiFramework.onUiVisibilityChanged.removeListener(
        handleUiVisibilityChanged
      );
    };
  }, []);
  return uiIsVisible;
}

interface BasicToolWidgetProps {
  config?: ContentManipulationTools;
}

/** Default Tool Widget for standard "review" applications. Provides standard tools to review, and measure elements.
 * This definition will also show a overflow button if there is not enough room to display all the toolbar buttons.
 */
export function BasicToolWidget({ config }: BasicToolWidgetProps) {
  const getHorizontalToolbarItems = React.useCallback((): CommonToolbarItem[] => {
    if (config?.hideDefaultHorizontalItems) {
      return [];
    }
    const items: CommonToolbarItem[] = [];

    items.push(
      ToolbarHelper.createToolbarItemFromItemDef(
        10,
        CoreTools.clearSelectionItemDef
      ),
      ToolbarHelper.createToolbarItemFromItemDef(
        20,
        SelectionContextToolDefinitions.clearHideIsolateEmphasizeElementsItemDef
      ),
      ToolbarHelper.createToolbarItemFromItemDef(
        30,
        SelectionContextToolDefinitions.hideElementsItemDef
      ),
      ToolbarHelper.createToolbarItemFromItemDef(
        40,
        SelectionContextToolDefinitions.isolateElementsItemDef
      ),
      ToolbarHelper.createToolbarItemFromItemDef(
        50,
        SelectionContextToolDefinitions.emphasizeElementsItemDef
      )
    );

    return items;
  }, [config]);

  const getVerticalToolbarItems = React.useCallback((): CommonToolbarItem[] => {
    if (config?.hideDefaultVerticalItems) {
      return [];
    }
    const items: CommonToolbarItem[] = [];
    items.push(
      ToolbarHelper.createToolbarItemFromItemDef(
        10,
        CoreTools.selectElementCommand
      ),
      ToolbarHelper.createToolbarItemFromItemDef(
        20,
        CoreTools.measureToolGroup
      ),
      ToolbarHelper.createToolbarItemFromItemDef(30, CoreTools.sectionToolGroup)
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
    <ToolWidgetComposer
      className={className}
      cornerItem={
        config?.cornerItem?.item ??
        config?.cornerItem?.hideDefault ? undefined : (
          <BackstageAppButton />
        )
      }
      horizontalToolbar={
        <ToolbarComposer
          items={horizontalItems}
          usage={ToolbarUsage.ContentManipulation}
          orientation={ToolbarOrientation.Horizontal}
        />
      }
      verticalToolbar={
        <ToolbarComposer
          items={verticalItems}
          usage={ToolbarUsage.ContentManipulation}
          orientation={ToolbarOrientation.Vertical}
        />
      }
    />
  );
}
