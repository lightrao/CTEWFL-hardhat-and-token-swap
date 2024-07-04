const { expect, assert } = require("chai");
const { ethers, waffle } = require("hardhat");
require("dotenv").config();

const {
  addressFactory, // Uniswap V2 Factory Contract address on ETH mainnet
  addressRouter, // Uniswap V2 Router02 Contract address on ETH mainnet
  addressFrom, // WETH Contract address on ETH mainnet
  addressTo, // SUSHI Contract address on ETH mainnet
} = require("../utils/AddressList");

const {
  erc20ABI,
  factoryABI, // ABI for Uniswap V2 Factory Contract
  routerABI, // ABI for Uniswap V2 Router Contract
} = require("../utils/AbiList");

describe("Read and Write to the Blockchain", () => {
  let provider, contractFactory, contractRouter, contractToken, amountIn;

  // get price information
  const getAmountOut = async () => {
    const amountsOut = await contractRouter.getAmountsOut(amountIn, [
      addressFrom,
      addressTo,
    ]);
    return amountsOut[1].toString();
  };

  before(async () => {
    // connecting to provider
    provider = new ethers.providers.JsonRpcProvider(process.env.ALCHEMY_URL); // provider connecting to ETH mainnet

    // contract objects
    contractFactory = new ethers.Contract(addressFactory, factoryABI, provider);
    contractRouter = new ethers.Contract(addressRouter, routerABI, provider);
    contractToken = new ethers.Contract(addressFrom, erc20ABI, provider);

    const decimals = await contractToken.decimals();
    const amountInHuman = "1";
    amountIn = ethers.utils.parseUnits(amountInHuman, decimals).toString();

    // Check chain ID
    const network = await provider.getNetwork();
    console.log(`Chain ID: ${network.chainId}`);
  });

  it("connects to a provider, factory, token and router", () => {
    assert(provider._isProvider);

    expect(contractFactory.address).to.equal(
      "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"
    );

    expect(contractRouter.address).to.equal(
      "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
    );

    expect(contractToken.address).to.equal(
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    );
  });

  it("gets the price of amountsOut", async () => {
    const amount = await getAmountOut();
    console.log(`Amount Out: ${amount}`);
    assert(amount);
  });

  it("sends a transaction, i.e., swaps a token", async () => {
    try {
      const [ownerSigner] = await ethers.getSigners(); // the first account generated by hardhat

      const mainnetForkUniswapRouter = new ethers.Contract(
        addressRouter,
        routerABI,
        ownerSigner
      );

      const myAddress = ownerSigner.address; // Using the owner's address directly from the signer
      console.log(`Using address: ${myAddress}`);

      const amountOut = await getAmountOut();
      console.log(`Amount Out: ${amountOut}`);

      // Check balance of the token to be swapped
      const tokenBalance = await contractToken.balanceOf(myAddress);
      console.log(
        `Token balance before swap: ${ethers.utils.formatUnits(
          tokenBalance,
          18
        )}`
      );

      if (tokenBalance.lt(amountIn)) {
        console.error("Insufficient token balance for swap.");
        return;
      }

      // Approve the Uniswap router to spend the token
      const approveTx = await contractToken
        .connect(ownerSigner)
        .approve(addressRouter, amountIn);
      await approveTx.wait();
      console.log(`Approval transaction hash: ${approveTx.hash}`);

      // Log balance before the transaction
      const balanceBefore = await ownerSigner.getBalance();
      console.log(
        `ETH Balance before swap: ${ethers.utils.formatEther(balanceBefore)}`
      );

      const txSwap = await mainnetForkUniswapRouter.swapExactTokensForTokens(
        amountIn, // amount In,
        amountOut, // amount Out,
        [addressFrom, addressTo], // path,
        myAddress, // address to,
        Date.now() + 1000 * 60 * 5, // deadline,
        {
          gasLimit: 200000,
          gasPrice: ethers.utils.parseUnits("50.5", "gwei"),
          type: 0, // Explicitly set the transaction type to 0 for legacy transactions
        }
      );

      console.log(`Swap transaction hash: ${txSwap.hash}`);

      // Wait for the transaction to be mined
      const receipt = await txSwap.wait();
      console.log("Transaction receipt:", receipt);

      // Log balance after the transaction
      const balanceAfter = await ownerSigner.getBalance();
      console.log(
        `ETH Balance after swap: ${ethers.utils.formatEther(balanceAfter)}`
      );

      const tokenBalanceAfter = await contractToken.balanceOf(myAddress);
      console.log(
        `Token balance after swap: ${ethers.utils.formatUnits(
          tokenBalanceAfter,
          18
        )}`
      );

      const mainnetForkProvider = waffle.provider;
      const txReceipt = await mainnetForkProvider.getTransactionReceipt(
        txSwap.hash
      );

      console.log("\nSWAP TRANSACTION");
      console.log(txSwap);

      console.log("\nTRANSACTION RECEIPT");
      console.log(txReceipt);
    } catch (error) {
      console.error("Error during swap transaction:", error);
    }
  });
});
