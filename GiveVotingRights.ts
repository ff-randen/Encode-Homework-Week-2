import { ethers } from "ethers";
import { Ballot, Ballot__factory } from "../typechain-types";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  // Receiving arguments
  const args = process.argv.slice(2);
  if (!args || args.length < 2) {
    throw new Error("Invalid number of arguments provided");
  }
  const contractAddress = args[0];
  const voterAddress = args[1];

  // Configuring the provider
  const provider = new ethers.JsonRpcProvider(
    process.env.RPC_ENDPOINT_URL ?? ""
  );
  const lastBlock = await provider.getBlock("latest");
  console.log(`Last block number: ${lastBlock?.number}`);
  const lastBlockTimestamp = lastBlock?.timestamp ?? 0;
  const lastBlockDate = new Date(lastBlockTimestamp * 1000);
  console.log(
    `Last block timestamp: ${lastBlockTimestamp} (${lastBlockDate.toLocaleDateString()} ${lastBlockDate.toLocaleTimeString()})`
  );

  // Configuring the wallet
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY ?? "", provider);
  console.log(`Wallet: ${wallet.address}`);
  const balanceBN = await provider.getBalance(wallet.address);
  const balance = Number(ethers.formatUnits(balanceBN));
  console.log(`Balance: ${balance} ETH`);
  if (balance < 0.01) {
    throw new Error("Not enough ether");
  }

  // Attaching the contract using TypeChain
  const ballotFactory = new Ballot__factory(wallet);
  const ballotContract = ballotFactory.attach(contractAddress) as Ballot;

  const tx = await ballotContract.giveRightToVote(voterAddress);

  const receipt = await tx.wait();
  console.log(`Transaction hash: ${receipt?.hash}`);

  const voter = await ballotContract.voters(voterAddress);
  console.log(`${voterAddress} voter weight is ${voter.weight}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
