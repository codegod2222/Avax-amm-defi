import { ChangeEvent, useState } from "react";
import { TokenInfo } from "../../hooks/useContract";
import styles from "./Select.module.css";
import BoxTemplate from "../InputBox/BoxTemplate";
import { ethers } from "ethers";

type Props = {
  tokens: TokenInfo[];
  currentAccount: string | undefined;
};

export default function Faucet({ tokens, currentAccount }: Props) {
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
    if (["", "."].includes(amountOfFunds.toString())) {
      alert("Amount should be a valid number"); //TODO: あんまわかってない
      return;
    }
    try {
      const contract = tokens[currentTokenIndex].contract;
      const amountInWei = ethers.utils.parseEther(amountOfFunds);

      const txn = await contract.faucet(currentAccount, amountInWei);
      await txn.wait();
      // await props.getHoldings();//TODO ユーザ情報の更新
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
        value={amountOfFunds.toString()}
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
