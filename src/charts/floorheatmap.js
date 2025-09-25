// Zone geometry configuration
const zoneGeometry = {
  "1_trim_1": { x: 13.45, y: 6.5, width: 9.55, height: 4 },
  "2_trim_2": { x: 27.35, y: 6.5, width: 9.55, height: 4 },
  "3_chassis_1": { x: 20.4, y: 12.1, width: 16.5, height: 4 },
  "4_chassis_2": { x: 13.45, y: 17.65, width: 9.55, height: 4 },
  "5_engine": { x: 13.45, y: 23.15, width: 9.55, height: 4 },
  "6_final": { x: 27.35, y: 17.65, width: 9.55, height: 4 },
  "7_inspect": { x: 27.35, y: 23.15, width: 9.55, height: 4 },
};

// Scales setup
const xscale = d3.scaleLinear().domain([0, 50]).range([0, 1440]);
const yscale = d3.scaleLinear().domain([0, 33.79]).range([0, 974]);

// Optimal ranges for each metric
const optimalRanges = {
  pm2_5: { min: 0, max: 25 },
  pm10: { min: 0, max: 50 },
  co2: { min: 400, max: 1000 },
  ta: { min: 18, max: 27 },
  rh: { min: 35, max: 50 },
};

// Metric name mapping
const metricNames = {
  pm2_5: "PM2.5 (µg/m³) ",
  pm10: "PM10 (µg/m³)",
  co2: "Carbon Dioxide (ppm)",
  ta: "Temperature (°C)",
  rh: "Relative Humidity (%)",
};

let metricFullName;

// Main initialization
document.addEventListener("DOMContentLoaded", function () {
  loadAndProcessData();
  setupEventListeners();
});

async function loadAndProcessData() {
  try {
    const rawData = await d3.csv("SAMBA_cleaned_data_NEW.csv", rowConverter);
    window.rawData = rawData;
    updateVisualization("rh");
  } catch (error) {
    console.error("Error loading data:", error);
  } finally {
    document.getElementById("loading-spinner").style.display = "none"; // Hide spinner
  }
}

function rowConverter(d) {
  return {
    zone_id: d.zone_id,
    pm2_5: parseFloat(d.pm2_5),
    ta: parseFloat(d.ta),
    rh: parseFloat(d.rh),
    co2: parseFloat(d.co2),
    pm10: parseFloat(d.pm10),
  };
}

function updateVisualization(metric = "rh") {
  const aggregatedData = Array.from(
    d3.rollup(
      window.rawData,
      (v) => d3.mean(v, (d) => d[metric]),
      (d) => d.zone_id
    ),
    ([zone_id, value]) => ({
      zone: zone_id,
      value: value,
      ...zoneGeometry[zone_id],
    })
  ).filter((d) => d.x !== undefined); // Filter out unknown zones

  window.heatmapData = aggregatedData;
  drawHeatmap(window.heatmapData, metric);
}

