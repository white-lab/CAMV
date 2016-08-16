
// var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

var ReactCSSTransitionGroup = require('react-addons-css-transition-group');

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
      <ReactBootstrap.Modal show={this.props.showModal} onHide={this.close}>
        <ReactBootstrap.Modal.Header>
          <ReactBootstrap.Modal.Title>
            <div>mz: {this.state.mz}</div>
            <div>current label: {this.state.currentLabel}</div>
          </ReactBootstrap.Modal.Title>
        </ReactBootstrap.Modal.Header>
        <ReactBootstrap.Modal.Body>
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
        </ReactBootstrap.Modal.Body>
        <ReactBootstrap.Modal.Footer>
          <ReactBootstrap.Button onClick={this.update} disabled={this.state.fragmentMatches.length == 0}>Update</ReactBootstrap.Button>
          <ReactBootstrap.Button onClick={this.close}>Close</ReactBootstrap.Button>
        </ReactBootstrap.Modal.Footer>
      </ReactBootstrap.Modal>
    )
  }
});
