import { MetaMaskInpageProvider } from "@metamask/providers";
//TODO metamaskのライブラリを使っていて良いのか調べる

//TODO ここで何してるかコメント書いておく
declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider;
  }
}

export const getEthereum = (): MetaMaskInpageProvider | null => {
  if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
    const { ethereum } = window;
    return ethereum;
  }
  return null;
};
