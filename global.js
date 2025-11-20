// global.js
const WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/* =======================================
 * PART A: SCROLLYTELLING GLOBE (TOP)
 * =====================================*/
(function scrollyGlobe() {
  const container = document.getElementById("globe-container");
  if (!container) return; // safety

  const size = container.clientWidth || 760;
  const width = size;
  const height = size;
  const radius = Math.min(width, height) / 2 - 20;

  const svg = d3
    .select("#globe")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const projection = d3
    .geoOrthographic()
    .scale(radius)
    .translate([width / 2, height / 2])
    .clipAngle(90);

  const path = d3.geoPath(projection);
  const graticule = d3.geoGraticule();

  let rotation = [0, -20];
  projection.rotate(rotation);
  let isDragging = false;
  let lastDragPos = null;
  let lastRotation = null;

  // water + graticule
  svg.append("path")
    .datum({ type: "Sphere" })
    .attr("class", "water")
    .attr("d", path);

  svg.append("path")
    .datum(graticule())
    .attr("class", "graticule")
    .attr("d", path);

  const countriesLayer = svg.append("g").attr("id", "countries-layer");
  const annotationGroup = svg.append("g").attr("id", "annotation-group");

  // Regions for steps
  // Regions for steps (approximate lon, lat)
  const regionAnnotations = [
    { step: 0, name: "Africa",                      coords: [20, 5] },
    { step: 1, name: "Asia",                        coords: [90, 30] },
    { step: 2, name: "Middle East & North Africa",  coords: [35, 25] },
    { step: 3, name: "Europe",                      coords: [15, 50] },
    { step: 4, name: "Latin America & the Caribbean", coords: [-70, -10] },
    { step: 5, name: "Northern America",            coords: [-100, 40] },
    { step: 6, name: "Oceania",                     coords: [140, -25] },
  ];


  let countries = [];

  d3.json(WORLD_URL)
    .then(world => {
      countries = topojson.feature(world, world.objects.countries).features;

    countriesLayer
        .selectAll("path")
        .data(countries)
        .join("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("fill", "#444f7a")
        .attr("stroke", "white")
        .attr("stroke-width", 0.3);

      addDrag();    // you can still drag manually
      // No auto-rotation for scrolly globe
      initScrolly();

    })
    .catch(err => console.error("Scrolly globe world load error:", err));

  function addDrag() {
    svg.call(
      d3.drag()
        .on("start", (event) => {
          isDragging = true;
          lastDragPos = [event.x, event.y];
          lastRotation = rotation.slice();
        })
        .on("drag", (event) => {
          const dx = event.x - lastDragPos[0];
          const dy = event.y - lastDragPos[1];

          rotation[0] = lastRotation[0] + dx * 0.4;
          rotation[1] = lastRotation[1] - dy * 0.4;

          projection.rotate(rotation);
          render();
        })
        .on("end", () => {
          isDragging = false;
        })
    );
  }

  function startRotation() {
    const velocity = 0.02;
    d3.timer(() => {
      if (isDragging) return;
      rotation[0] += velocity;
      projection.rotate(rotation);
      render();
    });
  }

  function render() {
    svg.selectAll("path.water").attr("d", path);
    svg.selectAll("path.graticule").attr("d", path);
    countriesLayer.selectAll("path").attr("d", path);
    // annotation shapes re-projected in drawAnnotation
  }

  // Scrollytelling using IntersectionObserver
  function initScrolly() {
    const steps = document.querySelectorAll(".step");
    if (!steps.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const stepIndex = +el.dataset.step;

          steps.forEach((s) => s.classList.toggle("is-active", s === el));
          activateStep(stepIndex);
        });
      },
      {
        root: null,
        threshold: 0.6,
      }
    );

    steps.forEach((step) => observer.observe(step));
    activateStep(0);
  }

  function activateStep(stepIndex) {
    const region = regionAnnotations.find((r) => r.step === stepIndex);
    if (!region) {
      annotationGroup.selectAll("*").remove();
      return;
    }

    const [lon, lat] = region.coords;
    rotation = [-lon, -lat];
    projection.rotate(rotation);

    svg.selectAll("path.water").attr("d", path);
    svg.selectAll("path.graticule").attr("d", path);
    countriesLayer.selectAll("path").attr("d", path);

    drawAnnotation(region);
  }

  function drawAnnotation(region) {
    annotationGroup.selectAll("*").remove();

    const [x, y] = projection(region.coords);
    if (!isFinite(x) || !isFinite(y)) return;

    const labelOffsetX = 80;
    const labelOffsetY = -30;

    annotationGroup
      .append("circle")
      .attr("class", "annotation-dot")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", 5);

    annotationGroup
      .append("line")
      .attr("class", "annotation-line")
      .attr("x1", x)
      .attr("y1", y)
      .attr("x2", x + labelOffsetX)
      .attr("y2", y + labelOffsetY);

    annotationGroup
      .append("text")
      .attr("class", "annotation-label")
      .attr("x", x + labelOffsetX)
      .attr("y", y + labelOffsetY - 4)
      .text(region.name);
  }
})();



