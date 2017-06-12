import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import Tree, { TreeNode } from 'rc-tree'

import cmp from '../../utils/cmp'

class ScanSelectionList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedNode: [],
      tree: [],
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevProps.db != this.props.db &&
      this.props.db != null
    ) {
      this.buildNodeTree()
    }
  }

  findTreeNode(ref) {
    let treeNode = this.refs["tree"]
    let runningKey = 'treeNode'

    for (const key of ref.split('-')) {
      if (treeNode === undefined) { break }
      runningKey = `${runningKey}-${key}`
      treeNode = treeNode.refs[runningKey]
    }

    return treeNode
  }

  componentWillUpdate(nextProps, nextState) {
    if (
      nextState.tree == this.state.tree
    ) {
      this.notReRender = true
    } else {
      this.notReRender = false
    }

    if (!cmp(nextProps.selectedNode, this.props.selectedNode)) {
      if (!cmp(nextProps.selectedNode, this.state.selectedNode)) {
        let tree = this.refs["tree"]

        if (tree != null) {
          // Add nodes to tree
          this.getIndices(nextProps.selectedNode)

          // Select and expand nodes
          let key = nextProps.selectedNode.map(i => i.join(",")).join("-")

          tree.setState({
            expandedKeys: this.toExpandKeys(nextProps.selectedNode),
            selectedKeys: [key],
          })

          // Scroll into view
          let treeNode = this.findTreeNode(key.split("-")[0])

          if (treeNode != null) {
            ReactDOM.findDOMNode(treeNode).scrollIntoView()
          }
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
      let key = nodes.map(i => i.join(",")).join("-")

      tree.setState({
        expandedKeys: this.toExpandKeys(nodes),
        selectedKeys: [key]
      })

      let treeNode = this.findTreeNode(key)
      ReactDOM.findDOMNode(treeNode).scrollIntoViewIfNeeded()
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

  selectLeft(indices) {
    if (indices.length <= 1) {
      return indices
    }

    indices.pop()
    return indices
  }

  selectRight(indices) {
    if (indices.length >= 4) {
      return indices
    }

    indices.push(0)
    return indices
  }

  async getMaxLength(indices) {
    let node = this.refs["tree"].treeView
    let children = node

    for (let index of indices) {
      if (children.props.children.length < 1 && children.props.isLeaf != true) {
        await new Promise((resolve) => { this.getChildren(children, resolve) })
      }
      node = children
      children = node.props.children[index]
    }

    return node.props.children.length
  }

  async selectUp(indices) {
    if (indices[indices.length - 1] == 0) {
      if (indices.length > 1) {
        indices.pop()
      }

      return indices
    }

    indices[indices.length - 1] -= 1

    while(indices.length < 4) {
      indices.push(0)
      let max = await this.getMaxLength(indices)

      if (max <= 0) {
        indices.pop()
        break
      }

      indices[indices.length - 1] = max - 1
    }

    return indices
  }

  async selectDown(indices) {
    let init = indices.slice(0)

    if (indices.length >= 4) {
      indices[indices.length - 1] += 1
    } else {
      indices.push(0)
    }

    while (indices[indices.length - 1] >= await this.getMaxLength(indices)) {
      if (indices.length <= 1) {
        return init
      }

      indices.pop()
      indices[indices.length - 1] += 1
    }

    return indices
  }

  async selectNext(indices) {
    let init = indices.slice(0)

    if (indices.length < 4) {
      while (indices.length < 4) { indices.push(0) }
      return indices
    }

    if (indices.length >= 4) {
      indices[indices.length - 1] += 1
    } else {
      indices.push(0)
    }

    while (indices[indices.length - 1] >= await this.getMaxLength(indices)) {
      if (indices.length <= 1) {
        return init
      }

      indices.pop()
      indices[indices.length - 1] += 1
    }

    while (indices.length < 4) { indices.push(0) }

    return indices
  }

  async selectPrevious(indices) {
    while (indices[indices.length - 1] == 0 && indices.length > 0) {
      indices.pop()
    }

    if (indices.length < 1) {
      return [0, 0, 0, 0]
    }

    indices[indices.length - 1] -= 1

    while(indices.length < 4) {
      indices.push(0)
      let max = await this.getMaxLength(indices)

      if (max <= 0) {
        indices.pop()
        break
      }

      indices[indices.length - 1] = max - 1
    }

    return indices
  }

  async getIndices(nodes) {
    let indices = []

    let node = this.refs['tree'].treeView
    let base = []

    for (let nodeId of nodes) {
      base.push(nodeId)
      if (node.props.children.length < 1) {
        await new Promise((resolve) => { this.getChildren(node, resolve) })
      }

      let key = base.map(i => i.join(",")).join("-")
      let index = node.props.children.findIndex(child => cmp(child.props.eventKey || child.key, key))

      node = node.props.children[index]
      indices.push(index)
    }

    return indices
  }

  async getNode(indices) {
    let nodes = []

    let node = this.refs["tree"].treeView
    let children = node

    for (let index of indices) {
      if (children.props.children.length < 1) {
        await new Promise((resolve) => { this.getChildren(children, resolve) })
      }

      node = children.props.children[index]
      children = node
      nodes = (node.props.eventKey || node.key).split('-').map(i => i.split(','))
    }

    return nodes
  }

  async handleHotkey(e) {
    let desc = []

    for (let mod of ["Shift", "Meta", "Alt", "Control"]) {
      if (e.getModifierState(mod)) {
        desc.push(mod)
      }
    }

    desc.push(e.key)
    desc = desc.join(" ")

    let indices = await this.getIndices(this.state.selectedNode)

    if (indices.length < 1) {
      indices = [0]
    }

    switch (desc) {
      case 'ArrowLeft':
        indices = await this.selectLeft(indices)
        break
      case 'ArrowRight':
        indices = await this.selectRight(indices)
        break
      case 'k':
      case 'ArrowUp':
        indices = await this.selectUp(indices)
        break
      case 'j':
      case 'ArrowDown':
        indices = await this.selectDown(indices)
        break
      case 'n':
        indices = await this.selectNext(indices)
        break
      case 'm':
      case 'p':
        indices = await this.selectPrevious(indices)
        break
      default:
        return
    }

    let node = await this.getNode(indices)
    this.selectNode(node)
  }

  getPeptides(treeNode, node, resolve) {
    this.props.db.each(
      "SELECT \
      peptides.peptide_id, peptides.peptide_seq, \
      mod_states.mod_state_id, mod_states.mod_desc \
      \
      FROM \
      mod_states \
      \
      JOIN peptides \
      ON mod_states.peptide_id=peptides.peptide_id \
      \
      INNER JOIN protein_sets \
      ON protein_sets.protein_set_id=peptides.protein_set_id \
      \
      WHERE protein_sets.protein_set_id=? \
      \
      ORDER BY peptides.peptide_seq, mod_states.mod_desc",
      [
        node[0][0],
      ],
      (err, row) => {
        if (err != null || row == null) {
          console.error(err, row)
          return
        }

        let key = `${treeNode.props.eventKey}-${row.peptide_id},${row.mod_state_id}`

        if (treeNode.props.children.map(i => i.props.eventKey || i.key).indexOf(key) >= 0) {
          return
        }

        treeNode.props.children.push(
          this.renderNode(
            key,
            `${row.peptide_seq} ${row.mod_desc}`,
            null,
            false,
          )
        )
      },
      (err, count) => {
        if (err != null) {
          console.error(err)
          return
        }
        if (resolve != null) { resolve() }
      }
    )
  }

  getScans(treeNode, node, resolve) {
    let scan_ids = new Set()

    this.props.db.each(
      "SELECT \
      scans.scan_id, scans.scan_num, scans.truncated \
      \
      FROM \
      scan_ptms \
      \
      INNER JOIN scans \
      ON scan_ptms.scan_id=scans.scan_id \
      \
      JOIN ptms \
      ON scan_ptms.ptm_id=ptms.ptm_id \
      \
      JOIN mod_states \
      ON ptms.mod_state_id=mod_states.mod_state_id \
      \
      JOIN peptides \
      ON mod_states.peptide_id=peptides.peptide_id \
      \
      INNER JOIN protein_sets \
      ON protein_sets.protein_set_id=peptides.protein_set_id \
      \
      WHERE mod_states.mod_state_id=? AND \
      peptides.peptide_id=? AND \
      protein_sets.protein_set_id=? \
      \
      ORDER BY scans.scan_num",
      [
        node[1][1],
        node[1][0],
        node[0][0],
      ],
      (err, row) => {
        if (err != null || row == null) {
          console.error(err, row)
        }

        if (scan_ids.has(row.scan_id)) {
          return
        }

        let key = `${treeNode.props.eventKey || treeNode.key}-${row.scan_id}`

        if (treeNode.props.children.map(i => i.props.eventKey || i.key).indexOf(key) >= 0) {
          return
        }

        treeNode.props.children.push(
          this.renderNode(
            key,
            `Scan: ${row.scan_num}`,
            null,
            row.truncated,
          )
        )

        scan_ids.add(row.scan_id)
      },
      (err, count) => {
        if (err != null) {
          console.error(err)
        }
        if (resolve != null) { resolve() }
      }
    )
  }

  getPtms(treeNode, node, resolve) {
    this.props.db.each(
      "SELECT \
      ptms.ptm_id, ptms.name, \
      scan_ptms.choice \
      \
      FROM \
      scan_ptms \
      \
      INNER JOIN scans \
      ON scan_ptms.scan_id=scans.scan_id \
      \
      JOIN ptms \
      ON scan_ptms.ptm_id=ptms.ptm_id \
      \
      JOIN mod_states \
      ON ptms.mod_state_id=mod_states.mod_state_id \
      \
      JOIN peptides \
      ON mod_states.peptide_id=peptides.peptide_id \
      \
      INNER JOIN protein_sets \
      ON protein_sets.protein_set_id=peptides.protein_set_id \
      \
      WHERE scans.scan_id=? AND \
      mod_states.mod_state_id=? AND \
      peptides.peptide_id=? AND \
      protein_sets.protein_set_id=? \
      \
      ORDER BY ptms.name",
      [
        node[2][0],
        node[1][1],
        node[1][0],
        node[0][0],
      ],
      (err, row) => {
        if (err != null || row == null) {
          console.error(err, row)
        }

        let key = `${treeNode.props.eventKey || treeNode.key}-${row.ptm_id}`

        if (treeNode.props.children.map(i => i.props.eventKey || i.key).indexOf(key) >= 0) {
          return
        }

        treeNode.props.children.push(
          this.renderNode(
            key,
            row.name,
            row.choice,
            false,
          )
        )
      },
      (err, count) => {
        if (err != null) {
          console.error(err)
        }
        if (resolve != null) { resolve() }
      }
    )
  }

  getChildren(treeNode, resolve) {
    let node = (
      treeNode.props.eventKey ||
      treeNode.key
    ).split("-").map(i => i.split(","))

    if (node.length == 1) {
      this.getPeptides(treeNode, node, resolve)
    } else if (node.length == 2) {
      this.getScans(treeNode, node, resolve)
    } else if (node.length == 3) {
      this.getPtms(treeNode, node, resolve)
    } else {
      console.error("Invalide node length")
    }
  }

  loadData(treeNode) {
    return new Promise((resolve) => {
      if (
        (
          treeNode.props.children == null ||
          treeNode.props.children.length < 1
        ) &&
        !treeNode.props.isLeaf
      ) {
        this.getChildren(treeNode, resolve)
      } else {
        resolve()
      }
    })
  }

  renderNode(key, title, choice, truncated) {
    return (
      <TreeNode
        key={key}
        title={title}
        className={
          choice != null ?
          choice : (truncated ? 'truncated' : 'undecided')
        }
        isLeaf={key.split('-').length > 3}
      >
        {[]}
      </TreeNode>
    )
  }

  async refresh(key, depth) {
    for (let i = -1; i >= -depth; i--) {
      let node = this.findTreeNode(
        key.slice(0, i).map(i => i.join(",")).join("-")
      )

      while (node.props.children.length > 0) {
        node.props.children.pop()
      }
    }

    await this.getIndices(key)
    this.findTreeNode(
      key.slice(0, -depth).map(i => i.join(",")).join("-")
    ).forceUpdate()
  }

  buildNodeTree() {
    return this.props.db.all(
      "SELECT \
      protein_sets.protein_set_id, protein_sets.protein_set_name \
      \
      FROM protein_sets \
      \
      ORDER BY protein_sets.protein_set_name",
      [],
      (err, rows) => {
        if (err != null || rows == null) {
          console.error(err)
          return
        }

        this.setState({
          tree: rows.map(
            row => {
              return {
                name: row.protein_set_name,
                nodeId: [row.protein_set_id]
              }
            }
          )
        })
      }
    )
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
              isLeaf={base.split('-').length > 3}
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
            isLeaf={base.split('-').length > 3}
          >
            {[]}
          </TreeNode>
        )
      })
    }

    let tree = this.state.tree

    if (this.treeNodes == null || !this.notReRender) {
      this.treeNodes = (
        tree.length > 0 &&
        <Tree
          showLine
          onSelect={this.update.bind(this)}
          loadData={this.loadData.bind(this)}
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
  db: PropTypes.object,

  updateAllCallback: PropTypes.func,

  selectedNode: PropTypes.array,
}

ScanSelectionList.defaultProps = {
  db: null,

  updateAllCallback: null,

  selectedNode: [],
}

module.exports = ScanSelectionList
