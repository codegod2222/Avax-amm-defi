import type { NextPage } from 'next'
import { useState} from "react";
import { BigNumber} from "ethers";
import styles from '../styles/Home.module.css'
import { useWallet } from "../hooks/useWallet";
import { useContract } from '../hooks/useContract';

const Home: NextPage = () => {
  const { currentAccount, connectWallet } = useWallet();
  const {usdcContract, joeContract, ammContract} = useContract();

  const [totalShares, setTotalShares] = useState<BigNumber>();

  async function getTotalShares() {
    if (!ammContract) return;
    try {
      const shares = await ammContract.totalShares();
      setTotalShares(shares);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div>
      {currentAccount ? (
        <div>
          <div className={styles.wallet}>
            <p className={styles.title}>wallet: </p>
            <p>{currentAccount}</p>
          </div>
          <div>
            <p>{totalShares?.toString()}</p>
            <button onClick={getTotalShares}>
          getTotalShares
        </button>
          </div>
        </div>
      ) : (
        <button className="connectWalletButton" onClick={connectWallet}>
          Connect Wallet
        </button>
      )}
    </div>
  )
}

export default Home
