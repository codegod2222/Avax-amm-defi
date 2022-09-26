import { ChangeEvent, useEffect, useState } from "react";
import { USDCToken as UsdcType } from "../../typechain-types";
import { JOEToken as JoeType } from "../../typechain-types";
import { AMM as AmmType } from "../../typechain-types";
import { UsdcAddress, JoeAddress } from "../../hooks/useContract";
import styles from "./Select.module.css";
import { BigNumber } from "ethers";
import BoxTemplate from "../InputBox/BoxTemplate";
import { MdAdd } from "react-icons/md";

type Props = {
  usdcContract: UsdcType | undefined;
  joeContract: JoeType | undefined;
  ammContract: AmmType | undefined;
  currentAccount: string | undefined;
};

export default function Provide({
  usdcContract,
  joeContract,
  ammContract,
  currentAccount,
}: Props) {
  const [amountOfUsdc, setAmountOfUsdc] = useState(BigNumber.from(0));
  const [amountOfJoe, setAmountOfJoe] = useState(BigNumber.from(0));
  const [error, setError] = useState("");

  useEffect(() => {
    checkLiquidity();
  }, []);

  const checkLiquidity = async () => {
    if (!ammContract) return;
    try {
      const share = await ammContract.totalShares();
      if (share.toString() === "0") {
        setError("Message: Empty pool. Set the initial conversion rate.");
      }
    } catch (error) {
      alert(error);
    }
  };

  // Gets estimates of a token to be provided in the pool given the amount of other token
  const getProvideEstimate = async (
    token: string,
    setter: (_: BigNumber) => void,
    value: string
  ) => {
    if (["", "."].includes(value)) return;
    if (!ammContract) return;
    try {
      const estimate = await ammContract.equivalentToken(
        token,
        BigNumber.from(value) //桁調整
      );
      setter(estimate); //桁調整
    } catch (error) {
      alert(error);
    }
  };

  const onChangeAmountOfUsdc = (e: ChangeEvent<HTMLInputElement>) => {
    setAmountOfUsdc(BigNumber.from(e.target.value));
    getProvideEstimate(
      UsdcAddress,
      (val: BigNumber) => {
        setAmountOfJoe(val);
      },
      amountOfUsdc.toString()
    );
  };

  const onChangeAmountOfKothi = (e: ChangeEvent<HTMLInputElement>) => {
    setAmountOfJoe(BigNumber.from(e.target.value));
    getProvideEstimate(
      JoeAddress,
      (val: BigNumber) => {
        setAmountOfUsdc(val);
      },
      amountOfJoe.toString()
    );
  };

  // Adds liquidity to the pool
  const provide = async () => {
    if (
      ["", "."].includes(amountOfUsdc.toString()) ||
      ["", "."].includes(amountOfJoe.toString())
    ) {
      alert("Amount should be a valid number");
      return;
    }
    if (!ammContract) return;
    try {
      //TODO 桁調整
      const txn = await ammContract.provide(
        UsdcAddress,
        amountOfUsdc,
        JoeAddress,
        amountOfJoe
      );
      await txn.wait();
      setAmountOfUsdc(BigNumber.from(0));
      setAmountOfJoe(BigNumber.from(0));
      // await props.getHoldings();//TODO 更新処理
      alert("Success");
      setError("");
    } catch (error) {
      alert(error);
    }
  };

  return (
    <div className={styles.tabBody}>
      {/* TODO: usdcとjoeをハードコードしてるので注意 */}
      <BoxTemplate
        leftHeader={"Amount of Usdc"}
        right=""
        value={amountOfUsdc.toNumber()}
        onChange={(e) => onChangeAmountOfUsdc(e)}
      />
      <div className={styles.swapIcon}>
        <MdAdd />
      </div>
      <BoxTemplate
        leftHeader={"Amount of Joe"}
        right=""
        value={amountOfJoe.toNumber()}
        onChange={(e) => onChangeAmountOfKothi(e)}
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
