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
  const projectId = "myConnectProjectId";
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
          projectId={projectId}
          iModelId={iModelId}
          extensions={extensions}
        />
      )}
    </div>
  );
};
```

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

const projectId = "myConnectProjectId";
const iModelId = "myIModelId";

const viewer = new iTwinViewer({
  elementId: "viewerRoot",
  authConfig: {
    getUserManagerFunction: getUserManager,
  },
});

if (viewer) {
  viewer.addExtension("dialogItemsSample");
  viewer.load(projectId, iModelId);
}
```

# Development

When making changes to the src, run `yarn start` in the dev folder to enable source watching and rebuild, so the dev-server will have access to updated code on succesful code compilation.
