require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "hardhat",
  solidity: "0.8.4",
  networks: {
    hardhat: {
      // forking: {
      //   url: process.env.ALCHEMY_URL, // your Alchemy mainnet URL
      // },
    },
    sepolia: {
      // Configuration for the Sepolia testnet
      url: process.env.SEPOLIA_RPC_URL, // RPC URL for connecting to Sepolia
      accounts: process.env.PRIVATE_KEY !== "" ? [process.env.PRIVATE_KEY] : [], // Array of private keys for deploying contracts
      chainId: 11155111, // Chain ID for Sepolia
    },
    localhost: {
      // Configuration for local Ethereum node
      url: "http://localhost:8545", // Localhost RPC URL
      // accounts: "hardhat supply", // Uncomment and provide accounts if needed
      chainId: 31337, // Chain ID for local network
    },
  },
};
