import React from 'react'
import { Modal, Button } from 'react-bootstrap'

class ModalFragmentBox extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      peak: null,
      fragmentMatches: [],
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      peak: nextProps.peak,
      fragmentMatches: nextProps.fragmentMatches,
    })
  }

  update() {
    let fragId = $( "#fragmentSelect" ).val()

    if (this.props.updateCallback != null) {
      this.props.updateCallback(peak, fragId)
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
          {
            this.props.peak != null &&
            <Modal.Title>
              <div>
                Observed m/z:&nbsp;
                { this.props.peak.mz.toFixed(5) }
              </div>
              {
                this.props.peak.name != null &&
                <div>
                  Current Label:&nbsp;
                  { this.props.peak.name }
                  {
                    this.props.peak.exp_mz != null &&
                    " - " + this.props.peak.exp_mz.toFixed(5)
                  }
                  {
                    this.props.peak.ppm != null &&
                    ' (' + this.props.peak.ppm.toFixed(1) + ' ppm)'
                  }
                </div>
              }
            </Modal.Title>
          }
        </Modal.Header>
        {
          this.state.fragmentMatches.length > 0 &&
          <Modal.Body>
            New Label:&nbsp;
            <select id="fragmentSelect">
              {
                this.state.fragmentMatches.map(
                  (object, i) => {
                    return (
                      <option
                        key={i}
                        value={object.frag_id || object.ionId || object.id}
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
        }
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
