import { ChangeEvent, useState } from "react";
import { USDCToken as UsdcType } from "../../typechain-types";
import { JOEToken as JoeType } from "../../typechain-types";
import styles from "./Select.module.css";
import { BigNumber } from "ethers";
import BoxTemplate from "../InputBox/BoxTemplate";

type Props = {
  usdcContract: UsdcType | undefined;
  joeContract: JoeType | undefined;
  currentAccount: string | undefined;
};

//TODO: トークンのコントラクト情報(コントラクト, アドレス, precision, シンボルなど)を構造体にまとめて, さらに二つの配列にするか, その配列が揃うまではdisableにする
//TODO: 繰り返し処理はまとめるか？
//TODO: 表示と中身の桁を確認する, 現状100とか打っても小さすぎる
export default function Faucet({
  usdcContract,
  joeContract,
  currentAccount,
}: Props) {
  const [amountOfUsdc, setAmountOfUsdc] = useState("");
  const [amountOfJoe, setAmountOfJoe] = useState("");

  const onChangeAmountOfUsdc = (e: ChangeEvent<HTMLInputElement>) => {
    setAmountOfUsdc(e.target.value);
  };

  const onChangeAmountOfJoe = (e: ChangeEvent<HTMLInputElement>) => {
    setAmountOfJoe(e.target.value);
  };

  async function onClickFund(
    tokenContract: UsdcType | JoeType | undefined,
    amount: BigNumber
  ) {
    if (!tokenContract) return;
    if (!currentAccount) return;
    if (["", "."].includes(amount.toString())) {
      alert("Amount should be a valid number"); //TODO: あんまわかってない
      return;
    }
    try {
      const txn = await tokenContract.faucet(currentAccount, amount);
      await txn.wait();
      setAmountOfJoe("");
      setAmountOfJoe("");
      // await props.getHoldings(); ユーザ情報の更新
      alert("Success");
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className={styles.tabBody}>
      <BoxTemplate
        leftHeader={"Amount of USDC"} // シンボルは定数使いたい
        right={"USDC"}
        value={Number(amountOfUsdc)}
        onChange={(e) => onChangeAmountOfUsdc(e)}
      />
      <div className={styles.bottomDiv}>
        <div
          className={styles.btn}
          onClick={() =>
            onClickFund(usdcContract, BigNumber.from(amountOfUsdc))
          }
        >
          Fund
        </div>
      </div>
      <BoxTemplate
        leftHeader={"Amount of JOE"}
        right={"JOE"}
        value={Number(amountOfJoe)}
        onChange={(e) => onChangeAmountOfJoe(e)}
      />
      <div className={styles.bottomDiv}>
        <div
          className={styles.btn}
          onClick={() => onClickFund(joeContract, BigNumber.from(amountOfJoe))}
        >
          Fund
        </div>
      </div>
    </div>
  );
}
