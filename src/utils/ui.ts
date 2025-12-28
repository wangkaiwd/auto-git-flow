import chalk from 'chalk';

const PREFIX = chalk.gray('│');

export const logger = {
  header: (title: string) => {
    console.log(`\n${chalk.bgCyan.black.bold(' GIT-FLOW ')} ${chalk.cyan.bold(title)}`);
    console.log(PREFIX);
  },
  info: (msg: string) => console.log(`${PREFIX} ${chalk.blue('ℹ')} ${msg}`),
  step: (msg: string) => {
    process.stdout.write(`${PREFIX} ${chalk.yellow('➜')} ${msg}`);
  },
  success: (msg: string) => console.log(`${PREFIX} ${chalk.green('✔')} ${msg}`),
  done: () => {
    process.stdout.write(chalk.green(' [OK]\n'));
  },
  warn: (msg: string) => console.log(`${PREFIX} ${chalk.yellow('⚠')} ${msg}`),
  error: (msg: string) => console.error(`${PREFIX} ${chalk.red('✘')} ${msg}`),
  errorRaw: (msg: string) => console.error(`${PREFIX} ${chalk.red(msg)}`),
  dim: (msg: string) => console.log(`${PREFIX} ${chalk.gray(msg)}`),
  dimRaw: (msg: string) => {
    process.stdout.write(`${PREFIX} ${chalk.gray(msg)}`);
  },
  footer: () => console.log(PREFIX + '\n'),
};
