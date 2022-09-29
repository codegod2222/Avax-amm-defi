import { useEffect, useState } from "react";
import { AMM as AmmType } from "../../typechain-types";
import styles from "./Details.module.css";
import { TokenInfo } from "../../hooks/useContract";
import { BigNumber, ethers } from "ethers";
import { formatInClient } from "../../utils/format";

type Props = {
  tokens: TokenInfo[];
  ammContract: AmmType | undefined;
  sharePrecision: BigNumber | undefined;
  currentAccount: string | undefined;
  updateDetailsFlag: number;
};

export default function Details({
  tokens,
  ammContract,
  sharePrecision,
  currentAccount,
  updateDetailsFlag,
}: Props) {
  const [amountOfTokensOfUser, setAmountOfTokensOfUser] = useState<string[]>(
    []
  );
  const [amountOfTokensInPool, setAmountOfTokensInPool] = useState<string[]>(
    []
  );
  const [userShare, setUserShare] = useState("");
  const [totalShare, setTotalShare] = useState("");

  useEffect(() => {
    getAmountOfTokensOfUser();
    getAmountOfTokensInPool();
    getShares();
  }, [ammContract, tokens, updateDetailsFlag]);

  const getAmountOfTokensOfUser = async () => {
    if (!ammContract || tokens.length !== 2 || !currentAccount) return;
    try {
      setAmountOfTokensOfUser([]);
      for (let index = 0; index < tokens.length; index++) {
        const amountInWei = await tokens[index].contract.balanceOf(
          currentAccount
        );
        const amountInEther = ethers.utils.formatEther(amountInWei);
        setAmountOfTokensOfUser((prevState) => [...prevState, amountInEther]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getAmountOfTokensInPool = async () => {
    if (!ammContract || tokens.length !== 2 || !currentAccount) return;
    try {
      setAmountOfTokensInPool([]);
      for (let index = 0; index < tokens.length; index++) {
        const amountInWei = await ammContract.totalAmount(
          tokens[index].address
        );
        const amountInEther = ethers.utils.formatEther(amountInWei);
        setAmountOfTokensInPool((prevState) => [...prevState, amountInEther]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  async function getShares() {
    if (!ammContract || !currentAccount || !sharePrecision) return;
    try {
      let share = await ammContract.shares(currentAccount);
      setUserShare(formatInClient(share, sharePrecision));

      share = await ammContract.totalShares();
      setTotalShare(formatInClient(share, sharePrecision));
    } catch (err) {
      console.log("Couldn't Fetch details", err);
    }
  }
  //TODO shareが表示されていない
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
          <div className={styles.detailsValue}>{userShare}</div>
        </div>
        <div className={styles.detailsRow}>
          <div className={styles.detailsAttribute}>Total Shares:</div>
          <div className={styles.detailsValue}>{totalShare}</div>
        </div>
      </div>
    </div>
  );
}
