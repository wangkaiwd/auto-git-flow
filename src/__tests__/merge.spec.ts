import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkTempDir } from './helper.js'
import childProcess, { type ExecSyncOptions } from 'node:child_process'
import { mergeAction } from '../commands/merge.js'
import { confirm, input } from '@inquirer/prompts'
import { add, format } from 'date-fns'
import { resetGitInstance } from '../utils/git.js'

const execOptions: ExecSyncOptions = {
  stdio: 'inherit',
}

vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  input: vi.fn(),
  confirm: vi.fn(),
}))

const createFeatureBranch = () => {
  const today = format(new Date(), 'yyyyMMdd')
  const featBranchName = `feat/xyz-${today}-QZ-3306`
  childProcess.execSync(`git checkout -b ${featBranchName}`, execOptions)
  childProcess.execSync(`git push -u origin HEAD`, execOptions)
  childProcess.execSync(`echo "test file" > a.txt`)
  childProcess.execSync(`git add .`)
  childProcess.execSync(`git commit -m "feat: create test file"`)
  childProcess.execSync(`git push`)
  return featBranchName
}

const createDevBranch = () => {
  const devDate = format(add(new Date(), { days: 2 }), 'yyyyMMdd')
  const devBranchName = `myProject-DEV-${devDate}`
  childProcess.execSync(`git checkout -b ${devBranchName}`, execOptions)
  childProcess.execSync(`git push -u origin HEAD`, execOptions)
  childProcess.execSync(`echo "test file" > b.txt`, execOptions)
  childProcess.execSync(`git add .`, execOptions)
  childProcess.execSync(`git commit -m "feat: add test file b"`, execOptions)
  childProcess.execSync(`git push`, execOptions)
  // 创建完成切换回main分支
  childProcess.execSync(`git checkout main`, execOptions)
  return devBranchName
}

describe('merge', () => {
  beforeEach(() => {
    const local = mkTempDir()
    const remote = mkTempDir()
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

  it('should create new dev branch when can not find closest dev branch', async () => {
    const featBranchName = createFeatureBranch()
    const devDate = format(add(new Date(), { days: 2 }), 'yyyyMMdd')
    const projectName = 'myProject'
    vi.mocked(input)
      .mockResolvedValueOnce(devDate)
      .mockResolvedValueOnce(projectName)
    vi.mocked(confirm).mockResolvedValue(true)
    // 1. 合并当前feature到 dev
    // 2. 发现没有 dev
    // 3. 基于基准分支创建 dev
    // 4. 发现没有基准分支
    // 5. 要通过当前分支创建？
    // 6. 输入日期
    // 7. 没有项目名，要输入项目名
    await mergeAction('dev')
    const branches = childProcess.execSync(`git branch -a`).toString()
    // 成功创建dev分支
    expect(branches).toContain(`${projectName}-DEV-${devDate}`)
    // 确保合并成功
    const mergedBranches = childProcess.execSync(
      `git branch --merged ${projectName}-DEV-${devDate}`,
      { encoding: 'utf-8' }
    )
    expect(mergedBranches).toContain(featBranchName)
  })
  it('should merge to closest dev branch', async () => {
    const closestDevBranchName = createDevBranch()
    const featBranchName = createFeatureBranch()

    await mergeAction('dev')
    const mergedBranches = childProcess.execSync(
      `git branch --merged ${closestDevBranchName}`,
      { encoding: 'utf-8' }
    )
    expect(mergedBranches).toContain(featBranchName)
  })
})
