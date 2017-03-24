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
      let max = this.getMaxLength(node)

      if (max <= 0) {
        node.pop()
        break
      }

      node[node.length - 1] = max - 1

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

  getIndices(nodes) {
    let indices = []

    let node = this.props.tree
    let children = node

    for (let nodeId of nodes) {
      let index = children.findIndex(child => child.nodeId == nodeId)
      node = children[index]
      children = node.children
      indices.push(index)
    }

    return indices
  }

  getNode(indices) {
    let nodes = []

    let node = this.props.tree
    let children = node

    for (let index of indices) {
      node = children[index]
      children = node.children
      nodes.push(node.nodeId)
    }

    return nodes
  }

  handleHotkey(e) {
    let node = this.props.selectedNode
    node = node.filter((i) => { return i != null })

    let indices = this.getIndices(node)

    if (indices.length < 1) {
      indices = [0]
    }

    switch (e.key) {
      case 'ArrowLeft':
        indices = this.selectLeft(indices)
        break
      case 'ArrowRight':
        indices = this.selectRight(indices)
        break
      case 'k':
      case 'ArrowUp':
        indices = this.selectUp(indices)
        break
      case 'j':
      case 'ArrowDown':
        indices = this.selectDown(indices)
        break
      default:
        return
    }

    node = this.getNode(indices)

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
