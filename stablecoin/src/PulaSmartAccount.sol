// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import {IAccount} from "@account-abstraction/contracts/interfaces/IAccount.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import {UserOperationLib, UserOperation} from "@account-abstraction/contracts/interfaces/UserOperation.sol";
import {BaseSmartAccountErrors} from "@biconomy/smart-account/contracts/common/Errors.sol";
import "@account-abstraction/contracts/core/Helpers.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@biconomy/smart-account/contracts/smart-account/BaseSmartAccount.sol";

contract PulaSmartAccount is BaseSmartAccount, Ownable, Initializable {
    using UserOperationLib for UserOperation;

    IEntryPoint private immutable _entryPoint;

    constructor(IEntryPoint entryPoint_) {
        _entryPoint = entryPoint_;
    }

    function entryPoint() public view override returns (IEntryPoint) {
        return _entryPoint;
    }

    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external override returns (uint256) {
        return 0;
    }

    function init(
        address handler,
        address moduleSetupContract,
        bytes calldata moduleSetupData
    ) external override initializer returns (address) {

        return address(this);
    }

    function _payPrefund(uint256 missingAccountFunds) internal override {
        if (missingAccountFunds != 0) {
            payable(msg.sender).call{
                value: missingAccountFunds,
                gas: type(uint256).max
            }("");

        }
    }
}