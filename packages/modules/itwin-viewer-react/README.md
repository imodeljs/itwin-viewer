# iTwin-Viewer-React

The iTwin Viewer is a configurable iModel.js viewer that offers basic tooling and widgets out-of-the-box and can be further extended through the use of [iModel.js extensions](https://github.com/imodeljs/extension-sample). This package contains the Viewer as a React component and some additional Typescript API's.

# Installation

```
yarn add @bentley/itwin-viewer-react
```

or

```
npm install @bentley/itwin-viewer-react
```

# Usage

## Dependencies

Currently, in order to use the iTwin Viewer with iModel.js extensions, the consuming application would need to be compiled using Webpack with the IModeljsLibraryExportsPlugin that is in the [@bentley/webpack-tools-core](https://www.npmjs.com/package/@bentley/webpack-tools-core) package:

In your webpack.config file:

```javascript
    plugins: [
      // NOTE: iModel.js specific plugin to allow exposing iModel.js shared libraries
      // into the global scope for use within iModel.js Extensions.
      new IModeljsLibraryExportsPlugin(),
```

If you are creating a new application and are using React, it is advised to use create-react-app with @bentley/react-scripts, which already include this plugin, as well as some other optimizations:

```
npx create-react-app my-app --scripts-version @bentley/react-scripts --template typescript
```

## React component

```javascript
import { Viewer, ViewerExtension } from "@bentley/itwin-viewer-react";
import React, { useState, useEffect } from "react";
/**
 * The following is a function that returns an instance of an oidc-client UserManager that is configured to authorize an iModel.js backend connection via the Bentley IMS authority
 * See https://github.com/imodeljs/itwin-viewer/blob/master/packages/apps/viewer-sample-react/src/components/home/UserManagerHome.tsx and https://github.com/imodeljs/itwin-viewer/blob/master/packages/apps/viewer-sample-react/src/services/auth/OidcClient.ts for an example
 * Alternatively, you can pass an iModel.js AuthorizationClient to the oidcClient property of the authConfig prop
 * See https://github.com/imodeljs/itwin-viewer/blob/master/packages/apps/viewer-sample-react/src/components/home/AuthClientHome.tsx and https://github.com/imodeljs/itwin-viewer/blob/master/packages/apps/viewer-sample-react/src/services/auth/AuthorizationClient.ts for an example
 */
import { getUserManager } from "./MyOidcClient";

export const UserManagerHome = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const contextId = "myConnectProjectId";
  const iModelId = "myIModelId";

  // list of extensions with their name and url where they are being served
  const extensions: ViewerExtension[] = [
    {
      name: "dialogItemsSample",
    },
  ];

  useEffect(() => {
    getUserManager()
      .getUser()
      .then((user) => {
        if (user && !user.expired) {
          setLoggedIn(true);
        }
      });
  }, []);

  return (
    <div>
      {loggedIn && (
        <Viewer
          authConfig={{ getUserManagerFunction: getUserManager }}
          contextId={contextId}
          iModelId={iModelId}
          extensions={extensions}
        />
      )}
    </div>
  );
};
```

### Props

#### Required

##### Web

- `contextId` - GUID for the context (project, asset, etc.) that contains the model that you wish to view
- `iModelId` - GUID for the iModel that you wish to view
- `authConfig` - an instance of an iModel.js [FrontendAuthorizationClient](https://www.imodeljs.org/reference/frontend-authorization-client/authorization/frontendauthorizationclient/) or a function that returns an oidc-client UserManager

##### Desktop

- `contextId` - GUID for the context (project, asset, etc.) that contains the model that you wish to view (it should be ommitted if using a snapshotPath instead)
- `iModelId` - GUID for the iModel that you wish to view (it should be ommitted if using a snapshotPath instead)
- `snapshotPath` - path to a local snapshot file (it should be ommitted if using a contextId/iModelId)
- `authConfig` - an instance of an iModel.js `DesktopAuthorizationClient` or a function that returns an oidc-client UserManager
- `desktopApp` - set to `true` to notify the Viewer that it is being used in a native desktop application

#### Optional

- `changeSetId` - changeset id to view if combined with the contextId and iModelId props
- `extensions` - array of extensions to load in the viewer
- `backend` - backend connection info (defaults to the General Purpose backend)
- `theme` - override the default theme
- `defaultUIConfig` - hide or override default tooling and widgets
  - `contentManipulationTools` - options for the content manipulation section (top left)
    - `cornerItem` - replace the default backstage navigation button with a new item
    - `hideDefaultHorizontalItems` - hide all horizontal tools in the top left section of the viewer
    - `hideDefaultVerticalItems` - hide all vertical tools in the top left section of the viewer
    - `verticalItems`
      - `selectTool` - hide the select tool
      - `measureTools` - hide the measure tools
      - `sectionTools` - hide the section tools
    - `horizontalItems`
      - `clearSelection` - hide the clear selection tool
      - `clearHideIsolateEmphasizeElements` - hide the clear hide/isolate/emphasize elements tool
      - `hideElements` - hide the hide elements tool
      - `isolateElements` - hide the isolate elements tool
      - `emphasizeElements` - hide the emphasize elements tool
  - `navigationTools` - options for the navigation section (top right)
    - `hideDefaultHorizontalItems` - hide all horizontal tools in the top right section of the viewer
    - `hideDefaultVerticalItems` - hide all vertical tools in the top right section of the viewer
    - `verticalItems`
      - `walkView` - hide the walk tool
      - `cameraView` - hide the camera tool
    - `horizontalItems`
      - `rotateView` - hide the rotate tool
      - `panView` - hide the pan tool
      - `fitView` - hide the fit view tool
      - `windowArea` - hide the window area tool
      - `undoView` - hide the undo view changes tool
      - `redoView` - hide the redo view changes tool
  - `hideToolSettings` - hide the contextual tool settings
  - `hideTreeView` - hide the tree view widget
  - `hidePropertyGrid` - hide the property grid widget
  - `hideDefaultStatusBar` - hide the status bar
- `productId` - application's GPRID
- `appInsightsKey` - Application Insights key for telemetry
- `imjsAppInsightsKey` - Application Insights key for iModel.js telemetry
- `onIModelConnected` - Callback function that executes after the iModel connection is successful and contains the iModel connection as a parameter
- `i18nUrlTemplate` - Override the default url template where i18n resource files are queried
- `frontstages` - Provide additional frontstages for the viewer to render
- `backstageItems` - Provide additional backstage items for the viewer's backstage composer
- `onIModelAppInit` - Callback function that executes after IModelApp.startup completes
- `viewportOptions` - Additional options for the default frontstage's IModelViewportControl
- `additionalI18nNamespaces` - Additional i18n namespaces to register
- `additionalRpcInterfaces` - Additional rpc interfaces to register (assumes that they are supported in your backend)
- `iModelDataErrorMessage` - Override the default message that sends users to the iTwin Synchronization Portal when there are data-related errors with an iModel. Pass empty string to override with no message.

## Typescript API

```html
<html>
  <div id="viewerRoot">
</html>
```

```javascript
import { ItwinViewer } from "@bentley/itwin-viewer-react";
// function that returns an instance of an oidc-client UserManager that is configured to authorize an iModel.js backend connection via the Bentley IMS authority
import { getUserManager } from "./MyOidcClient";

const contextId = "myConnectProjectId";
const iModelId = "myIModelId";

const viewer = new iTwinViewer({
  elementId: "viewerRoot",
  authConfig: {
    getUserManagerFunction: getUserManager,
  },
});

if (viewer) {
  viewer.addExtension("dialogItemsSample");
  viewer.load({ contextId, iModelId });
}
```

# Development

When making changes to the src, run `yarn start` in the dev folder to enable source watching and rebuild, so the dev-server will have access to updated code on succesful code compilation.
