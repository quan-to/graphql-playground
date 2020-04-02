export interface QRSMessage {
  name: MessageType
  payload: any
}

export enum MessageType {
  Error = 'error',
  Log = 'log',
  Sign = 'sign',
  Encrypt = 'encrypt',
  Decrypt = 'decrypt',
  AddPrivateKey = 'addPrivateKey',
  UnlockKey = 'unlockKey',
  ListPrivateKeys = 'listKeys',
  LoadPrivateKey = 'loadPrivateKey',
  LoadPrivateKeyResult = 'loadPrivateKeyResult',
}

export interface KeyInfo {
  FingerPrint: string
  Identifier: string
  Bits: number
  ContainsPrivateKey: boolean
  PrivateKeyIsDecrypted: boolean
}

export type MessageCallback = (name, payload) => any
export type PrivateKeysCallback = (
  keys: KeyInfo[],
  error: Error | void | null,
) => void
export type UnlockKeyCallback = (status: string, error: Error) => void
export type SignCallback = (signedData: string, error: Error) => void

export let FingerPrintHeaderName: string

FingerPrintHeaderName = '___qrs_sign_by___'
