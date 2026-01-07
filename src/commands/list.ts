import Table from 'cli-table3'
import chalk from 'chalk'
import { getBranches, fetchRemote } from '../utils/git.js'
import {
  BranchType,
  getLatestBranches,
  type BranchInfo,
} from '../utils/branch.js'
import { format } from 'date-fns'
import { logger } from '../utils/ui.js'

export async function listAction(count: string) {
  try {
    await fetchRemote()
    const branches = await getBranches()

    const limit = parseInt(count, 10)
    const latestRelease = getLatestBranches(branches, BranchType.RELEASE, limit)
    const latestDev = getLatestBranches(branches, BranchType.DEV, limit)

    logger.header(`分支列表 (Latest ${limit})`)

    const table = new Table({
      head: [
        chalk.cyan('Type'),
        chalk.cyan('Branch Name'),
        chalk.cyan('Date'),
        chalk.cyan('Project'),
      ],
      style: {
        head: [],
        border: [],
      },
    })

    const addRows = (
      branchInfos: BranchInfo[],
      typeName: string,
      color: (s: string) => string
    ) => {
      branchInfos.forEach((info) => {
        table.push([
          color(typeName),
          info.name,
          info.date ? format(info.date, 'yyyy-MM-dd') : '-',
          info.project || '-',
        ])
      })
    }

    addRows(latestRelease, 'Release', chalk.green)
    addRows(latestDev, 'Dev', chalk.yellow)

    if (table.length === 0) {
      logger.warn('未发现符合规范的 dev 或 release 分支。')
      logger.footer()
      return
    }

    console.log(table.toString())
    logger.footer()
  } catch (error: any) {
    logger.errorRaw(`获取分支列表失败: ${error.message}`)
    logger.footer()
  }
}
