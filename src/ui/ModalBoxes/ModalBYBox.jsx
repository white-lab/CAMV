import React from 'react'
import { Modal, Button } from 'react-bootstrap'

class ModalBYBox extends React.Component {
  close() {
    if (this.props.closeCallback != null) {
      this.props.closeCallback()
    }
  }

  onClick(element) {
    if (this.props.clickCallback != null) {
      this.props.clickCallback(element[0])
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
                    (element, index) =>
                    <p key={index}>
                      <a onClick={this.onClick.bind(this, element)}>
                        {element[1]}
                      </a>
                    </p>
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
                    (element, index) =>
                    <p key={index}>
                      <a onClick={this.onClick.bind(this, element)}>
                        {element[1]}
                      </a>
                    </p>
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
  clickCallback: React.PropTypes.func,
  closeCallback: React.PropTypes.func,
  bIons: React.PropTypes.array,
  yIons: React.PropTypes.array,
}

ModalBYBox.defaultProps = {
  clickCallback: null,
  closeCallback: null,
  bIons: [],
  yIons: [],
}

module.exports = ModalBYBox
