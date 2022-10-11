import { useState } from "react";
import { useContract } from "../../hooks/useContract";
import styles from "./Container.module.css";
import Swap from "../SelectTab/Swap";
import Details from "../Details/Details";
import Faucet from "../SelectTab/Faucet";
import Withdraw from "../SelectTab/Withdraw";
import Provide from "../SelectTab/Provide";

type Props = {
  currentAccount: string | undefined;
};

export default function Container({ currentAccount }: Props) {
  const [activeTab, setActiveTab] = useState("Swap");
  const [updateDetailsFlag, setUpdateDetailsFlag] = useState(0);
  const { usdc: token0, joe: token1, amm } = useContract(currentAccount);

  const changeTab = (tab: string) => {
    setActiveTab(tab);
  };

  const updateDetails = () => {
    // フラグを0と1の間で交互に変更します。
    setUpdateDetailsFlag((updateDetailsFlag + 1) % 2);
  };

  return (
    <div className={styles.mainBody}>
      <div className={styles.centerContent}>
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
            token0={token0}
            token1={token1}
            amm={amm}
            currentAccount={currentAccount}
            updateDetails={updateDetails}
          />
        )}
        {activeTab === "Provide" && (
          <Provide
            token0={token0}
            token1={token1}
            amm={amm}
            currentAccount={currentAccount}
            updateDetails={updateDetails}
          />
        )}
        {activeTab === "Withdraw" && (
          <Withdraw
            token0={token0}
            token1={token1}
            amm={amm}
            currentAccount={currentAccount}
            updateDetails={updateDetails}
          />
        )}
        {activeTab === "Faucet" && (
          <Faucet
            token0={token0}
            token1={token1}
            currentAccount={currentAccount}
            updateDetails={updateDetails}
          />
        )}
      </div>
      <Details
        token0={token0}
        token1={token1}
        amm={amm}
        currentAccount={currentAccount}
        updateDetailsFlag={updateDetailsFlag}
      />
    </div>
  );
}
