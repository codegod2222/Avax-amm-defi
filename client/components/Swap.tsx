import { ChangeEvent, useEffect, useState } from "react";
import { USDCToken as UsdcType } from "../typechain-types";
import { JOEToken as JoeType } from "../typechain-types";
import { AMM as AmmType } from "../typechain-types";
import { MdSwapVert } from "react-icons/md";
import styles from "./Swap.module.css";
import { UsdcAddress, JoeAddress } from "../hooks/useContract";
import BoxTemplate from "./BoxTemplate";

type Props = {
  usdcContract: UsdcType | undefined;
  joeContract: JoeType | undefined;
  ammContract: AmmType | undefined;
};

//TODO: Bignumber使う
export default function Swap({
  usdcContract,
  joeContract,
  ammContract,
}: Props) {
  // スワップ元とスワップ先のトークンのアドレスを格納します。
  const [tokenAddressSrc, setTokenAddressSrc] = useState(UsdcAddress);
  const [tokenAddressDst, setTokenAddressDst] = useState(JoeAddress);

  const [amountSrc, setAmountSrc] = useState(0.0);
  const [amountDst, setAmountDst] = useState(0.0);

  const [precision, setPrecision] = useState(0);

  useEffect(() => {
    getPrecision();
  }, []);

  async function getPrecision() {
    if (!ammContract) return;
    try {
      const precision = await ammContract.PRECISION();
      setPrecision(precision.toNumber());
    } catch (error) {
      console.log(error);
    }
  }

  const rev = () => {
    // スワップ元とスワップ先のトークンのアドレスを交換します。
    const copy = tokenAddressSrc;
    setTokenAddressSrc(tokenAddressDst);
    setTokenAddressDst(copy);

    getSwapEstimateDst(amountSrc); //TODO: ここあんまわかってない
  };

  // スワップ元トークンに指定された量から, スワップ先トークンの受け取れる量を取得します。
  const getSwapEstimateDst = async (val: number) => {
    if (["", "."].includes(val.toString())) return; //TODO: ここあんまわかってない
    if (ammContract) {
      try {
        let amount = await ammContract.swapEstimateFromSrcToken(
          tokenAddressSrc,
          val * precision
        );
        setAmountDst(amount.toNumber() / precision);
      } catch (error) {
        alert(error);
      }
    }
  };

  // スワップ先トークンに指定された量から, スワップ元トークンに必要な量を取得します。
  const getSwapEstimateSrc = async (val: number) => {
    if (["", "."].includes(val.toString())) return; //TODO: ここあんまわかってない
    if (ammContract) {
      try {
        let amount = await ammContract.swapEstimateFromDstToken(
          tokenAddressDst,
          val * precision
        );
        setAmountSrc(amount.toNumber() / precision);
      } catch (error) {
        alert(error);
      }
    }
  };

  const onChangeSrc = (val: ChangeEvent<HTMLInputElement>) => {
    setAmountSrc(Number(val.target.value)); //TODO: 強引なのでやり方考える
    getSwapEstimateDst(Number(val.target.value)); //TODO: 強引なのでやり方考える
  };

  const onChangeDst = (val: ChangeEvent<HTMLInputElement>) => {
    setAmountDst(Number(val.target.value)); //TODO: 強引なのでやり方考える
    getSwapEstimateSrc(Number(val.target.value)); //TODO: 強引なのでやり方考える
  };

  // Helps swap a token to another.
  const onSwap = async () => {
    if (["", "."].includes(amountSrc.toString())) {
      //TODO: ここあんまわかってない
      alert("Amount should be a valid number");
      return;
    }
    if (ammContract === undefined) {
      alert("Connect to Metamask");
      return;
    }
    try {
      const txn = await ammContract.swap(
        tokenAddressSrc,
        tokenAddressDst,
        amountSrc * precision
      );
      await txn.wait();
      setAmountSrc(0);
      setAmountDst(0);
      // await props.getHoldings(); // TODO: ここでユーザ情報の更新作業, このようにプロップスとして受け取ってもいかも
      alert("Success!");
    } catch (error) {
      alert(error);
    }
  };

  return (
    <div className={styles.tabBody}>
      <BoxTemplate
        leftHeader={"From"}
        right={tokenAddressSrc}
        value={amountSrc}
        onChange={(e) => onChangeSrc(e)}
      />
      <div className={styles.swapIcon} onClick={() => rev()}>
        <MdSwapVert />
      </div>
      <BoxTemplate
        leftHeader={"To"}
        right={tokenAddressDst}
        value={amountDst}
        onChange={(e) => onChangeDst(e)}
      />
      <div className={styles.bottomDiv}>
        <div className={styles.btn} onClick={() => onSwap()}>
          Swap
        </div>
      </div>
    </div>
  );
}
