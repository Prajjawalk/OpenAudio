// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IVC} from "./interfaces/IVC.sol";

contract MusicDistribution {
    IVC private vcContract;
    address public owner;

    // Mapping to track registered artists
    mapping(address => bool) public registeredArtists;

    // Mapping to track issued credentials (credential type as bytes32 => user => bool)
    mapping(address => mapping(bytes32 => bool)) public issuedCredentials;

    // Mapping to track number of credentials per account.
    mapping(address => uint256) public credentialCount;

    // Mapping to store credential types for each account.
    mapping(address => bytes32[]) private credentialTypes;

    // Events (emit credentialType as bytes32)
    event ArtistRegistered(address indexed artist);
    event CredentialIssued(address indexed artist, bytes32 credentialType);
    event CredentialRevoked(address indexed artist, bytes32 credentialType);

    constructor(address _vcContractAddress) {
        vcContract = IVC(_vcContractAddress);
        owner = msg.sender;
    }

    // Modifier that ensures the caller is a verified human on Humanity Protocol
    modifier onlyVerifiedHuman() {
        require(vcContract.isVerified(msg.sender), "Artist not verified on Humanity Protocol");
        _;
    }

    // Modifier that ensures the caller has a specific credential (passed in as bytes32)
    modifier onlyVerifiedWithCredential(bytes32 credentialType) {
        require(vcContract.isVerified(msg.sender), "Artist not verified on Humanity Protocol");
        require(issuedCredentials[msg.sender][credentialType], "Required credential not issued");
        _;
    }

    // Modifier to restrict functions to the contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    /**
     * @notice Register an artist on the platform.
     * @dev The artist must have the "music_rights" credential to register.
     */
    function registerArtist() external onlyVerifiedWithCredential(keccak256("music_rights")) {
        require(!registeredArtists[msg.sender], "Artist already registered");
        registeredArtists[msg.sender] = true;
        emit ArtistRegistered(msg.sender);
    }

    /**
     * @notice Mark a specific credential as issued for an artist.
     */
    function markCredentialIssued(address artist, bytes32 credentialType) external {
        require(!issuedCredentials[artist][credentialType], "Credential already issued");
        issuedCredentials[artist][credentialType] = true;
        credentialCount[artist] += 1;
        credentialTypes[artist].push(credentialType);
        emit CredentialIssued(artist, credentialType);
    }

    /**
     * @notice Check if an artist has a specific credential.
     */
    function hasCredential(address artist, bytes32 credentialType) external view returns (bool) {
        return issuedCredentials[artist][credentialType];
    }

    /**
     * @notice Revoke a specific credential for an artist.
     * @dev Only the contract owner can revoke a credential.
     */
    function revokeCredential(address artist, bytes32 credentialType) external onlyOwner {
        require(issuedCredentials[artist][credentialType], "Credential not issued");
        issuedCredentials[artist][credentialType] = false;
        credentialCount[artist] -= 1;
        // Remove the credential type from the array (swap with last element and pop)
        bytes32[] storage creds = credentialTypes[artist];
        for (uint256 i = 0; i < creds.length; i++) {
            if (creds[i] == credentialType) {
                creds[i] = creds[creds.length - 1];
                creds.pop();
                break;
            }
        }
        emit CredentialRevoked(artist, credentialType);
    }

    /**
     * @notice Get the total number of credentials an artist has.
     */
    function getCredentialCount(address artist) external view returns (uint256) {
        return credentialCount[artist];
    }

    /**
     * @notice Get the list of credential types an artist currently holds.
     */
    function getCredentialTypes(address artist) external view returns (bytes32[] memory) {
        return credentialTypes[artist];
    }
}
