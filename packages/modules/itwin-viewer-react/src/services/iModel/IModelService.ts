/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Id64String, OpenMode } from "@bentley/bentleyjs-core";
import { RemoteBriefcaseConnection } from "@bentley/imodeljs-frontend";

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
    // else create a new connection
    const connection = await RemoteBriefcaseConnection.open(
      projectId,
      imodelId,
      OpenMode.Readonly
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