/* =======================================
 * PART B: EXPLORE GLOBE (BOTTOM)
 * =====================================*/
(function exploreGlobe() {
  const container = document.getElementById("globe-explore-container");
  const svgEl = document.getElementById("globe-explore");
  if (!container || !svgEl) return; // if bottom view isn't in the HTML, just skip

  const size = container.clientWidth || 760;
  const width = size;
  const height = size;
  const radius = Math.min(width, height) / 2 - 20;

  const svg = d3
    .select("#globe-explore")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const projection = d3
    .geoOrthographic()
    .scale(radius)
    .translate([width / 2, height / 2])
    .clipAngle(90);

  const path = d3.geoPath(projection);
  const graticule = d3.geoGraticule();

  let rotation = [0, -20];
  projection.rotate(rotation);
  let isDragging = false;
  let lastDragPos = null;
  let lastRotation = null;

  // Background
  svg.append("path")
    .datum({ type: "Sphere" })
    .attr("class", "water")
    .attr("d", path);

  svg.append("path")
    .datum(graticule())
    .attr("class", "graticule")
    .attr("d", path);

  const countriesLayer = svg.append("g").attr("id", "explore-countries");

  // Controls & legend
  const metricSelect = document.getElementById("metric-select");
  const decadeSelect = document.getElementById("decade-select");
  const legendMin = document.getElementById("legend-min");
  const legendMax = document.getElementById("legend-max");
  const legendBar = document.querySelector("#legend-explore .legend-bar");
  const countryStatsEl = document.getElementById("country-stats");

  if (
    !metricSelect ||
    !decadeSelect ||
    !legendMin ||
    !legendMax ||
    !legendBar ||
    !countryStatsEl
  ) {
    console.warn("Explore controls, legend, or stats panel missing, skipping explore globe.");
    return;
  }

  // ✨ Elegant color scale for navy background
  // Deep blue -> teal -> warm gold
  const elegantInterpolator = t =>
    d3.interpolateRgbBasis(["#15254b", "#3f8abf", "#f6d365"])(t);

  const colorScale = d3.scaleSequential(elegantInterpolator);

  let countries = [];
  let dataByNameDecade = null;  // 🔑 keyed by Country Name, not Country Code
  let metricColumns = [];
  let decades = [];
  let currentMetric = null;
  let currentDecade = null;

  // Map year -> decade label like "1970-1979"
  function decadeLabelFromYear(year) {
    if (year == null || isNaN(year)) return null;
    if (year < 1970) return null; // ignore pre-1970 for the UI
    const start = Math.floor(year / 10) * 10;
    const end = start + 9;
    return `${start}-${end}`;
  }

  // 1️⃣ Always load world + draw countries first
  d3.json(WORLD_URL)
    .then(world => {
      // TopoJSON → GeoJSON
      countries = topojson.feature(world, world.objects.countries).features;
      console.log("Explore globe: countries loaded:", countries.length);

      countriesLayer
        .selectAll("path")
        .data(countries)
        .join("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("fill", "#444f7a")    // base color before data
        .attr("stroke", "white")
        .attr("stroke-width", 0.3)
        .on("click", (event, d) => onCountryClick(d));  // ⭐ click handler

      addDrag();
      startRotation();
      render();

      // 2️⃣ Then load gender.csv to build the decade-based choropleth
      loadGenderData();
    })
    .catch(err => {
      console.error("Explore globe world load error:", err);
    });

  function loadGenderData() {
    d3.csv("data/gender.csv", d3.autoType)
      .then(data => {
        console.log("Explore globe: gender.csv rows:", data.length);

        // Attach decade label to each row (only from 1970+)
        const filtered = data
          .map(d => {
            const decLabel = decadeLabelFromYear(d.Year);
            return decLabel ? { ...d, Decade: decLabel } : null;
          })
          .filter(d => d !== null);

        // 🔑 Rollup: Country Name -> Decade -> rows
        dataByNameDecade = d3.rollup(
          filtered,
          v => v,
          d => d["Country Name"],  // <-- USING Country Name
          d => d.Decade
        );

        // Metric columns
        metricColumns = data.columns.filter(c => c.startsWith("average_value_"));
        if (!metricColumns.length) {
          console.warn("No metric columns starting with 'average_value_' in gender.csv");
        }

        const preferredMetric =
          metricColumns.find(c =>
            c.toLowerCase().includes("life expectancy at birth, female (years)")
          ) || metricColumns[0];

        currentMetric = preferredMetric;

        // Decades present in the data (1970+), sorted chronologically
        decades = Array.from(
          new Set(filtered.map(d => d.Decade))
        ).sort((a, b) => {
          const aStart = parseInt(a.split("-")[0], 10);
          const bStart = parseInt(b.split("-")[0], 10);
          return aStart - bStart;
        });

        currentDecade = decades[decades.length - 1]; // latest decade

        setupControls();
        updateChoropleth();
      })
      .catch(err => {
        console.error("Explore globe gender.csv load error:", err);
        // If CSV fails, we still keep the plain globe.
      });
  }

  function setupControls() {
    // Metric dropdown
    metricSelect.innerHTML = "";
    metricColumns.forEach(col => {
      const opt = document.createElement("option");
      opt.value = col;
      opt.textContent = prettyMetricLabel(col);
      metricSelect.appendChild(opt);
    });
    if (currentMetric) metricSelect.value = currentMetric;

    metricSelect.addEventListener("change", () => {
      currentMetric = metricSelect.value;
      updateChoropleth();
      clearCountryStats(false);
    });

    // Decade dropdown
    decadeSelect.innerHTML = "";
    decades.forEach(dec => {
      const opt = document.createElement("option");
      opt.value = dec;
      opt.textContent = dec; // e.g. "1970-1979"
      decadeSelect.appendChild(opt);
    });
    if (currentDecade) decadeSelect.value = currentDecade;

    decadeSelect.addEventListener("change", () => {
      currentDecade = decadeSelect.value;
      updateChoropleth();
      clearCountryStats(false);
    });
  }

  function prettyMetricLabel(col) {
    let label = col.replace("average_value_", "");
    label = label.replace(
      " (% of primary school age children)",
      " (% of children)"
    );
    label = label.replace(
      " (births per 1,000 women ages 15-19)",
      " (per 1k women 15–19)"
    );
    return label;
  }

  function addDrag() {
    svg.call(
      d3.drag()
        .on("start", (event) => {
          isDragging = true;
          lastDragPos = [event.x, event.y];
          lastRotation = rotation.slice();
        })
        .on("drag", (event) => {
          const dx = event.x - lastDragPos[0];
          const dy = event.y - lastDragPos[1];

          rotation[0] = lastRotation[0] + dx * 0.4;
          rotation[1] = lastRotation[1] - dy * 0.4;

          projection.rotate(rotation);
          render();
        })
        .on("end", () => {
          isDragging = false;
        })
    );
  }

  function startRotation() {
    const velocity = 0.01;
    d3.timer(() => {
      if (isDragging) return;
      rotation[0] += velocity;
      projection.rotate(rotation);
      render();
    });
  }

  function render() {
    svg.selectAll("path.water").attr("d", path);
    svg.selectAll("path.graticule").attr("d", path);
    countriesLayer.selectAll("path.country").attr("d", path);
  }

  // Get metric value for a given country-name + decade (average across all years in that decade)
  function getValue(countryName, decade, metric) {
    if (!countryName || !metric || !dataByNameDecade) return null;
    const byDecade = dataByNameDecade.get(countryName);
    if (!byDecade) return null;
    const rows = byDecade.get(decade);
    if (!rows || !rows.length) return null;

    const vals = rows
      .map(r => r[metric])
      .filter(v => v != null && !isNaN(v));

    if (!vals.length) return null;
    return d3.mean(vals);
  }

  function updateChoropleth() {
    if (!countries.length || !currentMetric || !currentDecade || !dataByNameDecade) return;

    const vals = [];
    countries.forEach(d => {
      const name = d.properties && d.properties.name;
      if (!name) return;
      const v = getValue(name, currentDecade, currentMetric);
      if (v != null && !isNaN(v)) vals.push(v);
    });

    if (!vals.length) {
      console.warn("No data values for metric", currentMetric, "decade", currentDecade);
      return;
    }

    const extent = d3.extent(vals);
    colorScale.domain(extent);

    // 🗺️ Color countries
    countriesLayer
      .selectAll("path.country")
      .attr("fill", d => {
        const name = d.properties && d.properties.name;
        if (!name) return "#444f7a";
        const v = getValue(name, currentDecade, currentMetric);
        if (v == null || isNaN(v)) return "#444f7a"; // fallback color
        return colorScale(v);
      });

    // 🔢 Legend labels
    const format = d3.format(".2f");
    legendMin.textContent = format(extent[0]);
    legendMax.textContent = format(extent[1]);

    // 🎨 Legend gradient that matches the colorScale + navy background
    const [min, max] = extent;
    const stopsCount = 7;
    const stops = d3.range(stopsCount).map(i => {
      const t = i / (stopsCount - 1);             // 0 → 1
      const value = min + t * (max - min);        // map to [min, max]
      return colorScale(value);
    });

    legendBar.style.backgroundImage =
      `linear-gradient(to right, ${stops.join(",")})`;

    render();
  }

  /* ===== Click handler to show stats ===== */

  function onCountryClick(feature) {
    if (!dataByNameDecade || !currentMetric || !currentDecade) {
      clearCountryStats(true, "Data not loaded yet.");
      return;
    }

    const name = feature.properties && feature.properties.name
      ? feature.properties.name
      : "Unknown country";

    const byDec = dataByNameDecade.get(name);
    if (!byDec) {
      clearCountryStats(true, `No data for ${name} in ${currentDecade}.`);
      return;
    }

    const rows = byDec.get(currentDecade);
    if (!rows || !rows.length) {
      clearCountryStats(true, `No data for ${name} in ${currentDecade}.`);
      return;
    }

    const metricLabel = prettyMetricLabel(currentMetric);
    const vals = rows
      .map(r => r[currentMetric])
      .filter(v => v != null && !isNaN(v));

    if (!vals.length) {
      clearCountryStats(
        true,
        `No numeric values for ${metricLabel} in ${name}, ${currentDecade}.`
      );
      return;
    }

    const format = d3.format(".2f");
    const avg = d3.mean(vals);
    const min = d3.min(vals);
    const max = d3.max(vals);
    const years = Array.from(new Set(rows.map(r => r.Year))).sort((a, b) => a - b);

    const html = `
      <div class="country-stats-header">
        <div class="country-stats-name">${name}</div>
        <div class="country-stats-decade">${currentDecade}</div>
      </div>
      <div class="country-stats-metric">${metricLabel}</div>

      <div class="country-stats-value-row">
        <span class="country-stats-label">Average:</span>
        <span class="country-stats-value">${format(avg)}</span>
      </div>
      <div class="country-stats-value-row">
        <span class="country-stats-label">Range:</span>
        <span class="country-stats-value">${format(min)} – ${format(max)}</span>
      </div>

      <div class="country-stats-notes">
        Based on ${years.length} year(s) of data: ${years.join(", ")}.
      </div>
    `;

    countryStatsEl.classList.remove("country-stats--empty");
    countryStatsEl.innerHTML = html;
  }

  function clearCountryStats(showPlaceholder = true, message = null) {
    if (!showPlaceholder) return;
    countryStatsEl.classList.add("country-stats--empty");
    countryStatsEl.innerHTML = `
      <p class="country-stats-placeholder">
        ${message || "Click on a country to see its decade-average stats."}
      </p>
    `;
  }
})();
