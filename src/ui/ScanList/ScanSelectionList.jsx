  import React from 'react'

import ScanListItem from './ScanListItem'

class ScanSelectionList extends React.Component {
  update(nodes) {
    if (this.props.updateAllCallback != null) {
      this.props.updateAllCallback(nodes)
    }
  }

  selectLeft(node) {
    if (node.length <= 1) {
      return node
    }

    node.pop()
    return node
  }

  selectRight(node) {
    if (node.length >= 4) {
      return node
    }

    node.push(0)
    return node
  }

  getMaxLength(node) {
    let children = this.props.tree
    for (let i = 0; i < node.length - 1; i++) {
      children = children[node[i]].children
    }

    return children.length
  }

  selectUp(node) {
    if (node[node.length - 1] == 0) {
      if (node.length > 1) {
        node.pop()
      }

      return node
    }

    node[node.length - 1] -= 1

    while(node.length < 4) {
      node.push(0)
      node[node.length - 1] = this.getMaxLength(node) - 1
    }

    return node
  }

  selectDown(node) {
    let init = node.slice(0)

    if (node.length >= 4) {
      node[node.length - 1] += 1
    } else {
      node.push(0)
    }

    while (node[node.length - 1] >= this.getMaxLength(node)) {
      if (node.length <= 1) {
        return init
      }

      node.pop()
      node[node.length - 1] += 1
    }

    return node
  }

  handleHotkey(e) {
    let node = this.props.selectedNode
    node = node.filter((i) => { return i != null })

    if (node.length < 1) {
      node = [0]
    }

    switch (e.key) {
      case 'ArrowLeft':
        node = this.selectLeft(node)
        break
      case 'ArrowRight':
        node = this.selectRight(node)
        break
      case 'k':
      case 'ArrowUp':
        node = this.selectUp(node)
        break
      case 'j':
      case 'ArrowDown':
        node = this.selectDown(node)
        break
      default:
        return
    }

    while (node.length < 4) { node.push(null) }

    this.update(node)

    // TODO: Expand the tree as needed
  }

  render() {
    return (
      <ul className="tree">
        {
          this.props.tree.map(
            (child) => {
              return (
                <ScanListItem
                  key={
                    child.overrideKey != null ?
                    child.overrideKey : child.nodeId
                  }
                  nodeId={child.nodeId}
                  name={child.name}
                  children={child.children}

                  update={this.update.bind(this)}

                  selectedNode={this.props.selectedNode}
                />
              )
            }
          )
        }
      </ul>
    )
  }
}

ScanSelectionList.propTypes = {
  tree: React.PropTypes.array,

  updateAllCallback: React.PropTypes.func,

  selectedNode: React.PropTypes.array,
}

ScanSelectionList.defaultProps = {
  proteins: null,

  updateAllCallback: null,

  selectedNode: [],
}

module.exports = ScanSelectionList
