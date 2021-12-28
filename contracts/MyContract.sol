// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

contract MyContract {
    mapping(bytes32 => uint256) public claims;
    uint256 public product;
    uint256 public withdrawlDelay;

    constructor(uint256 _product, uint256 _withdrawlDelay) {
        product = _product;
        withdrawlDelay = _withdrawlDelay;
    }

    function donate() external payable {}

    function submitClaim(bytes32 _hash) public {
        claims[_hash] = block.number;
    }

    function withdraw(uint256 _factor1, uint256 _factor2) public {
        address payable claimant = payable(msg.sender);
        bytes32 hash = keccak256(abi.encode(msg.sender, _factor1, _factor2));
        uint256 claimBlockNumber = claims[hash];
        require(claimBlockNumber > 0, "Claim not found");
        require(
            block.number - claimBlockNumber > withdrawlDelay,
            "Not enough blocks mined since claim was submitted"
        );
        require(_factor1 * _factor2 == product, "Invalid factors");

        (bool sent, bytes memory data) = claimant.call{
            value: address(this).balance
        }("");
        require(sent, "Failed to send Ether");
    }
}
