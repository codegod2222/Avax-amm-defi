import { useEffect, useState } from "react";
import { USDCToken as UsdcType } from "../../typechain-types";
import { JOEToken as JoeType } from "../../typechain-types";
import { AMM as AmmType } from "../../typechain-types";
import { MdSwapVert } from "react-icons/md";
import styles from "./Select.module.css";
import { UsdcAddress, JoeAddress } from "../../hooks/useContract";
import BoxTemplate from "../InputBox/BoxTemplate";
import { BigNumber } from "ethers";

type Props = {
  usdcContract: UsdcType | undefined;
  joeContract: JoeType | undefined;
  ammContract: AmmType | undefined;
};

export default function Swap({
  usdcContract,
  joeContract,
  ammContract,
}: Props) {
  // スワップ元とスワップ先のトークンのアドレスを格納します。
  const [tokenAddressSrc, setTokenAddressSrc] = useState(UsdcAddress);
  const [tokenAddressDst, setTokenAddressDst] = useState(JoeAddress);

  const [amountSrc, setAmountSrc] = useState(BigNumber.from(0));
  const [amountDst, setAmountDst] = useState(BigNumber.from(0));

  const [precision, setPrecision] = useState(BigNumber.from(0));

  useEffect(() => {
    getPrecision();
  }, []);

  async function getPrecision() {
    if (!ammContract) return;
    try {
      const precision = await ammContract.PRECISION();
      setPrecision(precision);
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
  const getSwapEstimateDst = async (val: BigNumber) => {
    if (["", "."].includes(val.toString())) return; //TODO: ここあんまわかってない
    if (ammContract) {
      try {
        let amount = await ammContract.swapEstimateFromSrcToken(
          //TODO コントラクトとフロント側で関数名の考え方統一する
          tokenAddressSrc,
          val //TODO 桁調整
        );
        setAmountDst(amount); // TODO 桁調整
      } catch (error) {
        alert(error);
      }
    }
  };

  // スワップ先トークンに指定された量から, スワップ元トークンに必要な量を取得します。
  const getSwapEstimateSrc = async (val: BigNumber) => {
    if (["", "."].includes(val.toString())) return; //TODO: ここあんまわかってない
    if (ammContract) {
      try {
        let amount = await ammContract.swapEstimateFromDstToken(
          tokenAddressDst,
          val //TODO 桁調整
        );
        setAmountSrc(amount); // TODO 桁調整
      } catch (error) {
        alert(error);
      }
    }
  };

  const onChangeSrc = (val: BigNumber) => {
    setAmountSrc(val);
    getSwapEstimateDst(val);
  };

  const onChangeDst = (val: BigNumber) => {
    setAmountDst(val);
    getSwapEstimateSrc(val);
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
        amountSrc //TODO 桁調整
      );
      await txn.wait();
      setAmountSrc(BigNumber.from(0));
      setAmountDst(BigNumber.from(0));
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
        right={tokenAddressSrc}
        value={amountSrc.toNumber()}
        onChange={(e) => onChangeSrc(BigNumber.from(e.target.value))}
      />
      <div className={styles.swapIcon} onClick={() => rev()}>
        <MdSwapVert />
      </div>
      <BoxTemplate
        leftHeader={"To"}
        right={tokenAddressDst}
        value={amountDst.toNumber()}
        onChange={(e) => onChangeDst(BigNumber.from(e.target.value))}
      />
      <div className={styles.bottomDiv}>
        <div className={styles.btn} onClick={() => onSwap()}>
          Swap
        </div>
      </div>
    </div>
  );
}
