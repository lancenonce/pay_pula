# PayPula: Biconomy Sessions Keys with Next.js

This is a [Next.js](https://nextjs.org/) project that demonstrates the creation and use of a session for gasless transactions. It allows you to interact with a smart contract on the Scroll and Ethereum Sepolia test networks and execute a transaction to increment count.

## Getting Started

To get started with this project, follow these steps:

1. Clone this repository to your local machine:

   ```bash
   git clone https://github.com/lancenonce/pay_pula.git
   ```

2. Change to the project directory:

   ```bash
   cd pay_pula
   ```

3. Install the project dependencies:

   ```bash
   npm install
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your web browser to access the application.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Technologies Used

* [Next.js](https://nextjs.org/): A React framework for building web applications.
* [Biconomy](https://www.biconomy.io/): A gas-free transaction infrastructure for Ethereum and other blockchains.
* [Biconomy Sessions Key](https://www.biconomy.io/post/modular-session-keys): Read about Sessions Keys and how they work.
* [Ethers.js](https://docs.ethers.org/v5/): A library for interacting with the Ethereum blockchain.

## How This Project Uses Biconomy Session Keys

This project utilizes Biconomy session keys to sign transactions with ERC-4337. The session keys enable gasless transactions by allowing users to interact with smart contracts without needing to hold ETH for gas fees. The implementation leverages Biconomy's infrastructure to manage session keys and handle transaction signing.

### Deployed Contracts

#### Ethereum Sepolia:
- Pula deployed at: `0x7c0E4d8cAb5A6C0d24Bc79980779fEF3FDAD4474`
- PulaSmartAccount implementation deployed at: `0x40C77FaB3B0031D64331a6b38A89a051d9201ed0`
- PulaSmartAccountFactory deployed at: `0x137DAB9C2e03402CDaC6e6Af89a0b78d4BCAb956`

#### Scroll Sepolia:
- Pula deployed at: `0x849858e74B68523fe91a46c2A6dF927DEf8DE58b`
- PulaSmartAccount implementation deployed at: `0xE3Bc06f1A17E59519B3F6CA5a95D2C5124A6D8fC`
- PulaSmartAccountFactory deployed at: `0x7c0E4d8cAb5A6C0d24Bc79980779fEF3FDAD4474`

## Learn More

To learn more about the technologies used in this project, check out the following resources:

* [Next.js Documentation](https://nextjs.org/docs): Learn about Next.js features and API.
* [Biconomy Documentation](https://docs.biconomy.io/): Explore Biconomy's capabilities and integration guides.
* [Biconomy Session Keys Tutorial](https://docs.biconomy.io/tutorials/sessions): Learn how to create and use a session for a sponsored transaction.
* [Ethers.js Documentation](https://docs.ethers.org/v5/): Explore the features and capabilities of Ethers.js.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.