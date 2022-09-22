// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract AMM {
    uint256 K; // 価格を決める定数
    IERC20 tokenX; // ERC20を実装したコントラクト1
    IERC20 tokenY; // ERC20を実装したコントラクト2
    uint256 totalShares; // 全てのシェア(割合の分母, 株式みたいなもの)
    mapping(address => uint256) shares; // 各ユーザのシェア
    mapping(IERC20 => uint256) totalAmount; // プールにロックされた各トークンの量

    uint256 public constant PRECISION = 1_000_000; // 計算中の精度に使用する定数(= 6桁)

    constructor(IERC20 _token1, IERC20 _token2) payable {
        tokenX = _token1;
        tokenY = _token2;
    }

    // Ensures that the _qty is non-zero and the user has enough balance
    modifier validAmountCheck(uint256 _total, uint256 _qty) {
        require(_qty > 0, "Amount cannot be zero!");
        require(_qty <= _total, "Insufficient amount");
        _;
    }

    // Restricts withdraw, swap feature till liquidity is added to the pool
    modifier activePool() {
        require(totalShares > 0, "Zero Liquidity");
        _;
    }

    modifier validToken(IERC20 _token) {
        require(
            _token == tokenX || _token == tokenY,
            "Token is not in the pool"
        );
        _;
    }

    // Returns the balance of the user
    function myShare() external view returns (uint256) {
        return shares[msg.sender];
    }

    // Returns the total amount of tokens locked in the pool and the total shares issued corresponding to it
    function poolDetails()
        external
        view
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        return (totalAmount[tokenX], totalAmount[tokenY], totalShares);
    }

    function pairToken(IERC20 token)
        private
        view
        validToken(token)
        returns (IERC20)
    {
        if (token == tokenX) {
            return tokenY;
        }
        return tokenX;
    }

    function equivalentToken(IERC20 _srcToken, uint256 _amount)
        public
        view
        validToken(_srcToken)
        returns (uint256)
    {
        IERC20 dstToken = pairToken(_srcToken);

        return (totalAmount[dstToken] * _amount) / totalAmount[_srcToken];
    }

    // Adding new liquidity in the pool
    // Returns the amount of share issued for locking given assets
    function provide(uint256 _amountToken1, uint256 _amountToken2)
        external
        validAmountCheck(tokenX.balanceOf(msg.sender), _amountToken1)
        validAmountCheck(tokenY.balanceOf(msg.sender), _amountToken2)
        returns (uint256 share)
    {
        if (totalShares == 0) {
            // Genesis liquidity is issued 100 Shares
            share = 100 * PRECISION;
        } else {
            uint256 share1 = (totalShares * _amountToken1) /
                totalAmount[tokenX];
            uint256 share2 = (totalShares * _amountToken2) /
                totalAmount[tokenY];
            require(
                share1 == share2,
                "Equivalent value of tokens not provided..."
            );
            share = share1;
        }

        require(share > 0, "Asset value less than threshold for contribution!");

        tokenX.transferFrom(msg.sender, address(this), _amountToken1);
        tokenY.transferFrom(msg.sender, address(this), _amountToken2);

        totalAmount[tokenX] += _amountToken1;
        totalAmount[tokenY] += _amountToken2;
        K = totalAmount[tokenX] * totalAmount[tokenY];

        totalShares += share;
        shares[msg.sender] += share;
    }

    // Returns the estimate of Token1 & Token2 that will be released on burning given _share
    function withdrawEstimate(uint256 _share)
        public
        view
        activePool
        returns (uint256 amountToken1, uint256 amountToken2)
    {
        require(_share <= totalShares, "Share should be less than totalShare");
        amountToken1 = (_share * totalAmount[tokenX]) / totalShares;
        amountToken2 = (_share * totalAmount[tokenY]) / totalShares;
    }

    // Removes liquidity from the pool and releases corresponding Token1 & Token2 to the withdrawer
    function withdraw(uint256 _share)
        external
        activePool
        validAmountCheck(shares[msg.sender], _share)
        returns (uint256 amountToken1, uint256 amountToken2)
    {
        (amountToken1, amountToken2) = withdrawEstimate(_share);

        shares[msg.sender] -= _share;
        totalShares -= _share;

        totalAmount[tokenX] -= amountToken1;
        totalAmount[tokenY] -= amountToken2;
        K = totalAmount[tokenX] * totalAmount[tokenY];

        tokenX.transfer(msg.sender, amountToken1);
        tokenY.transfer(msg.sender, amountToken2);
    }

    // Returns the amount of Token2 that the user will get when swapping a given amount of Token1 for Token2
    function swapEstimateFromSrcToken(uint256 _amountToken1)
        public
        view
        activePool
        returns (uint256 amountToken2)
    {
        uint256 token1After = totalAmount[tokenX] + _amountToken1;
        uint256 token2After = K / (token1After);
        amountToken2 = totalAmount[tokenY] - token2After;

        // To ensure that Token2's pool is not completely depleted leading to inf:0 ratio
        if (amountToken2 == totalAmount[tokenY]) amountToken2--;
    }

    // Returns the amount of Token1 that the user should swap to get _amountToken2 in return
    function swapEstimateFromDstToken(uint256 _amountToken2)
        public
        view
        activePool
        returns (uint256 amountToken1)
    {
        require(
            _amountToken2 < totalAmount[tokenY],
            "Insufficient pool balance"
        );
        uint256 token2After = totalAmount[tokenY] - _amountToken2;
        uint256 token1After = K / token2After;
        amountToken1 = token1After - totalAmount[tokenX];
    }

    // Swaps given amount of Token1 to Token2 using algorithmic price determination
    function swapToken1(uint256 _amountToken1)
        external
        activePool
        validAmountCheck(tokenX.balanceOf(msg.sender), _amountToken1)
        returns (uint256 amountToken2)
    {
        amountToken2 = swapEstimateFromSrcToken(_amountToken1);

        tokenX.transferFrom(msg.sender, address(this), _amountToken1);
        totalAmount[tokenX] += _amountToken1;
        totalAmount[tokenY] -= amountToken2;
        tokenY.transfer(msg.sender, amountToken2);
    }

    // Returns the amount of Token2 that the user will get when swapping a given amount of Token1 for Token2
    function getSwapToken2Estimate(uint256 _amountToken2)
        public
        view
        activePool
        returns (uint256 amountToken1)
    {
        uint256 token2After = totalAmount[tokenY] + _amountToken2;
        uint256 token1After = K / token2After;
        amountToken1 = totalAmount[tokenX] - token1After;

        // To ensure that Token1's pool is not completely depleted leading to inf:0 ratio
        if (amountToken1 == totalAmount[tokenX]) amountToken1--;
    }

    // Returns the amount of Token2 that the user should swap to get _amountToken1 in return
    function getSwapToken2EstimateGivenToken1(uint256 _amountToken1)
        public
        view
        activePool
        returns (uint256 amountToken2)
    {
        require(
            _amountToken1 < totalAmount[tokenX],
            "Insufficient pool balance"
        );
        uint256 token1After = totalAmount[tokenX] - _amountToken1;
        uint256 token2After = K / token1After;
        amountToken2 = token2After - totalAmount[tokenY];
    }

    // Swaps given amount of Token2 to Token1 using algorithmic price determination
    function swapToken2(uint256 _amountToken2)
        external
        activePool
        validAmountCheck(tokenY.balanceOf(msg.sender), _amountToken2)
        returns (uint256 amountToken1)
    {
        amountToken1 = getSwapToken2Estimate(_amountToken2);

        tokenY.transferFrom(msg.sender, address(this), _amountToken2);
        totalAmount[tokenY] += _amountToken2;
        totalAmount[tokenX] -= amountToken1;
        tokenX.transfer(msg.sender, amountToken1);
    }
}
