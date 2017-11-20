import React from 'react'
import { findDOMNode } from 'react-dom'
import PropTypes from 'prop-types'
import { Modal, Button, FormGroup, ControlLabel, FormControl, HelpBlock } from 'react-bootstrap'
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
            <FormGroup>
              <ControlLabel>
                Protein Name
              </ControlLabel>
              <FormControl
                type="text"
                value={this.state.proteinMatch}
                placeholder="Protein Name (i.e. EGFR)"
                onChange={this.updateProtein.bind(this)}
                autoFocus
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>
                Peptide Sequence
              </ControlLabel>
              <FormControl
                type="text"
                value={this.state.peptideMatch}
                placeholder="Peptide Sequence (i.e. QyQ)"
                onChange={this.updatePeptide.bind(this)}
              />
            </FormGroup>

            <FormGroup>
              <ControlLabel>
                Scan Number
              </ControlLabel>
              <FormControl
                type="text"
                value={this.state.scanNumber}
                placeholder="Scan Number (i.e. 24117)"
                onChange={this.updateScan.bind(this)}
              />
            </FormGroup>

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
