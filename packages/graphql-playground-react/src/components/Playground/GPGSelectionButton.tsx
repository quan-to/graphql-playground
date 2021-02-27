/**
 * Created by Lucas Teske on 02/05/18.
 * @flow
 */

import * as React from 'react'

import { withTheme, styled } from '../../styled'
import { connect } from 'react-redux'
import { editHeaders } from '../../state/sessions/actions'
import { createStructuredSelector } from 'reselect'
import {
  getSelectedSessionIdFromRoot,
  getHeaders,
} from '../../state/sessions/selectors'
import { toJS } from './util/toJS'
import GPGSelectionButtonFingerprint from './GPGSelectionButtonFingerprint'
import {
  GetPrivateKeys,
  LoadKeyFromComputer,
  SetOnKeyRefreshCallback,
  RequestKeyUnlock,
} from '../../qrs/qrs'
import { FingerPrintHeaderName, KeyInfo } from '../../qrs/models'

export interface ReduxProps {
  operations: any[]
  keys: any[]
  sessionId: string
  onGpgKeyChanged: (fingerPrint: string) => void
  editHeaders: any
  getHeaders: any
}

export interface State {
  optionsOpen: boolean
  highlight: any
  availableKeys: KeyInfo[]
  selectedFingerPrint: string
  ignoreChangeEvent: boolean
}

let firstTime = true

class GPGSelectionButton extends React.Component<ReduxProps, State> {
  constructor(props) {
    super(props)

    this.state = {
      optionsOpen: false,
      highlight: null,
      availableKeys: [
        {
          FingerPrint: 'none',
          Identifier: 'None',
          ContainsPrivateKey: true,
          PrivateKeyIsDecrypted: true,
          Bits: 0,
        },
      ],
      selectedFingerPrint: 'none',
      ignoreChangeEvent: false,
    }
  }

  onKeysReceived(keys: KeyInfo[], error: Error | void | null): void {
    if (error) {
      // tslint:disable-next-line:no-console
      console.log(`Error fetching keys: ${error}`)
      return
    }

    if (!keys) {
      // tslint:disable-next-line:no-console
      console.log(`Error: NULL keys`)
      return
    }

    this.setState({
      availableKeys: [
        {
          FingerPrint: 'none',
          Identifier: 'None',
          ContainsPrivateKey: true,
          PrivateKeyIsDecrypted: true,
          Bits: 0,
        },
        ...keys,
      ],
    })
  }

  componentWillMount() {
    GetPrivateKeys((keys, error) => this.onKeysReceived(keys, error))
    const { selectedFingerPrint } = this.state
    const fingerPrint = selectedFingerPrint || 'none'

    let headers = this.props.getHeaders || '{}'
    try {
      if (headers === '') {
        headers = '{}'
      }
      const headObj = JSON.parse(headers)
      if (fingerPrint === 'none') {
        delete headObj[FingerPrintHeaderName]
      } else {
        headObj[FingerPrintHeaderName] = fingerPrint
      }
      this.props.editHeaders(JSON.stringify(headObj, null, 2))
    } catch (e) {
      return
    }
  }

  componentDidMount() {
    this.onOptionSelected('none')
  }

  getKey(fingerPrint: string): KeyInfo {
    const { availableKeys } = this.state
    for (let i = 0; i < availableKeys.length; i++) {
      const key = availableKeys[i]
      if (key.FingerPrint === fingerPrint) {
        return key
      }
    }

    return {
      FingerPrint: 'none',
      Identifier: 'None',
      ContainsPrivateKey: true,
      PrivateKeyIsDecrypted: true,
      Bits: 0,
    }
  }

  componentDidUpdate(prevProps) {
    const { selectedFingerPrint } = this.state
    try {
      const headers = JSON.parse(this.props.getHeaders || '{}')
      if (
        selectedFingerPrint !== 'none' &&
        headers[FingerPrintHeaderName] !== selectedFingerPrint
      ) {
        // this.onOptionSelected(selectedFingerPrint)
      } else if (
        selectedFingerPrint === 'none' &&
        typeof headers[FingerPrintHeaderName] !== 'undefined'
      ) {
        // this.onOptionSelected('none')
      }
    } catch (e) {
      return
    }
  }

