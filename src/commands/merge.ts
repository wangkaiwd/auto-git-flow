import { confirm } from '@inquirer/prompts'
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
import {
  getTargetBranch,
  getLatestRelease,
  getPreviousRelease,
  parseBranch,
  BranchType,
  type BranchInfo,
} from '../utils/branch.js'
import { createAction } from './create.js'
import { logger } from '../utils/ui.js'

/**
 * 确保目标分支存在，如果不存在则引导用户创建
 */
async function ensureTargetBranch(type: BranchType): Promise<BranchInfo> {
  await fetchRemote()
  let branches = await getBranches()
  let target = getTargetBranch(branches, type)

  if (!target) {
    logger.warn(`未找到可用的 ${type} 分支（需为今日或未来时间）。`)
    const shouldCreate = await confirm({
      message: `确定要现在创建一个新的 ${type} 分支吗？`,
      default: true,
    })

    if (shouldCreate) {
      await createAction(type)
      await fetchRemote()
      branches = await getBranches()
      target = getTargetBranch(branches, type)
    }
  }

  if (!target) {
    throw new Error(`终止: 未能定位到有效的 ${type} 目标分支。`)
  }

  return target
}

/**
 * 执行同步逻辑：拉取远程最新代码并按需同步基准分支
 */
async function syncAndPrepare(
  target: BranchInfo,
  base: BranchInfo | null,
  feature: string
) {
  logger.step('正在同步远程代码...')
  await pullBranch(target.name)
  if (base) {
    await pullBranch(base.name)
    await pullBranch(feature)
  }
  logger.done()

  if (base) {
    // 1. 检查目标分支是否落后于基准分支
    if (await isBranchBehind(target.name, base.name)) {
      logger.step(`正在同步基准 ${base.name} -> ${target.name}...`)
      await checkout(target.name)
      await merge(target.name, base.name)
      await push(target.name)
      logger.done()
    } else {
      logger.dim(`${target.name} 已包含 ${base.name} 的所有提交，跳过同步`)
    }

    // 2. 检查特性分支是否落后于基准分支
    if (await isBranchBehind(feature, base.name)) {
      logger.step(`检测到 ${feature} 落后于 ${base.name}，正在同步...`)
      await checkout(feature)
      await merge(feature, base.name)
      await push(feature)
      logger.done()
    }
  }
}

export async function mergeAction(targetArg?: string) {
  const originalBranch = await getCurrentBranch()

  try {
    await checkClean()
    logger.header('合并分支')
    await fetchRemote()

    // 1. 语法校验与状态检查
    const currentInfo = parseBranch(originalBranch)
    if (!currentInfo || currentInfo.type !== BranchType.FEATURE) {
      throw new Error('禁止操作：请先切换到 Feature 分支再执行合并。')
    }

    const targetType =
      targetArg === 'dev'
        ? BranchType.DEV
        : targetArg === 'release'
          ? BranchType.RELEASE
          : null

    if (!targetType) {
      throw new Error('错误参数：请指定合并目标 (dev 或 release)。')
    }

    logger.info(`当前分支: ${originalBranch}`)

    // 2. 定位目标与基准
    const targetBranch = await ensureTargetBranch(targetType)
    const branches = await getBranches()
    const baseBranch =
      targetType === BranchType.DEV
        ? getLatestRelease(branches)
        : getPreviousRelease(branches)

    logger.info(
      `目标环境: ${targetBranch.name}${baseBranch ? ` (基准: ${baseBranch.name})` : ''}`
    )

    // 3. 二次确认 (Release)
    if (targetType === BranchType.RELEASE) {
      const isConfirmed = await confirm({
        message: `⚠️ 确定要将特性分支合并到生产环境 ${targetBranch.name} 吗？`,
        default: false,
      })
      if (!isConfirmed) {
        logger.dim('操作已取消。')
        logger.footer()
        return
      }
    }

    // 4. 同步与合并
    await syncAndPrepare(targetBranch, baseBranch, originalBranch)

    logger.step(`正在合并 Feature 到 ${targetBranch.name}...`)
    await checkout(targetBranch.name)
    await merge(targetBranch.name, originalBranch)
    logger.done()

    logger.step('正在推送到远程...')
    await push(targetBranch.name)
    logger.done()

    // 5. 还原
    await checkout(originalBranch)
    logger.success(
      `成功！Feature 已合并至 ${targetBranch.name} 并推送到 origin。`
    )
    logger.dim(`已自动切回 ${originalBranch}`)

    logger.footer()
  } catch (err: any) {
    logger.errorRaw(err.message)
    const nowBranch = await getCurrentBranch()
    if (nowBranch !== originalBranch) {
      logger.warn(
        `流程中断，由于代码冲突或其他错误，请手动处理后切回 ${originalBranch}。`
      )
    }
    logger.footer()
  }
}
