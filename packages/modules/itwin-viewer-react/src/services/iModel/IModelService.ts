/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Id64String, OpenMode } from "@bentley/bentleyjs-core";
import { IModelHubClient, VersionQuery } from "@bentley/imodelhub-client";
import { IModelVersion } from "@bentley/imodeljs-common";
import {
  IModelApp,
  RemoteBriefcaseConnection,
} from "@bentley/imodeljs-frontend";
import { AuthorizedClientRequestContext } from "@bentley/itwin-client";

/** determine the proper version of the iModel to open
 * 1. If named versions exist, get the named version that contains the latest changeset
 * 2. If no named version exists, return the latest changeset
 */
const getVersion = async (iModelId: string): Promise<IModelVersion> => {
  const token = await IModelApp.authorizationClient?.getAccessToken();
  if (token) {
    const requestContext = new AuthorizedClientRequestContext(token);
    const hubClient = new IModelHubClient();
    const namedVersions = await hubClient.versions.get(
      requestContext,
      iModelId,
      new VersionQuery().top(1)
    );
    // if there is a named version (version with the latest changeset "should" be at the top), return the version as of its changeset
    // otherwise return the version as of the latest changeset
    return namedVersions.length === 1 && namedVersions[0].changeSetId
      ? IModelVersion.asOfChangeSet(namedVersions[0].changeSetId)
      : IModelVersion.latest();
  }
  return IModelVersion.latest();
};

/** parse the comma-delimited config value that is a list of accepted schema:classnames or return a default */
const getAcceptedViewClasses = (): string[] => {
  const acceptedClasses = [];
  // TODO is this accurate for the viewer? Need to be configurable
  acceptedClasses.push("BisCore:SpatialViewDefinition");
  return acceptedClasses;
};

/** open and return an IModelConnection from a project's wsgId and an imodel's wsgId */
export const openImodel = async (
  projectId: string,
  imodelId: string
): Promise<RemoteBriefcaseConnection | undefined> => {
  try {
    // get the version to query
    const version = await getVersion(imodelId);
    // else create a new connection
    const connection = await RemoteBriefcaseConnection.open(
      projectId,
      imodelId,
      OpenMode.Readonly,
      version
    );
    console.log(connection);
    return connection;
  } catch (error) {
    console.error(
      `Error opening the iModel: ${imodelId} in Project: ${projectId}`,
      error
    );
    throw error;
  }
};

/** Return the proper views based on the accepted classes
 */
export const getDefaultViewIds = async (
  imodel: RemoteBriefcaseConnection
): Promise<Id64String[]> => {
  const viewSpecs = await imodel.views.queryProps({});
  const acceptedViewClasses = getAcceptedViewClasses();
  const acceptedViewSpecs = viewSpecs.filter(
    (spec) => acceptedViewClasses.indexOf(spec.classFullName) !== -1
  );
  if (acceptedViewSpecs.length < 1) {
    throw new Error("No valid view definitions in imodel");
  }
  const ids = acceptedViewSpecs.map((spec) => {
    return spec.id as Id64String;
  });
  return ids;
};
