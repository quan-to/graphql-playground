import * as React from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import GraphQLBinApp from './GraphQLBinApp'

export default class Root extends React.Component<{}, {}> {
  render() {
    return (
      <BrowserRouter>
        <Switch>
          <Route component={GraphQLBinApp} />
        </Switch>
      </BrowserRouter>
    )
  }
}
