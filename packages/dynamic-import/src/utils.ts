import fs from 'fs'
import path from 'path'

export const DEFAULT_EXTENSIONS = [
  '.mjs',
  '.js',
  '.ts',
  '.jsx',
  '.tsx',
  '.json',
  '.vue'
]

export function isCommonjs(code: string) {
  return /\b(?:require|module|exports)\b/.test(code)
}

/**
 * { vue: true, type: 'template', 'lang.js': true }
 * { vue: true, type: 'style', index: '0', 'lang.less': true }
 * { vue: true, type: 'style', index: '0', scoped: 'true', 'lang.css': true }
 */
export function parsePathQuery(querystring: string): Record<string, string | boolean> {
  const [url, query] = querystring.split('?')
  try {
    const dict: Record<string, string | boolean> = [...new URLSearchParams(query).entries()].reduce((acc, [k, v]) => (
      { ...acc, [k]: v === '' ? true : v }
    ), { url, query })
    const { index, ...omit } = dict
    return omit
  } catch (error) {
    return {
      _error: error,
    }
  }
}

export interface FileExistOptions {
  exist?: boolean
  /** 外部传入时，内部节查找时间 */
  isDirectory?: boolean
  /** filepath 为相对路径时需要 cwd */
  cwd?: string
  extensions?: string[]
}
export interface FileExistStat {
  ext: string
  /**
   * tail === 'index' + ext : 目录
   * tail === ext           : 缺少尾缀
   * tail === ''            : filename 存在
   */
  tail: string
  filename: string
}
/**
 * 依次根据文件尾缀检测文件是否存在
 * @param filepath 绝对路径，或相对路径；相对路径时需要 cwd
 * @param options FileExistOptions
 * @returns FileExistStat | void
 */
export function detectFileExist(filepath: string, options: FileExistOptions = {}): FileExistStat | void {
  const extensions = options.extensions ?? DEFAULT_EXTENSIONS
  if (typeof options.cwd === 'string') { filepath = path.join(options.cwd, filepath) }

  // detect is a directory
  const exist = typeof options.exist === 'boolean' ? options.exist : fs.existsSync(filepath)
  const isDirectory = exist
    ? (typeof options.isDirectory === 'boolean' ? options.isDirectory : fs.statSync(filepath).isDirectory())
    : void 0

  // ddetect is a file
  let ext: string
  let tail: string
  if (exist) {
    if (isDirectory) {
      ext = extensions.find(element => fs.existsSync(path.join(filepath, 'index') + element))
      tail = 'index' + ext
    } else {
      ext = extensions.find(element => filepath.endsWith(element))
      tail = ''
    }
  } else {
    ext = extensions.find(element => fs.existsSync(filepath + element))
    tail = ext
  }

  return ext
    ? ({
      ext,
      tail,
      filename: detectFileExist.join(filepath, { ext, tail, filename: '' }),
    })
    : void 0
}
detectFileExist.join = function (filepath: string, stat: FileExistStat) {
  if (stat.tail.includes('index')) {
    return path.join(filepath, stat.tail)
  }
  if (stat.tail === stat.ext) {
    return filepath + stat.tail
  }
  // stat.tail === ''
  return filepath
}

/**
 * Console log
 * @param arg0 
 */
export const message = {
  info(arg0: {
    plugin: string
    error: string
    filename: string
  }) {
    console.log(`
    Plugin: ${arg0.plugin}
    File: ${arg0.filename}
    ${arg0.error}
  `)
  },
}

// ------------------------------------- interface -------------------------------------

export interface BaseOptions {
  extensions?: string[]
  catch?: (error: Error, ext: { filename: string;[k: string]: any; }) => void
}
