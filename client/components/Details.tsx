import { useEffect, useState } from "react";
import { USDCToken as UsdcType } from "../typechain-types";
import { JOEToken as JoeType } from "../typechain-types";
import { AMM as AmmType } from "../typechain-types";
import styles from "./Details.module.css";
import { UsdcAddress, JoeAddress } from "../hooks/useContract";
import { BigNumber } from "ethers";

type TokenDetails = {
  symbol: string;
  amountOfUser: BigNumber;
  amountOfPool: BigNumber;
};

type Props = {
  usdcContract: UsdcType | undefined;
  joeContract: JoeType | undefined;
  ammContract: AmmType | undefined;
  currentAccount: string | undefined;
};

// useEffectの使い方, サーバサイドレンダリングする？？
export default function Details({
  usdcContract,
  joeContract,
  ammContract,
  currentAccount,
}: Props) {
  const [allTokenDetails, setAllTokenDetails] = useState<TokenDetails[]>([]);
  const [userShare, setUserShare] = useState(BigNumber.from(0));
  const [totalShare, setTotalShare] = useState(BigNumber.from(0));

  useEffect(() => {
    getTokenDetails(usdcContract, UsdcAddress);
    getTokenDetails(joeContract, JoeAddress);
    getShares();
  }, [usdcContract, joeContract, ammContract, currentAccount]);

  async function getTokenDetails(
    tokenContract: UsdcType | JoeType | undefined,
    tokenAddress: string
  ) {
    if (!ammContract) return;
    if (!tokenContract) return;
    if (!currentAccount) return;
    try {
      const precision = await ammContract.PRECISION();
      console.log("Fetching details----");

      const symbol = await tokenContract.symbol();
      const amountOfUser = (await tokenContract.balanceOf(currentAccount)).div(
        precision
      );
      const amountOfPool = (await ammContract.totalAmount(tokenAddress)).div(
        precision
      );

      setAllTokenDetails((prevState) => [
        ...prevState,
        {
          symbol: symbol,
          amountOfUser: amountOfUser,
          amountOfPool: amountOfPool,
        },
      ]);
    } catch (err) {
      console.log("Couldn't Fetch details", err);
    }
  }

  async function getShares() {
    if (!ammContract) return;
    if (!currentAccount) return;
    try {
      const precision = await ammContract.PRECISION();

      let share = (await ammContract.shares(currentAccount)).div(precision);
      setUserShare(share);

      share = (await ammContract.totalShares()).div(precision);
      setTotalShare(share);
    } catch (err) {
      console.log("Couldn't Fetch details", err);
    }
  }

  return (
    <div className={styles.details}>
      <div className={styles.detailsBody}>
        <div className={styles.detailsHeader}>Details</div>
        {allTokenDetails.map((detail) => {
          return (
            <div className={styles.detailsRow}>
              <div className={styles.detailsAttribute}>
                Amount of {detail.symbol}:
              </div>
              <div className={styles.detailsValue}>
                {detail.amountOfUser.toString()}
              </div>
            </div>
          );
        })}
        <div className={styles.detailsHeader}>Pool Details</div>
        {allTokenDetails.map((detail) => {
          return (
            <div className={styles.detailsRow}>
              <div className={styles.detailsAttribute}>
                Total {detail.symbol}:
              </div>
              <div className={styles.detailsValue}>
                {detail.amountOfPool.toString()}
              </div>
            </div>
          );
        })}
        <div className={styles.detailsRow}>
          <div className={styles.detailsAttribute}>Your Share:</div>
          <div className={styles.detailsValue}>{userShare.toString()}</div>
        </div>
        <div className={styles.detailsRow}>
          <div className={styles.detailsAttribute}>Total Shares:</div>
          <div className={styles.detailsValue}>{totalShare.toString()}</div>
        </div>
      </div>
    </div>
  );
}
