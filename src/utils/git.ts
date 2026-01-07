import { simpleGit, type SimpleGit } from 'simple-git'
import chalk from 'chalk'

const git: SimpleGit = simpleGit()

export async function checkClean() {
  const status = await git.status()
  if (!status.isClean()) {
    throw new Error('❌ 工作区有未提交的代码，请先 Commit 或 Stash。')
  }
}

export async function getUserName(): Promise<string> {
  const name = await git.getConfig('user.name')
  if (!name.value) {
    throw new Error('❌ 获取不到用户名，请执行 git config user.name 配置。')
  }
  return name.value
}

export async function fetchRemote() {
  console.log(chalk.gray('正在拉取远程最新分支列表...'))
  await git.fetch(['--prune'])
}

export async function getCurrentBranch(): Promise<string> {
  const branchInfo = await git.branch()
  return branchInfo.current
}

export async function checkout(
  branch: string,
  create = false,
  startPoint?: string
) {
  if (create) {
    if (startPoint) {
      await git.checkout(['-b', branch, startPoint])
    } else {
      await git.checkoutLocalBranch(branch)
    }
  } else {
    await git.checkout(branch)
  }
}

export async function merge(target: string, source: string) {
  try {
    await git.merge([source])
  } catch (err: any) {
    console.error(err)
    throw new Error(
      `⚠️ 发生代码冲突！从 ${source} 合并到 ${target} 失败。\n请手动解决冲突文件并提交，然后切换回原分支。`
    )
  }
}

export async function push(branch: string) {
  await git.push(['-u', 'origin', branch])
}

export async function pullBranch(branch: string) {
  const branches = await git.branch()
  const isLocal = branches.all.includes(branch)

  if (!isLocal) {
    // Check if remote exists
    const remoteExists = branches.all.includes(`remotes/origin/${branch}`)
    if (remoteExists) {
      console.log(chalk.gray(`正在从远程拉取分支 ${branch}...`))
      await git.checkout(['-b', branch, `origin/${branch}`])
    } else {
      throw new Error(`❌ 错误: 远程不存在分支 ${branch}`)
    }
  } else {
    console.log(chalk.gray(`正在更新本地分支 ${branch}...`))
    await git.checkout(branch)
    await git.pull('origin', branch)
  }
}

export async function getBranches() {
  const summary = await git.branch(['-a'])
  return Array.from(
    new Set(summary.all.map((b) => b.replace('remotes/origin/', '')))
  )
}

/**
 * 检查分支 A 是否落后于分支 B
 * @returns true 表示 A 落后于 B（B 有 A 没有的提交）
 */
export async function isBranchBehind(
  branchA: string,
  branchB: string
): Promise<boolean> {
  const result = await git.raw([
    'rev-list',
    '--count',
    `${branchA}..${branchB}`,
  ])
  return parseInt(result.trim(), 10) > 0
}

export { git }
