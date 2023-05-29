import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { MdSwapVert } from 'react-icons/md';

import { AmmType, TokenType } from '../../hooks/useContract';
import { validAmount } from '../../utils/validAmount';
import InputNumberBox from '../InputBox/InputNumberBox';
import styles from './SelectTab.module.css';

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
  const [tokenIn, setTokenIn] = useState<TokenType>();
  const [tokenOut, setTokenOut] = useState<TokenType>();

  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');

  useEffect(() => {
    setTokenIn(token0);
    setTokenOut(token1);
  }, [token0, token1]);

  const rev = () => {
    // スワップ元とスワップ先のトークンを交換します。
    const inCopy = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(inCopy);

    // 交換後はソーストークンから推定量を再計算します。
    getSwapEstimateOut(amountIn);
  };

  // スワップ元トークンに指定された量から, スワップ先トークンの受け取れる量を取得します。
  const getSwapEstimateOut = async (amount: string) => {
    if (!amm || !tokenIn) return;
    if (!validAmount(amount)) return;
    try {
      const amountInInWei = ethers.utils.parseEther(amount);
      const amountOutInWei = await amm.contract.getSwapEstimateOut(
        tokenIn.contract.address,
        amountInInWei,
      );
      const amountOutInEther = ethers.utils.formatEther(amountOutInWei);
      setAmountOut(amountOutInEther);
    } catch (error) {
      alert(error);
    }
  };

  // スワップ先トークンに指定された量から, スワップ元トークンに必要な量を取得します。
  const getSwapEstimateIn = async (amount: string) => {
    if (!amm || !tokenOut) return;
    if (!validAmount(amount)) return;
    if (amm) {
      try {
        const amountOutInWei = ethers.utils.parseEther(amount);
        const amountInInWei = await amm.contract.getSwapEstimateIn(
          tokenOut.contract.address,
          amountOutInWei,
        );
        const amountInInEther = ethers.utils.formatEther(amountInInWei);
        setAmountIn(amountInInEther);
      } catch (error) {
        alert(error);
      }
    }
  };

  const onChangeIn = (amount: string) => {
    setAmountIn(amount);
    getSwapEstimateOut(amount);
  };

  const onChangeOut = (amount: string) => {
    setAmountOut(amount);
    getSwapEstimateIn(amount);
  };

  const onClickSwap = async () => {
    if (!currentAccount) {
      alert('Connect to wallet');
      return;
    }
    if (!amm || !tokenIn || !tokenOut) return;
    if (!validAmount(amountIn)) {
      alert('Amount should be a valid number');
      return;
    }
    try {
      const amountInInWei = ethers.utils.parseEther(amountIn);

      const txnIn = await tokenIn.contract.approve(
        amm.contract.address,
        amountInInWei,
      );
      await txnIn.wait();

      const txn = await amm.contract.swap(
        tokenIn.contract.address,
        tokenOut.contract.address,
        amountInInWei,
      );
      await txn.wait();
      setAmountIn('');
      setAmountOut('');
      updateDetails(); // ユーザとammの情報を更新
      alert('Success!');
    } catch (error) {
      alert(error);
    }
  };

  return (
    <div className={styles.tabBody}>
      <InputNumberBox
        leftHeader={'From'}
        right={tokenIn ? tokenIn.symbol : ''}
        value={amountIn}
        onChange={(e) => onChangeIn(e.target.value)}
      />
      <div className={styles.swapIcon} onClick={() => rev()}>
        <MdSwapVert />
      </div>
      <InputNumberBox
        leftHeader={'To'}
        right={tokenOut ? tokenOut.symbol : ''}
        value={amountOut}
        onChange={(e) => onChangeOut(e.target.value)}
      />
      <div className={styles.bottomDiv}>
        <div className={styles.btn} onClick={() => onClickSwap()}>
          Swap
        </div>
      </div>
    </div>
  );
}
