import { ChangeEvent, useEffect, useState } from "react";
import { AMM as AmmType } from "../../typechain-types";
import { TokenInfo } from "../../hooks/useContract";
import styles from "./Select.module.css";
import { BigNumber, ethers } from "ethers";
import BoxTemplate from "../InputBox/BoxTemplate";
import { validAmount } from "../../utils/validAmount";
import {
  formatWithPrecision,
  formatWithoutPrecision,
} from "../../utils/format";

type Props = {
  token0: TokenInfo | undefined;
  token1: TokenInfo | undefined;
  ammContract: AmmType | undefined;
  sharePrecision: BigNumber | undefined;
  currentAccount: string | undefined;
  updateDetails: () => void;
};

export default function Withdraw({
  token0,
  token1,
  ammContract,
  sharePrecision,
  currentAccount,
  updateDetails,
}: Props) {
  const [amountOfToken0, setAmountOfToken0] = useState("");
  const [amountOfToken1, setAmountOfToken1] = useState("");
  const [amountOfShare, setAmountOfShare] = useState("");
  const [amountOfMaxShare, setAmountOfMaxShare] = useState<string>(); //TODO ここみたいにコントラクトからの値はundefindeにするの他もやる

  useEffect(() => {
    getMaxShare();
  }, [ammContract]);

  const getMaxShare = async () => {
    if (!ammContract || !currentAccount || !sharePrecision) return;
    try {
      const shareWithPrecision = await ammContract.shares(currentAccount);
      const shareWithoutPrecision = formatWithoutPrecision(
        shareWithPrecision,
        sharePrecision
      );
      setAmountOfMaxShare(shareWithoutPrecision);
    } catch (error) {
      alert(error);
    }
  };

  const leftLessThanRightAsBigNumber = (
    left: string,
    right: string
  ): boolean => {
    return BigNumber.from(left).lt(BigNumber.from(right));
  };
  //TODO 現状正しくない入力はここで拾われるため毎度alertが出て面倒, 入力自体できないようにしたい, ""の時は0として扱ってほしい考える, 他のところもやる
  const getEstimate = async (
    token: TokenInfo | undefined,
    amountOfShare: string,
    setAmount: (amount: string) => void
  ) => {
    if (!ammContract || !sharePrecision || !token || !amountOfMaxShare) return;
    if (!validAmount(amountOfShare)) {
      alert("Amount should be a valid number");
      return;
    }
    if (leftLessThanRightAsBigNumber(amountOfMaxShare, amountOfShare)) {
      alert("Amount should be less than your max share");
      return;
    }
    try {
      const shareWithPrecision = formatWithPrecision(
        amountOfShare,
        sharePrecision
      );
      const estimateInWei = await ammContract.withdrawEstimate(
        token.address,
        shareWithPrecision
      );
      const estimateInEther = ethers.utils.formatEther(estimateInWei);
      setAmount(estimateInEther);
    } catch (error) {
      alert(error);
    }
  };

  const onClickMax = async () => {
    if (!amountOfMaxShare) return;
    setAmountOfShare(amountOfMaxShare);
    getEstimate(token0, amountOfMaxShare, setAmountOfToken0);
    getEstimate(token1, amountOfMaxShare, setAmountOfToken1);
  };

  const onChangeAmountOfShare = async (e: ChangeEvent<HTMLInputElement>) => {
    setAmountOfShare(e.target.value);
    getEstimate(token0, e.target.value, setAmountOfToken0);
    getEstimate(token1, e.target.value, setAmountOfToken1);
  };

  const onClickWithdraw = async () => {
    if (!currentAccount) {
      alert("connect wallet");
      return;
    }
    if (!ammContract || !sharePrecision || !amountOfMaxShare) return;
    if (!validAmount(amountOfShare)) {
      alert("Amount should be a valid number");
      return;
    }
    if (leftLessThanRightAsBigNumber(amountOfMaxShare, amountOfShare)) {
      alert("Amount should be less than your max share");
      return;
    }
    try {
      const txn = await ammContract.withdraw(
        formatWithPrecision(amountOfShare, sharePrecision)
      );
      await txn.wait();
      setAmountOfToken0("");
      setAmountOfToken1("");
      setAmountOfShare("");
      updateDetails(); // ユーザとammの情報を更新
      alert("Success!");
    } catch (error) {
      alert(error);
    }
  };

  return (
    <div className={styles.tabBody}>
      <div className={styles.bottomDiv}>
        <div className={styles.btn} onClick={() => onClickMax()}>
          Max
        </div>
      </div>
      <BoxTemplate
        leftHeader={"Amount of share:"}
        right=""
        value={amountOfShare}
        onChange={(e) => onChangeAmountOfShare(e)}
      />
      {token0 && token1 && (
        <div className={styles.withdrawEstimate}>
          <div>
            <p>
              Amount of {token0.symbol}: {amountOfToken0}
            </p>
            <p>
              Amount of {token1.symbol}: {amountOfToken1}
            </p>
          </div>
        </div>
      )}
      <div className={styles.bottomDiv}>
        <div className={styles.btn} onClick={() => onClickWithdraw()}>
          Withdraw
        </div>
      </div>
    </div>
  );
}
