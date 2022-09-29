import { ChangeEvent, useEffect, useState } from "react";
import { AMM as AmmType } from "../../typechain-types";
import { TokenInfo } from "../../hooks/useContract";
import styles from "./Select.module.css";
import { ethers } from "ethers";
import BoxTemplate from "../InputBox/BoxTemplate";
import { MdAdd } from "react-icons/md";
import { validAmount } from "../../utils/validAmount";

type Props = {
  tokens: TokenInfo[];
  ammContract: AmmType | undefined;
  currentAccount: string | undefined;
  updateDetails: () => void;
};
//TODO 順番が変わるのだるいのでmapは使わないようにするか？, それかorderする
export default function Provide({
  tokens,
  ammContract,
  currentAccount,
  updateDetails,
}: Props) {
  //TODO ここtoken0とtoken1的な感じにする
  enum TokenIndex {
    First,
    Second,
  }
  const [amountOfTokens, setAmountOfTokens] = useState<string[]>([]);
  const [activePool, setActivePool] = useState(false);

  useEffect(() => {
    checkLiquidity();
  }, [ammContract]);

  const checkLiquidity = async () => {
    if (!ammContract) return;
    try {
      const totalShares = await ammContract.totalShares();
      if (totalShares.toString() === "0") {
        setActivePool(false);
      } else {
        setActivePool(true);
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
    if (!ammContract || tokens.length !== 2) return;
    if (!activePool) return;
    if (!validAmount(amountOfTokens[tokenIndex])) return;
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

  const onClickProvide = async () => {
    if (!currentAccount) {
      alert("connect wallet");
      return;
    }
    if (!ammContract || tokens.length !== 2) return;
    if (
      !validAmount(amountOfTokens[TokenIndex.First]) ||
      !validAmount(amountOfTokens[TokenIndex.Second])
    ) {
      alert("Amount should be a valid number");
      return;
    }
    try {
      const amountTokenFirstInWei = ethers.utils.parseEther(
        amountOfTokens[TokenIndex.First]
      );
      const amountTokenSecondInWei = ethers.utils.parseEther(
        amountOfTokens[TokenIndex.Second]
      );

      await tokens[TokenIndex.First].contract.approve(
        "0xE8430Ce3f3A5d4A0E63f5C69e93574e8c9C12db0",
        amountTokenFirstInWei
      );
      await tokens[TokenIndex.Second].contract.approve(
        "0xE8430Ce3f3A5d4A0E63f5C69e93574e8c9C12db0",
        amountTokenSecondInWei
      );

      const txn = await ammContract.provide(
        tokens[TokenIndex.First].address,
        amountTokenFirstInWei,
        tokens[TokenIndex.Second].address,
        amountTokenSecondInWei
      );
      await txn.wait();
      setAmountOfTokens([]);
      updateDetails(); // ユーザとammの情報を更新
      alert("Success");
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
      {!activePool && (
        <div className={styles.error}>
          Message: Empty pool. Set the initial conversion rate.
        </div>
      )}
      <div className={styles.bottomDiv}>
        <div className={styles.btn} onClick={() => onClickProvide()}>
          Provide
        </div>
      </div>
    </div>
  );
}
