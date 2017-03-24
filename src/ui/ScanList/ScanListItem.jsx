import React from 'react'

class ScanListItem extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      open: this.childSelected(),
    }
  }

  childSelected() {
    return (
      this.props.parentSelected &&
      this.props.selectedNode != null &&
      this.props.selectedNode[0] == this.props.nodeId &&
      this.props.selectedNode.filter(i => i != null).length > 1
    )
  }

  isSelected() {
    return (
      this.props.parentSelected &&
      this.props.selectedNode != null &&
      this.props.selectedNode[0] == this.props.nodeId
    )
  }

  update(node) {
    if (this.props.update != null) {
      this.props.update(
        [this.props.nodeId].concat(node),
      )
    }
  }

  toggle() {
    this.setState({
      open: !this.state.open,
    })

    if (this.props.update != null) {
      this.props.update(
        [this.props.nodeId],
      )
    }
  }

  render() {
    let selected = this.isSelected()
    let highlight = (
      selected && !this.childSelected()
    )

    return (
      <div>
        <li
          className={
            this.props.choice != null ?
            this.props.choice : 'undecided'
          }
          onClick={this.toggle.bind(this)}
        >
          <span
            className={highlight ? 'selectedListItem' : 'unselectedListItem'}
          >
            {this.props.name}
          </span>
        </li>
        {
          (
            this.props.children != null &&
            this.props.children.length > 0
          ) && (this.state.open || this.childSelected()) &&
          <ul>
            {
              this.props.children.map(
                (child) => {
                  return (
                    <ScanListItem
                      key={
                        child.overrideKey != null ?
                        child.overrideKey : child.nodeId
                      }
                      nodeId={child.nodeId}
                      name={child.name}
                      choice={child.choice}
                      children={child.children}

                      update={this.update.bind(this)}

                      parentSelected={selected}
                      selectedNode={this.props.selectedNode.slice(1)}
                    />
                  )
                }
              )
            }
          </ul>
        }
      </div>
    )
  }
}

ScanListItem.propTypes = {
  nodeId: React.PropTypes.oneOfType([
    React.PropTypes.number,
    React.PropTypes.array,
  ]).isRequired,
  overrideKey: React.PropTypes.number,

  name: React.PropTypes.string.isRequired,
  children: React.PropTypes.array,
  choice: React.PropTypes.string,

  update: React.PropTypes.func,

  parentSelected: React.PropTypes.bool,
  selectedNode: React.PropTypes.array,
}

ScanListItem.defaultProps = {
  overrideKey: null,

  children: [],
  choice: null,

  update: null,

  parentSelected: true,
  selectedNode: [],
}

module.exports = ScanListItem
