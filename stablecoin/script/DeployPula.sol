// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/Pula.sol";

contract DeployPula is Script {
    function run() external {
        uint256 initialSupply = 1000000 * 10 ** 18;
        vm.startBroadcast();
        new Pula(initialSupply);
        vm.stopBroadcast();
    }
}