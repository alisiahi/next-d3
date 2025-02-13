"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

const BundMap = ({ selectedData, bundAggregatedData }) => {
  const svgRef = useRef(null);
  const width = 800;
  const height = 600;

  useEffect(() => {
    const loadBundMap = async () => {
      try {
        const response = await fetch("/2_hoch.geo.json");
        const data = await response.json();

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous map

        const projection = d3.geoMercator().fitSize([width, height], data);
        const pathGenerator = d3.geoPath().projection(projection);
        const g = svg.append("g");

        // Mapping for selected data
        const dataKeyMap = {
          Population: "population",
          "Death Rate": "death_rate",
          Cases: "cases",
          "Cases per 100K": "cases_per_100k",
        };

        const dataKey = dataKeyMap[selectedData];

        // Tooltip setup
        const tooltip = d3
          .select("body")
          .append("div")
          .attr("id", "tooltip-bund")
          .style("position", "absolute")
          .style("background", "rgba(0, 0, 0, 0.7)")
          .style("color", "#fff")
          .style("padding", "5px 10px")
          .style("border-radius", "5px")
          .style("font-size", "14px")
          .style("pointer-events", "none")
          .style("opacity", 0);

        // Determine value for selected data
        const value = bundAggregatedData[dataKey];
        const displayValue =
          value !== undefined ? value.toLocaleString() : "N/A";

        // Create a color scale
        const colorScale = d3
          .scaleSequential(d3.interpolateBlues)
          .domain([0, value || 1]);

        // Draw Germany map (without state borders)
        g.selectAll("path")
          .data(data.features)
          .enter()
          .append("path")
          .attr("d", pathGenerator)
          .attr("fill", value !== undefined ? colorScale(value) : "#ccc") // Default to gray
          .on("mouseover", function (event) {
            tooltip
              .style("opacity", 1)
              .html(
                `<strong>Germany</strong>${
                  selectedData ? `<br>${selectedData}: ${displayValue}` : ""
                }`
              );
          })
          .on("mousemove", function (event) {
            tooltip
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY - 20 + "px");
          })
          .on("mouseout", function () {
            tooltip.style("opacity", 0);
          });
      } catch (error) {
        console.error("Error loading Bund map:", error);
      }
    };

    loadBundMap();
  }, [bundAggregatedData, selectedData]);

  return <svg ref={svgRef} width={width} height={height} />;
};

export default BundMap;
