import { useState } from "react";
import { AMM as AmmType } from "../../typechain-types";
import { MdSwapVert } from "react-icons/md";
import styles from "./Select.module.css";
import { TokenInfo } from "../../hooks/useContract";
import BoxTemplate from "../InputBox/BoxTemplate";
import { ethers } from "ethers";

type Props = {
  tokens: TokenInfo[];
  ammContract: AmmType | undefined;
};

export default function Swap({ tokens, ammContract }: Props) {
  // スワップ元とスワップ先のトークンのインデックス番号を格納します。
  const [tokenIndexSrc, setTokenIndexSrc] = useState(0);
  const [tokenIndexDst, setTokenIndexDst] = useState(1);

  const [amountSrc, setAmountSrc] = useState("");
  const [amountDst, setAmountDst] = useState("");

  const rev = () => {
    // スワップ元とスワップ先のトークンのインデックスを交換します。
    const srcCopy = tokenIndexSrc;
    setTokenIndexSrc(tokenIndexDst);
    setTokenIndexDst(srcCopy);

    getSwapEstimateFromSrc(amountSrc); //TODO: ここあんまわかってない
  };

  // スワップ元トークンに指定された量から, スワップ先トークンの受け取れる量を取得します。
  const getSwapEstimateFromSrc = async (amount: string) => {
    if (!ammContract) return;
    if (tokens.length !== 2) return;
    if (["", "."].includes(amount)) return; //TODO: ここあんまわかってない
    try {
      const amountDstInWei = await ammContract.swapEstimateFromSrcToken(
        tokens[tokenIndexSrc].address,
        ethers.utils.parseEther(amount)
      );
      const amountDstInEther = ethers.utils.formatEther(amountDstInWei);
      setAmountDst(amountDstInEther);
    } catch (error) {
      alert(error);
    }
  };

  // スワップ先トークンに指定された量から, スワップ元トークンに必要な量を取得します。
  const getSwapEstimateFromDst = async (amount: string) => {
    if (!ammContract) return;
    if (tokens.length !== 2) return;
    if (["", "."].includes(amount)) return; //TODO: ここあんまわかってない
    if (ammContract) {
      try {
        const amountSrcInWei = await ammContract.swapEstimateFromDstToken(
          tokens[tokenIndexDst].address,
          ethers.utils.parseEther(amount)
        );
        const amountSrcInEther = ethers.utils.formatEther(amountSrcInWei);
        setAmountSrc(amountSrcInEther);
      } catch (error) {
        alert(error);
      }
    }
  };

  const onChangeSrc = (amount: string) => {
    setAmountSrc(amount);
    getSwapEstimateFromSrc(amount);
  };

  const onChangeDst = (amount: string) => {
    setAmountDst(amount);
    getSwapEstimateFromDst(amount);
  };

  const swap = async () => {
    if (["", "."].includes(amountSrc)) {
      //TODO: ここあんまわかってない
      alert("Amount should be a valid number");
      return;
    }
    if (!ammContract || tokens.length !== 2) {
      alert("Connect to wallet");
      return;
    }
    try {
      const txn = await ammContract.swap(
        tokens[tokenIndexSrc].address,
        tokens[tokenIndexDst].address,
        ethers.utils.parseEther(amountSrc)
      );
      await txn.wait();
      setAmountSrc("");
      setAmountDst("");
      // await props.getHoldings(); // TODO: ここでユーザ情報の更新作業, このようにプロップスとして受け取ってもいかも, それかbool値
      alert("Success!");
    } catch (error) {
      alert(error);
    }
  };

  return (
    <div className={styles.tabBody}>
      <BoxTemplate
        leftHeader={"From"}
        right={tokens[tokenIndexSrc] ? tokens[tokenIndexSrc].symbol : ""}
        value={amountSrc}
        onChange={(e) => onChangeSrc(e.target.value)}
      />
      <div className={styles.swapIcon} onClick={() => rev()}>
        <MdSwapVert />
      </div>
      <BoxTemplate
        leftHeader={"To"}
        right={tokens[tokenIndexDst] ? tokens[tokenIndexDst].symbol : ""}
        value={amountDst}
        onChange={(e) => onChangeDst(e.target.value)}
      />
      <div className={styles.bottomDiv}>
        <div className={styles.btn} onClick={() => swap()}>
          Swap
        </div>
      </div>
    </div>
  );
}
