/**
 * Created by Lucas Teske on 02/05/18.
 * @flow
 */
import * as React from 'react'
import { KeyInfo } from '../../qrs/models'

export interface Props {
  keyInfo: KeyInfo
  onSelect: (fingerprint: string) => void
  onMouseOver: (operation: any) => void
  onMouseOut: () => void
  highlight: string
  key: string
}

class GPGSelectionButtonFingerprint extends React.PureComponent<Props> {
  render() {
    return (
      <li
        data-fp={this.props.keyInfo.FingerPrint}
        key={this.props.keyInfo.FingerPrint}
        className={
          this.props.keyInfo.FingerPrint === this.props.highlight
            ? 'selected'
            : ''
        }
        onMouseOver={this.onMouseOver}
        onMouseOut={this.props.onMouseOut}
        onMouseDown={this.onDown}
      >
        {this.props.keyInfo.Identifier}{' '}
        {this.props.keyInfo.FingerPrint !== ''
          ? `(${this.props.keyInfo.FingerPrint})`
          : ''}
      </li>
    )
  }
  private onMouseOver = () => {
    this.props.onMouseOver(this.props.keyInfo.FingerPrint)
  }

  private onDown = e => {
    this.props.onSelect(e.currentTarget.dataset.fp)
  }
}

export default GPGSelectionButtonFingerprint
