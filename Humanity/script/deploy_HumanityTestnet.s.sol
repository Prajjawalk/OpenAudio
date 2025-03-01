// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MusicDistribution.sol";

contract DeployMusicDistribution is Script {
    function run() external {
        // Load the deployer's private key from Foundry's environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Start the broadcast using the deployer's private key
        vm.startBroadcast(deployerPrivateKey);

        // Set the Humanity Protocol IVC contract address
        address vcContractAddress = vm.envAddress("VC_CONTRACT_ADDRESS");

        // Deploy the MusicDistribution contract
        MusicDistribution musicDist = new MusicDistribution(vcContractAddress);

        console.log("MusicDistribution contract deployed at:", address(musicDist));

        // Stop the broadcast
        vm.stopBroadcast();
    }
}
