import { exec } from 'child_process';
import fs from 'fs';
import inquirer from 'inquirer';
import path from 'path';

const SCRIPTS_FOLDER = path.join(__dirname, './scripts');
const PORT = 3001;

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
