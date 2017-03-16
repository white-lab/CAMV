import React from 'react'
import { Modal, Button, FormGroup, ControlLabel, FormControl, HelpBlock } from 'react-bootstrap'
import hotkey from 'react-hotkey'


hotkey.activate();


class ModalSearchBox extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      proteinMatch: '',
      peptideMatch: '',
      scanMatch: '',
    }
  }

  componentDidMount() {
    hotkey.addHandler(this.handleHotkey.bind(this))
  }

  componentWillUnmount() {
    hotkey.removeHandler(this.handleHotkey.bind(this))
  }

  handleHotkey(e) {
    switch (e.key) {
      case 'Enter':
        this.runSearch()
        break
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
    this.setState({scanNumber: e.target.value})
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
        onHide={this.closeCallback}
        show={this.props.showModal}
      >
        <Modal.Header>
          <Modal.Title>
            <div>
              Search
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FormGroup
            // controlId="formBasicText"
            // validationState={this.getValidationState()}
          >
            <ControlLabel>
              Protein Name
            </ControlLabel>
            <FormControl
              type="text"
              value={this.state.proteinMatch}
              placeholder="Protein Name (i.e. EGFR)"
              onChange={this.updateProtein.bind(this)}
            />
            // <FormControl.Feedback />
            // <HelpBlock>Validation is based on string length.</HelpBlock>
          </FormGroup>
          <FormGroup
            // controlId="formBasicText"
            // validationState={this.getValidationState()}
          >
            <ControlLabel>
              Peptide Sequence
            </ControlLabel>
            <FormControl
              type="text"
              value={this.state.peptideMatch}
              placeholder="Peptide Sequence (i.e. QyQ)"
              onChange={this.updatePeptide.bind(this)}
            />
            // <FormControl.Feedback />
            <HelpBlock>
              Upper: match any residue. Lower: match modified residue. Dot: Match any.
              (i.e. T..QyQ => T-V-V-Q-pY-Q, pT-A-A-Q-pY-Q)
            </HelpBlock>
          </FormGroup>

          <FormGroup
            // controlId="formBasicText"
            // validationState={this.validateScan()}
          >
            <ControlLabel>
              Scan Number
            </ControlLabel>
            <FormControl
              type="text"
              value={this.state.scanNumber}
              placeholder="Scan Number"
              onChange={this.updateScan.bind(this)}
            />
            // <FormControl.Feedback />
            // <HelpBlock>
            // </HelpBlock>
          </FormGroup>

        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={this.runSearch.bind(this)}
          >
            Search
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}

ModalSearchBox.propTypes = {
  searchCallback: React.PropTypes.func,
  closeCallback: React.PropTypes.func,
  showModal: React.PropTypes.bool.isRequired,
}

ModalSearchBox.defaultProps = {
  searchCallback: null,
  closeCallback: null,
}

module.exports = ModalSearchBox
