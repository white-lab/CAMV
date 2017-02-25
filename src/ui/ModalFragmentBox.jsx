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
    this.props.updateCallback(matchId);
    this.close()
  }

  close() {
    this.props.closeCallback();
  }

  render() {
    return (
      <Modal
        show={this.props.showModal}
        onHide={this.close.bind(this)}
      >
        <Modal.Header>
          <Modal.Title>
            <div>mz: {this.state.mz}</div>
            <div>current label: {this.state.currentLabel}</div>
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
                      value={object.id}
                    >
                      {
                        object.name +
                        ' (' + String(Math.round(object.ppm)) + ' ppm)'
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
  updateCallback: React.PropTypes.func.isRequired,
  closeCallback: React.PropTypes.func.isRequired,
}

module.exports = ModalFragmentBox
