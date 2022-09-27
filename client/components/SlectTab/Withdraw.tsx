import { ChangeEvent, useEffect, useState } from "react";
import { AMM as AmmType } from "../../typechain-types";
import { TokenInfo } from "../../hooks/useContract";
import styles from "./Select.module.css";
import { BigNumber } from "ethers";
import BoxTemplate from "../InputBox/BoxTemplate";
import { validAmount } from "../../utils/validAmount";
//TODO: shareの精度問題
type Props = {
  tokens: TokenInfo[];
  ammContract: AmmType | undefined;
  currentAccount: string | undefined;
};

export default function Withdraw({
  tokens,
  ammContract,
  currentAccount,
}: Props) {
  const [maxShare, setMaxShare] = useState("");
  const [amountOfShare, setAmountOfShare] = useState("");

  // 各トークンの引き出せる推定量を保存する状態変数です。
  const [amountOfEstimate, setAmountOfEstimate] = useState<string[]>([]);

  useEffect(() => {
    getMaxShare();
  }, [ammContract]);

  const getMaxShare = async () => {
    if (!ammContract || !currentAccount) return;
    try {
      const share = await ammContract.shares(currentAccount);
      setMaxShare(share.toString());
    } catch (error) {
      alert(error);
    }
  };

  const getEstimate = async () => {
    if (!ammContract) return;
    try {
      setAmountOfEstimate([]);
      tokens.map(async (token) => {
        const estimate = await ammContract.withdrawEstimate(
          token.address,
          BigNumber.from(amountOfShare)
        );
        setAmountOfEstimate((prevState) => [...prevState, estimate.toString()]);
      });
    } catch (error) {
      alert(error);
    }
  };

  const onClickMax = async () => {
    setAmountOfShare(maxShare);
    getEstimate();
  };

  const onChangeAmountOfShare = async (e: ChangeEvent<HTMLInputElement>) => {
    setAmountOfShare(e.target.value);
    getEstimate();
  };

  const onClickWithdraw = async () => {
    if (!currentAccount) {
      alert("connect wallet");
      return;
    }
    if (!ammContract) return;
    if (!validAmount(amountOfShare)) {
      alert("Amount should be a valid number");
      return;
    }
    if (maxShare < amountOfShare) {
      alert("Amount should be less than your max share");
      return;
    }
    try {
      const txn = await ammContract.withdraw(BigNumber.from(amountOfShare));
      await txn.wait();
      setAmountOfShare("");
      setAmountOfEstimate([]);
      // await props.getHoldings();//TODO ユーザ情報更新作業
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
      {amountOfEstimate.length === 2 && (
        <div className={styles.withdrawEstimate}>
          <div>
            Amount of {tokens[0].symbol}: {amountOfEstimate[0]}
            Amount of {tokens[1].symbol}: {amountOfEstimate[1]}
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
