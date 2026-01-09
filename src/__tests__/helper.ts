import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

export const mkTempDir = () => {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'auto-git-flow-'))
}
