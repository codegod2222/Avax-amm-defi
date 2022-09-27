import { useState, useEffect } from "react";
import { ethers } from "ethers";
import UsdcArtifact from "../utils/USDCToken.json";
import JoeArtifact from "../utils/USDCToken.json";
import AmmArtifact from "../utils/AMM.json";
import { USDCToken as UsdcType } from "../typechain-types";
import { JOEToken as JoeType } from "../typechain-types";
import { AMM as AmmType } from "../typechain-types";
import { getEthereum } from "../utils/ethereum";

export const UsdcAddress = "0x3C25603dD3Af61597bb6c9D15B76F68d9926F385";
export const JoeAddress = "0xAc3bB21014CBf5a671AFB199B1D2B9a30116604F";
export const AmmAddress = "0xE8430Ce3f3A5d4A0E63f5C69e93574e8c9C12db0";

//TODO: トークンの型はfaucetもついたインターフェースにすると良いかも？
export type TokenInfo = {
  symbol: string;
  address: string;
  contract: UsdcType | JoeType;
};

// useContractの返すオブジェクトの型定義です。
type ReturnUseContract = {
  usdcContract: UsdcType | undefined; //TODO 消す
  joeContract: JoeType | undefined; //TODO 消す
  tokens: TokenInfo[];
  ammContract: AmmType | undefined;
};

export const useContract = (): ReturnUseContract => {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [usdcContract, setUsdcContract] = useState<UsdcType>();
  const [joeContract, setJoeContract] = useState<JoeType>(); //TODO 消す
  const [ammContract, setAmmContract] = useState<AmmType>(); // TODO 消す
  const ethereum = getEthereum();

  const getContract = (
    contractAddress: string,
    abi: ethers.ContractInterface,
    storeContract: (_: ethers.Contract) => void
  ) => {
    if (!ethereum) {
      console.log("Ethereum object doesn't exist!");
      return;
    }
    try {
      // @ts-ignore: ethereum as ethers.providers.ExternalProvider
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const Contract = new ethers.Contract(contractAddress, abi, signer);
      storeContract(Contract);
    } catch (error) {
      console.log(error);
    }
  };

  const addTokenInfo = async (
    address: string,
    contract: UsdcType | JoeType
  ) => {
    try {
      const symbol = await contract.symbol();
      setTokens((prevState) => [
        ...prevState,
        {
          symbol: symbol,
          address: address,
          contract: contract,
        },
      ]);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getContract(UsdcAddress, UsdcArtifact.abi, (Contract: ethers.Contract) => {
      addTokenInfo(UsdcAddress, Contract as UsdcType);
    });
    getContract(JoeAddress, JoeArtifact.abi, (Contract: ethers.Contract) => {
      addTokenInfo(UsdcAddress, Contract as JoeType);
    });
    getContract(AmmAddress, AmmArtifact.abi, (Contract: ethers.Contract) => {
      setAmmContract(Contract as AmmType);
    });
  }, [ethereum]);

  return {
    usdcContract: usdcContract,
    joeContract: joeContract,
    ammContract: ammContract,
    tokens: tokens,
  };
};
