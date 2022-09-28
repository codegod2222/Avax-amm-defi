import type { NextPage } from "next";
import styles from "../styles/Home.module.css";
import { useWallet } from "../hooks/useWallet";
import { useContract } from "../hooks/useContract";
import Container from "../components/Container/Container";

const Home: NextPage = () => {
  const { currentAccount, connectWallet } = useWallet();
  const { tokens, ammContract, sharePrecision } = useContract(currentAccount);

  return (
    <div className={styles.pageBody}>
      <div className={styles.navBar}>
        <div className={styles.appName}> AMM </div>
        {currentAccount == undefined ? (
          <div className={styles.connectBtn} onClick={connectWallet}>
            {" "}
            Connect to wallet{" "}
          </div>
        ) : (
          <div className={styles.connected}>
            {" "}
            {"Connected to " + currentAccount}{" "}
          </div>
        )}
      </div>
      <Container
        tokens={tokens}
        ammContract={ammContract}
        sharePrecision={sharePrecision}
        currentAccount={currentAccount}
      />
    </div>
  );
};

export default Home;
