import { simpleGit, type SimpleGit } from 'simple-git'
import chalk from 'chalk'
import { toCamelCase } from './string.js'

let _git: SimpleGit | null = null

export function getGit() {
  if (!_git) {
    _git = simpleGit()
  }
  return _git
}

export function resetGitInstance() {
  _git = null
}

export async function checkClean() {
  const status = await getGit().status()
  if (!status.isClean()) {
    throw new Error('❌ 工作区有未提交的代码，请先 Commit 或 Stash。')
  }
}

export async function getUserName(): Promise<string> {
  const name = await getGit().getConfig('user.name')
  if (!name.value) {
    throw new Error('❌ 获取不到用户名，请执行 git config user.name 配置。')
  }
  return name.value
}

export async function fetchRemote() {
  console.log(chalk.gray('正在拉取远程最新分支列表...'))
  await getGit().fetch(['--prune'])
}

export async function getCurrentBranch(): Promise<string> {
  const branchInfo = await getGit().branch()
  // TODO： Why this occur empty string ?
  return branchInfo.current
}

export async function checkout(
  branch: string,
  create = false,
  startPoint?: string
) {
  if (create) {
    if (startPoint) {
      // 始终使用远程分支作为基准
      const branches = await getGit().branch()
      const remoteRef = `remotes/origin/${startPoint}`
      const remoteExists = branches.all.includes(remoteRef)

      if (!remoteExists) {
        throw new Error(`❌ 错误: 远程分支 origin/${startPoint} 不存在`)
      }

      // https://git-scm.com/docs/git-config#Documentation/git-config.txt-branchautoSetupMerge
      // Use --no-track to prevent auto track
      await getGit().checkout([
        '-b',
        branch,
        '--no-track',
        `origin/${startPoint}`,
      ])
    } else {
      await getGit().checkoutLocalBranch(branch)
    }
  } else {
    await getGit().checkout(branch)
  }
}

export async function merge(target: string, source: string) {
  try {
    await getGit().merge([source])
  } catch (err: any) {
    console.error(err)
    throw new Error(
      `⚠️ 发生代码冲突！从 ${source} 合并到 ${target} 失败。\n请手动解决冲突文件并提交，然后切换回原分支。`
    )
  }
}

export async function push(branch: string) {
  await getGit().push(['-u', 'origin', branch])
}

export async function pullBranch(branch: string) {
  const branches = await getGit().branch()
  const isLocal = branches.all.includes(branch)

  if (!isLocal) {
    // Check if remote exists
    const remoteExists = branches.all.includes(`remotes/origin/${branch}`)
    if (remoteExists) {
      console.log(chalk.gray(`正在从远程拉取分支 ${branch}...`))
      await getGit().checkout(['-b', branch, `origin/${branch}`])
    } else {
      throw new Error(`❌ 错误: 远程不存在分支 ${branch}`)
    }
  } else {
    console.log(chalk.gray(`正在更新本地分支 ${branch}...`))
    await getGit().checkout(branch)
    await getGit().pull('origin', branch)
  }
}

export async function getBranches() {
  const summary = await getGit().branch(['-a'])
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
  // 使用远程分支进行比对
  const refA = `origin/${branchA}`
  const refB = `origin/${branchB}`

  const result = await getGit().raw(['rev-list', '--count', `${refA}..${refB}`])
  return parseInt(result.trim(), 10) > 0
}

export async function getRepoName(): Promise<string | null> {
  const remotes = await getGit().getRemotes(true)
  const origin = remotes.find((r) => r.name === 'origin')
  if (!origin?.refs?.fetch) return null

  const url = origin.refs.fetch
  const match =
    url.match(/\/([^/]+?)(?:\.git)?$/) || url.match(/:([^/]+?)(?:\.git)?$/)
  if (!match?.[1]) return null

  return toCamelCase(match[1])
}
