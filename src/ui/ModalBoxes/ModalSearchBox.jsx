import React from 'react'
import { findDOMNode } from 'react-dom'
import PropTypes from 'prop-types'
import { Modal, Button, Form, HelpBlock } from 'react-bootstrap'
import { HotKeys } from 'react-hotkeys'


class ModalSearchBox extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      proteinMatch: '',
      peptideMatch: '',
      scanMatch: '',
    }
    this.handlers = {
      "runSearch": this.runSearch.bind(this),
    }
  }

  runSearch() {
    if (this.props.searchCallback != null) {
      this.props.searchCallback(
        this.state.proteinMatch,
        this.state.peptideMatch,
        this.state.scanMatch,
      )
    }
  }

  closeCallback() {
    if (this.props.closeCallback != null) {
      this.props.closeCallback()
    }
  }

  updateProtein(e) {
    this.setState({proteinMatch: e.target.value})
  }

  updatePeptide(e) {
    this.setState({peptideMatch: e.target.value})
  }

  updateScan(e) {
    this.setState({scanMatch: e.target.value})
  }

  validateScan(text) {
    if (text == '') { return ''}

    var n = Math.floor(Number(text));

    if (String(n) !== text || n < 0) {
      return 'error'
    }
    return ''
  }

  render() {
    return (
      <Modal
        onHide={this.closeCallback.bind(this)}
        show={this.props.showModal}
        centered={true}
      >
        <HotKeys handlers={this.handlers}>
          <Modal.Header>
            <Modal.Title>
              <div>
                Search
              </div>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label>
                Protein Name
              </Form.Label>
              <Form.Control
                type="text"
                value={this.state.proteinMatch}
                placeholder="Protein Name (i.e. EGFR)"
                onChange={this.updateProtein.bind(this)}
                autoFocus
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>
                Peptide Sequence
              </Form.Label>
              <Form.Control
                type="text"
                value={this.state.peptideMatch}
                placeholder="Peptide Sequence (i.e. QyQ)"
                onChange={this.updatePeptide.bind(this)}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>
                Scan Number
              </Form.Label>
              <Form.Control
                type="text"
                value={this.state.scanNumber}
                placeholder="Scan Number (i.e. 24117)"
                onChange={this.updateScan.bind(this)}
              />
            </Form.Group>

          </Modal.Body>
          <Modal.Footer>
            <Button
              onClick={this.runSearch.bind(this)}
            >
              Search
            </Button>
          </Modal.Footer>
        </HotKeys>
      </Modal>
    )
  }
}

ModalSearchBox.propTypes = {
  searchCallback: PropTypes.func,
  closeCallback: PropTypes.func,
  showModal: PropTypes.bool.isRequired,
}

ModalSearchBox.defaultProps = {
  searchCallback: null,
  closeCallback: null,
}

module.exports = ModalSearchBox
