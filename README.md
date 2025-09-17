# alucart2005 - Blockchain/Web3 Practice Repository

A comprehensive learning repository for Ethereum smart contract development and decentralized application (dApp) creation. This project demonstrates the integration of Solidity smart contracts built with Foundry and a React-based frontend using Next.js.

## Features

- **Smart Contracts**: Solidity contracts developed using Foundry framework
  - Counter contract with basic increment and set functionality
- **Decentralized Application**: Next.js frontend with TypeScript and Tailwind CSS
- **Testing Framework**: Comprehensive test suite using Foundry's testing capabilities
- **Deployment Scripts**: Automated deployment scripts for smart contracts

## Installation

### Prerequisites

- Node.js (v16 or higher)
- Foundry (for smart contract development)
- Git

### Smart Contracts Setup

1. Navigate to the smart contracts directory:
   ```bash
   cd sc
   ```

2. Install dependencies:
   ```bash
   forge install
   ```

3. Build the contracts:
   ```bash
   forge build
   ```

### dApp Setup

1. Navigate to the dApp directory:
   ```bash
   cd dapp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Smart Contracts

#### Build and Test
```bash
cd sc
forge build
forge test
```

#### Deploy to Local Network
```bash
anvil
# In another terminal:
forge script script/Counter.s.sol:CounterScript --rpc-url http://localhost:8545 --private-key <your_private_key> --broadcast
```

#### Interact with Deployed Contract
```bash
cast call <contract_address> "number()" --rpc-url <rpc_url>
cast send <contract_address> "increment()" --rpc-url <rpc_url> --private-key <your_private_key>
```

### dApp

The dApp currently displays a placeholder Next.js page. To integrate with smart contracts:

1. Install Web3 libraries (e.g., ethers.js, wagmi)
2. Connect to Ethereum network
3. Interact with deployed Counter contract

## API Documentation

### Counter Contract

#### Functions

- `number() public view returns (uint256)`: Returns the current counter value
- `setNumber(uint256 newNumber) public`: Sets the counter to a new value
- `increment() public`: Increments the counter by 1

#### Events

- None currently defined

#### Example Usage

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Counter.sol";

contract Example {
    Counter public counter;

    constructor(address _counterAddress) {
        counter = Counter(_counterAddress);
    }

    function incrementCounter() public {
        counter.increment();
    }

    function getCounterValue() public view returns (uint256) {
        return counter.number();
    }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow Solidity best practices
- Write comprehensive tests for new features
- Update documentation for any API changes
- Ensure all tests pass before submitting PR

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- GitHub: [alucart2005](https://github.com/alucart2005)
- Email: [your-email@example.com]

---

*This repository is part of Codecrypto Academy learning materials.*