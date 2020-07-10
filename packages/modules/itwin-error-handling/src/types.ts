// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
export type EventTrackerFunction<T = string> = (
  name: T,
  properties?: { [key: string]: any }
) => void;
