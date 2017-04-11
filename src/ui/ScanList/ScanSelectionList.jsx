import React from 'react'
import PropTypes from 'prop-types'
import Tree, { TreeNode } from 'rc-tree'

import { cmp } from '../../utils/utils'

class ScanSelectionList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedNode: [],
    }
  }

  componentWillUpdate(nextProps, nextState) {
    if (
      nextProps.tree == this.props.tree
    ) {
      this.notReRender = true
    } else {
      this.notReRender = false
    }

    if (!cmp(nextProps.selectedNode, this.props.selectedNode)) {
      if (!cmp(nextProps.selectedNode, this.state.selectedNode)) {
        let tree = this.refs["tree"]

        if (tree != null) {
          tree.setState({
            expandedKeys: this.toExpandKeys(nextProps.selectedNode),
            selectedKeys: [nextProps.selectedNode.map(i => i.join(",")).join("-")]
          })
        }
      }

      this.setState({selectedNode: nextProps.selectedNode})
    }
  }

  toExpandKeys(nodes) {
    let tree = this.refs["tree"]
    let expandedKeys = tree != null ? tree.state.expandedKeys.slice() : []

    for (let index = 1; index < nodes.length; index++) {
      let slice = nodes.slice(0, index).map(i => i.join(",")).join("-")
      if (!expandedKeys.includes(slice)) {
        expandedKeys.push(slice)
      }
    }

    return expandedKeys
  }

  selectNode(nodes) {
    let tree = this.refs["tree"]
    if (tree != null) {
      tree.setState({
        expandedKeys: this.toExpandKeys(nodes),
        selectedKeys: [nodes.map(i => i.join(",")).join("-")]
      })
    }

    this.setState({
      selectedNode: nodes,
    }, () => {
      if (this.props.updateAllCallback != null) {
        this.props.updateAllCallback(nodes)
      }
    })
  }

  update(selectedKeys, info) {
    if (selectedKeys.length <= 0) {
      let tree = this.refs["tree"]
      if (tree != null) {
        let lastKey = this.state.selectedNode.map(i => i.join(",")).join("-")
        let expandedKeys = tree.state.expandedKeys.slice()

        let index = expandedKeys.indexOf(lastKey)

        if (index >= 0) {
          expandedKeys.splice(index, 1)
        } else {
          expandedKeys.push(lastKey)
        }

        tree.setState({
          selectedKeys: [lastKey],
          expandedKeys: expandedKeys,
        })
      }
      return
    }

    info.node.onExpand()

    let key = info.node.props.eventKey
    let nodes = key.split("-").map(i => i.split(",").map(j => parseInt(j)))

    this.setState({
      selectedNode: nodes,
    }, () => {
      if (this.props.updateAllCallback != null) {
        this.props.updateAllCallback(nodes)
      }
    })
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

  selectNext(node) {
    if (node.length < 4) {
      while (node.length < 4) { node.push(0) }
      return node
    }

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

    while (node.length < 4) { node.push(0) }

    return node
  }

  selectPrevious(node) {
    while (node[node.length - 1] == 0 && node.length > 0) {
      node.pop()
    }

    if (node.length < 1) {
      return [0, 0, 0, 0]
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

  getIndices(nodes) {
    let indices = []

    let node = this.props.tree
    let children = node

    for (let nodeId of nodes) {
      let index = children.findIndex(child => cmp(child.nodeId, nodeId))
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
    let indices = this.getIndices(this.state.selectedNode)

    if (indices.length < 1) {
      indices = [0]
    }

    let desc = []

    for (let mod of ["Shift", "Meta", "Alt", "Control"]) {
      if (e.getModifierState(mod)) {
        desc.push(mod)
      }
    }

    desc.push(e.key)
    desc = desc.join(" ")

    switch (desc) {
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
      case 'n':
        indices = this.selectNext(indices)
        break
      case 'm':
      case 'p':
        indices = this.selectPrevious(indices)
        break
      default:
        return
    }

    let node = this.getNode(indices)
    this.selectNode(node)

    // TODO: Expand the tree as needed
  }

  render() {
    const loop = (data, base) => {
      return data.map((item) => {
        if (item.children) {
          return (
            <TreeNode
              key={base + item.nodeId}
              title={item.name}
              className={
                item.choice != null ?
                item.choice : (
                  item.truncated != null && item.truncated ?
                  'truncated' : 'undecided'
                )
              }
            >
              {loop(item.children, base + item.nodeId + "-")}
            </TreeNode>
          )
        }
        return (
          <TreeNode
            key={base + item.nodeId}
            title={item.name}
            className={
              item.choice != null ?
              item.choice : (
                item.truncated != null && item.truncated ?
                'truncated' : 'undecided'
              )
            }
          />
        )
      })
    }

    let tree = this.props.tree

    if (this.treeNodes == null || !this.notReRender) {
      this.treeNodes = (
        tree.length > 0 &&
        <Tree
          showLine
          onSelect={this.update.bind(this)}
          ref="tree"
        >
          { loop(tree, "") }
        </Tree>
      )
    }

    return this.treeNodes
  }
}

ScanSelectionList.propTypes = {
  tree: PropTypes.array,

  updateAllCallback: PropTypes.func,

  selectedNode: PropTypes.array,
}

ScanSelectionList.defaultProps = {
  tree: [],

  updateAllCallback: null,

  selectedNode: [],
}

module.exports = ScanSelectionList
