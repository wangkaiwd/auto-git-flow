import { input, select } from '@inquirer/prompts'
import { format } from 'date-fns'
import {
  checkClean,
  fetchRemote,
  getBranches,
  getUserName,
  checkout,
  push,
  getCurrentBranch,
} from '../utils/git.js'
import { getLatestRelease, REQ_NO_REGEX, BranchType } from '../utils/branch.js'
import { logger } from '../utils/ui.js'

interface CreateConfig {
  type: BranchType
  baseBranch: string
  project: string
  date: string
  reqNo?: string | undefined
}

async function getCreateConfig(forcedType?: BranchType): Promise<CreateConfig> {
  const originalBranch = await getCurrentBranch()
  const branches = await getBranches()
  const latestRelease = getLatestRelease(branches)
  const baseBranch = latestRelease?.name || originalBranch

  logger.info(`当前分支: ${originalBranch}`)
  if (latestRelease) {
    logger.info(`基准分支: ${latestRelease.name}`)
  } else {
    // TODO: Is this logic correctly ?
    logger.warn('未找到 Release 分支，将以当前分支为基准')
  }

  const type =
    forcedType ||
    (await select({
      message: '请选择要创建的分支类型:',
      choices: [
        { name: 'Feature (特性开发)', value: BranchType.FEATURE },
        { name: 'Dev (测试环境)', value: BranchType.DEV },
        { name: 'Release (生产环境)', value: BranchType.RELEASE },
      ],
    }))

  const today = format(new Date(), 'yyyyMMdd')

  const dateInput = await input({
    message: `请输入日期 (格式: YYYYMMDD, 默认: ${today}):`,
    default: today,
    validate: (value) => {
      if (!/^\d{8}$/.test(value)) return '❌ 格式错误: 请输入8位数字日期'
      if (value < today)
        return `❌ 日期过早: 日期必须大于或等于当前日期 (${today})`
      return true
    },
  })

  let project = latestRelease?.project || ''
  if (type !== BranchType.FEATURE && !project) {
    project = await input({
      message: '请输入项目名称:',
      validate: (v) => (v.trim() ? true : '❌ 项目名称不能为空'),
    })
  }

  let reqNo
  if (type === BranchType.FEATURE) {
    reqNo = await input({
      message: '请输入需求编号 (例如 QZ-8848):',
      validate: (input) =>
        REQ_NO_REGEX.test(input) ||
        '❌ 格式错误: 需求编号必须为 QZ 后接4-8位数字 (如 QZ-8848)',
    })
  }

  return { type, baseBranch, project, date: dateInput, reqNo }
}

export async function createAction(arg?: BranchType | any) {
  // Commander passes the Command object if no args are defined, so we need to filter that out
  const forcedType = typeof arg === 'string' ? (arg as BranchType) : undefined
  try {
    logger.header('创建分支')
    await checkClean()
    await fetchRemote()

    const originalBranch = await getCurrentBranch()
    const config = await getCreateConfig(forcedType)
    const { type, baseBranch, project, date, reqNo } = config

    let branchName: string
    if (type === BranchType.FEATURE) {
      const user = await getUserName()
      branchName = `feat/${user}-${date}-${reqNo}`
    } else {
      branchName = `${project}-${type}-${date}`
    }

    logger.step(`正在从 ${baseBranch} 创建 ${branchName}...`)
    await checkout(branchName, true, baseBranch)
    await push(branchName)
    logger.done()

    if (type === BranchType.FEATURE) {
      logger.success(
        `分支 ${branchName} 创建成功并已推送到远程，已切换至该分支`
      )
    } else {
      logger.success(`分支 ${branchName} 创建成功并已推送到远程`)
      // 非特性分支创建后切回原分支
      if (originalBranch !== (await getCurrentBranch())) {
        logger.dimRaw(`正在切回原分支 ${originalBranch}...`)
        await checkout(originalBranch)
        logger.done()
      }
    }

    logger.footer()
  } catch (err: any) {
    logger.errorRaw(err.message)
    logger.footer()
  }
}
