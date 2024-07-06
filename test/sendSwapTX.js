const { expect, assert } = require("chai");
const { ethers, waffle } = require("hardhat");
require("dotenv").config();

// Contract addresses on Ethereum mainnet
const {
  addressFactory, // Uniswap V2 Factory Contract address on ETH mainnet
  addressRouter, // Uniswap V2 Router Contract address on ETH mainnet
  addressFrom, // WETH Contract address on ETH mainnet
  addressTo, // SUSHI Contract address on ETH mainnet
} = require("../utils/AddressList");

// ABIs for the contracts
const {
  erc20ABI, // identical to wethABI
  factoryABI, // ABI for Uniswap V2 Factory Contract
  routerABI, // ABI for Uniswap V2 Router Contract
} = require("../utils/AbiList");

describe("Read and Write to the Blockchain", () => {
  let provider, contractFactory, contractRouter, contractWeth, amountIn;

  // Function to get the amount of output tokens for a given input amount
  const getAmountOut = async () => {
    const amountsOut = await contractRouter.getAmountsOut(amountIn, [
      addressFrom,
      addressTo,
    ]);
    return amountsOut[1].toString(); // Return the amount of output tokens
  };

  // Function to wrap ETH into WETH
  const wrapETH = async (contractWethSigner, amount) => {
    const tx = await contractWethSigner.deposit({ value: amount }); // Call deposit function on WETH contract
    await tx.wait(); // Wait for the transaction to be mined
    console.log(`Wrapped ${ethers.utils.formatEther(amount)} ETH to WETH`);
  };

  before(async () => {
    // Connect to provider using the URL specified in the environment variable
    // This URL is for a live mainnet node, but Hardhat will use it to fork the mainnet locally
    provider = new ethers.providers.JsonRpcProvider(process.env.ALCHEMY_URL);

    // Log provider's info
    const providerRpcUrl = provider.connection.url;
    console.log(`provider's RPC URL: ${providerRpcUrl}`);
    const networkOfprovider = await provider.getNetwork();
    console.log(`networkOfprovider's Chain ID: ${networkOfprovider.chainId}`);

    // Create contract instances using the provider (connected to the forked mainnet)
    contractFactory = new ethers.Contract(addressFactory, factoryABI, provider);
    contractRouter = new ethers.Contract(addressRouter, routerABI, provider);
    contractWeth = new ethers.Contract(addressFrom, erc20ABI, provider);

    // Get the number of decimals for the WETH token and set amountIn for testing
    const decimals = await contractWeth.decimals();
    const amountInHuman = "1"; // 1 token (WETH)
    amountIn = ethers.utils.parseUnits(amountInHuman, decimals).toString(); // Convert to token decimals

    // Log the chain ID to confirm we are connected to the correct network (forked mainnet)
    const network = await provider.getNetwork();
    console.log(`Chain ID: ${network.chainId}`);
  });

  it("connects to a provider, factory, token, and router", () => {
    // Assert the provider is correctly set up
    assert(provider._isProvider);

    // Check that the contract addresses match the expected mainnet addresses
    expect(contractFactory.address).to.equal(
      "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"
    );

    expect(contractRouter.address).to.equal(
      "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
    );

    expect(contractWeth.address).to.equal(
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    );
  });

  it("gets the price of amountsOut", async () => {
    // Get the amount of output tokens for the given input amount
    const amount = await getAmountOut();
    console.log(`Amount Out: ${amount}`);
    assert(amount); // Assert the amount is valid
  });

  it("wraps ETH to WETH and swaps tokens", async () => {
    // Get the first signer from the local Hardhat network (this is a pre-funded account)
    const [ownerSigner] = await ethers.getSigners();

    // Log ownerSigner's info
    const ownerSignerRpcUrl = ownerSigner.provider.connection.url;
    console.log(`ownerSigner's RPC URL: ${ownerSignerRpcUrl}`);
    const networkOfownerSigner = await ownerSigner.provider.getNetwork();
    console.log(
      `networkOfownerSigner's Chain ID: ${networkOfownerSigner.chainId}`
    );

    // Create contract instances using the ownerSigner
    // This allows the signer to send transactions in the local forked environment
    const mainnetForkUniswapRouter = new ethers.Contract(
      addressRouter,
      routerABI,
      ownerSigner
    );

    const contractWethWithSigner = new ethers.Contract(
      addressFrom,
      erc20ABI,
      ownerSigner
    );

    // Log the address being used for transactions
    const myAddress = ownerSigner.address;
    console.log(`Using address: ${myAddress}`);

    // Get the amount out for the token swap
    const amountOut = await getAmountOut();
    console.log(`Amount Out: ${amountOut}`);

    // Wrap 10 ETH into WETH
    const ethAmount = ethers.utils.parseUnits("10.0", 18);
    await wrapETH(contractWethWithSigner, ethAmount);

    // Check balance of the token to be swapped
    const tokenBalance = await contractWethWithSigner.balanceOf(myAddress);
    console.log(
      `WETH balance before swap: ${ethers.utils.formatUnits(tokenBalance, 18)}`
    );

    // Ensure there is sufficient token balance for the swap
    if (tokenBalance.lt(amountIn)) {
      console.error("Insufficient token balance for swap.");
      return;
    }

    // Approve the Uniswap router to spend the WETH token
    const approveTx = await contractWethWithSigner.approve(
      addressRouter,
      amountIn
    );
    await approveTx.wait(); // Wait for the approval transaction to be mined

    // Log balance before the transaction
    const balanceBefore = await ownerSigner.getBalance();
    console.log(
      `ETH Balance before swap: ${ethers.utils.formatEther(balanceBefore)}`
    );

    // Perform the token swap on Uniswap
    const txSwap = await mainnetForkUniswapRouter.swapExactTokensForTokens(
      amountIn, // amount In
      amountOut, // amount Out
      [addressFrom, addressTo], // path
      myAddress, // address to
      Date.now() + 60 * 5, // deadline in seconds
      {
        gasLimit: 200000,
        gasPrice: ethers.utils.parseUnits("50.5", "gwei"),
        type: 0, // Explicitly set the transaction type to 0 for legacy transactions
      }
    );

    // Wait for the token swap transaction to be mined
    const receipt = await txSwap.wait();

    // Log balance after the transaction
    const balanceAfter = await ownerSigner.getBalance();
    console.log(
      `ETH Balance after swap: ${ethers.utils.formatEther(balanceAfter)}`
    );

    // Check WETH balance after the swap
    const tokenBalanceAfter = await contractWethWithSigner.balanceOf(myAddress);
    console.log(
      `WETH balance after swap: ${ethers.utils.formatUnits(
        tokenBalanceAfter,
        18
      )}`
    );

    // Get and log the transaction receipt (commented out for now)
    const mainnetForkProvider = waffle.provider;
    const txReceipt = await mainnetForkProvider.getTransactionReceipt(
      txSwap.hash
    );
    // console.log("\nTRANSACTION RECEIPT");
    // console.log(txReceipt);
  });
});
