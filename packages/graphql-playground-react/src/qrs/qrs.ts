import {
  MessageType,
  QRSMessage,
  MessageCallback,
  PrivateKeysCallback,
  UnlockKeyCallback,
  SignCallback,
} from './models'

export let needKeyUnlock: string | boolean

needKeyUnlock = false

let onNeedKeyUnlock: (() => void) | null

function SetOnNeedKeyUnlockCallback(cb: () => void) {
  onNeedKeyUnlock = cb
}

function buildQRSMessage(name: MessageType, payload: any): QRSMessage {
  return {
    name,
    payload,
  }
}

// To log on golang side as well
function hookQRSLog() {
  const console = window.console
  const log = console ? console.log : () => {}
  // tslint:disable-next-line:no-console
  console.log('Hooking log function')

  // tslint:disable-next-line
  console.log = function() {
    // @ts-ignore
    log.apply(console, arguments)
    SendQRSMessage(MessageType.Log, arguments, () => {})
  }
}

function SendQRSMessage(type: MessageType, payload: any, cb: MessageCallback) {
  if (typeof astilectron !== 'undefined') {
    astilectron.sendMessage(buildQRSMessage(type, payload), data => {
      data = data || {}
      cb(data.name, data.payload)
    })
  } else {
    cb(MessageType.Error, 'no QRS Available')
  }
}

function GetPrivateKeys(callback: PrivateKeysCallback) {
  SendQRSMessage(MessageType.ListPrivateKeys, {}, (name, payload) =>
    HandleReturn(name, payload, callback),
  )
}

function UnlockKey(
  fingerPrint: string,
  password: string,
  callback: UnlockKeyCallback,
) {
  SendQRSMessage(
    MessageType.UnlockKey,
    {
      fingerPrint,
      password,
    },
    (name, payload) => HandleReturn(name, payload, callback),
  )
}

function UnlockKeyPromise(fingerPrint: string, password: string) {
  return new Promise<string>((resolve, reject) => {
    UnlockKey(fingerPrint, password, (status: string, error: Error) => {
      if (error) {
        reject(error)
      } else {
        resolve(status)
      }
    })
  })
}

function Sign(fingerPrint: string, data: string, callback: SignCallback) {
  SendQRSMessage(
    MessageType.Sign,
    {
      fingerPrint,
      data,
    },
    (name, payload) => HandleReturn(name, payload, callback),
  )
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

function HandleReturn(name, payload, callback) {
  if (name === MessageType.Error) {
    return callback(null, payload)
  }

  return callback(payload)
}

function RegisterEvent(cb) {
  document.addEventListener('astilectron-ready', () => {
    hookQRSLog()
    // tslint:disable-next-line:no-console
    console.log('Astilectron Web is ready')
    astilectron.onMessage(message => {
      // Process message
      if (message === 'hello') {
        return 'world'
      }

      return null
    })

    if (cb) {
      cb()
    }
  })
}

function RequestKeyUnlock(fingerPrint: string | boolean) {
  needKeyUnlock = fingerPrint
  if (onNeedKeyUnlock && fingerPrint !== false) {
    onNeedKeyUnlock()
  }
}

export {
  GetPrivateKeys,
  RegisterEvent,
  SendQRSMessage,
  UnlockKey,
  Sign,
  SignPromise,
  UnlockKeyPromise,
  RequestKeyUnlock,
  SetOnNeedKeyUnlockCallback,
}
