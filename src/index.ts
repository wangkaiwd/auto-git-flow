#!/usr/bin/env node
import { Command } from 'commander'
import { createRequire } from 'module'
import { createAction } from './commands/create.js'
import { mergeAction } from './commands/merge.js'
import { listAction } from './commands/list.js'
import { syncAction } from './commands/sync.js'

const require = createRequire(import.meta.url)
const { version } = require('../package.json')

const program = new Command()

program
  .name('agf')
  .description('Auto Git Flow CLI - 自动化 Git 分支管理工具')
  .version(version)

program
  .command('create')
  .description('创建新分支 (Release, Dev, Feature)')
  .action(createAction)

program
  .command('merge')
  .description('合并分支 (Safe-Merge 策略)')
  .argument('<target>', '目标环境 (dev 或 release)')
  .action(mergeAction)

program
  .command('list')
  .description('查看最新的 dev 和 release 分支')
  .argument('[count]', '列出的分支个数 (默认 2)', '2')
  .action(listAction)

program
  .command('sync')
  .description('同步基准分支到当前 Feature 分支')
  .action(syncAction)

program.parse()
