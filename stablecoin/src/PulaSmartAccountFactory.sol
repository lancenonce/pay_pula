// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./PulaSmartAccount.sol";

contract PulaSmartAccountFactory is Ownable {
    address public implementation;

    event SmartAccountCreated(address indexed account, address indexed owner);

    constructor(address _implementation) {
        implementation = _implementation;
    }

    function createSmartAccount(address owner) external returns (address) {
        address clone = Clones.clone(implementation);
        PulaSmartAccount(clone).initialize(owner);
        emit SmartAccountCreated(clone, owner);
        return clone;
    }
}