/**
 * Created by Lucas Teske on 02/05/18.
 * @flow
 */
import * as React from 'react'
import { KeyInfo } from '../../qrs/models'

export interface Props {
  keyInfo: KeyInfo
  onMouseOver: (operation: any) => void
  onMouseOut: () => void
  onMouseUp: (operation: any) => void
  highlight: string
  key: string
}

class GPGSelectionButtonFingerprint extends React.PureComponent<Props> {
  render() {
    return (
      <li
        key={this.props.keyInfo.FingerPrint}
        className={
          this.props.keyInfo.FingerPrint === this.props.highlight
            ? 'selected'
            : ''
        }
        onMouseOver={this.onMouseOver}
        onMouseOut={this.props.onMouseOut}
        onMouseUp={this.onMouseUp}
      >
        {this.props.keyInfo.Identifier}
      </li>
    )
  }
  private onMouseOver = () => {
    this.props.onMouseOver(this.props.keyInfo.FingerPrint)
  }

  private onMouseUp = () => {
    this.props.onMouseUp(this.props.keyInfo.FingerPrint)
  }
}

export default GPGSelectionButtonFingerprint
