import { useState, useEffect } from "react";
import { BigNumber, ethers } from "ethers";
import abi from "../utils/AMM.json";
import { getEthereum } from "../utils/ethereum";
import { AMM as AmmType } from "../typechain-types";

const contractAddress = "0xE8430Ce3f3A5d4A0E63f5C69e93574e8c9C12db0";
const contractABI = abi.abi;

// useAmmContractの返すオブジェクトの型定義です。
type ReturnUseAmmContract = {
  totalShares: BigNumber | undefined;
  getTotalShares: () => void;
};

// useAmmContractの引数のオブジェクトの型定義です。
type PropsUseAmmContract = {
  currentAccount: string | undefined;
};

export const useAmmContract = ({
  currentAccount,
}: PropsUseAmmContract): ReturnUseAmmContract => {
  const [ammContract, setAmmContract] = useState<AmmType>();
  const [processing, setProcessing] = useState<boolean>(false);
  const [totalShares, setTotalShares] = useState<BigNumber>();
  const ethereum = getEthereum();

  function getMessengerContract() {
    try {
      if (ethereum) {
        // @ts-ignore: ethereum as ethers.providers.ExternalProvider
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const MessengerContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        ) as AmmType;
        setAmmContract(MessengerContract);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function getTotalShares() {
    if (!ammContract) return;
    try {
      const shares = await ammContract.totalShares();
      setTotalShares(shares);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    getMessengerContract();
  }, [ethereum]);

  return {
    totalShares: totalShares,
    getTotalShares: getTotalShares,
  };
};