  render() {
    SetOnKeyRefreshCallback((lastFingerprint: string) => {
      // tslint:disable-next-line:no-console
      console.log(`Refreshing Keys`)
      GetPrivateKeys((keys, error) => this.onKeysReceived(keys, error))
      this.onOptionSelected(lastFingerprint)
      RequestKeyUnlock(lastFingerprint)
    })
    const { availableKeys, selectedFingerPrint } = this.state
    const optionsOpen = this.state.optionsOpen
    let options: any = null
    if (optionsOpen) {
      const highlight = this.state.highlight
      options = (
        <GPGOptions>
          <GPGSelectionButtonFingerprint
            key={'Load key key'}
            keyInfo={{
              FingerPrint: '',
              Identifier: 'Open key...',
              ContainsPrivateKey: false,
              PrivateKeyIsDecrypted: false,
              Bits: 0,
            }}
            onSelect={this.onLoadKey}
            highlight={highlight}
            onMouseOver={this.handleMouseOver}
            onMouseOut={this.handleMouseOut}
          />
          {availableKeys.map(key => (
            <GPGSelectionButtonFingerprint
              key={key.FingerPrint}
              keyInfo={key}
              onMouseOver={this.handleMouseOver}
              onMouseOut={this.handleMouseOut}
              onSelect={this.onOptionSelected}
              highlight={highlight}
            />
          ))}
        </GPGOptions>
      )
    }

    let selectedBox: any = null

    if (selectedFingerPrint === 'none') {
      selectedBox = <div>🔑 Choose key...</div>
    } else {
      const key = this.getKey(selectedFingerPrint)
      selectedBox = <div>🔑 {key.FingerPrint}</div>
    }

    return (
      <Wrapper>
        <Button onMouseDown={this.onOptionsOpen} title="Change GPG Key">
          {selectedBox}
        </Button>
        {options}
      </Wrapper>
    )
  }

  private onLoadKey = () => {
    return LoadKeyFromComputer()
  }

  private handleMouseOver = (fingerPrint: string) => {
    this.setState({ highlight: fingerPrint })
  }

  private handleMouseOut = () => {
    this.setState({ highlight: null })
  }

  private onOptionSelected = fingerPrint => {
    fingerPrint = fingerPrint || 'none'
    if (typeof fingerPrint !== 'string') {
      return
    }

    // tslint:disable-next-line:no-console
    console.log(`Selected FingerPrint: ${fingerPrint}`)
    let headers = this.props.getHeaders || '{}'
    try {
      headers = headers === '' ? '{}' : headers
      const headObj = JSON.parse(headers)
      if (fingerPrint === 'none') {
        delete headObj[FingerPrintHeaderName]
      } else {
        headObj[FingerPrintHeaderName] = fingerPrint
      }
      this.props.editHeaders(JSON.stringify(headObj, null, 2))
    } catch (e) {}

    if (this.props.onGpgKeyChanged) {
      this.props.onGpgKeyChanged(fingerPrint)
    }

    this.setState({
      optionsOpen: false,
      selectedFingerPrint: fingerPrint,
    } as State)
  }

  private onOptionsOpen = downEvent => {
    let initialPress = true
    const downTarget = downEvent.target
    this.setState({ highlight: null, optionsOpen: true })

    let onMouseUp: any = upEvent => {
      if (initialPress && upEvent.target === downTarget) {
        initialPress = false
      } else {
        document.removeEventListener('mouseup', onMouseUp)
        onMouseUp = null
        if (downTarget.parentNode) {
          const isOptionsMenuClicked =
            // tslint:disable-next-line
            downTarget.parentNode.compareDocumentPosition(upEvent.target) &
            Node.DOCUMENT_POSITION_CONTAINED_BY
          if (!isOptionsMenuClicked) {
            // menu calls setState if it was clicked
            this.setState({ optionsOpen: false } as State)
          }
          if (firstTime) {
            this.onOptionSelected('none')
            firstTime = false
          }
        }
      }
    }

    document.addEventListener('mouseup', onMouseUp)
  }
}

const mapStateToProps = createStructuredSelector({
  sessionId: getSelectedSessionIdFromRoot,
  getHeaders,
})

export default withTheme<{}>(
  connect(
    mapStateToProps,
    { editHeaders },
  )(toJS(GPGSelectionButton)),
)

const Wrapper = styled.div``

const Button = styled.button`
  text-transform: uppercase;
  font-weight: 600;
  color: ${p => p.theme.editorColours.buttonText};
  background: ${p => p.theme.editorColours.button};
  border-radius: 2px;
  flex: 0 0 auto;
  letter-spacing: 0.53px;
  font-size: 14px;
  padding: 6px 9px 7px 10px;
  margin-left: 6px;

  cursor: pointer;
  transition: 0.1s linear background-color;
  &:first-child {
    margin-left: 0;
  }
  &:hover {
    background-color: ${p => p.theme.editorColours.buttonHover};
  }
`

const GPGOptions = styled.ul`
  max-height: 300px;
  position: absolute;
  left: 15px;
  z-index: 1000;

  align-items: center;
  justify-content: center;

  border-radius: 10px 10px 10px 10px;
  transition: background-color 100ms;
  cursor: pointer;
  background-color: white;

  li {
    cursor: pointer;
    list-style: none;
    align-items: center;
    justify-content: center;
    padding: 10px 20px 10px 20px;
    border-radius: 0px;
  }
  li:first-child {
    border-radius: 10px 10px 0px 0px;
  }
  li:last-child {
    border-radius: 0px 0px 10px 10px;
  }

  li.selected {
    cursor: pointer;
    list-style: none;
    align-items: center;
    justify-content: center;
    padding: 10px 20px 10px 20px;
    background: rgb(39, 174, 96);
    color: white;
  }
`
