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
  tokens: TokenInfo[];
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
          tokens={tokens}
          ammContract={ammContract}
          currentAccount={currentAccount}
        />
      )}
      {activeTab === "Provide" && (
        <Provide
          tokens={tokens}
          ammContract={ammContract}
          currentAccount={currentAccount}
        />
      )}
      {activeTab === "Withdraw" && (
        <Withdraw
          tokens={tokens}
          ammContract={ammContract}
          sharePrecision={sharePrecision}
          currentAccount={currentAccount}
        />
      )}
      {activeTab === "Faucet" && (
        <Faucet tokens={tokens} currentAccount={currentAccount} />
      )}
      <Details
        tokens={tokens}
        ammContract={ammContract}
        sharePrecision={sharePrecision}
        currentAccount={currentAccount}
      />
    </div>
  );
}
