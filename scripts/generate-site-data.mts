import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { commands } from '@botmedic/commands';
import { RULE_CASES } from '@botmedic/rules';

const outputPath = resolve('site/js/data.js');
const content = `/**
 * AUTO-GENERATED. Do not edit directly.
 * Run "npm run generate-site-data" after updating rules or commands.
 */

export const commands = ${JSON.stringify(commands, null, 2)};

export const ruleCases = ${JSON.stringify(RULE_CASES, null, 2)};
`;

writeFileSync(outputPath, content, { encoding: 'utf-8' });
console.log(`Updated ${outputPath}`);
