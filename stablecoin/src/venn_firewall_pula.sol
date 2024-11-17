// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {VennFirewallConsumer} from "@ironblocks/firewall-consumer/contracts/consumers/VennFirewallConsumer.sol";

contract Pula is ERC20, VennFirewallConsumer {
    constructor(uint256 initialSupply) ERC20("Pula", "PUL") {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) public firewallProtected {
        _mint(to, amount);
    }
}