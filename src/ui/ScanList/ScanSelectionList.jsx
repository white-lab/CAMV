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

  componentWillUpdate(nextProps, nextState) {
    this.notReRender = nextState.tree == this.state.tree
  }

  async componentDidUpdate(prevProps, prevState) {
    if (
      prevProps.db != this.props.db &&
      this.props.db != null
    ) {
      this.buildNodeTree()
    }

    if (!cmp(prevProps.selectedNode, this.props.selectedNode)) {
      if (!cmp(prevProps.selectedNode, this.state.selectedNode)) {
        let tree = this.refs["tree"]

        if (tree != null) {
          // Add nodes to tree
          let indices = await this.getIndices(this.props.selectedNode)

          // Select and expand nodes
          let key = this.props.selectedNode.map(i => i.join(",")).join("-")

          tree.setState({
            expandedKeys: this.toExpandKeys(this.props.selectedNode),
            selectedKeys: [key],
          })

          // Scroll into view
          this.findTreeDOMNode(indices).scrollIntoViewIfNeeded()
        }
      }

      this.setState({
        selectedNode: this.props.selectedNode,
      })
    }
  }

  findTreeNode(ref) {
    let treeNode = this.refs["tree"]
    let runningKey = ''

    for (const key of ref.split('-')) {
      if (treeNode === undefined) { break }
      runningKey = `${runningKey}${runningKey.length>0 ? '-' : ''}${key}`
      treeNode = treeNode.props.children.find(i => i.key == runningKey)
    }

    return treeNode
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

  findTreeDOMNode(indices) {
    // Can't get the treeNode DOM directly, but we can find it by iterating
    // over the tree's <ul> and <li> elements
    let node = ReactDOM.findDOMNode(this.refs["tree"])
    for (let index of indices.slice(0, -1)) {
      node = node.children[index].children[2]
    }
    return node.children[indices[indices.length - 1]].children[1]
  }

  async selectNode(nodes) {
    let tree = this.refs["tree"]
    if (tree != null) {
      let key = nodes.map(i => i.join(",")).join("-")

      tree.setState({
        expandedKeys: this.toExpandKeys(nodes),
        selectedKeys: [key]
      })

      let indices = await this.getIndices(nodes)
      this.findTreeDOMNode(indices).scrollIntoViewIfNeeded()
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
    let node = this.refs["tree"]
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

    let node = this.refs['tree']
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

    let node = this.refs["tree"]
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

  async handleSelect(desc) {
    let indices = await this.getIndices(this.state.selectedNode)

    if (indices.length < 1) {
      indices = [0]
    }

    let mapping = {
      'left': this.selectLeft.bind(this),
      'right': this.selectRight.bind(this),
      'up': this.selectUp.bind(this),
      'down': this.selectDown.bind(this),
      'next': this.selectNext.bind(this),
      'previous': this.selectPrevious.bind(this),
    }

    indices = await mapping[desc](indices)
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

        let key = `${treeNode.props.eventKey || treeNode.key}-${row.peptide_id},${row.mod_state_id}`

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
    this.refs["tree"].forceUpdate()
  }

  buildNodeTree() {
    return this.props.db.all(
      "SELECT \
      protein_sets.protein_set_id, protein_sets.protein_set_accession \
      \
      FROM protein_sets \
      \
      ORDER BY protein_sets.protein_set_accession",
      [],
      (err, rows) => {
        if (err != null || rows == null) {
          console.error(err)
          return
        }

        this.setState({
          tree: rows.map(
            row => {
              let name = Array.from(
                new Set(row.protein_set_accession.split(' / ').map(i => i.split("_")[0]))
              ).sort().join(" / ")

              return {
                name: name,
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
