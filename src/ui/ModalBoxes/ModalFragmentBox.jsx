import React from 'react'
import { Modal, Button } from 'react-bootstrap'

class ModalFragmentBox extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      mz: null,
      fragmentMatches: [],
      currentLabel: '',
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      mz: nextProps.mz,
      fragmentMatches: nextProps.fragmentMatches,
      currentLabel: nextProps.currentLabel
    })
  }

  update() {
    var matchId = $( "#fragmentSelect" ).val()

    if (this.props.updateCallback != null) {
      this.props.updateCallback(matchId)
    }

    this.close()
  }

  close() {
    if (this.props.closeCallback != null) {
      this.props.closeCallback()
    }
  }

  render() {
    return (
      <Modal
        show={this.props.showModal}
        onHide={this.close.bind(this)}
      >
        <Modal.Header>
          <Modal.Title>
            <div>
              Observed m/z:&nbsp;
              { this.state.mz != null ? this.state.mz.toFixed(5) : null }
            </div>
            <div>
              Current Label:&nbsp;
              {this.state.currentLabel}
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          New Label:&nbsp;
          <select id="fragmentSelect">
            {
              this.state.fragmentMatches.map(
                (object, i) => {
                  return (
                    <option
                      key={i}
                      value={object.ionId || object.id}
                    >
                      {
                        object.name +
                        ' - ' + object.mz.toFixed(5) +
                        ' (' + object.ppm.toFixed(1) + ' ppm)'
                      }
                    </option>
                  )
                }
              )
            }
          </select>
        </Modal.Body>
        <Modal.Footer>
          <Button
            disabled={this.state.fragmentMatches.length == 0}
            onClick={this.update.bind(this)}
          >
            Update
          </Button>
          <Button
            onClick={this.close.bind(this)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}

ModalFragmentBox.propTypes = {
  updateCallback: React.PropTypes.func,
  closeCallback: React.PropTypes.func,
}

ModalFragmentBox.defaultProps = {
  updateCallback: null,
  closeCallback: null,
}

module.exports = ModalFragmentBox
