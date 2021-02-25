import { PrivateKeysCallback, UnlockKeyCallback, SignCallback } from './models'

// import * as openpgp from 'openpgp'
declare var openpgp: any // Loaded in html

const loadedKeys: any[] = []

const getLoadedKey = (fingerprint: string): any => {
  const keys = loadedKeys
    .map(k => (getKeyFingerprint(k) === fingerprint ? k : null))
    .filter(k => k !== null)

  if (!keys.length) {
    return null
  }

  const [key] = keys
  return key
}

/**
 * Loads a private key from ASCII Armored format and unlocks it with the specified password
 *
 * @param key The ASCII Armored Private Key
 * @param password Password to unlock the key
 */
export const loadPrivateKey = async (
  key: string,
  password: string | null,
): Promise<any> => {
  const { err, keys } = await openpgp.key.readArmored(key)
  if (err && err.length) {
    throw err[0]
  }
  const [privateKey] = keys
  if (password !== null) {
    await privateKey.decrypt(password)
  }
  return privateKey
}

const getKeyFingerprint = (key: any): string => {
  const fingerprint = key.getFingerprint().toString()
  return fingerprint.toUpperCase().substr(fingerprint.length - 16, 16)
}

/**
 * Converts a PGP Signature to Quanto format
 *
 * @param fingerprint Fingerprint of the key
 * @param hash Hash used in the signature
 * @param gpgSig the PGP Signature
 */
export const gpg2quanto = (
  fingerprint: string,
  hash: string,
  gpgSig: string,
): string => {
  let cutSig = ''
  let save = false
  const fp = fingerprint.toUpperCase().substr(fingerprint.length - 16, 16)
  const lines = gpgSig
    .trim()
    .replace('\r', '')
    .split('\n')

  for (let i = 1; i < lines.length - 1; i++) {
    const line = lines[i].trim()
    if (!save) {
      // Wait for first empty line
      if (line.length === 0) {
        save = true
      }
    } else {
      cutSig += line
    }
  }

  return `${fp}_${hash.toUpperCase()}_${cutSig}`
}

/**
 * Signs the data with the specified key and returns a PGP Signature
 *
 * @param key a pre-loaded and unlocked OpenPGP.js private key
 * @param data the data to be signed
 */
export const signData = async (key: any, data: string): Promise<string> => {
  const { signature: detachedSignature } = await openpgp.sign({
    message: openpgp.cleartext.fromText(data),
    privateKeys: [key],
    detached: true,
  })

  return gpg2quanto(getKeyFingerprint(key), 'SHA512', detachedSignature)
}

async function openFile() {
  return new Promise((resolve, reject) => {
    const readFile = e => {
      const file = e.target.files[0]
      if (!file) {
        reject('no file selected')
        return
      }
      const reader = new FileReader()
      reader.onload = e => {
        // @ts-ignore
        const contents = e.target.result
        document.body.removeChild(fileInput)
        resolve(contents)
      }
      reader.readAsText(file)
    }
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.style.display = 'none'
    fileInput.onchange = readFile
    document.body.appendChild(fileInput)
    fileInput.click()
  })
}

async function LoadKeyFromComputer() {
  let fileData
  try {
    fileData = await openFile()
  } catch (e) {
    // Eat error, no file selected
  }
  if (fileData) {
    const key = await loadPrivateKey(fileData, null)
    if (
      !loadedKeys
        .map(k => getKeyFingerprint(k))
        .filter(fp => fp === getKeyFingerprint(key)).length
    ) {
      loadedKeys.push(key)
    }
    if (onKeyRefreshCallback) {
      onKeyRefreshCallback()
    }
  }
}

function GetPrivateKeys(callback: PrivateKeysCallback) {
  const k = loadedKeys.map((k: any) => {
    let identifier = ''
    if (k.users.length) {
      const { name, email } = k.users[0].userId
      identifier = `${name} <${email}>`
    }
    return {
      FingerPrint: getKeyFingerprint(k),
      Identifier: identifier,
      ContainsPrivateKey: k.isPrivate(),
      PrivateKeyIsDecrypted: k.isDecrypted(),
      Bits: k.getAlgorithmInfo().bits,
    }
  })
  callback(k, null)
}

function UnlockKey(
  fingerprint: string,
  password: string,
  callback: UnlockKeyCallback,
) {
  const key = getLoadedKey(fingerprint)
  if (!key) {
    return callback('', new Error(`no such key ${fingerprint}`))
  }

  if (key.isDecrypted()) {
    return callback('ok', null)
  }

  key
    .decrypt(password)
    .then(() => {
      callback('ok', null)
    })
    .catch(err => {
      callback('error', err)
    })
}

function Sign(fingerprint: string, data: string, callback: SignCallback) {
  const key = getLoadedKey(fingerprint)
  if (!key) {
    return callback('', new Error(`no such key ${fingerprint}`))
  }

  signData(key, data)
    .then((signature: string) => callback(signature, null))
    .catch(err => callback('', err))
}

async function SignPromise(fingerPrint: string, data: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    Sign(fingerPrint, data, (signedData: string, error: Error) => {
      if (error) {
        reject(error)
      } else {
        resolve(signedData)
      }
    })
  })
}

function RegisterEvents(cb) {
  // Nothing to to do right now
  cb()
}

let onKeyRefreshCallback: (() => void) | null
let onKeyRequestUnlockCallback: ((fingerprint: string) => void) | null

function isKeyUnlocked(fingerprint: string): boolean {
  const key = getLoadedKey(fingerprint)
  if (key === null) {
    throw new Error(`No such key ${fingerprint}`)
  }

  return key.isDecrypted()
}

function SetOnKeyRefreshCallback(cb: () => void) {
  onKeyRefreshCallback = cb
}

function SetOnKeyRequestCallback(cb: (fingerprint: string) => void) {
  onKeyRequestUnlockCallback = cb
}

function RequestKeyUnlock(fingerprint: string) {
  if (onKeyRequestUnlockCallback) {
    onKeyRequestUnlockCallback(fingerprint)
  }
}

export {
  GetPrivateKeys,
  RegisterEvents,
  UnlockKey,
  Sign,
  SignPromise,
  SetOnKeyRefreshCallback,
  isKeyUnlocked,
  LoadKeyFromComputer,
  RequestKeyUnlock,
  SetOnKeyRequestCallback,
}
