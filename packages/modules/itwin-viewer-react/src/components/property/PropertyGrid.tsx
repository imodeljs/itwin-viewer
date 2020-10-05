/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import "./PropertyGrid.themed.scss";

import { Logger } from "@bentley/bentleyjs-core";
import { GetMetaDataFunction } from "@bentley/imodeljs-common";
import { IModelApp, IModelConnection } from "@bentley/imodeljs-frontend";
import { AuthorizedClientRequestContext } from "@bentley/itwin-client";
import { Toaster } from "@bentley/itwin-error-handling-react";
import { Field } from "@bentley/presentation-common";
import {
  PresentationPropertyDataProvider,
  propertyGridWithUnifiedSelection,
} from "@bentley/presentation-components";
import { Presentation } from "@bentley/presentation-frontend";
import { SettingsStatus } from "@bentley/product-settings-client";
import { PropertyRecord } from "@bentley/ui-abstract";
import {
  ActionButtonRenderer,
  ActionButtonRendererProps,
  PropertyCategory,
  PropertyData,
  PropertyGrid,
  PropertyGridContextMenuArgs,
  PropertyValueRendererManager,
} from "@bentley/ui-components";
import {
  ContextMenuItem,
  ContextMenuItemProps,
  GlobalContextMenu,
  Orientation,
} from "@bentley/ui-core";
import { ConfigurableCreateInfo, WidgetControl } from "@bentley/ui-framework";
import React, { useEffect, useState } from "react";
import { connect } from "react-redux";

import styles from "./PropertyGrid.module.scss";
import { copyToClipboard } from "./WebUtilities";

type ContextMenuItemInfo = ContextMenuItemProps &
  React.Attributes & { label: string };

const loggingCategory = "itwin-property-grid";
const sharedNamespace = "favoriteProperties";
const sharedName = "sharedProps";
const logWarning = (message: string, getMetaData?: GetMetaDataFunction) =>
  Logger.logWarning(loggingCategory, message, getMetaData);

const UnifiedSelectionPropertyGrid = propertyGridWithUnifiedSelection(
  PropertyGrid
);

export class PropertyDataProvider extends PresentationPropertyDataProvider {
  private _parentIsFieldFavorite = this.isFieldFavorite;
  private _enableFavorites = false;
  constructor(iModelConnection: IModelConnection, rulesetId: string) {
    super({ imodel: iModelConnection, ruleset: rulesetId });
    this.pagingSize = 50;
  }
  public toggleFavorites = (turnOn: boolean) =>
    (this._enableFavorites = turnOn);
  protected isFieldFavorite = (field: Field): boolean =>
    this._enableFavorites ? this._parentIsFieldFavorite(field) : false; // tslint:disable-line:naming-convention

  /** Expand categories by default */
  public async getData(): Promise<PropertyData> {
    const data = await super.getData();
    const newCategories = data.categories.map((value: PropertyCategory) => {
      return { ...value, expand: true };
    });
    data.categories = newCategories;
    return data;
  }
}

interface PropertyGridFeatureTracking {
  trackCopyPropertyText?: () => void;
}

interface PropertyGridProps {
  imodel: IModelConnection;
  i18nNamespace: string;
  rootClassName: string;
  contextId?: string;
  debugLog?: (...args: any[]) => void;
  featureTracking?: PropertyGridFeatureTracking;
  rulesetId?: string;
}

const getRequestContext = async (contextId: string | undefined) => {
  const token = await IModelApp.authorizationClient!.getAccessToken();

  const requestContext =
    token && contextId ? new AuthorizedClientRequestContext(token) : undefined;

  return requestContext;
};

