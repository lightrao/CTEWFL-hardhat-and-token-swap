require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

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
