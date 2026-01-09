/**
 * 将字符串转换为驼峰命名 (camelCase)
 * @param str 输入字符串
 * @param separator 分隔符正则，默认为 [-_]
 */
export function toCamelCase(str: string, separator: RegExp = /[-_]/): string {
  return str
    .split(separator)
    .map((word, i) =>
      i === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('')
}
