import { useEffect, useState } from "react";
import { BigNumber } from "ethers";
import { USDCToken as UsdcType } from "../typechain-types";
import { JOEToken as JoeType } from "../typechain-types";
import { AMM as AmmType } from "../typechain-types";
import styles from "./Container.module.css";

type Props = {
  usdcContract: UsdcType | undefined;
  joeContract: JoeType | undefined;
  ammContract: AmmType | undefined;
};

export default function ContainerComponent({
  usdcContract,
  joeContract,
  ammContract,
}: Props) {
  const [activeTab, setActiveTab] = useState("Swap");
  const [totalShares, setTotalShares] = useState<BigNumber>();

  useEffect(() => {
    getTotalShares();
  });

  async function getTotalShares() {
    if (!ammContract) return;
    try {
      const shares = await ammContract.totalShares();
      setTotalShares(shares);
    } catch (error) {
      console.log(error);
    }
  }

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

      {activeTab === "Swap" && <div>{totalShares?.toString()}</div>}
      {activeTab === "Provide" && <div>{totalShares?.toString()}</div>}
      {activeTab === "Withdraw" && <div>{totalShares?.toString()}</div>}
      {activeTab === "Faucet" && <div>{totalShares?.toString()}</div>}
    </div>
  );
}
