# Change Log - @bentley/itwin-viewer-react

This log was last generated on Mon, 01 Feb 2021 18:57:57 GMT and should not be manually modified.

## 5.10.0
Mon, 01 Feb 2021 18:57:57 GMT

### Minor changes

- Add the ability to provide UI providers to the viewer

## 5.9.0
Wed, 27 Jan 2021 13:46:09 GMT

### Minor changes

- better handle data-related errors and allow configurability of message

## 5.8.2
Tue, 26 Jan 2021 20:28:07 GMT

### Patches

- move up UiFramework.setIModelConnection in order to be able to fetch connection from StateManager in the onIModelConnected callback

## 5.8.1
Mon, 25 Jan 2021 21:51:38 GMT

### Patches

- Add message for empty iModels

## 5.8.0
Fri, 22 Jan 2021 17:10:24 GMT

### Minor changes

- Add the ability to provide additional rpc interfaces to be registered

## 5.7.0
Fri, 18 Dec 2020 13:05:20 GMT

### Minor changes

- Add the ability to provide addiitonal i18n namespaces to register

## 5.6.0
Thu, 17 Dec 2020 20:52:12 GMT

### Minor changes

- Add the ability to provide options to the IModelViewportControl in the default frontstage

## 5.5.0
Wed, 16 Dec 2020 20:28:48 GMT

### Minor changes

- Replace selection tree with the packged visibility tree

## 5.4.2
Thu, 10 Dec 2020 14:50:58 GMT

### Patches

- Fixes for the property grid

## 5.4.1
Tue, 01 Dec 2020 21:06:06 GMT

### Patches

- Switch to the property-grid-react package

## 5.4.0
Wed, 18 Nov 2020 22:13:04 GMT

### Minor changes

- Add the ability to hide individual default tools

## 5.3.0
Wed, 18 Nov 2020 15:12:01 GMT

### Minor changes

- Add the SnapMode tool to the status bar

## 5.2.0
Thu, 12 Nov 2020 15:18:47 GMT

### Minor changes

- default to UI framework version 2; add prop to change

## 5.1.4
Wed, 11 Nov 2020 20:36:10 GMT

### Patches

- allow a default frontstage to render without an iModel connection unless otherwise specified

## 5.1.3
Wed, 11 Nov 2020 20:24:23 GMT

### Patches

- Initialize FrameworkUiAdmin at startup so popup like context menus, tool settings, cards, and toolbars can be shown and hidden via ImodelApp.uiAdmin calls.

## 5.1.2
Tue, 10 Nov 2020 16:51:42 GMT

### Patches

- fix test

## 5.1.1
Mon, 09 Nov 2020 18:43:01 GMT

### Patches

- fix bug where viewer would not render with a default frontstage and no model

## 5.1.0
Mon, 09 Nov 2020 14:12:37 GMT

### Minor changes

- Add the ability to provide additional frontstages and backstage launchers for them

## 5.0.0
Tue, 27 Oct 2020 16:50:34 GMT

### Breaking changes

- add support for desktop apps with local snapshots

## 4.2.1
Tue, 20 Oct 2020 12:57:12 GMT

### Patches

- Remove designreview from list of backends we support by default. rename selectionscope namespace"

## 4.2.0
Tue, 13 Oct 2020 17:54:10 GMT

### Minor changes

- Add the ability to customize the iModel.js i18n url template

## 4.1.0
Mon, 12 Oct 2020 18:02:11 GMT

### Minor changes

- Add callback function when the iModel connection is established

## 4.0.1
Mon, 12 Oct 2020 00:25:40 GMT

### Patches

- Fix BUDDI prop check and add ErrorBoundary to the Viewer component

## 4.0.0
Mon, 05 Oct 2020 19:05:40 GMT

### Breaking changes

- Rename projectId to contextId

## 3.0.2
Wed, 30 Sep 2020 19:47:56 GMT

### Patches

- Add props to README

## 3.0.1
Tue, 29 Sep 2020 13:28:31 GMT

### Patches

- Added bottom panel to defaultFrontstage
- Also added left panel to defaultFrontstage

## 3.0.0
Wed, 23 Sep 2020 20:36:01 GMT

### Breaking changes

- Upgrade minimum iModel.js version to 2.6.4 and fix issues with telemetry

## 2.0.1
Fri, 11 Sep 2020 12:13:08 GMT

### Patches

- always instantiate i18n

## 2.0.0
Tue, 08 Sep 2020 18:28:22 GMT

### Breaking changes

- Upgrade minimum iModel.js version

## 1.5.1
Thu, 27 Aug 2020 17:57:28 GMT

### Patches

- Fix corner item logic

## 1.5.0
Thu, 27 Aug 2020 14:13:34 GMT

### Minor changes

- Add the ability to hide default UI items

## 1.4.1
Tue, 25 Aug 2020 18:10:23 GMT

*Version update only*

## 1.4.0
Tue, 25 Aug 2020 11:54:15 GMT

### Minor changes

- Add support for extension args

## 1.3.1
Fri, 21 Aug 2020 19:02:15 GMT

### Patches

- remove unused dependency

## 1.3.0
Fri, 21 Aug 2020 13:33:12 GMT

### Minor changes

- Remove default theme and add support for querying models by changeSetId

## 1.2.0
Wed, 19 Aug 2020 14:57:28 GMT

### Minor changes

- Add a parameter for color theme

## 1.1.4
Tue, 18 Aug 2020 16:01:21 GMT

*Version update only*

## 1.1.3
Tue, 18 Aug 2020 13:47:01 GMT

### Patches

- add keywords to package.json and remove yarn references

## 1.1.2
Thu, 13 Aug 2020 18:28:26 GMT

### Patches

- Redux adjustments for extension support

## 1.1.1
Thu, 13 Aug 2020 17:43:14 GMT

### Patches

- add note regarding Webpack plugin to README

## 1.1.0
Wed, 12 Aug 2020 19:17:57 GMT

### Minor changes

- Get latest changeset from a named version, if it exists, by default

