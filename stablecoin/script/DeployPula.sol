// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/Pula.sol";
import "../src/PulaSmartAccount.sol";
import "../src/PulaSmartAccountFactory.sol";

contract DeployPula is Script {
    function run() external {
        uint256 initialSupply = 1000000 * 10 ** 18;
        vm.startBroadcast();

        Pula pula = new Pula(initialSupply);
        console.log("Pula deployed at:", address(pula));

        IEntryPoint entryPoint = IEntryPoint(address(0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789));
        PulaSmartAccount smartAccountImplementation = new PulaSmartAccount(entryPoint);
        console.log("PulaSmartAccount implementation deployed at:", address(smartAccountImplementation));

        PulaSmartAccountFactory factory = new PulaSmartAccountFactory(address(smartAccountImplementation));
        console.log("PulaSmartAccountFactory deployed at:", address(factory));

        vm.stopBroadcast();
    }
}