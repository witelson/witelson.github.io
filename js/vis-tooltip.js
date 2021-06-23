class VisTooltip {
  constructor({
    container,
    direction = "vertical",
    className = "",
    xOffset = 0,
    yOffset = 0,
  }) {
    this.container = container;
    this.direction = direction;
    this.className = className;
    this.xOffset = xOffset;
    this.yOffset = yOffset;
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.move = this.move.bind(this);
    this.init();
  }

  init() {
    this.container.classed("vis-tooltip-parent", true);
    this.tooltip = this.container
      .append("div")
      .attr("class", `vis vis-tooltip text-is-xxs ${this.className}`);
  }

  show(html) {
    this.tooltip.html(html).classed("is-visible", true);
    this.tooltipBCR = this.tooltip.node().getBoundingClientRect();
    this.containerBCR = this.container.node().getBoundingClientRect();
    return this;
  }

  hide() {
    this.tooltip.classed("is-visible", false);
    return this;
  }

  move({ target }) {
    const targetBCR = target.node().getBoundingClientRect();

    let x = 0,
      y = 0;

    if (["right", "left", "horizontal"].includes(this.direction)) {
      // Right
      if (this.direction !== "left") {
        x = targetBCR.x + targetBCR.width + this.xOffset - this.containerBCR.x;
      }

      // Left
      if (
        this.direction === "left" ||
        x + this.tooltipBCR.width > this.containerBCR.width // Not enough space for right
      ) {
        x =
          targetBCR.x -
          this.xOffset -
          this.containerBCR.x -
          this.tooltipBCR.width;
      }

      y =
        targetBCR.y + targetBCR.height / 2 + this.yOffset - this.containerBCR.y;
      if (y + this.tooltipBCR.height > this.containerBCR.height) {
        y = y - this.yOffset * 2 - this.tooltipBCR.height;
      } else if (y < 0) {
        y = 0;
      }
    }

    if (
      ["top", "bottom", "vertical"].includes(this.direction) ||
      x < 0 || // Not enough space for left
      x + this.tooltipBCR.width > this.containerBCR.width // Not enough space for right
    ) {
      // Top
      if (this.direction !== "bottom") {
        x =
          targetBCR.x +
          targetBCR.width / 2 -
          this.containerBCR.x -
          this.tooltipBCR.width / 2;
        y =
          targetBCR.y -
          this.yOffset -
          this.containerBCR.y -
          this.tooltipBCR.height;
      }

      // Bottom
      if (
        this.direction === "bottom" ||
        y < 0 // Not enough space for top
      ) {
        x =
          targetBCR.x +
          targetBCR.width / 2 -
          this.containerBCR.x -
          this.tooltipBCR.width / 2;
        y = targetBCR.y + targetBCR.height + this.yOffset - this.containerBCR.y;
      }

      if (x < 0) {
        x = 0;
      } else if (x + this.tooltipBCR.width > this.containerBCR.width) {
        x = this.containerBCR.width - this.tooltipBCR.width;
      }
    }

    this.tooltip.style("transform", `translate(${x}px,${y}px)`);

    return this;
  }
}
