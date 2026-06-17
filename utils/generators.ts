let _last = 0
let _seq = 0

export const genId = (): string => {
  const now = Date.now()
  _seq = now === _last ? _seq + 1 : 0
  _last = now
  return now.toString(18)
}

let _c = 0
export const gen = (n: number): string => ((++_c % n) * 1000).toString(36)
