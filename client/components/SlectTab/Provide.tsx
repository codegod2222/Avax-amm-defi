import { ChangeEvent, useEffect, useState } from "react";
import { AMM as AmmType } from "../../typechain-types";
import { TokenInfo } from "../../hooks/useContract";
import styles from "./Select.module.css";
import { ethers } from "ethers";
import BoxTemplate from "../InputBox/BoxTemplate";
import { MdAdd } from "react-icons/md";

type Props = {
  tokens: TokenInfo[];
  ammContract: AmmType | undefined;
};

export default function Provide({ tokens, ammContract }: Props) {
  const [amountOfTokens, setAmountOfTokens] = useState<string[]>([]);
  const [error, setError] = useState("");

  enum TokenIndex {
    First,
    Second,
  }

  useEffect(() => {
    checkLiquidity();
  }, []);

  const checkLiquidity = async () => {
    if (!ammContract) return;
    try {
      const totalShares = await ammContract.totalShares();
      if (totalShares.toString() === "0") {
        setError("Message: Empty pool. Set the initial conversion rate.");
      }
    } catch (error) {
      alert(error);
    }
  };

  const updateAmountOfTokens = (tokenIndex: number, newAmount: string) => {
    let copyArray = amountOfTokens;
    copyArray[tokenIndex] = newAmount;
    setAmountOfTokens(copyArray);
  };

  const getProvideEstimate = async (tokenIndex: number) => {
    if (!ammContract) return;
    if (["", "."].includes(amountOfTokens[tokenIndex])) return;
    try {
      const amountInWei = ethers.utils.parseEther(amountOfTokens[tokenIndex]);
      const pairAmountInWei = await ammContract.equivalentToken(
        tokens[tokenIndex].address,
        amountInWei
      );

      const pairTokenIndex = (tokenIndex + 1) % tokens.length;
      const pairAmountInEther = ethers.utils.formatEther(pairAmountInWei);
      updateAmountOfTokens(pairTokenIndex, pairAmountInEther);
    } catch (error) {
      alert(error);
    }
  };

  const onChangeAmount = (
    tokenIndex: number,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    updateAmountOfTokens(tokenIndex, e.target.value);
    getProvideEstimate(tokenIndex);
  };

  const provide = async () => {
    if (!ammContract) {
      alert("connect wallet");
      return;
    }
    if (
      ["", "."].includes(amountOfTokens[TokenIndex.First]) ||
      ["", "."].includes(amountOfTokens[TokenIndex.Second])
    ) {
      alert("Amount should be a valid number");
      return;
    }
    try {
      const txn = await ammContract.provide(
        tokens[TokenIndex.First].address,
        ethers.utils.parseEther(amountOfTokens[TokenIndex.First]),
        tokens[TokenIndex.Second].address,
        ethers.utils.parseEther(amountOfTokens[TokenIndex.Second])
      );
      await txn.wait();
      setAmountOfTokens([]);
      // await props.getHoldings();//TODO ユーザ情報更新処理
      alert("Success");
      setError("");
    } catch (error) {
      alert(error);
    }
  };

  return (
    <div className={styles.tabBody}>
      <BoxTemplate
        leftHeader={
          "Amount of " +
          (tokens[TokenIndex.First]
            ? tokens[TokenIndex.First].symbol
            : "some token")
        }
        right={tokens[TokenIndex.First] ? tokens[TokenIndex.First].symbol : ""}
        value={amountOfTokens[TokenIndex.First]}
        onChange={(e) => onChangeAmount(0, e)}
      />
      <div className={styles.swapIcon}>
        <MdAdd />
      </div>
      <BoxTemplate
        leftHeader={
          "Amount of " +
          (tokens[TokenIndex.Second]
            ? tokens[TokenIndex.Second].symbol
            : "some token")
        }
        right={
          tokens[TokenIndex.Second] ? tokens[TokenIndex.Second].symbol : ""
        }
        value={amountOfTokens[TokenIndex.Second]}
        onChange={(e) => onChangeAmount(1, e)}
      />
      <div className={styles.error}>{error}</div>
      <div className={styles.bottomDiv}>
        <div className={styles.btn} onClick={() => provide()}>
          Provide
        </div>
      </div>
    </div>
  );
}
