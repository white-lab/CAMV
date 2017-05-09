
import * as d3 from "d3"

class MassSpectrum {
  constructor(elemid, data, options) {
    this.elemid = elemid
    this.chart = document.getElementById(elemid)
    console.log(this.elemid, this.chart)

    this.cx = this.chart.clientWidth
    this.cy = this.chart.clientHeight

    this.options = options || {}
    this.options.xmax = options.xmax || 30
    this.options.xmin = options.xmin || 0
    this.options.ymax = options.ymax || 10
    this.options.ymin = options.ymin || 0
    this.options.isolationWindow = options.isolationWindow || []
    this.options.hideLabels = options.hideLabels || false

    this.padding = {
       "top":    this.options.title  ? 40 : 20,
       "right":                 30,
       "bottom": this.options.xlabel ? 60 : 30,
       "left":   this.options.ylabel ? 70 : 45
    }

    this.size = {
      "width":  this.cx - this.padding.left - this.padding.right,
      "height": this.cy - this.padding.top  - this.padding.bottom
    }

    this.data = data
    if (data.length > 0) {
    // } else {
    //   this.data = [{mz: 1, into: 1000}, {mz: 10, into: 10000}, {mz: 50, into: 50000}, {mz: 90, into: 90000}]
    //   this.options.ymax = 100000
    }

    // x-scale
    this.x = d3.scaleLinear()
        .domain([this.options.xmin, this.options.xmax])
        .range([0, this.size.width])

    // y-scale (inverted domain)
    this.y = d3.scaleLinear()
      .domain([this.options.ymax, this.options.ymin])
      .range([0, this.size.height])

    this.vis = d3.select(this.chart).append("svg")
      .attr('id', elemid + '_vis')
      .attr("width",  this.cx)
      .attr("height", this.cy)
      .append("g")
        .attr("transform", `translate(${this.padding.left}, ${this.padding.top})`)

    this.plot = this.vis.append("rect")
      .attr("width", this.size.width)
      .attr("height", this.size.height)
      .style("fill", "#FFFFFF")

    this.scaler = d3.zoom()
      .translateExtent([
        [this.x(this.options.xmin), this.y(this.options.ymin)],
        [this.x(this.options.xmax), this.y(this.options.ymax)],
      ])
      .scaleExtent([1, 100000])
      .on("zoom", this.zoomed())

    this.plot.call(this.scaler)

    this.yAxis = d3.axisLeft(this.y)
      .tickFormat(d3.format(".0e"))

    this.gY = this.vis.append("g")
      .attr("transform", "translate(0, 0)")
      .call(this.yAxis)

    this.xAxis = d3.axisBottom(this.x)
    this.gX = this.vis.append("g")
      .attr("transform", `translate(0, ${this.size.height})`)
      .call(this.xAxis)

    // Add the x-axis label
    if (this.options.xlabel) {
      this.vis.append("text")
        .attr("class", "axis")
        .text(this.options.xlabel)
        .attr("x", this.size.width/2)
        .attr("y", this.size.height)
        .attr("dy","2.4em")
        .style("text-anchor","middle")
    }

    // add y-axis label
    if (this.options.ylabel) {
      this.vis.append("g").append("text")
        .attr("class", "axis")
        .text(this.options.ylabel)
        .style("text-anchor","middle")
        .attr("transform", `translate(-40, ${this.size.height/2}) rotate(-90)`)
    }

    // add Chart Title
    if (this.options.title) {
      this.vis.append("text")
        .attr("class", "axis")
        .text(this.options.title)
        .attr("x", this.size.width / 2)
        .attr("dy","-0.8em")
        .style("text-anchor", "middle")
    }

    this.drawBars(this.data, this.x, this.y)
  }

