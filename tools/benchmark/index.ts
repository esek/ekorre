#!/usr/bin/env node
// This is only ever to be run in development environment,
// so requiring depencencies in production is not needed
/* eslint-disable import/no-extraneous-dependencies */

import { exec, execSync } from 'child_process';
import { platform } from 'os';
import fs from 'fs';
import inquirer from 'inquirer';
import yargs from 'yargs';
import commandExists = require('command-exists');
import path from 'path';
import 'dotenv/config';

const SCRIPTS_FOLDER = path.join(__dirname, './scripts');
const { PORT } = process.env;

const selectScript = async () => {
  const scripts = fs.readdirSync(SCRIPTS_FOLDER);
  const { script } = await inquirer.prompt({
    name: 'script',
    type: 'list',
    message: 'Vilket skript vill du köra?',
    choices: scripts,
  });

  return script as string;
};

const run = async () => {
  try {
    await commandExists('wrk');
  } catch (err) {
    console.error('wrk måste finnas installerat för att kunna köra benchmarking,\nse https://github.com/wg/wrk');
    process.exit(1);
  }

  const script = await selectScript();

  if (!script) {
    process.exit(1);
  }

  const command = `wrk -t6 -c200 -d30s -s ${SCRIPTS_FOLDER}/${script} http://localhost:${PORT}`;

  exec(command, (err, stdout) => {
    console.log({ err });
    console.log({ stdout });
  });
};

run();
