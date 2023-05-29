// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AMM {
    IERC20 private _tokenX; // ERC20を実装したコントラクト
    IERC20 private _tokenY; // ERC20を実装したコントラクト
    uint256 public totalShare; // シェアの総量
    mapping(address => uint256) public share; // 各ユーザのシェア
    mapping(IERC20 => uint256) public totalAmount; // プールにロックされた各トークンの量

    uint256 public constant PRECISION = 1_000_000; // シェアの精度に使用する定数(= 6桁)

    // プールに使えるトークンを指定します。
    constructor(IERC20 tokenX, IERC20 tokenY) {
        _tokenX = tokenX;
        _tokenY = tokenY;
    }

    // プールに流動性があり, 使用可能であることを確認します。
    modifier activePool() {
        require(totalShare > 0, "Zero Liquidity");
        _;
    }

    // スマートコントラクトが扱えるトークンであることを確認します。
    modifier validToken(IERC20 token) {
        require(
            token == _tokenX || token == _tokenY,
            "Token is not in the pool"
        );
        _;
    }

    // スマートコントラクトが扱えるトークンであることを確認します。
    modifier validTokens(IERC20 tokenX, IERC20 tokenY) {
        require(
            tokenX == _tokenX || tokenY == _tokenY,
            "Token is not in the pool"
        );
        require(
            tokenY == _tokenX || tokenY == _tokenY,
            "Token is not in the pool"
        );
        require(tokenX != tokenY, "Tokens should be different!");
        _;
    }

    // 引数のトークンとペアのトークンのコントラクトを返します。
    function _pairToken(
        IERC20 token
    ) private view validToken(token) returns (IERC20) {
        if (token == _tokenX) {
            return _tokenY;
        }
        return _tokenX;
    }

    // 引数のトークンの量に値するペアのトークンの量を返します。
    function getEquivalentToken(
        IERC20 inToken,
        uint256 amountIn
    ) public view activePool validToken(inToken) returns (uint256) {
        IERC20 outToken = _pairToken(inToken);

        return (totalAmount[outToken] * amountIn) / totalAmount[inToken];
    }

    // プールに流動性を提供します。
    function provide(
        IERC20 tokenX,
        uint256 amountX,
        IERC20 tokenY,
        uint256 amountY
    ) external validTokens(tokenX, tokenY) returns (uint256) {
        require(amountX > 0, "Amount cannot be zero!");
        require(amountY > 0, "Amount cannot be zero!");

        uint256 newshare;
        if (totalShare == 0) {
            // 初期は100
            newshare = 100 * PRECISION;
        } else {
            uint256 shareX = (totalShare * amountX) / totalAmount[tokenX];
            uint256 shareY = (totalShare * amountY) / totalAmount[tokenY];
            require(
                shareX == shareY,
                "Equivalent value of tokens not provided..."
            );
            newshare = shareX;
        }

        require(
            newshare > 0,
            "Asset value less than threshold for contribution!"
        );

        tokenX.transferFrom(msg.sender, address(this), amountX);
        tokenY.transferFrom(msg.sender, address(this), amountY);

        totalAmount[tokenX] += amountX;
        totalAmount[tokenY] += amountY;

        totalShare += newshare;
        share[msg.sender] += newshare;

        return newshare;
    }

    // ユーザのシェアから引き出せるトークンの量を算出します。
    function getWithdrawEstimate(
        IERC20 token,
        uint256 _share
    ) public view activePool validToken(token) returns (uint256) {
        require(_share <= totalShare, "Share should be less than totalShare");
        return (_share * totalAmount[token]) / totalShare;
    }

    function withdraw(
        uint256 _share
    ) external activePool returns (uint256, uint256) {
        require(_share > 0, "share cannot be zero!");
        require(_share <= share[msg.sender], "Insufficient share");

        uint256 amountTokenX = getWithdrawEstimate(_tokenX, _share);
        uint256 amountTokenY = getWithdrawEstimate(_tokenY, _share);

        share[msg.sender] -= _share;
        totalShare -= _share;

        totalAmount[_tokenX] -= amountTokenX;
        totalAmount[_tokenY] -= amountTokenY;

        _tokenX.transfer(msg.sender, amountTokenX);
        _tokenY.transfer(msg.sender, amountTokenY);

        return (amountTokenX, amountTokenY);
    }

    // swap元のトークン量からswap先のトークン量を算出
    function getSwapEstimateOut(
        IERC20 inToken,
        uint256 amountIn
    ) public view activePool validToken(inToken) returns (uint256) {
        IERC20 outToken = _pairToken(inToken);

        uint256 amountInWithFee = amountIn * 997;

        uint256 numerator = amountInWithFee * totalAmount[outToken];
        uint256 denominator = totalAmount[inToken] * 1000 + amountInWithFee;
        uint256 amountOut = numerator / denominator;

        return amountOut;
    }

    // swap先のトークン量からswap元のトークン量を算出
    function getSwapEstimateIn(
        IERC20 outToken,
        uint256 amountOut
    ) public view activePool validToken(outToken) returns (uint256) {
        require(amountOut < totalAmount[outToken], "Insufficient pool balance");
        IERC20 inToken = _pairToken(outToken);

        uint256 numerator = 1000 * totalAmount[inToken] * amountOut;
        uint256 denominator = 997 * (totalAmount[outToken] - amountOut);
        uint256 amountIn = numerator / denominator;

        return amountIn;
    }

    function swap(
        IERC20 inToken,
        IERC20 outToken,
        uint256 amountIn
    ) external activePool validTokens(inToken, outToken) returns (uint256) {
        require(amountIn > 0, "Amount cannot be zero!");

        uint256 amountOut = getSwapEstimateOut(inToken, amountIn);

        inToken.transferFrom(msg.sender, address(this), amountIn);
        totalAmount[inToken] += amountIn;
        totalAmount[outToken] -= amountOut;
        outToken.transfer(msg.sender, amountOut);
        return amountOut;
    }
}
