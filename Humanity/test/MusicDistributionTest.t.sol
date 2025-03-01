// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MusicDistribution.sol";
import "../src/MockIVC.sol";

contract MusicDistributionTest is Test {
    MusicDistribution musicDist;
    MockIVC mockIVC;

    // Test addresses
    address verifiedArtist = address(1);
    address unverifiedArtist = address(2);
    address otherArtist = address(3);

    function setUp() public {
        // Deploy the mock IVC contract and set verification status.
        mockIVC = new MockIVC();
        mockIVC.setVerified(verifiedArtist, true);
        mockIVC.setVerified(otherArtist, true);
        // unverifiedArtist remains unverified.

        // Deploy MusicDistribution with the address of the mock IVC.
        musicDist = new MusicDistribution(address(mockIVC));
    }

    /// @notice Helper function to convert a string to bytes32.
    function stringToBytes32(string memory source) internal pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        require(tempEmptyStringTest.length <= 32, "string too long");
        assembly {
            result := mload(add(source, 32))
        }
    }

    /// @notice Test that a verified artist with the required credential can register.
    function testRegisterVerifiedArtist() public {
        // Prepare the "music_rights" credential.
        bytes32 musicRightsCredential = keccak256(abi.encodePacked("music_rights"));
        // Mark the credential as issued for the verified artist.
        musicDist.markCredentialIssued(verifiedArtist, musicRightsCredential);

        // Simulate the verified artist calling registerArtist.
        vm.prank(verifiedArtist);
        musicDist.registerArtist();

        // Verify that the artist is registered.
        bool isRegistered = musicDist.registeredArtists(verifiedArtist);
        assertTrue(isRegistered, "Verified artist should be registered");
    }

    /// @notice Test that an unverified artist (even with the credential) cannot register.
    function testRegisterUnverifiedArtist() public {
        bytes32 musicRightsCredential = keccak256(abi.encodePacked("music_rights"));
        // Mark the credential as issued for the unverified artist.
        musicDist.markCredentialIssued(unverifiedArtist, musicRightsCredential);

        // Expect revert due to lack of verification.
        vm.prank(unverifiedArtist);
        vm.expectRevert("Artist not verified on Humanity Protocol");
        musicDist.registerArtist();
    }

    /// @notice Test that marking a credential works correctly.
    function testMarkCredentialIssued() public {
        // Convert "test" into bytes32.
        bytes32 testCredential = stringToBytes32("test");
        musicDist.markCredentialIssued(otherArtist, testCredential);

        bool hasCred = musicDist.hasCredential(otherArtist, testCredential);
        assertTrue(hasCred, "Artist should have the 'test' credential");
    }

    /// @notice Test that attempting to issue the same credential twice reverts.
    function testDoubleIssueCredentialReverts() public {
        bytes32 testCredential = stringToBytes32("test");
        musicDist.markCredentialIssued(otherArtist, testCredential);

        vm.expectRevert("Credential already issued");
        musicDist.markCredentialIssued(otherArtist, testCredential);
    }

    /// @notice Test that a credential can be revoked by the owner.
    function testRevokeCredential() public {
        bytes32 testCredential = stringToBytes32("test");

        // Issue a credential to otherArtist.
        musicDist.markCredentialIssued(otherArtist, testCredential);
        bool hasCred = musicDist.hasCredential(otherArtist, testCredential);
        assertTrue(hasCred, "Credential should be issued initially");

        // Revoke the credential (owner is address(this))
        musicDist.revokeCredential(otherArtist, testCredential);

        bool stillHasCred = musicDist.hasCredential(otherArtist, testCredential);
        assertTrue(!stillHasCred, "Credential should be revoked");
    }

    /// @notice Test that revoking a credential that has not been issued reverts.
    function testRevokeNonIssuedCredentialReverts() public {
        bytes32 testCredential = stringToBytes32("test");

        vm.expectRevert("Credential not issued");
        musicDist.revokeCredential(otherArtist, testCredential);
    }
}
