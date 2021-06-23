class VisProjectTimeline {
  constructor({ el, data, title }) {
    this.el = el;
    this.data = data;
    this.title = title;
    this.resizeVis = this.resizeVis.bind(this);
    this.initVis();
  }

  initVis() {
    this.parseTime = d3.timeParse("%Y-%m-%d");
    this.formatTime = d3.timeFormat("%d %B %Y");

    this.gradientId = "project-timeline-gradient";

    this.orders = {
      Start: (a, b) => d3.ascending(a.startDate, b.startDate),
      End: (a, b) =>
        d3.descending(a.endDate, b.endDate) ||
        d3.descending(a.startDate, b.startDate),
      Duration: (a, b) =>
        d3.descending(a.endDate - a.startDate, b.endDate - b.startDate),
    };
    this.selectedOrder = Object.keys(this.orders)[0];

    this.lineWidth = 2;
    this.dotRadius = 3;
    this.margin = {
      top: 16,
      right: this.dotRadius,
      bottom: 16,
      left: 96,
    };
    this.height = this.margin.top + this.lineWidth + this.margin.bottom;

    this.x = d3.scaleTime();

    this.container = d3
      .select(this.el)
      .classed("vis vis-project-timeline", true)
      .on("click", () => {});
    this.title = this.container
      .append("h4")
      .attr("class", "vis-timeline-title text-is-h4")
      .text(this.title);
    this.orderBySelect = this.container
      .append("div")
      .attr("class", "vis-timeline-order-by-control")
      .call((div) =>
        div
          .append("label")
          .attr("class", "vis-timeline-order-by-label")
          .text("Order by ")
          .attr("for", "vis-timeline-order-by-select")
      )
      .call((div) =>
        div
          .append("select")
          .on("change", (event) => {
            this.selectedOrder = event.currentTarget.value;
            this.sortData();
          })
          .attr("class", "vis-timeline-order-by-select")
          .selectAll("option")
          .data(Object.keys(this.orders))
          .join("option")
          .attr("value", (d) => d)
          .text((d) => d)
      );
    this.legend = this.container
      .append("div")
      .attr("class", "vis-timeline-legend");
    this.renderLegend();
    this.xAxis = this.container
      .append("div")
      .attr("class", "vis-timeline-x-axis text-is-xxs");
    this.timeline = this.container
      .append("div")
      .attr("class", "vis-timeline  color-label text-is-xxs");

    this.tooltip = new VisTooltip({
      container: this.container,
      direction: "right",
      className: "vis-project-timeline",
      yOffset: 12,
    });

    window.addEventListener("resize", this.resizeVis);
    this.resizeVis();
    this.wrangleData();
  }

  resizeVis() {
    this.width = this.xAxis.node().clientWidth;
    this.x.range([this.margin.left, this.width - this.margin.right]);
    if (this.displayData) this.updateVis();
  }

  wrangleData() {
    const accessor = {
      id: (d, i) => i,
      title: (d) => d["PROJECT TITLE"].trim(),
      startDate: (d) => this.parseTime(d["START DATE"].trim()),
      endDate: (d) =>
        d["STATUS"].trim() === "Ongoing"
          ? new Date()
          : this.parseTime(d["END DATE"].trim()),
      status: (d) => d["STATUS"].trim(),
    };
    this.displayData = this.data
      .map((d, i) =>
        Object.keys(accessor).reduce((e, key) => {
          e[key] = accessor[key](d, i);
          return e;
        }, {})
      )
      .sort((a, b) => d3.ascending(a.startDate, b.startDate));

    this.x.domain([
      d3.min(this.displayData, (d) => d.startDate),
      d3.max(this.displayData, (d) => d.endDate),
    ]);

    this.sortData();
  }

  sortData() {
    this.sortedDisplayData = this.displayData
      .slice()
      .sort(this.orders[this.selectedOrder]);
    this.updateVis();
  }

  updateVis() {
    this.renderXAxis();
    this.renderTimeline();
  }

  renderLegend() {
    const svgLegend = this.legend
      .append("svg")
      .attr("width", 180)
      .attr("height", 24);
    svgLegend
      .append("defs")
      .append("linearGradient")
      .attr("id", this.gradientId)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0)
      .attr("x2", 180 - this.dotRadius)
      .selectAll("stop")
      .data(["#14142B", "#D9DBE9"])
      .join("stop")
      .attr("stop-color", (d) => d)
      .attr("offset", (d, i) => (i ? "100%" : "0%"));
    svgLegend
      .append("path")
      .attr("class", "vis-timeline-legend__path")
      .attr("fill", "none")
      .attr("stroke", `url(#${this.gradientId})`)
      .attr("stroke-width", this.lineWidth)
      .attr("d", `M0,4 L${180 - this.dotRadius},4`);
    svgLegend
      .append("circle")
      .attr("class", "vis-timeline-legend__dot color-slate")
      .attr("fill", "currentColor")
      .attr("r", this.dotRadius)
      .attr("cx", 180 - this.margin.right)
      .attr("cy", 4 + this.lineWidth / 2 - this.dotRadius / 2);
    svgLegend
      .selectAll(".vis-timeline-legend__label")
      .data(["Start", "End"])
      .join("text")
      .attr("class", "vis-timeline-legend__label text-is-body10")
      .attr("x", (d, i) => (i ? 180 : 0))
      .attr("y", 16)
      .attr("dy", "0.71em")
      .attr("text-anchor", (d, i) => (i ? "end" : "start"))
      .text((d) => d);
  }

  renderXAxis() {
    const svgXAxis = this.xAxis
      .selectAll("svg")
      .data([0])
      .join("svg")
      .attr("viewBox", [0, 0, this.width, 16]);

    const gXAxis = svgXAxis
      .selectAll(".axis")
      .data([0])
      .join("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,20)`);

    gXAxis
      .call(
        d3
          .axisTop(this.x)
          .ticks((this.width - this.margin.left - this.margin.right) / 80)
      )
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick")
          .call((g) => g.select("line").remove())
          .call((g) => g.select("text").classed("text-is-xxs text-bold", true))
      );
  }

  renderTimeline() {
    this.timelineItem = this.timeline
      .style("height", `${this.displayData.length * this.height}px`)
      .selectAll(".vis-timeline-item")
      .data(this.sortedDisplayData, (d) => d.id)
      .join((enter) =>
        enter
          .append("div")
          .attr("class", "vis-timeline-item")
          .style("transform", (d, i) => `translateY(${i * this.height}px)`)
          .call((item) =>
            item
              .append("div")
              .attr("class", "vis-timeline-item__title text-is-xxs")
          )
          .call((item) =>
            item.append("div").attr("class", "vis-timeline-item__anchor")
          )
          .call((item) =>
            item
              .append("svg")
              .attr("class", "vis-timeline-item__body")
              .call((svg) =>
                svg
                  .append("defs")
                  .append("linearGradient")
                  .attr("id", (d) => `${this.gradientId}-${d.id}`)
                  .attr("gradientUnits", "userSpaceOnUse")
                  .selectAll("stop")
                  .data(["#14142B", "#D9DBE9"])
                  .join("stop")
                  .attr("stop-color", (d) => d)
                  .attr("offset", (d, i) => (i ? "100%" : "0%"))
              )
          )
          .on("mouseover", (event, d) => {
            const item = d3.select(event.currentTarget);
            item
              .select(".vis-timeline-item__title")
              .classed("color-slate", true);
            this.tooltip.show(this.tooltipTimelineItemContent(d)).move({
              target: item.select(".vis-timeline-item__anchor"),
            });
          })
          .on("mouseout", (event, d) => {
            d3.select(event.currentTarget)
              .select(".vis-timeline-item__title")
              .classed("color-slate", false);
            this.tooltip.hide();
          })
      );

    this.timelineItem
      .transition()
      .duration(500)
      .delay((d, i) => i * 20)
      .style("transform", (d, i) => `translateY(${i * this.height}px)`);

    this.timelineItem
      .select(".vis-timeline-item__title")
      .style("width", (d) => `${this.x(d.startDate)}px`)
      .text((d) => d.title);

    this.timelineItem
      .select(".vis-timeline-item__anchor")
      .style("left", (d) => `${this.x(d.startDate)}px`);

    const svg = this.timelineItem
      .select(".vis-timeline-item__body")
      .attr("width", (d) => this.width - this.x(d.startDate))
      .attr("height", this.height);
    svg
      .select("linearGradient")
      .attr("x1", 0)
      .attr("x2", (d) => this.x(d.endDate) - this.x(d.startDate));
    svg
      .selectAll(".vis-timeline-item__path")
      .data((d) => [d])
      .join((enter) =>
        enter
          .append("path")
          .attr("class", "vis-timeline-item__path")
          .attr("fill", "none")
          .attr("stroke", (d) => `url(#${this.gradientId}-${d.id})`)
          .attr("stroke-width", this.lineWidth)
      )
      .attr(
        "d",
        (d) =>
          `M0,${this.margin.top + this.lineWidth / 2} L${
            this.x(d.endDate) - this.x(d.startDate)
          },${this.margin.top + this.lineWidth / 2}`
      );
    svg
      .selectAll(".vis-timeline-item__dot")
      .data((d) => [d].filter((d) => d.status !== "Ongoing"))
      .join((enter) =>
        enter
          .append("circle")
          .attr("class", "vis-timeline-item__dot color-slate")
          .attr("fill", "currentColor")
          .attr("r", this.dotRadius)
          .attr("cy", this.margin.top + this.lineWidth / 2)
      )
      .attr("cx", (d) => this.x(d.endDate) - this.x(d.startDate));
  }

  tooltipTimelineItemContent(d) {
    let html = "";
    // Status
    html += `<div class="item-chip color-placeholder">${d.status}</div>`;
    // Title
    html += `<div class="item-title color-off-white text-bold">${d.title}</div>`;
    // Dates
    html += `
      <div class="tooltip-item">
        <div class="color-placeholder">timeline</div>
        <div class="color-input">${[
          this.formatTime(d.startDate),
          d.status === "Ongoing" ? "" : this.formatTime(d.endDate),
        ].join(" – ")}</div>
      </div>
    `;
    return html;
  }
}
