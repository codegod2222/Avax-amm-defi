import { useState } from "react";
import { AMM as AmmType } from "../../typechain-types";
import { MdSwapVert } from "react-icons/md";
import styles from "./Select.module.css";
import { TokenInfo } from "../../hooks/useContract";
import BoxTemplate from "../InputBox/BoxTemplate";
import { ethers } from "ethers";
import { validAmount } from "../../utils/validAmount";

type Props = {
  token0: TokenInfo | undefined;
  token1: TokenInfo | undefined;
  ammContract: AmmType | undefined;
  currentAccount: string | undefined;
  updateDetails: () => void;
};

export default function Swap({
  token0,
  token1,
  ammContract,
  currentAccount,
  updateDetails,
}: Props) {
  // スワップ元とスワップ先のトークンを格納します。
  const [tokenSrc, setTokenSrc] = useState(token0);
  const [tokenDst, setTokenDst] = useState(token1);

  const [amountSrc, setAmountSrc] = useState("");
  const [amountDst, setAmountDst] = useState("");

  const rev = () => {
    // スワップ元とスワップ先のトークンを交換します。
    const srcCopy = tokenSrc;
    setTokenSrc(tokenDst);
    setTokenDst(srcCopy);

    // 交換後はソーストークンから推定量を再計算します。
    getSwapEstimateFromSrc(amountSrc);
  };

  // スワップ元トークンに指定された量から, スワップ先トークンの受け取れる量を取得します。
  const getSwapEstimateFromSrc = async (amount: string) => {
    if (!ammContract || !tokenSrc) return;
    if (!validAmount(amount)) return;
    try {
      const amountSrcInWei = ethers.utils.parseEther(amount);
      const amountDstInWei = await ammContract.swapEstimateFromSrcToken(
        tokenSrc.address,
        amountSrcInWei
      );
      const amountDstInEther = ethers.utils.formatEther(amountDstInWei);
      setAmountDst(amountDstInEther);
    } catch (error) {
      alert(error);
    }
  };

  // スワップ先トークンに指定された量から, スワップ元トークンに必要な量を取得します。
  const getSwapEstimateFromDst = async (amount: string) => {
    if (!ammContract || !tokenDst) return;
    if (!validAmount(amount)) return; //TODO 他のやり方合わせる
    if (ammContract) {
      try {
        const amountDstInWei = ethers.utils.parseEther(amount);
        const amountSrcInWei = await ammContract.swapEstimateFromDstToken(
          tokenDst.address,
          amountDstInWei
        );
        const amountSrcInEther = ethers.utils.formatEther(amountSrcInWei);
        setAmountSrc(amountSrcInEther);
      } catch (error) {
        alert(error);
      }
    }
  };

  const onChangeSrc = (amount: string) => {
    //TODO このeではなくamount: stringのやり方他のところでもやる
    setAmountSrc(amount);
    getSwapEstimateFromSrc(amount);
  };

  const onChangeDst = (amount: string) => {
    setAmountDst(amount);
    getSwapEstimateFromDst(amount);
  };

  const onClickSwap = async () => {
    if (!currentAccount) {
      alert("Connect to wallet");
      return;
    }
    if (!ammContract || !tokenSrc || !tokenDst) return;
    if (!validAmount(amountSrc)) {
      alert("Amount should be a valid number");
      return;
    }
    try {
      const amountSrcInWei = ethers.utils.parseEther(amountSrc);
      const txn = await ammContract.swap(
        tokenSrc.address,
        tokenDst.address,
        amountSrcInWei
      );
      await txn.wait();
      setAmountSrc("");
      setAmountDst("");
      updateDetails(); // ユーザとammの情報を更新
      alert("Success!");
    } catch (error) {
      alert(error);
    }
  };

  return (
    <div className={styles.tabBody}>
      <BoxTemplate
        leftHeader={"From"}
        right={tokenSrc ? tokenSrc.symbol : ""}
        value={amountSrc}
        onChange={(e) => onChangeSrc(e.target.value)}
      />
      <div className={styles.swapIcon} onClick={() => rev()}>
        <MdSwapVert />
      </div>
      <BoxTemplate
        leftHeader={"To"}
        right={tokenDst ? tokenDst.symbol : ""}
        value={amountDst}
        onChange={(e) => onChangeDst(e.target.value)}
      />
      <div className={styles.bottomDiv}>
        <div className={styles.btn} onClick={() => onClickSwap()}>
          Swap
        </div>
      </div>
    </div>
  );
}
