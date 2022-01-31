#!/usr/bin/env node
// This is only ever to be run in development environment,
// so requiring depencencies in production is not needed
/* eslint-disable import/no-extraneous-dependencies */

import { exec } from 'child_process';
import fs from 'fs';
import inquirer from 'inquirer';
import yargs from 'yargs';
import path from 'path';
import 'dotenv/config';

const SCRIPTS_FOLDER = path.join(__dirname, './scripts');
const { PORT } = process.env;
const DEFAULT_THREADS = 5;
const DEFAULT_OPEN_CONNECTIONS = 250;
const DEFAULT_TEST_TIME = '30s';

const selectScript = async (): Promise<string> => {
  const scripts = fs.readdirSync(SCRIPTS_FOLDER);
  const { script } = await inquirer.prompt({
    name: 'script',
    type: 'list',
    message: 'Vilket skript vill du köra?',
    choices: scripts,
  });

  return script as string;
};

const selectUrl = async (): Promise<string> => {
  const otherOption = 'Något annat...';
  const { url } = await inquirer.prompt({
    name: 'url',
    type: 'list',
    default: 0,
    message: 'Vilken URL vill du testa?',
    choices: [
      `http://localhost:${PORT ?? ''}`,
      'https://ekorre.esek.se',
      otherOption,
    ]
  });

  if (url === otherOption) {
    const { otherUrl } = await inquirer.prompt({
      name: 'otherUrl',
      type: 'input',
      message: 'Skriv in URL:en du vill benchmarka'
    });
    return otherUrl as string;
  }
  return url as string;
};

const run = async () => {
  const script = await selectScript();
  const url = await selectUrl();

  if (!script || !url) {
    process.exit(1);
  }

  const command = `wrk -t6 -c200 -d30s -s ${SCRIPTS_FOLDER}/${script} ${url}`;

  exec(command, (err, stdout) => {
    console.log({ err });
    console.log({ stdout });
  });
};

run();
