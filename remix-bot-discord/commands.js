import 'dotenv/config';
import { InstallGlobalCommands } from './utils.js';

// Simple test command
const TEST_COMMAND = {
  name: 'test',
  description: 'Basic command',
  type: 1,
};

// Simple test command
const SEND_COMMAND = {
  name: 'send',
  description: 'Send command',
  type: 1,
  options: [
    {
      type: 3,
      name: "ipfs_hash",
      description: "IPFS hash of all the relay proof data",
      required: true,
    },
    {
      type: 3,
      name: "receiver",
      description: "Receiver address of the transaction",
      required: true,
    }
  ]
};

const ALL_COMMANDS = [TEST_COMMAND, SEND_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);