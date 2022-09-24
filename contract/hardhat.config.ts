import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv"; // 環境構築時にこのパッケージはインストールしてあります。

// .envファイルから環境変数をロードします。
dotenv.config();

if (process.env.MNEMONIC === undefined) {
  console.log("mnemonic is missing");
}

module.exports = {
  solidity: "0.8.9",
  networks: {
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: {
        mnemonic: process.env.MNEMONIC,
      },
    },
  },
};
