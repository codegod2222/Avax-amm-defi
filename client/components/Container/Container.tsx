import { useState } from "react";
import { AMM as AmmType } from "../../typechain-types";
import { TokenInfo } from "../../hooks/useContract";
import styles from "./Container.module.css";
import Swap from "../SlectTab/Swap";
import Details from "../Details/Details";
import Faucet from "../SlectTab/Faucet";
import Withdraw from "../SlectTab/Withdraw";
import Provide from "../SlectTab/Provide";
import { BigNumber } from "ethers";

type Props = {
  tokens: TokenInfo[]; //TODO これ止める
  ammContract: AmmType | undefined;
  sharePrecision: BigNumber | undefined;
  currentAccount: string | undefined;
};

export default function Container({
  tokens,
  ammContract,
  sharePrecision,
  currentAccount,
}: Props) {
  const [activeTab, setActiveTab] = useState("Swap");
  const [updateDetailsFlag, setUpdateDetailsFlag] = useState(0);

  const changeTab = (tab: string) => {
    setActiveTab(tab);
  };

  const updateDetails = () => {
    // フラグを0と1の間で交互に変更します。
    setUpdateDetailsFlag((updateDetailsFlag + 1) % 2);
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
          token0={tokens[0]}
          token1={tokens[1]}
          ammContract={ammContract}
          currentAccount={currentAccount}
          updateDetails={updateDetails}
        />
      )}
      {activeTab === "Provide" && (
        <Provide
          token0={tokens[0]}
          token1={tokens[1]}
          ammContract={ammContract}
          currentAccount={currentAccount}
          updateDetails={updateDetails}
        />
      )}
      {activeTab === "Withdraw" && (
        <Withdraw
          token0={tokens[0]}
          token1={tokens[1]}
          ammContract={ammContract}
          sharePrecision={sharePrecision}
          currentAccount={currentAccount}
          updateDetails={updateDetails}
        />
      )}
      {activeTab === "Faucet" && (
        <Faucet
          token0={tokens[0]}
          token1={tokens[1]}
          currentAccount={currentAccount}
          updateDetails={updateDetails}
        />
      )}
      <Details
        tokens={tokens}
        ammContract={ammContract}
        sharePrecision={sharePrecision}
        currentAccount={currentAccount}
        updateDetailsFlag={updateDetailsFlag}
      />
    </div>
  );
}
