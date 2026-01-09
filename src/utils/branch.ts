import { compareDesc, compareAsc, parse } from 'date-fns'

export enum BranchType {
  RELEASE = 'RELEASE',
  DEV = 'DEV',
  FEATURE = 'FEATURE',
}

export const REQ_NO_REGEX = /^QZ-\d{4,8}$/

export interface BranchInfo {
  name: string
  type: BranchType
  date?: Date
  project?: string
}

export function parseBranch(branchName: string): BranchInfo | null {
  // Release: {project}-RELEASE-{YYYYMMDD}
  const releaseMatch = branchName.match(/^(.+)-RELEASE-(\d{8})$/)
  if (releaseMatch) {
    return {
      name: branchName,
      type: BranchType.RELEASE,
      project: releaseMatch[1]!,
      date: parse(releaseMatch[2]!, 'yyyyMMdd', new Date()),
    }
  }

  // Dev: {project}-DEV-{YYYYMMDD}
  //      {project}-dev-{YYYYMMDD}
  const devMatch = branchName.match(/^(.+)-(?:DEV|dev)-(\d{8})$/)
  if (devMatch) {
    return {
      name: branchName,
      type: BranchType.DEV,
      project: devMatch[1]!,
      date: parse(devMatch[2]!, 'yyyyMMdd', new Date()),
    }
  }

  // Feature: feat/{user}-{date}-{reqNo}
  const featMatch = branchName.match(/^feat\/(.+)-(\d{8})-(QZ-\d{4})$/)
  if (featMatch) {
    return {
      name: branchName,
      type: BranchType.FEATURE,
      date: parse(featMatch[2]!, 'yyyyMMdd', new Date()),
    }
  }

  return null
}

export function getLatestRelease(branches: string[]): BranchInfo | null {
  const releases = branches
    .map(parseBranch)
    .filter((b): b is BranchInfo => b?.type === BranchType.RELEASE)
    .sort((a, b) => compareDesc(a.date!, b.date!))

  return releases[0] || null
}

export function getPreviousRelease(branches: string[]): BranchInfo | null {
  const releases = branches
    .map(parseBranch)
    .filter((b): b is BranchInfo => b?.type === BranchType.RELEASE)
    .sort((a, b) => compareDesc(a.date!, b.date!))

  return releases[1] || null
}

export function getTargetBranch(
  branches: string[],
  type: BranchType
): BranchInfo | null {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()) // Start of today

  const targets = branches
    .map(parseBranch)
    .filter((b): b is BranchInfo => b?.type === type && !!b.date)
    .filter((b) => b.date! >= today) // Only today or future
    .sort((a, b) => compareAsc(a.date!, b.date!))

  return targets[0] || null // Return the earliest one (which is the closest to today)
}
export function getLatestBranches(
  branches: string[],
  type: BranchType,
  limit: number
): BranchInfo[] {
  return branches
    .map(parseBranch)
    .filter((b): b is BranchInfo => b?.type === type)
    .sort((a, b) => compareDesc(a.date!, b.date!))
    .slice(0, limit)
}
