/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import modelImg from "@bentley/icons-generic/icons/imodeljs.svg";
import { Button, ButtonType } from "@bentley/ui-core";
import React from "react";
import { RouteComponentProps } from "react-router";

import { ReactComponent as Itwin } from "../../images/itwin.svg";
import styles from "./Home.module.scss";

export const Home = ({ history }: RouteComponentProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.title}>
          <p>
            <Itwin className={styles.logo} />
            {"iTwinViewer Sample App"}
          </p>
        </div>
        <img className={styles.img} src={modelImg} alt={"modelImage"} />
        <div className={styles.signIn}>
          <Button
            className={styles.homeButton}
            onClick={() => history.push("/usermanager")}
            buttonType={ButtonType.Primary}
          >
            {"Use Native OIDC Client"}
          </Button>
          <Button
            className={styles.homeButton}
            onClick={() => history.push("/authclient")}
            buttonType={ButtonType.Blue}
          >
            {"Use iModel.js Auth Client"}
          </Button>
        </div>
      </div>
    </div>
  );
};
