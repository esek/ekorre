#!/usr/bin/env node

// This is only ever to be run in development environment,
// so requiring depencencies in production is not needed
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */

import { exec } from 'child_process';
import fs from 'fs';
import inquirer from 'inquirer';
import { createSpinner } from 'nanospinner';
import path from 'path';
import 'dotenv/config';

const SCRIPTS_FOLDER = path.join(__dirname, './scripts');
const { PORT } = process.env;
const DEFAULT_THREADS = 5;
const DEFAULT_OPEN_CONNECTIONS = 250;
const DEFAULT_TEST_TIME = '30s';

const selectScript = async (): Promise<string> => {
  const scripts = fs.readdirSync(SCRIPTS_FOLDER);
  const { script } = await inquirer.prompt<{ script: string }>({
    type: 'list',
    name: 'script',
    message: 'Vilket skript vill du köra?',
    choices: scripts,
  });

  return script;
};

const selectUrl = async (): Promise<string> => {
  const otherOption = 'Något annat...';
  const { url } = await inquirer.prompt<{ url: string }>({
    type: 'list',
    name: 'url',
    default: 0,
    message: 'Vilken URL vill du testa?',
    choices: [
      `http://localhost:${PORT ?? ''}`,
      'https://ekorre.esek.se',
      otherOption,
    ]
  });

  if (url === otherOption) {
    const { otherUrl } = await inquirer.prompt<{ otherUrl: string }>({
      name: 'otherUrl',
      type: 'input',
      message: 'Skriv in URL:en du vill benchmarka'
    });
    return otherUrl;
  }
  return url;
};

const selectBenchmarkOptions = async () => {
  const { threads } = await inquirer.prompt<{ threads: number }>({
    name: 'threads',
    type: 'number',
    default: DEFAULT_THREADS,
    message: 'Antal trådar',
  });
  const { openConnections } = await inquirer.prompt<{ openConnections: number }>({
    name: 'openConnections',
    type: 'number',
    default: DEFAULT_OPEN_CONNECTIONS,
    message: 'Antal öppna HTTP-anslutningar samtidigt',
  });
  const { testTime } = await inquirer.prompt<{ testTime: string }>({
    name: 'testTime',
    type: 'input',
    default: DEFAULT_TEST_TIME,
    message: 'Testduration',
  });

  return {
    threads,
    openConnections,
    testTime,
  };
};

const run = async () => {
  console.log(`För mer information och instruktioner för att skriva egna benchmarks,\nse ${path.join(__dirname, 'README.md')}\n`);

  const script = await selectScript();
  const url = await selectUrl();

  if (!script || !url) {
    process.exit(1);
  }

  const { useDefault } = await inquirer.prompt<{ useDefault: boolean }>({
    type: 'confirm',
    name: 'useDefault',
    default: true,
    message: 'Använd defaultinställningar för benchmark?',
  });

  let command: string;
  if (useDefault) {
    command = `wrk -t${DEFAULT_THREADS} -c${DEFAULT_OPEN_CONNECTIONS} -d${DEFAULT_TEST_TIME} -s ${SCRIPTS_FOLDER}/${script} ${url}`;
  } else {
    const { threads, openConnections, testTime } = await selectBenchmarkOptions();
    command = `wrk -t${threads} -c${openConnections} -d${testTime} -s ${SCRIPTS_FOLDER}/${script} ${url}`;
  }

  console.log(); // For nice empty line
  const spinner = createSpinner('Kör benchmark...', {
    interval: 80,
    frames: [
      ' 🧑⚽️       🧑 ',
      '🧑  ⚽️      🧑 ',
      '🧑   ⚽️     🧑 ',
      '🧑    ⚽️    🧑 ',
      '🧑     ⚽️   🧑 ',
      '🧑      ⚽️  🧑 ',
      '🧑       ⚽️🧑  ',
      '🧑      ⚽️  🧑 ',
      '🧑     ⚽️   🧑 ',
      '🧑    ⚽️    🧑 ',
      '🧑   ⚽️     🧑 ',
      '🧑  ⚽️      🧑 '
    ]}).start();

  exec(command, (err, stdout) => {
    if (err != null) {
      spinner.error({ text: 'Fasen, något sket sig...' });
      console.error(err);
      console.log(`Något gick fel. Är wrk installerat, och är ${url} uppe?`);
    } else {
      spinner.success({ text: 'Fääääääärdig!' });
      console.log(`\n*** RESULTAT FÖR ${script} ***`);
      console.log(stdout);
    }
  });
};

run();
