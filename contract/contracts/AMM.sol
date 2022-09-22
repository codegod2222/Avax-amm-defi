// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract AMM {
    uint256 K; // 価格を決める定数
    IERC20 token1; // ペアのうち1つのトークンのコントラクト
    IERC20 token2; // ペアのうちもう1つのトークンのコントラクト
    uint256 totalShares; // 全てのシェア(割合の分母, 株式みたいなもの)
    mapping(address => uint256) shares; // 各ユーザのシェア
    uint256 totalToken1; // プールにロックされたトークン1の量
    uint256 totalToken2; // プールにロックされたトークン2の量

    uint256 public constant PRECISION = 1_000_000; // 計算中の精度に使用する定数(= 6桁)

    constructor(address _token1, address _token2) payable {
        token1 = IERC20(_token1);
        token2 = IERC20(_token2);
    }

    // Ensures that the _qty is non-zero and the user has enough balance
    modifier validAmountCheck(uint256 _total, uint256 _qty) {
        // ここ引数をインターフェースにできないのか？
        require(_qty > 0, "Amount cannot be zero!");
        require(_qty <= _total, "Insufficient amount");
        _;
    }

    // Restricts withdraw, swap feature till liquidity is added to the pool
    modifier activePool() {
        require(totalShares > 0, "Zero Liquidity");
        _;
    }

    // Returns the balance of the user
    function getMyShare() external view returns (uint256 myShare) {
        myShare = shares[msg.sender];
    }

    // Returns the total amount of tokens locked in the pool and the total shares issued corresponding to it
    function getPoolDetails()
        external
        view
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        return (totalToken1, totalToken2, totalShares);
    }

    // Returns amount of Token1 required when providing liquidity with _amountToken2 quantity of Token2
    function getEquivalentToken1Estimate(uint256 _amountToken2)
        public
        view
        activePool
        returns (uint256 reqToken1)
    {
        reqToken1 = (totalToken1 * _amountToken2) / totalToken2;
    }

    // Returns amount of Token2 required when providing liquidity with _amountToken1 quantity of Token1
    function getEquivalentToken2Estimate(uint256 _amountToken1)
        public
        view
        activePool
        returns (uint256 reqToken2)
    {
        reqToken2 = (totalToken2 * _amountToken1) / totalToken1;
    }

    // Adding new liquidity in the pool
    // Returns the amount of share issued for locking given assets
    function provide(uint256 _amountToken1, uint256 _amountToken2)
        external
        validAmountCheck(token1.balanceOf(msg.sender), _amountToken1)
        validAmountCheck(token2.balanceOf(msg.sender), _amountToken2)
        returns (uint256 share)
    {
        if (totalShares == 0) {
            // Genesis liquidity is issued 100 Shares
            share = 100 * PRECISION;
        } else {
            uint256 share1 = (totalShares * _amountToken1) / totalToken1;
            uint256 share2 = (totalShares * _amountToken2) / totalToken2;
            require(
                share1 == share2,
                "Equivalent value of tokens not provided..."
            );
            share = share1;
        }

        require(share > 0, "Asset value less than threshold for contribution!");

        token1.transferFrom(msg.sender, address(this), _amountToken1);
        token2.transferFrom(msg.sender, address(this), _amountToken2);

        totalToken1 += _amountToken1;
        totalToken2 += _amountToken2;
        K = totalToken1 * totalToken2;

        totalShares += share;
        shares[msg.sender] += share;
    }

    // Returns the estimate of Token1 & Token2 that will be released on burning given _share
    function getWithdrawEstimate(uint256 _share)
        public
        view
        activePool
        returns (uint256 amountToken1, uint256 amountToken2)
    {
        require(_share <= totalShares, "Share should be less than totalShare");
        amountToken1 = (_share * totalToken1) / totalShares;
        amountToken2 = (_share * totalToken2) / totalShares;
    }

    // Removes liquidity from the pool and releases corresponding Token1 & Token2 to the withdrawer
    function withdraw(uint256 _share)
        external
        activePool
        validAmountCheck(shares[msg.sender], _share)
        returns (uint256 amountToken1, uint256 amountToken2)
    {
        (amountToken1, amountToken2) = getWithdrawEstimate(_share);

        shares[msg.sender] -= _share;
        totalShares -= _share;

        totalToken1 -= amountToken1;
        totalToken2 -= amountToken2;
        K = totalToken1 * totalToken2;

        token1.transfer(msg.sender, amountToken1);
        token2.transfer(msg.sender, amountToken2);
    }

    // Returns the amount of Token2 that the user will get when swapping a given amount of Token1 for Token2
    function getSwapToken1Estimate(uint256 _amountToken1)
        public
        view
        activePool
        returns (uint256 amountToken2)
    {
        uint256 token1After = totalToken1 + _amountToken1;
        uint256 token2After = K / (token1After);
        amountToken2 = totalToken2 - token2After;

        // To ensure that Token2's pool is not completely depleted leading to inf:0 ratio
        if (amountToken2 == totalToken2) amountToken2--;
    }

    // Returns the amount of Token1 that the user should swap to get _amountToken2 in return
    function getSwapToken1EstimateGivenToken2(uint256 _amountToken2)
        public
        view
        activePool
        returns (uint256 amountToken1)
    {
        require(_amountToken2 < totalToken2, "Insufficient pool balance");
        uint256 token2After = totalToken2 - _amountToken2;
        uint256 token1After = K / token2After;
        amountToken1 = token1After - totalToken1;
    }

    // Swaps given amount of Token1 to Token2 using algorithmic price determination
    function swapToken1(uint256 _amountToken1)
        external
        activePool
        validAmountCheck(token1.balanceOf(msg.sender), _amountToken1)
        returns (uint256 amountToken2)
    {
        amountToken2 = getSwapToken1Estimate(_amountToken1);

        token1.transferFrom(msg.sender, address(this), _amountToken1);
        totalToken1 += _amountToken1;
        totalToken2 -= amountToken2;
        token2.transfer(msg.sender, amountToken2);
    }

    // Returns the amount of Token2 that the user will get when swapping a given amount of Token1 for Token2
    function getSwapToken2Estimate(uint256 _amountToken2)
        public
        view
        activePool
        returns (uint256 amountToken1)
    {
        uint256 token2After = totalToken2 + _amountToken2;
        uint256 token1After = K / token2After;
        amountToken1 = totalToken1 - token1After;

        // To ensure that Token1's pool is not completely depleted leading to inf:0 ratio
        if (amountToken1 == totalToken1) amountToken1--;
    }

    // Returns the amount of Token2 that the user should swap to get _amountToken1 in return
    function getSwapToken2EstimateGivenToken1(uint256 _amountToken1)
        public
        view
        activePool
        returns (uint256 amountToken2)
    {
        require(_amountToken1 < totalToken1, "Insufficient pool balance");
        uint256 token1After = totalToken1 - _amountToken1;
        uint256 token2After = K / token1After;
        amountToken2 = token2After - totalToken2;
    }

    // Swaps given amount of Token2 to Token1 using algorithmic price determination
    function swapToken2(uint256 _amountToken2)
        external
        activePool
        validAmountCheck(token2.balanceOf(msg.sender), _amountToken2)
        returns (uint256 amountToken1)
    {
        amountToken1 = getSwapToken2Estimate(_amountToken2);

        token2.transferFrom(msg.sender, address(this), _amountToken2);
        totalToken2 += _amountToken2;
        totalToken1 -= amountToken1;
        token1.transfer(msg.sender, amountToken1);
    }
}
