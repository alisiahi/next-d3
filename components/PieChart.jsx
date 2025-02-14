"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

const PieChart = ({ bundeslandAggregatedData, selectedData }) => {
  const svgRef = useRef(null);
  const width = 900;
  const height = 600;
  const margin = { top: 150, right: 150, bottom: 150, left: 150 }; // Increased margins
  const radius =
    Math.min(
      width - margin.left - margin.right,
      height - margin.top - margin.bottom
    ) / 2;
  const labelRadius = radius * 1.2; // Extend labels further

  useEffect(() => {
    if (!bundeslandAggregatedData || !selectedData) return;

    const dataKeyMap = {
      Population: "population",
      "Death Rate": "death_rate",
      Cases: "cases",
      "Cases per 100K": "cases_per_100k",
    };
    const dataKey = dataKeyMap[selectedData];

    const data = Object.entries(bundeslandAggregatedData).map(
      ([name, values]) => ({
        name,
        value: values[dataKey],
      })
    );

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous chart

    const pie = d3.pie().value((d) => {
      if (selectedData === "Cases" || selectedData === "Population") {
        return Math.log1p(d.value); // log(1 + value) to avoid log(0) issues
      }
      return d.value; // Default for other categories
    })(data);

    const arc = d3.arc().innerRadius(0).outerRadius(radius);
    const outerArc = d3.arc().innerRadius(labelRadius).outerRadius(labelRadius);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10); // or d3.schemeSet3

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Draw pie slices
    g.selectAll("path")
      .data(pie)
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => colorScale(d.value))
      .attr("stroke", "#fff")
      .style("stroke-width", "2px");

    // Add leader lines
    g.selectAll("polyline")
      .data(pie)
      .enter()
      .append("polyline")
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("fill", "none")
      .attr("points", (d) => {
        const posA = arc.centroid(d); // Midpoint of slice
        const posB = outerArc.centroid(d); // Just outside the slice
        const posC = [posB[0] * 1.2, posB[1] * 1.2]; // Extend further out
        return [posA, posB, posC].map((p) => p.join(",")).join(" ");
      });

    // Add labels outside the pie
    g.selectAll(".label")
      .data(pie)
      .enter()
      .append("text")
      .attr("transform", (d) => {
        const pos = outerArc.centroid(d);
        pos[0] *= 1.3; // Move text further out horizontally
        pos[1] *= 1.3; // Move text further out vertically
        return `translate(${pos})`;
      })
      .attr("text-anchor", (d) =>
        (d.startAngle + d.endAngle) / 2 > Math.PI ? "end" : "start"
      )
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", "#000")
      .text((d) => `${d.data.name}: ${d.data.value.toLocaleString()}`); // Include both name and value
  }, [bundeslandAggregatedData, selectedData]);

  return <svg ref={svgRef} width={width} height={height} />;
};

export default PieChart;
