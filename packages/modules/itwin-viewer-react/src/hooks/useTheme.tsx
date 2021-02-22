/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { ColorTheme, UiFramework } from "@bentley/ui-framework";
import { useEffect } from "react";

export function useTheme(
  imjsInitialized: boolean,
  theme?: ColorTheme | string
): void {
  useEffect(() => {
    if (imjsInitialized && theme) {
      // use the provided theme
      UiFramework.setColorTheme(theme);
    }
  }, [theme, imjsInitialized]);
}
