#!/usr/bin/env node
import fs from 'node:fs';
const [file, ...statuses] = process.argv.slice(2);
if (!file || !statuses.length) throw new Error('usage: set-daily-log-status.mjs LOG STATUS...');
const log = JSON.parse(fs.readFileSync(file, 'utf8'));
log.workflow_status = [...new Set([...(log.workflow_status ?? []), ...statuses])];
fs.writeFileSync(file, JSON.stringify(log, null, 2) + '\n');
console.log(`${file}: ${log.workflow_status.join(', ')}`);
