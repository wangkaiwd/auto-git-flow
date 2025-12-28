#!/usr/bin/env node
import { Command } from 'commander';
import { createAction } from './commands/create.js';
import { mergeAction } from './commands/merge.js';
import { listAction } from './commands/list.js';

const program = new Command();

program
  .name('agf')
  .description('Auto Git Flow CLI - 自动化 Git 分支管理工具')
  .version('1.0.0');

program
  .command('create')
  .description('创建新分支 (Release, Dev, Feature)')
  .action(createAction);

program
  .command('merge')
  .description('合并分支 (Safe-Merge 策略)')
  .argument('[target]', '目标环境 (dev 或 release)')
  .action(mergeAction);

program
  .command('list')
  .description('查看最新的 dev 和 release 分支')
  .argument('[count]', '列出的分支个数 (默认 2)', '2')
  .action(listAction);

program.parse();
