// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./PulaSmartAccount.sol";

contract PulaSmartAccountFactory {
    address public implementation;
    address public entryPoint;

    constructor(address _implementation) {
        implementation = _implementation;
    }

    event SmartAccountCreated(address indexed account, address indexed owner);

    function createSmartAccount(address owner) external returns (address) {
        address clone = Clones.clone(implementation);
        PulaSmartAccount(clone).initialize(owner, entryPoint, address(0));
        emit SmartAccountCreated(clone, owner);
        return clone;
    }
}
