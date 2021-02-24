export interface KeyInfo {
  FingerPrint: string
  Identifier: string
  Bits: number
  ContainsPrivateKey: boolean
  PrivateKeyIsDecrypted: boolean
}

export type PrivateKeysCallback = (
  keys: KeyInfo[],
  error: Error | void | null,
) => void
export type UnlockKeyCallback = (
  status: string,
  error: Error | void | null,
) => void
export type SignCallback = (
  signedData: string,
  error: Error | void | null,
) => void

export let FingerPrintHeaderName: string

FingerPrintHeaderName = '___qrs_sign_by___'
