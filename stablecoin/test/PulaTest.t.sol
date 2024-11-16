// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/Pula.sol";

contract PulaTest is Test {
    Pula public pula;

    function setUp() public {
        pula = new Pula(1000000 * 10 ** 18);
    }

    function testInitialSupply() public view {
        assertEq(pula.totalSupply(), 1000000 * 10 ** 18);
    }

    function testMint() public {
        pula.mint(address(this), 1000 * 10 ** 18);
        assertEq(pula.balanceOf(address(this)), 1000 * 10 ** 18 + 1000000 * 10 ** 18);
    }
}