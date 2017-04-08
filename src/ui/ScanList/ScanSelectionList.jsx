import React from 'react'
import Tree, { TreeNode } from 'rc-tree'

class ScanSelectionList extends React.Component {
  componentWillUpdate(nextProps, nextState) {
    if (
      nextProps.tree == this.props.tree
    ) {
      this.notReRender = true
    } else {
      this.notReRender = false
    }
  }

  cmp(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.length == b.length && a.every((v, i) => this.cmp(v, b[i]))
    } else {
      return a == b
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (!this.cmp(prevProps.selectedNode, this.props.selectedNode)) {
      let tree = this.refs["tree"]
      if (tree != null) {
        console.log(this.props.selectedNode.filter(i => i != null).map(i => Array.isArray(i) ? i.join(",") : i).join("-"))
        tree.setState({
          selectedKeys: [this.props.selectedNode.filter(i => i != null).map(i => Array.isArray(i) ? i.join(",") : i).join("-")]
        })
      }
    }
  }

  selectNode(nodes) {
    let tree = this.refs["tree"]
    console.log(nodes)
    if (tree != null) {
      tree.setState({
        selectedKeys: nodes.map(i => Array.isArray(i) ? i.join(",") : i).join("-")
      })
    }

    console.log("selected", nodes)

    if (this.props.updateAllCallback != null) {
      this.props.updateAllCallback(nodes)
    }
  }

  update(selectedKeys, info) {
    console.log(selectedKeys, info)
    info.node.onExpand()

    let key = info.node.props.eventKey
    let node = key
    let nodes = node.split("-").map(
      i => {
        let j = i.split(",").map(parseInt)
        return j.length > 1 ? j : j[0]
      }
    )

    console.log("selected", nodes)

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

    node = this.getNode(indices)

    while (node.length < 4) { node.push(null) }

    this.selectNode(node)

    // TODO: Expand the tree as needed
  }

  render() {
    const loop = (data, base) => {
      // console.log(data, base)

      return data.map((item) => {
        // console.log(item)
        if (item.children) {
          // console.log('children', item.children)
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
    // console.log(tree)
    let treeNodes
    if (this.treeNodes && this.notReRender) {
      treeNodes = this.treeNodes
    } else {
      treeNodes = (
        tree.length > 0 &&
        <Tree
          showLine
          onSelect={this.update.bind(this)}
          ref="tree"
        >
          { loop(tree, "") }
        </Tree>
      )
      this.treeNodes = treeNodes
    }

    return treeNodes
  }
}

ScanSelectionList.propTypes = {
  tree: React.PropTypes.array,

  updateAllCallback: React.PropTypes.func,

  selectedNode: React.PropTypes.array,
}

ScanSelectionList.defaultProps = {
  tree: [],

  updateAllCallback: null,

  selectedNode: [],
}

module.exports = ScanSelectionList
