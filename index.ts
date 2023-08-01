import { ethers } from 'ethers';

// TODO: replace with your actual limit
const MAX_CLAIMS_PER_TX = 100;
// From https://github.com/gnosischain/configs/blob/b90374a1c63703db8235fcdb65aff2e909bc42b5/mainnet/config.yaml#L55C27-L55C69
const DEPOSIT_CONTRACT_ADDRESS = "0x0B98057eA310F4d31F2a452B414647007d1645d9"

async function processWithdrawals() {
  const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545'); // replace with your Ethereum node RPC URL
  const privateKey = 'YOUR_PRIVATE_KEY'; // replace with your private key
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const depositContractAbi = [ 'function claimWithdrawals(address[] memory _addrs) public' ];
  const depositContract = new ethers.Contract(DEPOSIT_CONTRACT_ADDRESS, depositContractAbi, provider).connect(wallet);

  let latestBlock: number;
  latestBlock = await provider.getBlockNumber();

  const lastCall = latestBlock; // replace with your desired block range
  
  let addrs: string[] = [];
  for(let i=lastCall; i<=latestBlock; i++) {
    const block = await provider.getBlock(i);
    for(const withdraw of block.withdrawals) {
      addrs.push(withdraw.address);
    }
  }

  const uniqueAddrs = [...new Set(addrs)];

  // Process claims in batches
  while (uniqueAddrs.length > 0) {
    const batch = uniqueAddrs.splice(0, MAX_CLAIMS_PER_TX);
    console.log(`Processing batch of addresses: ${batch}`);
    const tx = await depositContract.claimWithdrawals(batch);
    const receipt = await tx.wait();
    console.log(receipt);
  }
}

// Run the script every hour
setInterval(() => {
  processWithdrawals().catch((error) => {
    console.error("Error in processWithdrawals: ", error);
  });
}, 60 * 60 * 1000);
