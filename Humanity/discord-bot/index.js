import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Create a new Discord client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Define slash commands
const commands = [
  new SlashCommandBuilder()
    .setName("issuecredential")
    .setDescription("Issue a credential to a given Ethereum address")
    .addStringOption((option) =>
      option
        .setName("address")
        .setDescription(
          "The Ethereum address (or DID) to issue the credential to"
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("credential")
        .setDescription("The type of credential (e.g., music_artist)")
        .setRequired(true)
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName("checkverification")
    .setDescription(
      "Check if the given address is verified on Humanity Protocol"
    )
    .addStringOption((option) =>
      option
        .setName("address")
        .setDescription("The Ethereum address (or DID) to check")
        .setRequired(true)
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName("revokecredential")
    .setDescription("Revoke a credential for a given Ethereum address")
    .addStringOption((option) =>
      option
        .setName("address")
        .setDescription(
          "The Ethereum address (or DID) to revoke the credential from"
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("credential")
        .setDescription("The type of credential to revoke (e.g., music_artist)")
        .setRequired(true)
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName("credentialcount")
    .setDescription("Get credential details (count and types) for an address")
    .addStringOption((option) =>
      option
        .setName("address")
        .setDescription("The Ethereum address (or DID) to check")
        .setRequired(true)
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName("verifycredential")
    .setDescription("Verify a credential by address + type (no JSON needed)")
    .addStringOption((option) =>
      option
        .setName("address")
        .setDescription("The Ethereum address (or DID) to verify")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("credential")
        .setDescription("The credential type (e.g., music_artist)")
        .setRequired(true)
    )
    .toJSON(),
];

// Register slash commands with Discord
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("Registering slash commands...");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );
    console.log("Slash commands registered successfully!");
  } catch (error) {
    console.error("Error registering commands:", error);
  }
})();

// Listen for interactions
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "issuecredential") {
    await interaction.deferReply();
    const address = interaction.options.getString("address");
    const credential = interaction.options.getString("credential");

    try {
      const backendUrl =
        process.env.BACKEND_URL || "http://localhost:3000/api/issue-credential";
      const response = await axios.post(backendUrl, {
        subject_address: address,
        credentialType: credential,
      });
      const result = response.data;
      if (result.txHash && result.txHash !== "Credential already issued") {
        await interaction.editReply(
          `Credential issued successfully. Transaction hash: ${result.txHash}`
        );
      } else if (
        result.txHash === "Credential already issued" ||
        result.message === "Credential already issued"
      ) {
        await interaction.editReply(
          `Credential is already issued for ${address}.`
        );
      } else {
        await interaction.editReply(`Result: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      console.error("Error issuing credential:", error);
      await interaction.editReply(
        "There was an error issuing the credential. Please try again later."
      );
    }
  } else if (interaction.commandName === "checkverification") {
    await interaction.deferReply();
    const address = interaction.options.getString("address");

    try {
      const backendCheckUrl =
        process.env.BACKEND_CHECK_URL ||
        "http://localhost:3000/api/check-verification";
      const response = await axios.post(backendCheckUrl, {
        subject_address: address,
      });
      const result = response.data;
      if (result.verified) {
        await interaction.editReply(
          `The address ${address} is verified on Humanity Protocol.`
        );
      } else {
        await interaction.editReply(
          `The address ${address} is NOT verified on Humanity Protocol.`
        );
      }
    } catch (error) {
      console.error("Error checking verification:", error);
      await interaction.editReply(
        "There was an error checking verification. Please try again later."
      );
    }
  } else if (interaction.commandName === "revokecredential") {
    await interaction.deferReply();
    const address = interaction.options.getString("address");
    const credential = interaction.options.getString("credential");

    try {
      const backendRevokeUrl =
        process.env.BACKEND_REVOKE_URL ||
        "http://localhost:3000/api/revoke-credential";
      const response = await axios.post(backendRevokeUrl, {
        subject_address: address,
        credentialType: credential,
      });
      const result = response.data;
      if (result.txHash) {
        await interaction.editReply(
          `Credential revoked successfully. Transaction hash: ${result.txHash}`
        );
      } else {
        await interaction.editReply(`Result: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      console.error("Error revoking credential:", error);
      await interaction.editReply(
        "There was an error revoking the credential. Please try again later."
      );
    }
  } else if (interaction.commandName === "credentialcount") {
    await interaction.deferReply();
    const address = interaction.options.getString("address");

    try {
      const backendCountUrl =
        process.env.BACKEND_COUNT_URL ||
        "http://localhost:3000/api/credential-details";
      const response = await axios.post(backendCountUrl, {
        subject_address: address,
      });
      const result = response.data;
      await interaction.editReply(
        `The address ${address} has ${
          result.count
        } credential(s): ${result.types.join(", ")}`
      );
    } catch (error) {
      console.error("Error getting credential details:", error);
      await interaction.editReply(
        "There was an error getting the credential details. Please try again later."
      );
    }
  } else if (interaction.commandName === "verifycredential") {
    await interaction.deferReply();
    const address = interaction.options.getString("address");
    const credential = interaction.options.getString("credential");

    try {
      // Call the new /verify-credential endpoint with address + credentialType
      const backendVerifyUrl =
        process.env.BACKEND_VERIFY_URL ||
        "http://localhost:3000/api/verify-credential";
      const response = await axios.post(backendVerifyUrl, {
        subject_address: address,
        credentialType: credential,
      });
      const result = response.data;
      await interaction.editReply(
        `Verification result: ${JSON.stringify(result)}`
      );
    } catch (error) {
      console.error("Error verifying credential:", error);
      await interaction.editReply(
        "There was an error verifying the credential. Please try again later."
      );
    }
  }
});

// Log in to Discord
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
