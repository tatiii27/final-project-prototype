const storyData = {
  africa: {
    "1960s": {
      secondary: { girls: 11, boys: 16 },
      tertiary: { girls: 1, boys: 2 },
    },
    "2010s": {
      secondary: { girls: 39, boys: 46 },
      tertiary: { girls: 7.5, boys: 10 },
    },
  },
  asia: {
    "1960s": {
      secondary: { girls: 13, boys: 32 },
      tertiary: { girls: 2, boys: 7 },
    },
    "2010s": {
      secondary: { girls: 66, boys: 66 },
      tertiary: { girls: 21, boys: 22 },
    },
  },
  mena: {
    "1960s": {
      secondary: { girls: 18, boys: 35 },
      tertiary: { girls: 4, boys: 8 },
    },
    "2010s": {
      secondary: { girls: 77, boys: 81 },
      tertiary: { girls: 38, boys: 37 },
    },
  },
  europe: {
    "1960s": {
      secondary: { girls: 80, boys: 83 },
      tertiary: { girls: 24, boys: 25 },
    },
    "2010s": {
      secondary: { girls: 100, boys: 100 },
      tertiary: { girls: 72, boys: 61 },
    },
  },
  latam: {
    "1960s": {
      secondary: { girls: 27, boys: 29 },
      tertiary: { girls: 5, boys: 9 },
    },
    "2010s": {
      secondary: { girls: 97, boys: 91 },
      tertiary: { girls: 54, boys: 42 },
    },
  },
  na: {
    "1960s": {
      // secondary missing in text; we only show tertiary
      tertiary: { girls: 39, boys: 56 },
    },
    "2010s": {
      secondary: { girls: 99, boys: 99 },
      tertiary: { girls: 102, boys: 74 },
    },
  },
  oceania: {
    "1960s": {
      secondary: { girls: 76, boys: 77 },
      tertiary: { girls: 12, boys: 20 },
    },
    "2010s": {
      secondary: { girls: 125, boys: 125 },
      tertiary: { girls: 111, boys: 78 },
    },
  },
};

document.addEventListener("DOMContentLoaded", () => {
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "story-tooltip")
    .style("position", "fixed")
    .style("pointer-events", "none")
    .style("padding", "6px 10px")
    .style("border-radius", "8px")
    .style("background", "rgba(15,23,42,0.95)")
    .style("color", "#f9fafb")
    .style("font-size", "12px")
    .style("line-height", "1.4")
    .style("opacity", 0);

  const maxPercent = 130; // to cover 125% cases

  const steps = document.querySelectorAll(".region-step");
  steps.forEach((step) => {
    const regionKey = step.dataset.region;
    const regionObj = storyData[regionKey];
    if (!regionObj) return;

    const periodEls = step.querySelectorAll(".region-period");
    periodEls.forEach((periodEl) => {
      const periodKey = periodEl.dataset.period;
      const metrics = regionObj[periodKey];
      if (!metrics) return;

      const container = periodEl.querySelector(".mini-chart");
      drawMiniChart(container, metrics, maxPercent, tooltip);
    });
  });
});

function drawMiniChart(containerEl, metricsObj, maxPercent, tooltip) {
  const metricNames = Object.keys(metricsObj);
  if (!metricNames.length) return;

  const width = 260;
  const barHeight = 10;
  const rowGap = 20;
  const height = metricNames.length * rowGap + 10;

  const svg = d3
    .select(containerEl)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const g = svg.append("g").attr("transform", "translate(80,8)");

  const x = d3.scaleLinear().domain([0, maxPercent]).range([0, width - 100]);

  // metric labels
  g.selectAll(".metric-label")
    .data(metricNames)
    .enter()
    .append("text")
    .attr("class", "metric-label")
    .attr("x", -8)
    .attr("y", (d, i) => i * rowGap + barHeight)
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "middle")
    .text((d) =>
      d === "secondary"
        ? "Secondary"
        : d === "tertiary"
        ? "Tertiary"
        : d
    );

  const rows = g
    .selectAll(".metric-row")
    .data(metricNames)
    .enter()
    .append("g")
    .attr("class", "metric-row")
    .attr("transform", (d, i) => `translate(0,${i * rowGap})`);

  // GIRLS bars
  rows
    .append("rect")
    .attr("class", "bar-girls")
    .attr("x", 0)
    .attr("y", 0)
    .attr("height", barHeight)
    .attr("width", 0)
    .attr("rx", 4)
    .on("mouseenter", (event, key) => {
      const m = metricsObj[key];
      const girls = m.girls;
      const boys = m.boys;
      const diff = boys - girls;
      const aheadText =
        diff > 0
          ? `Boys ahead by ${diff.toFixed(1)}%`
          : diff < 0
          ? `Girls ahead by ${Math.abs(diff).toFixed(1)}%`
          : "No gender gap";

      tooltip
        .style("opacity", 1)
        .html(
          `<strong>${key === "secondary" ? "Secondary" : "Tertiary"}</strong><br>
           Girls: ${girls.toFixed(1)}%<br>
           Boys: ${boys.toFixed(1)}%<br>
           <span style="color:#e5e7eb">${aheadText}</span>`
        );
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", event.clientX + 16 + "px")
        .style("top", event.clientY - 20 + "px");
    })
    .on("mouseleave", () => tooltip.style("opacity", 0))
    .transition()
    .duration(900)
    .attr("width", (key) => x(metricsObj[key].girls));

  // BOYS bars
  rows
    .append("rect")
    .attr("class", "bar-boys")
    .attr("x", 0)
    .attr("y", barHeight + 3)
    .attr("height", barHeight)
    .attr("width", 0)
    .attr("rx", 4)
    .on("mouseenter", (event, key) => {
      const m = metricsObj[key];
      const girls = m.girls;
      const boys = m.boys;
      const diff = boys - girls;
      const aheadText =
        diff > 0
          ? `Boys ahead by ${diff.toFixed(1)}%`
          : diff < 0
          ? `Girls ahead by ${Math.abs(diff).toFixed(1)}%`
          : "No gender gap";

      tooltip
        .style("opacity", 1)
        .html(
          `<strong>${key === "secondary" ? "Secondary" : "Tertiary"}</strong><br>
           Girls: ${girls.toFixed(1)}%<br>
           Boys: ${boys.toFixed(1)}%<br>
           <span style="color:#e5e7eb">${aheadText}</span>`
        );
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", event.clientX + 16 + "px")
        .style("top", event.clientY - 20 + "px");
    })
    .on("mouseleave", () => tooltip.style("opacity", 0))
    .transition()
    .delay(200)
    .duration(900)
    .attr("width", (key) => x(metricsObj[key].boys));

  // tiny axis line
  g.append("line")
    .attr("x1", 0)
    .attr("x2", width - 100)
    .attr("y1", metricNames.length * rowGap + 2)
    .attr("y2", metricNames.length * rowGap + 2)
    .attr("stroke", "rgba(148,163,184,0.5)")
    .attr("stroke-width", 0.5);
}
