const { ethers } = require("ethers");

// Define the constructor arguments
const initialSupply = ethers.utils.parseUnits("1000000", 18);

// ABI-encode the constructor arguments
const abiCoder = new ethers.utils.AbiCoder();
const encodedArgs = abiCoder.encode(["uint256"], [initialSupply]);

console.log("ABI-encoded constructor arguments:", encodedArgs);