import {
  checkClean,
  fetchRemote,
  getBranches,
  getCurrentBranch,
  checkout,
  merge,
  push,
  pullBranch,
  isBranchBehind,
} from '../utils/git.js'
import { getLatestRelease, parseBranch, BranchType } from '../utils/branch.js'
import { logger } from '../utils/ui.js'

export async function syncAction() {
  const currentBranch = await getCurrentBranch()

  try {
    await checkClean()
    logger.header('同步基准分支')
    await fetchRemote()

    const currentInfo = parseBranch(currentBranch)
    if (!currentInfo || currentInfo.type !== BranchType.FEATURE) {
      throw new Error('禁止操作：请先切换到 Feature 分支再执行同步。')
    }

    logger.info(`当前分支: ${currentBranch}`)

    const branches = await getBranches()
    const baseBranch = getLatestRelease(branches)

    if (!baseBranch) {
      throw new Error('未找到可用的 Release 基准分支。')
    }

    logger.info(`基准分支: ${baseBranch.name}`)

    logger.step('正在拉取远程代码...')
    await pullBranch(baseBranch.name)
    await pullBranch(currentBranch)
    logger.done()

    const isBehind = await isBranchBehind(currentBranch, baseBranch.name)

    if (!isBehind) {
      logger.success(
        `当前分支 ${currentBranch} 已包含 ${baseBranch.name} 的所有提交，无需同步。`
      )
      logger.footer()
      return
    }

    logger.step(`正在合并 ${baseBranch.name} -> ${currentBranch}...`)
    await checkout(currentBranch)
    await merge(currentBranch, baseBranch.name)
    logger.done()

    logger.step('正在推送到远程...')
    await push(currentBranch)
    logger.done()

    logger.success(
      `成功！${baseBranch.name} 已合并至 ${currentBranch} 并推送到 origin。`
    )
    logger.footer()
  } catch (err: any) {
    logger.errorRaw(err.message)
    const nowBranch = await getCurrentBranch()
    if (nowBranch !== currentBranch) {
      logger.warn(
        `流程中断，由于代码冲突或其他错误，请手动处理后切回 ${currentBranch}。`
      )
    }
    logger.footer()
  }
}
