import { useEffect, useState } from "react";
import { AMM as AmmType } from "../../typechain-types";
import styles from "./Details.module.css";
import { TokenInfo } from "../../hooks/useContract";
import { BigNumber, ethers } from "ethers";
import { formatWithoutPrecision } from "../../utils/format";

type Props = {
  token0: TokenInfo | undefined;
  token1: TokenInfo | undefined;
  ammContract: AmmType | undefined;
  sharePrecision: BigNumber | undefined;
  currentAccount: string | undefined;
  updateDetailsFlag: number;
};

export default function Details({
  token0,
  token1,
  ammContract,
  sharePrecision,
  currentAccount,
  updateDetailsFlag,
}: Props) {
  const [amountOfUserTokens, setAmountOfUserTokens] = useState<string[]>([]);
  const [amountOfPoolTokens, setAmountOfPoolTokens] = useState<string[]>([]);
  const [tokens, setTokens] = useState<TokenInfo[]>([]);

  const [userShare, setUserShare] = useState("");
  const [totalShare, setTotalShare] = useState("");

  useEffect(() => {
    if (!token0 || !token1) return;
    setTokens([token0, token1]);
  }, [token0, token1]);

  useEffect(() => {
    getAmountOfUserTokens();
  }, [tokens, updateDetailsFlag]);

  useEffect(() => {
    getAmountOfPoolTokens();
  }, [ammContract, tokens, updateDetailsFlag]);

  useEffect(() => {
    getShares();
  }, [ammContract, sharePrecision, updateDetailsFlag]);

  const getAmountOfUserTokens = async () => {
    if (!currentAccount) return;
    try {
      setAmountOfUserTokens([]);
      for (let index = 0; index < tokens.length; index++) {
        const amountInWei = await tokens[index].contract.balanceOf(
          currentAccount
        );
        const amountInEther = ethers.utils.formatEther(amountInWei);
        setAmountOfUserTokens((prevState) => [...prevState, amountInEther]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getAmountOfPoolTokens = async () => {
    if (!ammContract) return;
    try {
      setAmountOfPoolTokens([]);
      for (let index = 0; index < tokens.length; index++) {
        const amountInWei = await ammContract.totalAmount(
          tokens[index].address
        );
        const amountInEther = ethers.utils.formatEther(amountInWei);
        setAmountOfPoolTokens((prevState) => [...prevState, amountInEther]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  async function getShares() {
    if (!ammContract || !currentAccount || !sharePrecision) return;
    try {
      let share = await ammContract.shares(currentAccount);
      let shareWithoutPrecision = formatWithoutPrecision(share, sharePrecision);
      setUserShare(shareWithoutPrecision);

      share = await ammContract.totalShares();
      shareWithoutPrecision = formatWithoutPrecision(share, sharePrecision);
      setTotalShare(shareWithoutPrecision);
    } catch (err) {
      console.log("Couldn't Fetch details", err);
    }
  }

  //TODO shareなのかsharesなのか
  return (
    <div className={styles.details}>
      <div className={styles.detailsBody}>
        <div className={styles.detailsHeader}>Your Details</div>
        {amountOfUserTokens.map((amount, index) => {
          return (
            <div className={styles.detailsRow}>
              <div className={styles.detailsAttribute}>
                {tokens[index].symbol}:
              </div>
              <div className={styles.detailsValue}>{amount}</div>
            </div>
          );
        })}
        <div className={styles.detailsHeader}>Pool Details</div>
        {amountOfPoolTokens.map((amount, index) => {
          return (
            <div className={styles.detailsRow}>
              <div className={styles.detailsAttribute}>
                Total {tokens[index].symbol}:
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
