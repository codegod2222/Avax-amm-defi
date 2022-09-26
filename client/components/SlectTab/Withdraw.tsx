import { ChangeEvent, useEffect, useState } from "react";
import { USDCToken as UsdcType } from "../../typechain-types";
import { JOEToken as JoeType } from "../../typechain-types";
import { AMM as AmmType } from "../../typechain-types";
import { UsdcAddress, JoeAddress } from "../../hooks/useContract";
import styles from "./Select.module.css";
import { BigNumber } from "ethers";
import BoxTemplate from "../InputBox/BoxTemplate";

type Props = {
  usdcContract: UsdcType | undefined;
  joeContract: JoeType | undefined;
  ammContract: AmmType | undefined;
  currentAccount: string | undefined;
};

export default function Withdraw({
  usdcContract,
  joeContract,
  ammContract,
  currentAccount,
}: Props) {
  const [amountOfShare, setAmountOfShare] = useState("");

  //TODO: トークン情報を配列にしたらまとめる
  const [estimateUsdcToken, setEstimateUsdcToken] = useState("");
  const [estimateJoeToken, setEstimateJoeToken] = useState("");

  const [userShare, setUserShare] = useState(BigNumber.from(0));

  const [precision, setPrecision] = useState(BigNumber.from(0));

  useEffect(() => {
    getPrecision();
    getUserShare();
  }, []);

  const getUserShare = async () => {
    if (!ammContract) return;
    if (!currentAccount) return;
    try {
      const share = await ammContract.shares(currentAccount);
      setUserShare(share);
    } catch (error) {
      alert(error);
    }
  };

  async function getPrecision() {
    if (!ammContract) return;
    try {
      const precision = await ammContract.PRECISION();
      setPrecision(precision);
    } catch (error) {
      console.log(error);
    }
  }

  const getEstimate = async () => {
    if (!ammContract) return;
    try {
      let estimate = await ammContract.withdrawEstimate(
        UsdcAddress,
        BigNumber.from(amountOfShare).mul(precision)
      );
      setEstimateUsdcToken(estimate.toString()); //TODO: 桁調整

      estimate = await ammContract.withdrawEstimate(
        JoeAddress,
        BigNumber.from(amountOfShare).mul(precision)
      );
      setEstimateJoeToken(estimate.toString()); //TODO: 桁調整
    } catch (error) {
      alert(error);
    }
  };

  const onChangeAmountOfShare = async (e: ChangeEvent<HTMLInputElement>) => {
    setAmountOfShare(e.target.value);
    getEstimate();
  };

  const getMaxShare = async () => {
    setAmountOfShare(userShare.toString());
    getEstimate();
  };

  // Withdraws the share
  const withdrawShare = async () => {
    if (!ammContract) return;
    if (["", "."].includes(amountOfShare)) {
      alert("Amount should be a valid number"); //TODO わかってない
      return;
    }
    if (userShare.toString() < amountOfShare) {
      alert("Amount should be less than your max share");
      return;
    }
    try {
      const txn = await ammContract.withdraw(
        BigNumber.from(amountOfShare).div(precision)
      );
      console.log(txn);
      await txn.wait();
      setAmountOfShare("");
      setEstimateUsdcToken("");
      setEstimateJoeToken("");
      // await props.getHoldings();//TODO 更新作業
      alert("Success!");
    } catch (error) {
      alert(error);
    }
  };

  return (
    <div className={styles.tabBody}>
      <div onClick={() => getMaxShare()} className={styles.getMax}>
        Max
      </div>
      <BoxTemplate
        leftHeader={"Amount:"}
        right=""
        value={amountOfShare.toString()}
        onChange={(e) => onChangeAmountOfShare(e)}
      />
      {/* TODO usdcとjoeをハードコードしてるので注意 */}
      {estimateUsdcToken !== "" && estimateJoeToken !== "" && (
        <div className={styles.withdrawEstimate}>
          <div>Amount of Usdc: {estimateUsdcToken}</div>
          <div>Amount of Joe: {estimateUsdcToken}</div>
        </div>
      )}
      <div className={styles.bottomDiv}>
        <div className={styles.btn} onClick={() => withdrawShare()}>
          Withdraw
        </div>
      </div>
    </div>
  );
}
