import React from 'react'
import { Modal, Button } from 'react-bootstrap'

class ModalBYBox extends React.Component {
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
            b/y Ions
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {
            this.props.bIons.length > 0 &&
            (
              <div id="modalBIons">
                {
                  this.props.bIons.map(
                    (name, i) => <p key={i}>{name}</p>
                  )
                }
              </div>
            )
          }
          {
            this.props.yIons.length > 0 &&
            (
              <div id="modalYIons">
                {
                  this.props.yIons.map(
                    (name, i) => <p key={i}>{name}</p>
                  )
                }
              </div>
            )
          }
        </Modal.Body>
        <Modal.Footer>
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

ModalBYBox.propTypes = {
  closeCallback: React.PropTypes.func,
  bIons: React.PropTypes.array,
  yIons: React.PropTypes.array,
}

ModalBYBox.defaultProps = {
  closeCallback: null,
  bIons: [],
  yIons: [],
}

module.exports = ModalBYBox
