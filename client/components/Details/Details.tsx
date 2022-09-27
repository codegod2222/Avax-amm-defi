import { useEffect, useState } from "react";
import { AMM as AmmType } from "../../typechain-types";
import styles from "./Details.module.css";
import { TokenInfo } from "../../hooks/useContract";
import { ethers } from "ethers";

type Props = {
  tokens: TokenInfo[];
  ammContract: AmmType | undefined;
  currentAccount: string | undefined;
};

export default function Details({
  tokens,
  ammContract,
  currentAccount,
}: Props) {
  const [amountOfTokensOfUser, setAmountOfTokensOfUser] = useState<string[]>(
    []
  );
  const [amountOfTokensInPool, setAmountOfTokensInPool] = useState<string[]>(
    []
  );
  const [userShare, setUserShare] = useState("");
  const [totalShare, setTotalShare] = useState("");

  // 今ラグができる, サーバサイドレンダリングする？
  useEffect(() => {
    getAmountOfTokensOfUser();
    getAmountOfTokensInPool();
    getShares();
  }, [ammContract, tokens]);

  const getAmountOfTokensOfUser = async () => {
    if (!ammContract || tokens.length !== 2 || !currentAccount) return;
    try {
      setAmountOfTokensOfUser([]);
      tokens.map(async (token) => {
        const amountInWei = await token.contract.balanceOf(currentAccount);
        const amountInEther = ethers.utils.formatEther(amountInWei);
        setAmountOfTokensOfUser((prevState) => [...prevState, amountInEther]);
      });
    } catch (error) {
      console.log(error);
    }
  };

  const getAmountOfTokensInPool = async () => {
    if (!ammContract || tokens.length !== 2 || !currentAccount) return;
    try {
      setAmountOfTokensInPool([]);
      tokens.map(async (token) => {
        const amountInWei = await ammContract.totalAmount(token.address);
        const amountInEther = ethers.utils.formatEther(amountInWei);
        setAmountOfTokensInPool((prevState) => [...prevState, amountInEther]);
      });
    } catch (error) {
      console.log(error);
    }
  };

  async function getShares() {
    if (!ammContract || !currentAccount) return;
    try {
      let share = await ammContract.shares(currentAccount);
      setUserShare(share.toString());

      share = await ammContract.totalShares();
      setTotalShare(share.toString());
    } catch (err) {
      console.log("Couldn't Fetch details", err);
    }
  }

  return (
    <div className={styles.details}>
      <div className={styles.detailsBody}>
        <div className={styles.detailsHeader}>Your Details</div>
        {amountOfTokensOfUser.map((amount, index) => {
          return (
            <div className={styles.detailsRow}>
              <div className={styles.detailsAttribute}>
                {tokens[index] ? tokens[index].symbol : "some token"}:
              </div>
              <div className={styles.detailsValue}>{amount}</div>
            </div>
          );
        })}
        <div className={styles.detailsHeader}>Pool Details</div>
        {amountOfTokensInPool.map((amount, index) => {
          return (
            <div className={styles.detailsRow}>
              <div className={styles.detailsAttribute}>
                Total {tokens[index] ? tokens[index].symbol : "some token"}::
              </div>
              <div className={styles.detailsValue}>{amount}</div>
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
