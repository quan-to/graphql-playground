import * as React from 'react'
import * as ReactDOM from 'react-dom'
import './index.css'
import {
  GetPrivateKeys,
  RegisterEvent,
  SendQRSMessage,
  UnlockKey,
  Sign,
  SignPromise,
  RequestKeyUnlock,
  // UnlockKeyPromise,
} from './qrs/qrs'
import { ApolloLink } from 'apollo-link'
import { FingerPrintHeaderName } from './qrs/models'
import { LinkCreatorProps } from './state/sessions/fetchingSagas'
import { HttpLink } from 'apollo-link-http'
import MiddlewareApp from './components/MiddlewareApp'

if (process.env.NODE_ENV !== 'production') {
  /* tslint:disable-next-line */
  // const { whyDidYouUpdate } = require('why-did-you-update')
  // whyDidYouUpdate(React)
}

/* tslint:disable-next-line */
;(window as any)['GraphQLPlayground'] = {
  init(element: HTMLElement, options) {
    ReactDOM.render(
      <MiddlewareApp
        setTitle={true}
        showNewWorkspace={false}
        {...options}
        // config={config}
        // configString={configString}
        // codeTheme={lightEditorColours}
        // tabs={tabs}
        createApolloLink={customLinkCreator}
        // schema={exampleSchema}
      />,
      element,
    )
  },
}

const customSignFetch = async (
  input?: Request | string,
  init?: RequestInit,
) => {
  let signBy: string | null = null
  try {
    if (init) {
      const { headers, body } = init
      if (headers) {
        signBy = headers[FingerPrintHeaderName]
        if (signBy && signBy !== 'none') {
          const dBody = JSON.parse(`${body || '{}'}`)
          dBody._timestamp = Date.now()
          dBody._timeUniqueId = 'huebr'
          const newBody = JSON.stringify(dBody)
          headers['signature'] = `${await SignPromise(signBy, newBody)}`
          init.body = newBody
        }
        delete headers[FingerPrintHeaderName]
      }
    }

    return fetch(input, init)
  } catch (e) {
    if (
      `${e}`.indexOf('is not decrypt') !== -1 &&
      signBy !== null &&
      init &&
      init.headers
    ) {
      RequestKeyUnlock(signBy)
    }
    throw e
  }
}

const customLinkCreator = (
  session: LinkCreatorProps,
  wsEndpoint?: string,
): { link: ApolloLink } => {
  const { headers, credentials } = session

  const link = new HttpLink({
    uri: session.endpoint,
    fetch: customSignFetch,
    headers,
    credentials,
  })

  return { link }
}
;(window as any)['QRS'] = {
  GetPrivateKeys,
  RegisterEvent,
  SendQRSMessage,
  UnlockKey,
  Sign,
  RequestKeyUnlock,
}
