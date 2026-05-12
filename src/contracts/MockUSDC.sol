// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// A simplified Fake USDC for testing your Vault
contract MockUSDC {
    mapping(address => uint256) public balanceOf;

    // Anyone can mint fake money for testing
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function balance(address account) external view returns (uint256) {
        return balanceOf[account];
    }
}