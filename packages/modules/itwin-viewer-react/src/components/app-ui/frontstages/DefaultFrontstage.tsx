/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Id64 } from "@bentley/bentleyjs-core";
import { ViewState } from "@bentley/imodeljs-frontend";
import {
  BasicNavigationWidget,
  BasicToolWidget,
  ContentGroup,
  ContentLayoutDef,
  ContentViewManager,
  CoreTools,
  Frontstage,
  FrontstageProvider,
  IModelViewportControl,
  StagePanel,
  SyncUiEventId,
  UiFramework,
  Widget,
  WidgetState,
  Zone,
  ZoneLocation,
  ZoneState,
} from "@bentley/ui-framework";
import * as React from "react";

import { PropertyGridWidget } from "../../property";
import { AppStatusBarWidget } from "../statusbars/AppStatusBar";
import { TreeWidget } from "../widgets/TreeWidget";

/**
 * Default Frontstage for the iTwinViewer
 */
export class DefaultFrontstage extends FrontstageProvider {
  // constants
  static MAIN_CONTENT_ID = "Main";
  static DEFAULT_TOOL_WIDGET_KEY = "DefaultToolWidget";
  static DEFAULT_TOOL_SETTINGS_KEY = "DefaultToolSettings";
  static DEFAULT_NAVIGATION_WIDGET_KEY = "DefaultNavigationWidget";
  static DEFAULT_TREE_WIDGET_KEY = "DefaultTreeWidget";
  static DEFAULT_STATUS_BAR_WIDGET_KEY = "DefaultStatusBarWidget";
  static DEFAULT_PROPERTIES_WIDGET_KEY = "DefaultPropertiesWidgetKey";

  // Content layout for content views
  private _contentLayoutDef: ContentLayoutDef;

  // Content group for all layouts
  private _contentGroup: ContentGroup;

  constructor(public viewStates: ViewState[]) {
    super();

    this._contentLayoutDef = new ContentLayoutDef({
      id: DefaultFrontstage.MAIN_CONTENT_ID,
    });

    // Create the content group.
    this._contentGroup = new ContentGroup({
      contents: [
        {
          classId: IModelViewportControl,
          applicationData: {
            viewState: this.viewStates[0],
            iModelConnection: UiFramework.getIModelConnection(),
          },
        },
      ],
    });
  }

  /** Define the Frontstage properties */
  public get frontstage() {
    return (
      <Frontstage
        id="DefaultFrontstage"
        defaultTool={CoreTools.selectElementCommand}
        defaultLayout={this._contentLayoutDef}
        contentGroup={this._contentGroup}
        isInFooterMode={true}
        contentManipulationTools={
          <Zone
            widgets={[
              <Widget
                key={DefaultFrontstage.DEFAULT_TOOL_WIDGET_KEY}
                isFreeform={true}
                element={<BasicToolWidget />}
              />,
            ]}
          />
        }
        toolSettings={
          <Zone
            widgets={[
              <Widget
                key={DefaultFrontstage.DEFAULT_TOOL_SETTINGS_KEY}
                isToolSettings={true}
              />,
            ]}
          />
        }
        viewNavigationTools={
          <Zone
            widgets={[
              /** Use standard NavigationWidget delivered in ui-framework */
              <Widget
                key={DefaultFrontstage.DEFAULT_NAVIGATION_WIDGET_KEY}
                isFreeform={true}
                element={<BasicNavigationWidget />}
              />,
            ]}
          />
        }
        centerRight={
          <Zone
            defaultState={ZoneState.Minimized}
            allowsMerging={true}
            widgets={[
              <Widget
                key={DefaultFrontstage.DEFAULT_TREE_WIDGET_KEY}
                control={TreeWidget}
                fillZone={true}
                iconSpec="icon-tree"
                labelKey="iTwinViewer:components.tree"
                applicationData={{
                  iModelConnection: UiFramework.getIModelConnection(),
                }}
              />,
            ]}
          />
        }
        bottomRight={
          <Zone
            allowsMerging={true}
            mergeWithZone={ZoneLocation.CenterRight}
            widgets={[
              <Widget
                key={DefaultFrontstage.DEFAULT_PROPERTIES_WIDGET_KEY}
                control={PropertyGridWidget}
                defaultState={WidgetState.Hidden}
                fillZone={true}
                iconSpec="icon-properties-list"
                labelKey="iTwinViewer:components.properties"
                applicationData={{
                  iModelConnection: UiFramework.getIModelConnection(),
                  rulesetId: "Default",
                  projectId: UiFramework.getIModelConnection()?.contextId,
                }}
                syncEventIds={[SyncUiEventId.SelectionSetChanged]}
                stateFunc={_determineWidgetStateForSelectionSet}
              />,
            ]}
          />
        }
        statusBar={
          <Zone
            widgets={[
              <Widget
                key={DefaultFrontstage.DEFAULT_STATUS_BAR_WIDGET_KEY}
                isStatusBar={true}
                control={AppStatusBarWidget}
              />,
            ]}
          />
        }
        rightPanel={<StagePanel allowedZones={[6, 9]} />}
      />
    );
  }
}

const _determineWidgetStateForSelectionSet = (): WidgetState => {
  const activeContentControl = ContentViewManager.getActiveContentControl();
  if (
    activeContentControl?.viewport &&
    activeContentControl?.viewport.view.iModel.selectionSet.size > 0
  ) {
    for (const id of activeContentControl.viewport.view.iModel.selectionSet.elements.values()) {
      if (Id64.isValid(id) && !Id64.isTransient(id)) {
        return WidgetState.Open;
      }
    }
  }
  return WidgetState.Closed;
};
