import dotenv from 'dotenv';
import { fetch } from 'undici';

dotenv.config({ path: '.env.local' });

const required = ['DISCORD_APP_ID', 'DISCORD_BOT_TOKEN', 'DISCORD_GUILD_ID'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable ${key}. Set it in .env.local or the shell before running the script.`);
  }
}

const appId = process.env.DISCORD_APP_ID!;
const botToken = process.env.DISCORD_BOT_TOKEN!;
const guildId = process.env.DISCORD_GUILD_ID!;

const commands = [
  {
    name: 'health',
    type: 1,
    description: 'Confirm BotMedic is responsive',
    dm_permission: false,
    default_member_permissions: null
  },
  {
    name: 'envcheck',
    type: 1,
    description: 'Verify required BotMedic environment variables',
    dm_permission: false,
    default_member_permissions: null
  },
  {
    name: 'permissions',
    type: 1,
    description: 'Check the bot role/channel permissions locally',
    dm_permission: false,
    default_member_permissions: null
  },
  {
    name: 'latency',
    type: 1,
    description: 'Measure the round-trip latency for this interaction',
    dm_permission: false,
    default_member_permissions: null
  },
  {
    name: 'helpme',
    type: 1,
    description: 'Give me troubleshooting hints with BotMedic',
    dm_permission: false,
    default_member_permissions: null
  }
];

async function main() {
  const url = `https://discord.com/api/v10/applications/${appId}/guilds/${guildId}/commands`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commands)
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('Discord API rejected the command registration', text);
    process.exit(1);
  }

  const data = await response.json();
  console.log('Registered commands:', JSON.stringify(data, null, 2));
}

main().catch((error) => {
  console.error('Command registration failed', error);
  process.exit(1);
});
