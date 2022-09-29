import { ChangeEvent, useEffect, useState } from "react";
import { AMM as AmmType } from "../../typechain-types";
import { TokenInfo } from "../../hooks/useContract";
import styles from "./Select.module.css";
import { ethers } from "ethers";
import BoxTemplate from "../InputBox/BoxTemplate";
import { MdAdd } from "react-icons/md";
import { validAmount } from "../../utils/validAmount";

type Props = {
  token0: TokenInfo | undefined;
  token1: TokenInfo | undefined;
  ammContract: AmmType | undefined;
  currentAccount: string | undefined;
  updateDetails: () => void;
};
//TODO 順番が変わるのだるいのでmapは使わないようにするか？, それかorderする
//TODO コントラクトのアドレスはcontract.addressで取得できる!定数も関数で持ってこれるようにしていいかも, ひとまずカレントアカウントだけ引数で渡すように, サインインで得たものと同じものを使うという意味で
//TODO 一旦各コントラクトと, それぞれ定数を持ってくるようにリファクタ->コントラクトや定数はuseContractから各コンポーネントで呼び出す
export default function Provide({
  token0,
  token1,
  ammContract,
  currentAccount,
  updateDetails,
}: Props) {
  const [amountOfToken0, setAmountOfToken0] = useState("");
  const [amountOfToken1, setAmountOfToken1] = useState("");
  const [activePool, setActivePool] = useState(true);

  useEffect(() => {
    checkLiquidity();
  }, [ammContract]);

  const checkLiquidity = async () => {
    if (!ammContract) return;
    try {
      const totalShares = await ammContract.totalShares();
      if (totalShares.toString() === "0") {
        setActivePool(false);
      } else {
        setActivePool(true);
      }
    } catch (error) {
      alert(error);
    }
  };

  const getProvideEstimate = async (
    token: TokenInfo,
    amount: string,
    setPairTokenAmount: (amount: string) => void
  ) => {
    if (!ammContract || !token0 || !token1) return;
    if (!activePool) return;
    if (!validAmount(amount)) return;
    try {
      const amountInWei = ethers.utils.parseEther(amount);
      const pairAmountInWei = await ammContract.equivalentToken(
        token.address,
        amountInWei
      );
      const pairAmountInEther = ethers.utils.formatEther(pairAmountInWei);
      setPairTokenAmount(pairAmountInEther);
    } catch (error) {
      alert(error);
    }
  };

  const onChangeAmount = (
    e: ChangeEvent<HTMLInputElement>,
    token: TokenInfo | undefined,
    setAmount: (amount: string) => void,
    setPairTokenAmount: (amount: string) => void
  ) => {
    if (!token) return;
    setAmount(e.target.value);
    getProvideEstimate(token, e.target.value, setPairTokenAmount);
  };

  const onClickProvide = async () => {
    if (!currentAccount) {
      alert("connect wallet");
      return;
    }
    if (!ammContract || !token0 || !token1) return;
    if (!validAmount(amountOfToken0) || !validAmount(amountOfToken1)) {
      alert("Amount should be a valid number");
      return;
    }
    try {
      const amountToken0InWei = ethers.utils.parseEther(amountOfToken0);
      const amountToken1InWei = ethers.utils.parseEther(amountOfToken1);

      await token0.contract.approve(ammContract.address, amountToken0InWei);
      await token1.contract.approve(ammContract.address, amountToken1InWei);

      const txn = await ammContract.provide(
        token0.address,
        amountToken0InWei,
        token1.address,
        amountToken1InWei
      );
      await txn.wait();
      setAmountOfToken0("");
      setAmountOfToken1("");
      updateDetails(); // ユーザとammの情報を更新
      alert("Success");
    } catch (error) {
      alert(error);
    }
  };

  return (
    <div className={styles.tabBody}>
      <BoxTemplate
        leftHeader={"Amount of " + (token0 ? token0.symbol : "some token")}
        right={token0 ? token0.symbol : ""}
        value={amountOfToken0}
        onChange={(e) =>
          onChangeAmount(e, token0, setAmountOfToken0, setAmountOfToken1)
        }
      />
      <div className={styles.swapIcon}>
        <MdAdd />
      </div>
      <BoxTemplate
        leftHeader={"Amount of " + (token1 ? token1.symbol : "some token")}
        right={token1 ? token1.symbol : ""}
        value={amountOfToken1}
        onChange={(e) =>
          onChangeAmount(e, token1, setAmountOfToken1, setAmountOfToken0)
        }
      />
      {!activePool && (
        <div className={styles.error}>
          Message: Empty pool. Set the initial conversion rate.
        </div>
      )}
      <div className={styles.bottomDiv}>
        <div className={styles.btn} onClick={() => onClickProvide()}>
          Provide
        </div>
      </div>
    </div>
  );
}
