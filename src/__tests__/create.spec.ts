import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mkTempDir } from './helper.js'
import childProcess, { type ExecSyncOptions } from 'node:child_process'

vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  select: vi.fn(),
}))

import { createAction } from '../commands/create.js'
import { input, select } from '@inquirer/prompts'
import { BranchType } from '../utils/branch.js'
import { format, parse, subDays } from 'date-fns'
import { resetGitInstance } from '../utils/git.js'
import { afterEach } from 'node:test'

const execOptions: ExecSyncOptions = {
  stdio: 'inherit',
}

describe('create', () => {
  let local: string
  let remote: string
  beforeEach(() => {
    resetGitInstance()
    local = mkTempDir()
    remote = mkTempDir()
    childProcess.execSync(`git init --bare ${remote}`, execOptions)
    childProcess.execSync(`git clone ${remote} ${local}`, execOptions)
    process.chdir(local)
    // TODO: 要保证目标仓库已经完成初始化，并且至少有了main分支
    childProcess.execSync(`git config user.name "xyz"`, execOptions)
    childProcess.execSync(
      `git config user.email "xyz@example.com"`,
      execOptions
    )
    childProcess.execSync(
      `git commit --allow-empty -m "feat: init"`,
      execOptions
    )
    childProcess.execSync(`git push -u origin main`, execOptions)
    console.log('local', local)
    console.log('remote', remote)
  })

  afterEach(() => {
    resetGitInstance()
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

  it('should create a new dev branch without project name', async () => {
    const date = format(new Date(), 'yyyyMMdd')
    const projectName = 'myProject'

    vi.mocked(select).mockResolvedValue(BranchType.DEV)
    vi.mocked(input)
      .mockResolvedValueOnce(date)
      .mockResolvedValueOnce(projectName)

    await createAction()
    const branches = childProcess.execSync(`git branch -a`).toString()
    expect(branches).toContain(`remotes/origin/${projectName}-DEV-${date}`)
  })

  it('should create a new dev branch with project name', async () => {
    const date = format(new Date(), 'yyyyMMdd')
    const parsedDate = parse(date, 'yyyyMMdd', new Date())
    const baseBranchDate = format(subDays(parsedDate, 3), 'yyyyMMdd')
    const projectName = 'myProject'

    childProcess.execSync(
      `git push -u origin HEAD:${projectName}-RELEASE-${baseBranchDate}`,
      execOptions
    )
    vi.mocked(select).mockResolvedValue(BranchType.DEV)
    vi.mocked(input).mockResolvedValueOnce(date)

    await createAction()

    const branches = childProcess.execSync(`git branch -a`).toString()
    expect(branches).toContain(`remotes/origin/${projectName}-DEV-${date}`)
  })

  it('should create a new release branch without project name', async () => {
    const date = format(new Date(), 'yyyyMMdd')
    const projectName = 'myProject'

    vi.mocked(select).mockResolvedValue(BranchType.RELEASE)
    vi.mocked(input)
      .mockResolvedValueOnce(date)
      .mockResolvedValueOnce(projectName)

    await createAction()
    const branches = childProcess.execSync(`git branch -a`).toString()
    expect(branches).toContain(`remotes/origin/${projectName}-RELEASE-${date}`)
  })

  it('should create a new release branch with project name', async () => {
    const date = format(new Date(), 'yyyyMMdd')
    const parsedDate = parse(date, 'yyyyMMdd', new Date())
    const baseBranchDate = format(subDays(parsedDate, 3), 'yyyyMMdd')
    const projectName = 'myProject'

    childProcess.execSync(
      `git push -u origin HEAD:${projectName}-RELEASE-${baseBranchDate}`,
      execOptions
    )
    vi.mocked(select).mockResolvedValue(BranchType.RELEASE)
    vi.mocked(input).mockResolvedValueOnce(date)

    await createAction()

    const branches = childProcess.execSync(`git branch -a`).toString()
    expect(branches).toContain(`remotes/origin/${projectName}-RELEASE-${date}`)
  })
})