export const ViewerPropertyGrid = connect(undefined)(
  (props: PropertyGridProps) => {
    const {
      imodel,
      contextId,
      debugLog,
      featureTracking,
      rulesetId,
      i18nNamespace,
      rootClassName,
    } = props;
    const translate = (key: string) =>
      IModelApp.i18n.translateWithNamespace(
        i18nNamespace,
        `propertygrid.${key}`
      );
    const [dataProvider, setDataProvider] = useState<PropertyDataProvider>();
    const [selectedLabel, setSelectedLabel] = useState<PropertyRecord>();
    const [contextMenu, setContextMenu] = useState<
      PropertyGridContextMenuArgs
    >();
    const [contextMenuItemInfos, setContextMenuItemInfos] = useState<
      ContextMenuItemInfo[]
    >();
    const [sharedFavorites, setSharedFavorites] = useState<string[]>();

    useEffect(() => {
      // The correct location for these XML presentation rules is actually in the BACKEND assets/presentation_rules directory.
      // Apparently we can create json rulesets that we can apply on the frontend but as Kevin noted, the xml rulesets cause errors
      // if you try to load them via the Presentation.presentation.rulesets() apis.
      // Our backend currently deploys "Items" and "Classes" rulesets, and "Items" seems to do what we need for now.
      setDataProvider(new PropertyDataProvider(imodel, rulesetId ?? "Items"));
    }, [imodel, rulesetId]);

    useEffect(() => {
      const onDataChangedHandler = async () => {
        try {
          let data = await dataProvider?.getData();
          if (data) {
            // Get shared favorites & add to data
            let newSharedFavs: string[] = [];

            const requestContext = await getRequestContext(contextId);

            if (requestContext && contextId) {
              const result = await IModelApp.settings.getSharedSetting(
                requestContext,
                sharedNamespace,
                sharedName,
                false,
                contextId,
                imodel.iModelId
              );
              if (result.setting?.slice) {
                newSharedFavs = (result.setting as Array<string>).slice();
              }
              setSharedFavorites(newSharedFavs);
            }
            if (data.categories[0]?.name !== "Favorite") {
              data.categories.unshift({
                name: "Favorite",
                label: "Favorite",
                expand: true,
              });
              data.records["Favorite"] = [];
            }
            const dataFavs = data.records["Favorite"];

            for (const cat of data.categories) {
              if (cat.name !== "Favorite") {
                for (const rec of data.records[cat.name]) {
                  const propName = rec.property.name;
                  const shared =
                    newSharedFavs &&
                    newSharedFavs?.findIndex(
                      (fav: string) => rec.property.name === fav
                    ) >= 0;
                  if (
                    shared &&
                    !dataFavs.find(
                      (favRec: PropertyRecord) =>
                        favRec.property.name === propName
                    )
                  ) {
                    // if shared & not already in favorites
                    dataFavs.push(rec);
                    const propertyField = await dataProvider?.getFieldByPropertyRecord(
                      rec
                    );
                    if (propertyField) {
                      await Presentation.favoriteProperties.add(
                        propertyField,
                        contextId
                      );
                    }
                  }
                }
              }
            }
            if (dataFavs.length === 0) {
              // If there are no favorites, delete the favorite category
              data.categories.splice(0, 1);
              delete data.records["Favorite"];
            }
            const newData = await dataProvider?.getData();
            if (newData) {
              data = newData;
            }
            debugLog?.(
              "Data Provider: Got Properties: " + JSON.stringify(data)
            );
          }
          if (data?.label) {
            setSelectedLabel(data.label);
          }
        } catch (err) {
          Toaster.error(err.message, { type: "temporary" });
        }
      };

      dataProvider?.toggleFavorites(true);

      // returns the unsubscribe function which will be called before running this effect again
      return dataProvider?.onDataChanged.addListener(onDataChangedHandler);
    }, [dataProvider, debugLog, sharedFavorites, imodel.iModelId, contextId]);

    const onAddFavorite = async (propertyField: Field) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      Presentation.favoriteProperties.add(propertyField, contextId);
      setContextMenu(undefined);
    };

    const onRemoveFavorite = async (propertyField: Field) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      Presentation.favoriteProperties.remove(propertyField, contextId);
      setContextMenu(undefined);
    };

    const onShareFavorite = async (propName: string) => {
      const requestContext = await getRequestContext(contextId);

      if (!requestContext || !contextId || !sharedFavorites) {
        setContextMenu(undefined);
        return;
      }
      sharedFavorites.push(propName);
      const result = await IModelApp.settings.saveSharedSetting(
        requestContext,
        sharedFavorites,
        sharedNamespace,
        sharedName,
        false,
        contextId,
        imodel.iModelId
      );
      if (result.status !== SettingsStatus.Success) {
        throw new Error(
          "Could not share favoriteProperties: " + result.errorMessage
        );
      }
      const result2 = await IModelApp.settings.getSharedSetting(
        requestContext,
        sharedNamespace,
        sharedName,
        false,
        contextId,
        imodel.iModelId
      );
      if (result2.status !== SettingsStatus.Success) {
        throw new Error(
          "Could not share favoriteProperties: " + result2.errorMessage
        );
      }
      setContextMenu(undefined);
    };

    const onUnshareFavorite = async (propName: string) => {
      const requestContext = await getRequestContext(contextId);

      if (!requestContext || !contextId || !sharedFavorites) {
        setContextMenu(undefined);
        return;
      }
      const index = sharedFavorites.indexOf(propName);
      if (index > -1) {
        sharedFavorites.splice(index, 1);
      }
      const result = await IModelApp.settings.saveSharedSetting(
        requestContext,
        sharedFavorites,
        sharedNamespace,
        sharedName,
        false,
        contextId,
        imodel.iModelId
      );
      if (result.status !== SettingsStatus.Success) {
        throw new Error(
          "Could not unshare favoriteProperties: " + result.errorMessage
        );
      }
      setContextMenu(undefined);
    };

    const shareActionButtonRenderer: ActionButtonRenderer = (
      props: ActionButtonRendererProps
    ) => {
      const shared =
        sharedFavorites !== undefined &&
        sharedFavorites?.findIndex(
          (fav: string) => props.property.property.name === fav
        ) >= 0;
      return (
        <div>
          {shared && (
            <span
              className="icon icon-share"
              style={{ paddingRight: "5px" }}
            ></span>
          )}
        </div>
      );
    };

    const onCopyText = async (property: PropertyRecord) => {
      if (property.description) {
        copyToClipboard(property.description);
      } else {
        logWarning(
          "PROPERTIES COPY TEXT FAILED TO RUN DUE TO UNDEFINED PROPERTY RECORD DESCRIPTION"
        );
      }
      setContextMenu(undefined);
    };

    const buildContextMenu = async (args: PropertyGridContextMenuArgs) => {
      const field = await dataProvider?.getFieldByPropertyRecord(
        args.propertyRecord
      );
      const items: ContextMenuItemInfo[] = [];
      if (field !== undefined) {
        if (
          sharedFavorites &&
          sharedFavorites?.findIndex(
            (fav: string) => args.propertyRecord.property.name === fav
          ) >= 0
        ) {
          // i.e. if shared
          items.push({
            key: "unshare-favorite",
            onSelect: () =>
              onUnshareFavorite(args.propertyRecord.property.name),
            title: translate("context-menu.unshare-favorite.description"),
            label: translate("context-menu.unshare-favorite.label"),
          });
        } else if (Presentation.favoriteProperties.has(field, contextId)) {
          items.push({
            key: "share-favorite",
            onSelect: () => onShareFavorite(args.propertyRecord.property.name),
            title: translate("context-menu.share-favorite.description"),
            label: translate("context-menu.share-favorite.label"),
          });
          items.push({
            key: "remove-favorite",
            onSelect: () => onRemoveFavorite(field),
            title: translate("context-menu.remove-favorite.description"),
            label: translate("context-menu.remove-favorite.label"),
          });
        } else {
          items.push({
            key: "add-favorite",
            onSelect: () => onAddFavorite(field),
            title: translate("context-menu.add-favorite.description"),
            label: translate("context-menu.add-favorite.label"),
          });
        }
      }

      items.push({
        key: "copy-text",
        onSelect: async () => {
          featureTracking?.trackCopyPropertyText?.();
          await onCopyText(args.propertyRecord);
        },
        title: translate("context-menu.copy-text.description"),
        label: translate("context-menu.copy-text.label"),
      });

      setContextMenuItemInfos(items.length > 0 ? items : undefined);
    };

    const onPropertyContextMenu = (args: PropertyGridContextMenuArgs) => {
      args.event.persist();
      setContextMenu(args.propertyRecord.isMerged ? undefined : args);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      buildContextMenu(args);
    };

    const onContextMenuOutsideClick = () => setContextMenu(undefined);
    const onContextMenuEsc = () => setContextMenu(undefined);

    const renderContextMenu = () => {
      if (!contextMenu || !contextMenuItemInfos) {
        return undefined;
      }

      const items: React.ReactNode[] = [];
      contextMenuItemInfos.forEach((info: ContextMenuItemInfo) =>
        items.push(
          <ContextMenuItem
            key={info.key}
            onSelect={info.onSelect}
            title={info.title}
          >
            {info.label}
          </ContextMenuItem>
        )
      );

      return (
        <GlobalContextMenu
          opened={true}
          onOutsideClick={onContextMenuOutsideClick}
          onEsc={onContextMenuEsc}
          identifier="PropertiesWidget"
          x={contextMenu?.event.clientX}
          y={contextMenu?.event.clientY}
        >
          {items}
        </GlobalContextMenu>
      );
    };

    if (!dataProvider) {
      return <div />;
    }
    return (
      <div className={rootClassName}>
        <div>{translate("title")}</div>
        <div className={styles.propertyPanelClass}>
          {selectedLabel &&
            PropertyValueRendererManager.defaultManager.render(selectedLabel)}
        </div>
        <UnifiedSelectionPropertyGrid
          dataProvider={dataProvider}
          orientation={Orientation.Vertical}
          isPropertySelectionEnabled={true}
          isPropertyHoverEnabled={true}
          onPropertyContextMenu={onPropertyContextMenu}
          actionButtonRenderers={[shareActionButtonRenderer]}
        />
        {renderContextMenu()}
      </div>
    );
  }
);

export class PropertyGridWidget extends WidgetControl {
  constructor(info: ConfigurableCreateInfo, options: any) {
    super(info, options);

    if (options.iModelConnection) {
      this.reactElement = (
        <ViewerPropertyGrid
          imodel={options.iModelConnection}
          contextId={options.contextId}
          rootClassName={"property-grid"}
          i18nNamespace={"iTwinViewer"}
        />
      );
    }
  }
}
