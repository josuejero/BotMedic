import { InteractionResponse, InteractionResponseType, Interaction } from '../types/discord';

const REQUIRED_PERMISSIONS = [
  { label: 'View channel', bit: 1n << 10n },
  { label: 'Send messages', bit: 1n << 11n },
  { label: 'Embed links', bit: 1n << 14n },
  { label: 'Read message history', bit: 1n << 16n },
  { label: 'Use application commands', bit: 1n << 31n }
];

function parsePermissions(value?: string): bigint | undefined {
  if (!value) {
    return undefined;
  }

  try {
    return BigInt(value);
  } catch (error) {
    console.warn('Unable to parse permission bitfield', error);
    return undefined;
  }
}

export function buildPermissionsResponse(interaction: Interaction): InteractionResponse {
  const rawBitfield = interaction.app_permissions ?? interaction.member?.permissions;
  const parsed = parsePermissions(rawBitfield);
  const lines: string[] = ['BotMedic permission check:'];

  if (!parsed) {
    lines.push(
      '• ⚠️ Unable to read the bot permission bitfield from the interaction. Please confirm the bot is in a guild channel.'
    );
    lines.push('• ℹ️ This check relies on the `app_permissions` value that Discord includes with slash commands.');

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: lines.join('\n'),
        flags: 64
      }
    };
  }

  const missingPermissions = REQUIRED_PERMISSIONS.filter((perm) => (parsed & perm.bit) === 0n);

  if (missingPermissions.length) {
    lines.push(`• ⚠️ Missing the following permissions: ${missingPermissions.map((perm) => perm.label).join(', ')}`);
    lines.push('• ℹ️ Update the bot role or channel overrides so it can read/send artifacts and register commands.');
  } else {
    lines.push('• ✅ Bot has all the essential channel permissions for diagnostics.');
  }

  lines.push(`• Checked flags: ${REQUIRED_PERMISSIONS.map((perm) => perm.label).join(', ')}`);

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: lines.join('\n'),
      flags: 64
    }
  };
}
