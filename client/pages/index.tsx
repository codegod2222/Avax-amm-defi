import type { NextPage } from 'next'
import styles from '../styles/Home.module.css'
import { useWallet } from "../hooks/useWallet";
import { useAmmContract } from '../hooks/useAmmContract';


const Home: NextPage = () => {
  const { currentAccount, connectWallet } = useWallet();
  const {totalShares, getTotalShares} = useAmmContract({currentAccount: currentAccount});

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
