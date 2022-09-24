import { useState, useEffect } from "react";
import { ethers } from "ethers";
import UsdcArtifact from "../utils/USDCToken.json";
import JoeArtifact from "../utils/USDCToken.json";
import AmmArtifact from "../utils/AMM.json";
import { USDCToken as UsdcType } from "../typechain-types";
import { JOEToken as JoeType } from "../typechain-types";
import { AMM as AmmType } from "../typechain-types";
import { getEthereum } from "../utils/ethereum";

const UsdcAddress = "0x3C25603dD3Af61597bb6c9D15B76F68d9926F385";
const JoeAddress = "0xAc3bB21014CBf5a671AFB199B1D2B9a30116604F";
const AmmAddress = "0xE8430Ce3f3A5d4A0E63f5C69e93574e8c9C12db0";

// useContractの返すオブジェクトの型定義です。
type ReturnUseContract = {
  usdcContract: UsdcType | undefined;
  joeContract: JoeType | undefined;
  ammContract: AmmType | undefined;
};

export const useContract = (): ReturnUseContract => {
  const [usdcContract, setUsdcContract] = useState<UsdcType>();
  const [joeContract, setJoeContract] = useState<JoeType>();
  const [ammContract, setAmmContract] = useState<AmmType>();
  const ethereum = getEthereum();

  function getContract(
    contractAddress: string,
    abi: ethers.ContractInterface,
    setContract: (_: ethers.Contract) => void
  ) {
    try {
      if (ethereum) {
        // @ts-ignore: ethereum as ethers.providers.ExternalProvider
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const Contract = new ethers.Contract(contractAddress, abi, signer);
        setContract(Contract);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    getContract(UsdcAddress, UsdcArtifact.abi, (Contract: ethers.Contract) => {
      setUsdcContract(Contract as UsdcType);
    });
    getContract(JoeAddress, JoeArtifact.abi, (Contract: ethers.Contract) => {
      setJoeContract(Contract as JoeType);
    });
    getContract(AmmAddress, AmmArtifact.abi, (Contract: ethers.Contract) => {
      setAmmContract(Contract as AmmType);
    });
  }, [ethereum]);

  return {
    usdcContract: usdcContract,
    joeContract: joeContract,
    ammContract: ammContract,
  };
};
