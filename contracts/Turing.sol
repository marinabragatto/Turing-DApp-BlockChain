//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "hardhat/console.sol";

contract  Turing is ERC20 {

    // Users name and their address
    mapping(string => address) public users; 
    // Users address and their name
    mapping(address => string) public usersInv; 
    // Number of users 
    uint public constant numUsers = 6; 
    // Contract Owner
    address public owner; 
    // State of Voting (active or deactive)
    bool public voting;
    // First User voted for Second User -> bool  
    mapping(string => mapping(string => bool)) public hasVote;
    // Times a user voted   
    mapping(string => uint) public userVotedTimes;
    // Codinomes to frontend
    string[] private codinomes;

    modifier verifyPermission {
        require(owner == msg.sender || msg.sender == users["roberta"], "User do not have Permission");
        _; // Indica que o código da Funcao modificada roda depois do require  
    }

    modifier verifyVoting(string memory codinome, uint qtde_de_Turings) {
        require(voting == true, "Voting is not active");
        require(bytes(usersInv[msg.sender]).length > 0, "User is not permitted");
        require(msg.sender != users[codinome], "A user cannot vote for themselves");
        require(qtde_de_Turings > 0 && qtde_de_Turings <= 2, "Amount of Turing not allowed");
        string memory msg_sender_codinome = usersInv[msg.sender];
        require(hasVote[msg_sender_codinome][codinome] == false, "A user cannot vote for the same user twice");

        _; 

    }

    function initializeUsers() public {
        string[numUsers] memory users_name =  ["roberta", "nome1", "nome2", "nome3", "nome4", "nome5"];
        // 0x502542668aF09fa7aea52174b9965A7799343Df7 prof
        address[numUsers] memory users_address =  [0x502542668aF09fa7aea52174b9965A7799343Df7, 0x70997970C51812dc3A010C7d01b50e0d17dc79C8, 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC,0x90F79bf6EB2c4f870365E785982E1f101E93b906, 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65, 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc];
        
        for(uint i = 0; i < numUsers; i++){
            users[users_name[i]] = users_address[i];
            usersInv[users_address[i]] = users_name[i]; 
            if(i>0){ // It is not the teacher
                codinomes.push(users_name[i]); 
            }
        }

    }

    constructor() ERC20("Turing", "TT"){
        owner = msg.sender;
        initializeUsers();
        votingOn();
    }

    function decimals() public view virtual override returns (uint8) {
        return 0;
    }

    function updateUser(string memory codinome, address  user_addr) public verifyPermission {
        require(bytes(codinome).length > 0, "Codinome cannot be an empty string" );

        if (users[codinome] == address(0)) {
            codinomes.push(codinome);
        }


        address oldAddress = users[codinome]; 
        // Uptade name -> address
        users[codinome] = user_addr; 
        // Uptade address -> name
        delete usersInv[oldAddress]; // Delete the reference to old address
        usersInv[user_addr] = codinome; // add the new reference
    }

    function votingOn() public verifyPermission{
        voting = true;
    }
    
    function votingOff() public verifyPermission{
        voting = false;
    }

    function issueToken (string memory codinome , uint qtde_de_Turings) public verifyPermission {
        // Uncapped Lazy Supply
        _mint(users[codinome], qtde_de_Turings);
    }

    function vote(string memory codinome, uint qtde_de_Turings) public verifyVoting(codinome, qtde_de_Turings){
        _mint(users[codinome], qtde_de_Turings);

        string memory msg_sender_codinome = usersInv[msg.sender];
        hasVote[msg_sender_codinome][codinome] = true;
        userVotedTimes[msg_sender_codinome]++;
        if(userVotedTimes[msg_sender_codinome] == 10){
            _mint(msg.sender, 1);
            userVotedTimes[msg_sender_codinome] = 0;
        }
    }

    function getCodinomes() public view returns (string[] memory) {
        return codinomes;
    }



}