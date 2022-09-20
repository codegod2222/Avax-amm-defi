import hre, { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("AMM", function () {
  async function deployContract() {
    // 初めのアドレスはコントラクトのデプロイに使用されます。
    const [owner, otherAccount] = await ethers.getSigners();

    const AMM = await hre.ethers.getContractFactory("AMM");
    const amm = await AMM.deploy();

    const precision = await amm.PRECISION();

    return { amm, precision, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right number of holdings", async function () {
      const { amm } = await loadFixture(deployContract);

      await amm.faucet(1000, 1000);

      const holdings = await amm.getMyHoldings();

      expect(holdings.amountToken1).to.equal(1000);
      expect(holdings.amountToken2).to.equal(1000);
      expect(holdings.myShare).to.equal(0);
    });

    // なぜかうまくいかない
    // it("Should set the right number of holdings", async function () {
    //   const { amm } = await loadFixture(deployContract);

    //   await amm.faucet(1000, 1000);

    //   expect(await amm.provide(100, 10)).to.equal(100000000);
    // });
  });

  describe("Provide", function () {
    it("Should set the right number of funds", async function () {
      const { amm, precision } = await loadFixture(deployContract);

      const fundsToken1 = 1000;
      const fundsToken2 = 1000;

      await amm.faucet(fundsToken1, fundsToken2);

      const providedToken1 = 100;
      const providedToken2 = 10;
      await amm.provide(providedToken1, providedToken2);

      const holdings = await amm.getMyHoldings();

      expect(holdings[0]).to.equal(fundsToken1 - providedToken1);
      expect(holdings[1]).to.equal(fundsToken2 - providedToken2);
      expect(holdings[2]).to.equal(precision.mul(100));

      const details = await amm.getPoolDetails();

      expect(details[0]).to.equal(providedToken1);
      expect(details[1]).to.equal(providedToken2);
      expect(details[2]).to.equal(precision.mul(100));

      expect(await amm.getEquivalentToken1Estimate(5)).to.equal(50);
      expect(await amm.getEquivalentToken2Estimate(50)).to.equal(5);
    });

    it("provide twice", async function () {
      const { amm, precision, owner, otherAccount } = await loadFixture(
        deployContract
      );

      const ownerFundsToken1 = 1000;
      const ownerFundsToken2 = 1000;
      await amm.faucet(ownerFundsToken1, ownerFundsToken2);
      const ownerProvidedToken1 = 100;
      const ownerProvidedToken2 = 10;
      await amm.provide(ownerProvidedToken1, ownerProvidedToken2);

      const otherFundsToken1 = 1000;
      const otherFundsToken2 = 1000;
      await amm
        .connect(otherAccount)
        .faucet(otherFundsToken1, otherFundsToken2);
      const otherProvidedToken1 = 50;
      const otherProvidedToken2 = await amm.getEquivalentToken2Estimate(
        otherProvidedToken1
      );
      await amm
        .connect(otherAccount)
        .provide(otherProvidedToken1, otherProvidedToken2);

      const ownerHoldings = await amm.getMyHoldings();
      expect(ownerHoldings[0]).to.equal(ownerFundsToken1 - ownerProvidedToken1);
      expect(ownerHoldings[1]).to.equal(ownerFundsToken2 - ownerProvidedToken2);
      expect(ownerHoldings[2]).to.equal(precision.mul(100));

      const otherHoldings = await amm.connect(otherAccount).getMyHoldings();
      expect(otherHoldings[0]).to.equal(otherFundsToken1 - otherProvidedToken1);
      expect(otherHoldings[1]).to.equal(
        otherFundsToken2 - otherProvidedToken2.toNumber()
      );
      expect(otherHoldings[2]).to.equal(precision.mul(50));

      const details = await amm.getPoolDetails();

      expect(details[0]).to.equal(ownerProvidedToken1 + otherProvidedToken1);
      expect(details[1]).to.equal(
        ownerProvidedToken2 + otherProvidedToken2.toNumber()
      );
      expect(details[2]).to.equal(precision.mul(150));
    });
  });

  describe("Withdraw", function () {
    it("provide twice", async function () {
      const { amm, precision, owner, otherAccount } = await loadFixture(
        deployContract
      );

      const ownerFundsToken1 = 1000;
      const ownerFundsToken2 = 1000;
      await amm.faucet(ownerFundsToken1, ownerFundsToken2);
      const ownerProvidedToken1 = 100;
      const ownerProvidedToken2 = 10;
      await amm.provide(ownerProvidedToken1, ownerProvidedToken2);

      const otherFundsToken1 = 1000;
      const otherFundsToken2 = 1000;
      await amm
        .connect(otherAccount)
        .faucet(otherFundsToken1, otherFundsToken2);
      const otherProvidedToken1 = 50;
      const otherProvidedToken2 = await amm.getEquivalentToken2Estimate(
        otherProvidedToken1
      );
      await amm
        .connect(otherAccount)
        .provide(otherProvidedToken1, otherProvidedToken2);

      let otherHoldings = await amm.connect(otherAccount).getMyHoldings();

      await amm.connect(otherAccount).withdraw(otherHoldings.myShare);

      const ownerHoldings = await amm.getMyHoldings();
      expect(ownerHoldings[0]).to.equal(ownerFundsToken1 - ownerProvidedToken1);
      expect(ownerHoldings[1]).to.equal(ownerFundsToken2 - ownerProvidedToken2);
      expect(ownerHoldings[2]).to.equal(precision.mul(100));

      otherHoldings = await amm.connect(otherAccount).getMyHoldings();
      expect(otherHoldings[0]).to.equal(otherFundsToken1);
      expect(otherHoldings[1]).to.equal(otherFundsToken2);
      expect(otherHoldings[2]).to.equal(0);

      const details = await amm.getPoolDetails();

      expect(details[0]).to.equal(ownerProvidedToken1);
      expect(details[1]).to.equal(ownerProvidedToken2);
      expect(details[2]).to.equal(precision.mul(100));
    });
  });

  //   describe("Change limits", function () {
  //     it("Should revert with the right error if called by other account", async function () {
  //       const { amm, otherAccount } = await loadFixture(deployContract);

  //       await expect(
  //         amm.connect(otherAccount).changeNumOfPendingLimits(5)
  //       ).to.be.revertedWith("You aren't the owner");
  //     });

  //     it("Should set the right number of pending limits after change", async function () {
  //       const { amm, numOfPendingLimits } = await loadFixture(
  //         deployContract
  //       );

  //       const newLimits = numOfPendingLimits + 1;
  //       await amm.changeNumOfPendingLimits(newLimits);
  //       expect(await amm.numOfPendingLimits()).to.equal(newLimits);
  //     });

  //     it("Should emit an event on change limits", async function () {
  //       const { amm } = await loadFixture(deployContract);

  //       await expect(amm.changeNumOfPendingLimits(10)).to.emit(
  //         amm,
  //         "NumOfPendingLimitsChanged"
  //       );
  //     });
  //   });

  //   describe("Post", function () {
  //     it("Should emit an event on post", async function () {
  //       const { amm, otherAccount } = await loadFixture(deployContract);

  //       await expect(
  //         amm.post("text", otherAccount.address, { value: 1 })
  //       ).to.emit(amm, "NewMessage");
  //     });

  //     it("Should send the correct amount of tokens", async function () {
  //       const { amm, owner, otherAccount } = await loadFixture(
  //         deployContract
  //       );
  //       const test_deposit = 10;

  //       // メッセージをpostした場合は, 送り主(owner)からコントラクト(amm)へ送金されます。
  //       await expect(
  //         amm.post("text", otherAccount.address, {
  //           value: test_deposit,
  //         })
  //       ).to.changeEtherBalances(
  //         [owner, amm],
  //         [-test_deposit, test_deposit]
  //       );
  //     });

  //     it("Should set the right Message", async function () {
  //       const { amm, owner, otherAccount } = await loadFixture(
  //         deployContract
  //       );
  //       const test_deposit = 1;
  //       const test_text = "text";

  //       await amm.post(test_text, otherAccount.address, {
  //         value: test_deposit,
  //       });
  //       const messages = await amm.connect(otherAccount).getOwnMessages();
  //       const message = messages[0];
  //       expect(message.depositInWei).to.equal(test_deposit);
  //       expect(message.text).to.equal(test_text);
  //       expect(message.isPending).to.equal(true);
  //       expect(message.sender).to.equal(owner.address);
  //       expect(message.receiver).to.equal(otherAccount.address);
  //     });

  //     it("Should revert with the right error if exceed number of pending limits", async function () {
  //       const { amm, otherAccount, numOfPendingLimits } = await loadFixture(
  //         deployContract
  //       );

  //       // メッセージ保留数の上限まで otherAccount へメッセージを送信します。
  //       for (let cnt = 1; cnt <= numOfPendingLimits; cnt++) {
  //         await amm.post("dummy", otherAccount.address);
  //       }
  //       // 次に送信するメッセージはキャンセルされます。
  //       await expect(
  //         amm.post("exceed", otherAccount.address)
  //       ).to.be.revertedWith(
  //         "The receiver has reached the number of pending limits"
  //       );
  //     });
  //   });

  //   describe("Accept", function () {
  //     it("Should emit an event on accept", async function () {
  //       const { amm, otherAccount } = await loadFixture(deployContract);
  //       const test_deposit = 1;

  //       await amm.post("text", otherAccount.address, {
  //         value: test_deposit,
  //       });

  //       const first_index = 0;
  //       await expect(amm.connect(otherAccount).accept(first_index)).to.emit(
  //         amm,
  //         "MessageConfirmed"
  //       );
  //     });

  //     it("isPending must be changed", async function () {
  //       const { amm, otherAccount } = await loadFixture(deployContract);
  //       const first_index = 0;

  //       await amm.post("text", otherAccount.address);
  //       let messages = await amm.connect(otherAccount).getOwnMessages();
  //       expect(messages[0].isPending).to.equal(true);

  //       await amm.connect(otherAccount).accept(first_index);
  //       messages = await amm.connect(otherAccount).getOwnMessages();
  //       expect(messages[0].isPending).to.equal(false);
  //     });

  //     it("Should send the correct amount of tokens", async function () {
  //       const { amm, otherAccount } = await loadFixture(deployContract);
  //       const test_deposit = 10;

  //       await amm.post("text", otherAccount.address, {
  //         value: test_deposit,
  //       });

  //       // メッセージをacceptした場合は, コントラクト(amm)から受取人(otherAccount)へ送金されます。
  //       const first_index = 0;
  //       await expect(
  //         amm.connect(otherAccount).accept(first_index)
  //       ).to.changeEtherBalances(
  //         [amm, otherAccount],
  //         [-test_deposit, test_deposit]
  //       );
  //     });

  //     it("Should revert with the right error if called in duplicate", async function () {
  //       const { amm, otherAccount } = await loadFixture(deployContract);

  //       await amm.post("text", otherAccount.address, { value: 1 });
  //       await amm.connect(otherAccount).accept(0);
  //       await expect(
  //         amm.connect(otherAccount).accept(0)
  //       ).to.be.revertedWith("This message has already been confirmed");
  //     });
  //   });
});