function drawHeatmap(data, metric) {
  d3.select("#overview-heatmap").selectAll("svg").remove();
  const svg = d3
    .select("#overview-heatmap")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", "0 0 1550 974")
    .attr("transform", "translate(-20, 0)");

  // Add background image
  svg
    .append("image")
    .attr("href", "overview.svg")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 1440)
    .attr("height", 974);

  // Add chart title
  metricFullName = metricNames[metric] || metric; // Get full name or use variable name if not found

  svg
    .append("text")
    .attr("x", 745) // Center the title horizontally
    .attr("y", 75) // Position the title from the top
    .attr("text-anchor", "middle") // Center the text
    .style("fill", "black")
    .style("font-family", "monospace")
    .style("font-size", "2.5em")
    .style("font-weight", "bold")
    .text(`Overview of Facility: ${metricFullName} Levels`);

  // Color scale setup
  const values = data.map((d) => d.value);
  const dataMin = d3.min(values);
  const dataMax = d3.max(values);

  // Set legendMin and legendMax, possibly with padding or optimal ranges
  let legendMin = dataMin;
  let legendMax = dataMax;

  // If you want to extend the legend range:
  if (optimalRanges[metric]) {
    legendMin = Math.min(legendMin, optimalRanges[metric].min);
    legendMax = Math.max(legendMax, optimalRanges[metric].max);
  }
  const range = legendMax - legendMin;
  legendMin -= range * 0.1;
  legendMax += range * 0.1;

  // Define color scales for different metrics
  const colorScales = {
    pm2_5: d3
      .scaleSequential()
      .domain([legendMax, legendMin])
      .interpolator(d3.interpolateViridis),
    pm10: d3
      .scaleSequential()
      .domain([legendMax, legendMin])
      .interpolator(d3.interpolateViridis),
    co2: d3
      .scaleSequential()
      .domain([legendMax, legendMin])
      .interpolator(d3.interpolatePlasma),
    ta: d3
      .scaleSequential()
      .domain([legendMax, legendMin])
      .interpolator(d3.interpolateRdYlBu),
    rh: d3
      .scaleSequential()
      .domain([legendMax, legendMin])
      .interpolator(d3.interpolateRdYlGn),
  };

  // Select the color scale based on the current metric
  const colorScale =
    colorScales[metric] ||
    d3
      .scaleSequential()
      .domain([legendMax, legendMin])
      .interpolator(d3.interpolateViridis); // Default to Viridis
  // Draw heatmap rectangles
  svg
    .selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", (d) => xscale(d.x))
    .attr("y", (d) => yscale(d.y))
    .attr("width", (d) => xscale(d.width))
    .attr("height", (d) => yscale(d.height))
    .attr("fill", (d) => colorScale(d.value))
    .attr("opacity", 0.7)
    .on("mouseover", function () {
      d3.select(this)
        .transition()
        .duration(200)
        .style("filter", "drop-shadow(0px 0px 10px rgba(0,0,0,0.7))"); // Add glow effect
    })
    .on("mouseout", function () {
      d3.select(this).transition().duration(200).style("filter", "none"); // Remove glow effect
    })
    .on("click", function (event, d) {
      const button = document.getElementById(d.zone);
      if (button) button.click();

      d3.selectAll("rect").attr("stroke-width", 0);
      d3.select(this).attr("stroke", "cyan").attr("stroke-width", 3);
      console.log("Clicked zone:", d.zone);
    });

  // Add a group for each label
  const labelGroups = svg
    .selectAll("g.data-label-group")
    .data(data)
    .enter()
    .append("g")
    .attr("class", "data-label-group")
    .attr("transform", (d) => {
      const cx = xscale(d.x) + xscale(d.width) / 2;
      const cy = yscale(d.y) + yscale(d.height) / 2;
      const verticalOffset = 20; // Adjust this value to move the group up
      return `translate(${cx},${cy + verticalOffset})`;
    });

  const labelPadding = 24;
  const labelHeight = 32;

  labelGroups.each(function (d) {
    const group = d3.select(this);
    const value =
      d.value !== undefined && !isNaN(d.value) ? d.value.toFixed(1) : "N/A";
    // Defer measurement and drawing
    setTimeout(() => {
      const tempText = group
        .append("text")
        .attr("font-size", "1.5em")
        .attr("font-family", "monospace")
        .text(value);
      const textWidth = tempText.node().getBBox().width;
      tempText.remove();
      group
        .append("rect")
        .attr("x", -textWidth / 2 - labelPadding / 2)
        .attr("y", -labelHeight / 2)
        .attr("width", textWidth + labelPadding)
        .attr("height", labelHeight)
        .attr("rx", labelHeight / 2)
        .attr("fill", "#ffffff")
        .attr("stroke", "#000000")
        .attr("stroke-width", 1)
        .attr("opacity", 0.8);
      group
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "#000")
        .attr("font-size", "1.5em")
        .attr("font-family", "monospace")
        .text(value);
    }, 0);
  });
  // Adjust legend range to include optimal range, if it exists
  if (optimalRanges[metric]) {
    legendMin = Math.min(legendMin, optimalRanges[metric].min);
    legendMax = Math.max(legendMax, optimalRanges[metric].max);
  }

  // Update legend
  addLegend(svg, colorScale, legendMin, legendMax, metric);
}

