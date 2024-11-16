// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/PulaSmartAccount.sol";
import "../src/PulaSmartAccountFactory.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract PulaSmartAccountFactoryTest is Test {
    PulaSmartAccountFactory public factory;
    PulaSmartAccount public implementation;
    address public entryPoint = address(0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789);
    address public owner = address(0x477F47f3565685486Fe1f54db675C7F63A2E7290);

    function setUp() public {
        implementation = new PulaSmartAccount(IEntryPoint(entryPoint));
        factory = new PulaSmartAccountFactory(address(implementation));
    }

    function isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }

    function testCreateSmartAccount() public {
        address clone = factory.createSmartAccount(owner);

        // Check that the clone address is a contract
        assertTrue(isContract(clone), "Clone should be a contract");

        // Check that the owner is set correctly
        PulaSmartAccount smartAccount = PulaSmartAccount(clone);
        assertEq(smartAccount.owner(), owner, "Owner should be set correctly");

        // Check that the entry point is set correctly
        assertEq(smartAccount.entryPoint(), entryPoint, "Entry point should be set correctly");

        // Check that the SmartAccountCreated event is emitted
        vm.expectEmit(true, true, true, true);
    }
}