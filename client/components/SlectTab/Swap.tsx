import { useEffect, useState } from "react";
import { TokenType, AmmType } from "../../hooks/useContract";
import { MdSwapVert } from "react-icons/md";
import styles from "./Select.module.css";
import InputNumberBox from "../Box/InputNumberBox";
import { ethers } from "ethers";
import { validAmount } from "../../utils/validAmount";

type Props = {
  token0: TokenType | undefined;
  token1: TokenType | undefined;
  amm: AmmType | undefined;
  currentAccount: string | undefined;
  updateDetails: () => void;
};

export default function Swap({
  token0,
  token1,
  amm,
  currentAccount,
  updateDetails,
}: Props) {
  // スワップ元とスワップ先のトークンを格納します。
  const [tokenSrc, setTokenSrc] = useState<TokenType>();
  const [tokenDst, setTokenDst] = useState<TokenType>();

  const [amountSrc, setAmountSrc] = useState("");
  const [amountDst, setAmountDst] = useState("");

  useEffect(() => {
    setTokenSrc(token0);
    setTokenDst(token1);
  }, [token0, token1]);

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
    if (!amm || !tokenSrc) return;
    if (!validAmount(amount)) return;
    try {
      const amountSrcInWei = ethers.utils.parseEther(amount);
      const amountDstInWei = await amm.contract.swapEstimateFromSrcToken(
        tokenSrc.contract.address,
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
    if (!amm || !tokenDst) return;
    if (!validAmount(amount)) return;
    if (amm) {
      try {
        const amountDstInWei = ethers.utils.parseEther(amount);
        const amountSrcInWei = await amm.contract.swapEstimateFromDstToken(
          tokenDst.contract.address,
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
    if (!amm || !tokenSrc || !tokenDst) return;
    if (!validAmount(amountSrc)) {
      alert("Amount should be a valid number");
      return;
    }
    try {
      const amountSrcInWei = ethers.utils.parseEther(amountSrc);
      const txn = await amm.contract.swap(
        tokenSrc.contract.address,
        tokenDst.contract.address,
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
      <InputNumberBox
        leftHeader={"From"}
        right={tokenSrc ? tokenSrc.symbol : ""}
        value={amountSrc}
        onChange={(e) => onChangeSrc(e.target.value)}
      />
      <div className={styles.swapIcon} onClick={() => rev()}>
        <MdSwapVert />
      </div>
      <InputNumberBox
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
