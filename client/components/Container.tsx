import { useState } from "react";
import { USDCToken as UsdcType } from "../typechain-types";
import { JOEToken as JoeType } from "../typechain-types";
import { AMM as AmmType } from "../typechain-types";
import styles from "./Container.module.css";
import Swap from "./Swap";
import Details from "./Details";
import Faucet from "./Faucet";
import Withdraw from "./Withdraw";

type Props = {
  usdcContract: UsdcType | undefined;
  joeContract: JoeType | undefined;
  ammContract: AmmType | undefined;
  currentAccount: string | undefined;
};

//TODO: セレクトタブのところ, 同じcssで囲みたい
export default function Container({
  usdcContract,
  joeContract,
  ammContract,
  currentAccount,
}: Props) {
  const [activeTab, setActiveTab] = useState("Swap");

  const changeTab = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className={styles.centerBody}>
      <div className={styles.selectTab}>
        <div
          className={
            styles.tabStyle +
            " " +
            (activeTab === "Swap" ? styles.activeTab : "")
          }
          onClick={() => changeTab("Swap")}
        >
          Swap
        </div>
        <div
          className={
            styles.tabStyle +
            " " +
            (activeTab === "Provide" ? styles.activeTab : "")
          }
          onClick={() => changeTab("Provide")}
        >
          Provide
        </div>
        <div
          className={
            styles.tabStyle +
            " " +
            (activeTab === "Withdraw" ? styles.activeTab : "")
          }
          onClick={() => changeTab("Withdraw")}
        >
          Withdraw
        </div>
        <div
          className={
            styles.tabStyle +
            " " +
            (activeTab === "Faucet" ? styles.activeTab : "")
          }
          onClick={() => changeTab("Faucet")}
        >
          Faucet
        </div>
      </div>

      {activeTab === "Swap" && (
        <Swap
          usdcContract={usdcContract}
          joeContract={joeContract}
          ammContract={ammContract}
        />
      )}
      {activeTab === "Provide" && <div>Provide</div>}
      {activeTab === "Withdraw" && (
        <Withdraw
          usdcContract={usdcContract}
          joeContract={joeContract}
          ammContract={ammContract}
          currentAccount={currentAccount}
        />
      )}
      {activeTab === "Faucet" && (
        <Faucet
          usdcContract={usdcContract}
          joeContract={joeContract}
          currentAccount={currentAccount}
        />
      )}
      <Details
        usdcContract={usdcContract}
        joeContract={joeContract}
        ammContract={ammContract}
        currentAccount={currentAccount}
      />
    </div>
  );
}
