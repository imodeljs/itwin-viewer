/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Id64 } from "@bentley/bentleyjs-core";
import { ViewState } from "@bentley/imodeljs-frontend";
import {
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

import { ItwinViewerUi } from "../../../types";
import { PropertyGridWidget } from "../../property";
import { AppStatusBarWidget } from "../statusbars/AppStatusBar";
import { BasicNavigationWidget, BasicToolWidget, TreeWidget } from "../widgets";

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

  private _uiConfig?: ItwinViewerUi;

  constructor(public viewStates: ViewState[], uiConfig?: ItwinViewerUi) {
    super();

    this._uiConfig = uiConfig;

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
                element={
                  <BasicToolWidget
                    config={this._uiConfig?.contentManipulationTools}
                  />
                }
              />,
            ]}
          />
        }
        toolSettings={
          <Zone
            widgets={
              !this._uiConfig?.hideToolSettings
                ? [
                    <Widget
                      key={DefaultFrontstage.DEFAULT_TOOL_SETTINGS_KEY}
                      isToolSettings={true}
                    />,
                  ]
                : []
            }
          />
        }
        viewNavigationTools={
          <Zone
            widgets={[
              <Widget
                key={DefaultFrontstage.DEFAULT_NAVIGATION_WIDGET_KEY}
                isFreeform={true}
                element={
                  <BasicNavigationWidget
                    config={this._uiConfig?.navigationTools}
                  />
                }
              />,
            ]}
          />
        }
        centerRight={
          <Zone
            defaultState={ZoneState.Minimized}
            allowsMerging={true}
            widgets={
              !this._uiConfig?.hideTreeView
                ? [
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
                  ]
                : []
            }
          />
        }
        bottomRight={
          <Zone
            allowsMerging={true}
            mergeWithZone={ZoneLocation.CenterRight}
            widgets={
              !this._uiConfig?.hidePropertyGrid
                ? [
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
                        contextId: UiFramework.getIModelConnection()?.contextId,
                      }}
                      syncEventIds={[SyncUiEventId.SelectionSetChanged]}
                      stateFunc={_determineWidgetStateForSelectionSet}
                    />,
                  ]
                : []
            }
          />
        }
        statusBar={
          <Zone
            widgets={
              !this._uiConfig?.hideDefaultStatusBar
                ? [
                    <Widget
                      key={DefaultFrontstage.DEFAULT_STATUS_BAR_WIDGET_KEY}
                      isStatusBar={true}
                      control={AppStatusBarWidget}
                    />,
                  ]
                : []
            }
          />
        }
        rightPanel={<StagePanel allowedZones={[6, 9]} />}
        bottomPanel={<StagePanel allowedZones={[7, 8, 9]} />}
        leftPanel={<StagePanel allowedZones={[1, 4, 7]} />}
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