function addLegend(svg, colorScale, legendMin, legendMax, metric) {
  svg.selectAll(".legend").remove();

  const legend = svg
    .append("g")
    .attr("class", "legend")
    .attr("transform", "translate(1265, 100)")
    .attr("font-family", "sans-serif")
    .attr("font-size", "1.15em");

  metricFullName = metricNames[metric] || metric;

  // Legend title
  legend
    .append("text")
    .attr("y", -30)
    .attr("x", 0)
    .style("font-size", "1.25em")
    .style("font-family", "monospace")
    .text(`${metricFullName}`);

  // Gradient legend
  const legendWidth = 50;
  const legendHeight = 800;

  // Unique gradient per legend
  const gradientId = `legend-gradient-${Math.random().toString(36).substr(2, 9)}`;
  const gradient = svg
    .append("defs")
    .append("linearGradient")
    .attr("id", gradientId)
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%");

  gradient
    .selectAll("stop")
    .data(
      colorScale.ticks().map((t, i, n) => ({
        offset: `${(100 * i) / n.length}%`,
        color: colorScale(t),
      }))
    )
    .enter()
    .append("stop")
    .attr("offset", (d) => d.offset)
    .attr("stop-color", (d) => d.color);

  legend
    .append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", `url(#${gradientId})`);

  // Scale for legend axis
  const yScale = d3
    .scaleLinear()
    // .domain([d3.min(colorScale.domain()), maxValue])
    .domain([legendMin, legendMax])
    .range([legendHeight, 0]);

  legend
    .append("g")
    .attr("transform", `translate(${legendWidth + 10}, 0)`)
    .call(d3.axisRight(yScale).ticks(10))
    .selectAll("text")
    .style("font-family", "monospace")
    .style("font-size", "2em");

  // --- Highlight optimal range ---
  const range = optimalRanges[metric];
  if (range) {
    // Map optimal range to legend position
    const yMin = yScale(range.max);
    const yMax = yScale(range.min);

    // Draw a green border or highlight for optimal range
    legend
      .append("rect")
      .attr("x", -5)
      .attr("y", yMin)
      .attr("width", legendWidth + 10)
      .attr("height", yMax - yMin)
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-dasharray", "6, 8")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 4);

    // Add explicit labels
    legend
      .append("text")
      .attr("x", legendWidth + 20)
      .attr("y", yMin + 50)
      .style("fill", "red")
      .style("font-size", "1.25em")
      .style("font-family", "monospace")
      .text(`Optimal: ${range.min}-${range.max}`);
  }
}

function setupEventListeners() {
  // Replace metric selector dropdown with buttons
  document.querySelectorAll(".metric-btn").forEach((button) => {
    button.addEventListener("click", function () {
      // Remove active class from all buttons
      document.querySelectorAll(".metric-btn").forEach((btn) => {
        btn.classList.remove("active");
      });
      // Add active class to clicked button
      this.classList.add("active");
      // Update visualization with selected metric
      updateVisualization(this.dataset.metric);
    });
  });

  // Zone filtering buttons
  const buttons = [
    "ReturnToOverview",
    "1_trim_1",
    "2_trim_2",
    "3_chassis_1",
    "4_chassis_2",
    "5_engine",
    "6_final",
    "7_inspect",
  ];

  buttons.forEach((btnId) => {
    document.getElementById(btnId).addEventListener("click", function () {
      // Get current metric from active button instead of dropdown
      const currentMetric =
        document.querySelector(".metric-btn.active").dataset.metric;

      if (btnId === "ReturnToOverview") {
        updateVisualization(currentMetric);
      } else {
        const filteredData = window.heatmapData.filter((d) => d.zone === btnId);
        drawHeatmap(filteredData, currentMetric);
      }
    });
  });
}

export async function init() {
  console.log("floorheatmap init started");
  try {
    await loadAndProcessData();
    setupEventListeners();
    console.log("floorheatmap initialized successfully");
  } catch (error) {
    console.error("floorheatmap init failed:", error);
  }
}
