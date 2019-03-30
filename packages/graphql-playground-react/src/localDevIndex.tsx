import * as React from 'react'
import * as ReactDOM from 'react-dom'
import MiddlewareApp from './components/MiddlewareApp'
import './index.css'
// import { Tab } from './state/sessions/reducers'
import { LinkCreatorProps } from './state/sessions/fetchingSagas'
import { ApolloLink } from 'apollo-link'
import { HttpLink } from 'apollo-link-http'
import { FingerPrintHeaderName } from './qrs/models'
import { SignPromise } from './qrs/qrs'
// import { exampleSchema } from './fixtures/exampleSchema'

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
  if (init) {
    const { headers } = init
    if (headers) {
      const signBy = headers[FingerPrintHeaderName]
      if (signBy && signBy !== 'none') {
        const dBody = JSON.parse(`${init.body || {}}`)
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
