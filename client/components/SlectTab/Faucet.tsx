import { ChangeEvent, useState } from "react";
import { TokenInfo } from "../../hooks/useContract";
import styles from "./Select.module.css";
import BoxTemplate from "../InputBox/BoxTemplate";
import { ethers } from "ethers";
import { validAmount } from "../../utils/validAmount";

type Props = {
  tokens: TokenInfo[];
  currentAccount: string | undefined;
  updateDetails: () => void;
};

export default function Faucet({
  tokens,
  currentAccount,
  updateDetails,
}: Props) {
  const [amountOfFunds, setAmountOfFunds] = useState("");
  const [currentTokenIndex, setCurrentTokenIndex] = useState(0);

  // 参照するインデックスを次に移動させます。
  const onChangeToken = () => {
    setCurrentTokenIndex((currentTokenIndex + 1) % tokens.length);
  };

  const onChangeAmountOfFunds = (e: ChangeEvent<HTMLInputElement>) => {
    setAmountOfFunds(e.target.value);
  };

  async function onClickFund() {
    if (!currentAccount) {
      alert("connect wallet");
      return;
    }
    if (tokens.length !== 2) return;
    if (!validAmount(amountOfFunds)) {
      alert("Amount should be a valid number");
      return;
    }
    try {
      const contract = tokens[currentTokenIndex].contract;
      const amountInWei = ethers.utils.parseEther(amountOfFunds);

      const txn = await contract.faucet(currentAccount, amountInWei);
      await txn.wait();
      updateDetails(); // ユーザとammの情報を更新
      alert("Success");
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className={styles.tabBody}>
      <div className={styles.bottomDiv}>
        <div className={styles.btn} onClick={() => onChangeToken()}>
          Change
        </div>
      </div>
      <BoxTemplate
        leftHeader={
          "Amount of " +
          (tokens[currentTokenIndex]
            ? tokens[currentTokenIndex].symbol
            : "some token")
        }
        right={
          tokens[currentTokenIndex] ? tokens[currentTokenIndex].symbol : ""
        }
        value={amountOfFunds}
        onChange={(e) => onChangeAmountOfFunds(e)}
      />
      <div className={styles.bottomDiv}>
        <div className={styles.btn} onClick={() => onClickFund()}>
          Fund
        </div>
      </div>
    </div>
  );
}
