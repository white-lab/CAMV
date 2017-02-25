import React from 'react';
import { Modal, Button } from 'react-bootstrap';

var ModalFragmentBox = React.createClass({
  getInitialState() {
    return {
      mz: null,
      fragmentMatches: [],
      currentLabel: ''
    }
  },
  update: function() {
    var matchId = $( "#fragmentSelect" ).val()
    this.props.updateCallback(matchId);
    this.close()
  },
  close: function() {
    this.props.closeCallback();
  },
  componentWillReceiveProps: function(nextProps) {
    this.setState({
      mz: nextProps.mz,
      fragmentMatches: nextProps.fragmentMatches,
      currentLabel: nextProps.currentLabel
    })
  },

  render: function() {
    return (
      <Modal show={this.props.showModal} onHide={this.close}>
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
                return <option key={i} value={object.id}>{object.name + ' (' + String(Math.round(object.ppm))+ ' ppm)'}</option>
              }
            )
          }
          </select>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.update} disabled={this.state.fragmentMatches.length == 0}>Update</Button>
          <Button onClick={this.close}>Close</Button>
        </Modal.Footer>
      </Modal>
    )
  }
});

module.exports = ModalFragmentBox
