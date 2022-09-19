import { ethers } from "hardhat";
import { Overrides } from "ethers";

async function deploy() {
  // コントラクトをデプロイするアカウントのアドレスを取得します。
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with the account:", deployer.address);

  // コントラクトのインスタンスを作成します。
  const AMM = await ethers.getContractFactory("AMM");

  // The deployed instance of the contract
  const amm = await AMM.deploy();

  await amm.deployed();

  console.log("Contract deployed at:", amm.address);
  console.log(
    "Contract's fund is:",
    await amm.provider.getBalance(amm.address)
  );
}

deploy()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