  drawBars(data, x, y) {
    if (
      this.options.isolationWindow.length > 0 &&
      x.domain()[1] > this.options.isolationWindow[0] &&
      x.domain()[0] < this.options.isolationWindow[1]
    ) {
      let isolationData = [
        [
          Math.max(x.domain()[0], this.options.isolationWindow[0]),
          Math.min(x.domain()[1], this.options.isolationWindow[1]),
          y.domain()[0],
          y.domain()[1],
        ],
      ]

      this.isolationWindow = this.vis.selectAll(".rect")
          .data(isolationData)
	      .enter().append("rect")
          .attr('x', d => x(d[0]))
          .attr('y', d => y(d[2]))
        	.attr("width", d => x(d[1]) - x(d[0]))
        	.attr("height", d => y(d[3]) - y(d[2]))
          .attr('fill', "#f5c4b8")
          .attr('stroke', '#dc3912')
    }

    this.bar_width = 2

    if (data.length > 0) {
      this.bars = this.vis.selectAll("bar")
          .data(data)
        .enter().append("rect")
          .attr('x', (d) => { return x(d.mz) - this.bar_width / 2})
          .attr('y', (d) => { return y(d.into) })
          .attr("class", "r")
          .attr('width', this.bar_width)
          .attr("height", (d) => { return this.size.height - y(d.into) })
          .attr('fill', '#3366cc')
          .on('click', (d) => this.clicked(d))

      let scatterPoints = data.filter(i => i.visible)
      let shapes = {
        circle: d3.symbolCircle,
        star: d3.symbolStar,
        cross: d3.symbolCross,
        diamond: d3.symbolDiamond,
        square: d3.symbolSquare,
        triangle: d3.symbolTriangle,
        wye: d3.symbolWye,
      }

      this.scatter = this.vis.selectAll(".symbol")
          .data(scatterPoints)
        .enter().append("path")
          .attr("transform", (d) => `translate(${x(d.mz)}, ${y(d.into)})`)
          .attr('d', d3.symbol().size((d) => 10 * d.size).type((d) => shapes[d.shape] || d3.symbolCircle))
          .attr('fill', (d) => d.color)
          .on('click', (d) => this.clicked(d))

      if (!this.options.hideLabels) {
        this.scatterText = this.vis.selectAll(".text")
            .data(scatterPoints)
          .enter().append('text')
            .text((d) => d.name)
            .attr('x', (d) => x(d.mz))
            .attr('y', (d) => y(d.into))
            .attr('dx', 4)
            .style('text-anchor', 'start')
            // .attr("transform", (d) => `rotate(-90) translate(${x(d.mz)}, ${y(d.into)})`)
            .attr("class", "shadow")
            .attr('fill', '#3366cc')
            .on('click', (d) => this.clicked(d))
      }
    }
  }

  clicked(d) {
    if (this.options.clickCallback != null) {
      let peak = this.data.find(
        peak => peak.mz === d.mz
      )
      this.options.clickCallback(peak)
    }
  }

  zoomed() {
    return () => {
      let newx = d3.event.transform.rescaleX(this.x)

      if (newx.domain()[0] < this.options.xmin) {
        newx = newx.domain([
          this.options.xmin,
          newx.domain()[1] + this.options.xmin - newx.domain()[0],
        ])
      }

      if (newx.domain()[1] > this.options.xmax) {
        newx = newx.domain([
          newx.domain()[0] + newx.domain()[1] - this.options.xmax,
          newx.domain()[1],
        ])
      }

      let newData = this.data.filter(i => i.mz >= newx.domain()[0] && i.mz <= newx.domain()[1])
      let maxY = (
        newData.length > 0 ?
        Math.max.apply(null, newData.map(d => d.into)) :
        this.options.ymax
      )
      let newy = this.y.domain([maxY * 1.1, 0])

      this.gX.call(this.xAxis.scale(newx))
      this.gY.call(this.yAxis.scale(newy))

      if (this.bars != null) {
        this.bars.remove()
      }

      if (this.scatter != null) {
        this.scatter.remove()
      }

      if (this.scatterText != null) {
        this.scatterText.remove()
      }

      if (this.isolationWindow != null) {
        this.isolationWindow.remove()
      }

      this.drawBars(newData, newx, newy)
    }
  }

  remove() {
    d3.select(`#${this.elemid}_vis`).remove()
  }
}

module.exports = MassSpectrum
