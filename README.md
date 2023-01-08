# About This Project

`Miniswap` is a amm dapp that allows tokens to be exchanged like `Uniswap`.

### Connect wallet

Add the following network before:

```
Network Name: Avalanche FUJI C-Chain
New RPC URL: https://api.avax-test.network/ext/bc/C/rpc
ChainID: 43113
Symbol: AVAX
Explorer: https://testnet.snowtrace.io/
```

![](/public/images/connect.gif)

### Start from faucet

Get the two tokens (fake USDC and fake JOE) from faucet.

![](/public/images/faucet.gif)

### Swap

First, sign transaction that approve amm contract to move token.

![](/public/images/swap1.gif)

↓

Sign transaction to call swap.

![](/public/images/swap2.gif)

### Provide

First, sign two transactions that approve amm contract to move tokens.

![](/public/images/provide1.gif)

↓

Sign transaction to call provide.

![](/public/images/provide2.gif)

### Withdraw

Withdraw tokens equivalent to the share.

![](/public/images/withdraw.gif)

# Build & run

```
git clone [this_repository]
cd [this_repository]
npm install
npm run dev
```

After executing the above command, access `localhost:3000` in your browser.

# Description

## Chain deployed to: `Avalanche`

## Contract

### Stack description

contract

- Solidity

test & deploy

- hardhat
- typescript

### Directory structure

Root: `package/contract`

- `AMM.sol`  
  Implementing AMM contract code.
- `ERC20Tokens.sol`  
  Implementing ERC20 contracts To simulate the AMM

### Walk-through of `AMM`'s code

- function: `provide`  
  Provide liquidity with the address and quantity of the token as arguments.  
  The contract records share (like `LP token`) for the user who calls this function.

- function: `withdraw`  
  Withdraw tokens deposited with share as an argument.

- function: `swap`  
  Swap tokens.  
  Using the formula:`k = x * y` for calculation, and there is a 0.3% fee for swapping.

## Client

### Stack description

- typescript
- React.js
- Next.js

### Directory structure

Root: `package/client`

- `components`, `hooks`, `pages`, `styles`, `public`  
  Contains client side code
- `utils`  
  Contains the contracts ABI and utility functions.
