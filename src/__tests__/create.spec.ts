import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mkTempDir } from './helper.js'
import childProcess from 'node:child_process'

vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  select: vi.fn(),
}))

import { createAction } from '../commands/create.js'
import { input, select } from '@inquirer/prompts'
import { BranchType } from '../utils/branch.js'
import { format } from 'date-fns'
import { toCamelCase } from '../utils/string.js'

describe('create', () => {
  let local
  let remote
  let projectName: string
  beforeEach(() => {
    local = mkTempDir()
    remote = mkTempDir()
    projectName = toCamelCase(local.split('/').pop()!)
    childProcess.execSync(`git init --bare ${remote}`, { stdio: 'inherit' })
    childProcess.execSync(`git clone ${remote} ${local}`, { stdio: 'inherit' })
    process.chdir(local)
    // TODO: 要保证目标仓库已经完成初始化，并且至少有了main分支
    childProcess.execSync(`git config user.name "xyz"`)
    childProcess.execSync(`git config user.email "xyz@example.com"`)
    childProcess.execSync(`git commit --allow-empty -m "feat: init"`)
    childProcess.execSync(`git push -u origin main`)
    console.log('local', local)
    console.log('remote', remote)
  })

  it('should create a new feature branch', async () => {
    const date = format(new Date(), 'yyyyMMdd')
    const reqNo = 'QZ-1314'
    vi.mocked(select).mockResolvedValue(BranchType.FEATURE)
    // https://vitest.dev/api/mock.html#mockresolvedvalueonce
    vi.mocked(input)
      .mockResolvedValueOnce(date)
      // 第二次调用
      .mockResolvedValueOnce(reqNo)

    await createAction()
    const branches = childProcess.execSync(`git branch -a`).toString()
    console.log('branches', branches)
    // local branch created
    expect(branches).toContain(`feat/xyz-${date}-${reqNo}`)
    // remote branch created
    expect(branches).toContain(`remotes/origin/feat/xyz-${date}-${reqNo}`)
  })
  it('should create a new dev branch', async () => {
    const date = format(new Date(), 'yyyyMMdd')

    vi.mocked(select).mockResolvedValue(BranchType.DEV)
    vi.mocked(input).mockResolvedValueOnce(date)

    await createAction()
    const branches = childProcess.execSync(`git branch -a`).toString()
    expect(branches).toContain(`remotes/origin/${projectName}-DEV-${date}`)
  })
})
