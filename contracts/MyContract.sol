// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

contract MyContract {
    mapping(bytes32 => uint) public claims;
    int256 public product;

    function donate() external payable {}

    constructor(int256 _product) {
        product = _product;
    }

    function submitClaim(bytes32 _hash) public {
        claims[_hash] = block.number;
    }

    function withdraw(int256 _factor1, int256 _factor2) public {
        address payable claimant = payable(msg.sender);
        bytes32 hash = keccak256(abi.encode(msg.sender, _factor1, _factor2));
        require(claims[hash] > 0, "Claim not found");
        require(_factor1*_factor2 == product, "Invalid factors");

        (bool sent, bytes memory data) = claimant.call{
            value: address(this).balance
        }("");
        require(sent, "Failed to send Ether");
    }
}
