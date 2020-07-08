// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import React, { Fragment, useEffect } from "react";

export const ErrorMessage = "I'm a broken component";

const BrokenComponent = () => {
  useEffect(() => {
    throw new Error(ErrorMessage);
  });
  return <Fragment />;
};

export default BrokenComponent;
