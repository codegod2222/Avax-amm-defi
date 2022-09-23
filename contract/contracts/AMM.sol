// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

//TODO: 返り値とmodifierについて見直し, 必要かなど
contract AMM {
    uint256 K; // 価格を決める定数
    IERC20 tokenX; // ERC20を実装したコントラクト1
    IERC20 tokenY; // ERC20を実装したコントラクト2
    uint256 public totalShares; // 全てのシェア(割合の分母, 株式みたいなもの)
    mapping(address => uint256) public shares; // 各ユーザのシェア
    mapping(IERC20 => uint256) public totalAmount; // プールにロックされた各トークンの量

    uint256 public constant PRECISION = 1_000_000; // 計算中の精度に使用する定数(= 6桁)

    // プールに使えるトークンを指定します。
    constructor(IERC20 _tokenX, IERC20 _tokenY) {
        tokenX = _tokenX;
        tokenY = _tokenY;
    }

    // ユーザの関数呼び出しに使用するある量が0より大きいことを確認します。
    modifier validAmount(uint256 _amount) {
        require(_amount > 0, "Amount cannot be zero!");
        _;
    }

    // ユーザが引き出そうとするシェアが有効な値であることを確認します。
    modifier validShare(uint256 _share) {
        require(_share > 0, "share cannot be zero!");
        require(_share <= shares[msg.sender], "Insufficient share");
        _;
    }

    // プールに流動性があり, 使用可能であることを確認します。
    modifier activePool() {
        require(totalShares > 0, "Zero Liquidity");
        _;
    }

    // スマートコントラクトが扱えるトークンであることを確認します。
    modifier validToken(IERC20 _token) {
        require(
            _token == tokenX || _token == tokenY,
            "Token is not in the pool"
        );
        _;
    }

    // 引数のトークンとペアのコントラクトを返します。
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

    // 引数のトークンの量に値するペアのトークンの量を返します。
    function equivalentToken(IERC20 _srcToken, uint256 _amountSrc)
        public
        view
        validToken(_srcToken)
        returns (uint256)
    {
        IERC20 dstToken = pairToken(_srcToken);

        return (totalAmount[dstToken] * _amountSrc) / totalAmount[_srcToken];
    }

    // プールに流動性を提供します。
    function provide(
        IERC20 _tokenX,
        uint256 _amountX,
        IERC20 _tokenY,
        uint256 _amountY
    )
        external
        validToken(_tokenX)
        validToken(_tokenY)
        validAmount(_amountX)
        validAmount(_amountY)
        returns (uint256)
    {
        uint256 share;
        if (totalShares == 0) {
            // 初期は100
            share = 100 * PRECISION;
        } else {
            uint256 shareX = (totalShares * _amountX) / totalAmount[_tokenX];
            uint256 shareY = (totalShares * _amountY) / totalAmount[_tokenY];
            require(
                shareX == shareY,
                "Equivalent value of tokens not provided..."
            );
            share = shareX;
        }

        require(share > 0, "Asset value less than threshold for contribution!");

        _tokenX.transferFrom(msg.sender, address(this), _amountX);
        _tokenY.transferFrom(msg.sender, address(this), _amountY);

        totalAmount[_tokenX] += _amountX;
        totalAmount[_tokenY] += _amountY;
        K = totalAmount[_tokenX] * totalAmount[_tokenY];

        totalShares += share;
        shares[msg.sender] += share;

        return share;
    }

    // ユーザのシェアから引き出せるトークンの量を算出します。
    function withdrawEstimate(IERC20 _token, uint256 _share)
        public
        view
        activePool
        returns (uint256)
    {
        require(_share <= totalShares, "Share should be less than totalShare");
        return (_share * totalAmount[_token]) / totalShares;
    }

    function withdraw(uint256 _share)
        external
        activePool
        validShare(_share)
        returns (uint256, uint256)
    {
        uint256 amountTokenX = withdrawEstimate(tokenX, _share);
        uint256 amountTokenY = withdrawEstimate(tokenY, _share);

        shares[msg.sender] -= _share;
        totalShares -= _share;

        totalAmount[tokenX] -= amountTokenX;
        totalAmount[tokenY] -= amountTokenY;
        K = totalAmount[tokenX] * totalAmount[tokenY];

        tokenX.transfer(msg.sender, amountTokenX);
        tokenY.transfer(msg.sender, amountTokenY);

        return (amountTokenX, amountTokenY);
    }

    // swap元のトークン量からswap先のトークン量を算出
    function swapEstimateFromSrcToken(IERC20 _srcToken, uint256 _amountSrc)
        public
        view
        activePool
        returns (uint256)
    {
        IERC20 dstToken = pairToken(_srcToken);

        uint256 totalAmountSrcAfter = totalAmount[_srcToken] + _amountSrc;
        uint256 totalAmountDstAfter = K / (totalAmountSrcAfter);
        uint256 amountDst = totalAmount[dstToken] - totalAmountDstAfter;

        // swapの結果, トークン量が0になるのを防ぐ
        if (amountDst == totalAmount[dstToken]) amountDst--;
        return amountDst;
    }

    // swap先のトークン量からswap元のトークン量を算出
    function swapEstimateFromDstToken(IERC20 _dstToken, uint256 _amountDst)
        public
        view
        activePool
        returns (uint256)
    {
        require(
            _amountDst < totalAmount[_dstToken],
            "Insufficient pool balance"
        );
        IERC20 srcToken = pairToken(_dstToken);

        uint256 totalAmountDstAfter = totalAmount[_dstToken] - _amountDst;
        uint256 totalAmountSrcAfter = K / totalAmountDstAfter;
        return totalAmountSrcAfter - totalAmount[srcToken];
    }

    function swap(
        IERC20 _srcToken,
        IERC20 _dstToken,
        uint256 _amountSrc
    ) external activePool validAmount(_amountSrc) returns (uint256) {
        uint256 amountDst = swapEstimateFromSrcToken(_srcToken, _amountSrc);

        _srcToken.transferFrom(msg.sender, address(this), _amountSrc);
        totalAmount[_srcToken] += _amountSrc;
        totalAmount[_dstToken] -= amountDst;
        _dstToken.transfer(msg.sender, amountDst);
        return amountDst;
    }
}
