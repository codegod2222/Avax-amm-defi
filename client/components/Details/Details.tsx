import { useEffect, useState } from "react";
import styles from "./Details.module.css";
import { TokenType, AmmType } from "../../hooks/useContract";
import { ethers } from "ethers";
import { formatWithoutPrecision } from "../../utils/format";

type Props = {
  token0: TokenType | undefined;
  token1: TokenType | undefined;
  amm: AmmType | undefined;
  currentAccount: string | undefined;
  updateDetailsFlag: number;
};

export default function Details({
  token0,
  token1,
  amm,
  currentAccount,
  updateDetailsFlag,
}: Props) {
  const [amountOfUserTokens, setAmountOfUserTokens] = useState<string[]>([]);
  const [amountOfPoolTokens, setAmountOfPoolTokens] = useState<string[]>([]);
  const [tokens, setTokens] = useState<TokenType[]>([]);

  const [userShare, setUserShare] = useState("");
  const [totalShare, setTotalShare] = useState("");

  const DISPLAY_CHAR_LIMIT = 7;

  useEffect(() => {
    if (!token0 || !token1) return;
    setTokens([token0, token1]);
  }, [token0, token1]);

  useEffect(() => {
    getAmountOfUserTokens();
  }, [tokens, updateDetailsFlag]);

  useEffect(() => {
    getAmountOfPoolTokens();
  }, [amm, tokens, updateDetailsFlag]);

  useEffect(() => {
    getShare();
  }, [amm, updateDetailsFlag]);

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
    if (!amm) return;
    try {
      setAmountOfPoolTokens([]);
      for (let index = 0; index < tokens.length; index++) {
        const amountInWei = await amm.contract.totalAmount(
          tokens[index].contract.address
        );
        const amountInEther = ethers.utils.formatEther(amountInWei);
        setAmountOfPoolTokens((prevState) => [...prevState, amountInEther]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  async function getShare() {
    if (!amm || !currentAccount) return;
    try {
      let share = await amm.contract.share(currentAccount);
      let shareWithoutPrecision = formatWithoutPrecision(
        share,
        amm.sharePrecision
      );
      setUserShare(shareWithoutPrecision);

      share = await amm.contract.totalShare();
      shareWithoutPrecision = formatWithoutPrecision(share, amm.sharePrecision);
      setTotalShare(shareWithoutPrecision);
    } catch (err) {
      console.log("Couldn't Fetch details", err);
    }
  }

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
              <div className={styles.detailsValue}>
                {amount.substring(0, DISPLAY_CHAR_LIMIT)}
              </div>
            </div>
          );
        })}
        <div className={styles.detailsRow}>
          <div className={styles.detailsAttribute}>Share:</div>
          <div className={styles.detailsValue}>
            {userShare.substring(0, DISPLAY_CHAR_LIMIT)}
          </div>
        </div>
        <div className={styles.detailsHeader}>Pool Details</div>
        {amountOfPoolTokens.map((amount, index) => {
          return (
            <div className={styles.detailsRow}>
              <div className={styles.detailsAttribute}>
                Total {tokens[index].symbol}:
              </div>
              <div className={styles.detailsValue}>
                {amount.substring(0, DISPLAY_CHAR_LIMIT)}
              </div>
            </div>
          );
        })}
        <div className={styles.detailsRow}>
          <div className={styles.detailsAttribute}>Total Share:</div>
          <div className={styles.detailsValue}>
            {totalShare.substring(0, DISPLAY_CHAR_LIMIT)}
          </div>
        </div>
      </div>
    </div>
  );
}
