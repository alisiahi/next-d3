"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

const BarChart = ({ bundeslandAggregatedData, selectedData }) => {
  const svgRef = useRef(null);
  const width = 900;
  const height = 600;
  const margin = { top: 20, right: 150, bottom: 50, left: 120 }; // Increased right margin for labels

  useEffect(() => {
    if (!bundeslandAggregatedData || !selectedData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous chart

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

    // Sort data in descending order
    data.sort((a, b) => b.value - a.value);

    // Choose scale based on selected data type
    const xScale =
      selectedData === "Death Rate" || selectedData === "Cases per 100K"
        ? d3
            .scaleLinear()
            .domain([0, d3.max(data, (d) => d.value)]) // Linear for Death Rate
            .range([margin.left, width - margin.right])
        : d3
            .scaleSymlog()
            .domain([1, d3.max(data, (d) => d.value)]) // Symlog for other cases
            .range([margin.left, width - margin.right]);

    const yScale = d3
      .scaleBand()
      .domain(data.map((d) => d.name))
      .range([margin.top, height - margin.bottom])
      .padding(0.3);

    const colorScale = d3
      .scaleSequential(d3.interpolateYlOrRd)
      .domain([0, d3.max(data, (d) => d.value)]);

    // Append bars
    svg
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", (d) => yScale(d.name))
      .attr("x", margin.left)
      .attr("width", (d) => xScale(d.value) - margin.left)
      .attr("height", yScale.bandwidth())
      .attr("fill", (d) => colorScale(d.value));

    // Add labels beside bars (ensuring they fit)
    svg
      .selectAll(".bar-label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "bar-label")
      .attr("x", (d) => Math.min(xScale(d.value) + 5, width - margin.right)) // Prevent cutoff
      .attr("y", (d) => yScale(d.name) + yScale.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "start") // Align left for better readability
      .attr("fill", "#000")
      .attr("font-size", "12px")
      .text((d) => d.value.toLocaleString());

    // Add X-axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format(".2s")));

    // Add Y-axis
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale));
  }, [bundeslandAggregatedData, selectedData]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="border rounded-lg bg-white shadow-md"
    />
  );
};

export default BarChart;
