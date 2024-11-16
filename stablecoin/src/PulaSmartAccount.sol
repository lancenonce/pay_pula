// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.10;

import {IAccount} from "@account-abstraction/contracts/interfaces/IAccount.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import { UserOperation } from "@biconomy/smart-account/contracts/smart-contract-wallet/libs/UserOperation.sol";
import "@account-abstraction/contracts/core/Helpers.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@biconomy/smart-account/contracts/smart-contract-wallet/SmartWallet.sol";

contract PulaSmartAccount is Initializable, SmartWallet {
    constructor(IEntryPoint entryPoint_) SmartWallet() {}

    function initialize(address owner, address entryPoint, address handler) external initializer {
        SmartWallet.init(owner, entryPoint, handler);
    }
}