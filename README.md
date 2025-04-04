# Hardhat and Token Swap

### Quickstart

1. Clone the project repository and navigate into it:

   ```sh
   git clone <repository_url>
   cd <repository_directory>
   ```

2. Install the project dependencies:

   ```sh
   npm ci
   ```

3. Run Hardhat:

   ```sh
   npx hardhat
   ```

### Test driven development

create ./scripts/log-hello.js file, run the script:

```sh
npx hardhat run scripts/log-hello.js
```

run scripts in ./test folder:

```sh
npx hardhat test
```

### Connecting to Contract Addresses

create ./utils folder, and create AbiList.js and AddressList.js in it
create ./test/sendSwapTX.js file
run:

```sh
npx hardhat test
```

### Connecting to Mainnet Fork and Getting Wallet Details for Signing Transactions

run a hardhat node locally forked from ETH mainnet:

```sh
source .env
npx hardhat node --fork ${ALCHEMY_URL}
```

### Building Our Swap Transaction

update ./test/sendSwapTX.js file

### Reviewing Our Transaction and Receipt

update ./test/sendSwapTX.js file
run:

```sh
npx hardhat test --network localhost
npx hardhat test --network hardhat
npx hardhat test
```
