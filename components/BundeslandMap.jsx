"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const BundeslandMap = ({ bundeslandAggregatedData, selectedData }) => {
  const svgRef = useRef(null);
  const [selectedBundesland, setSelectedBundesland] = useState(null);
  const width = 800;
  const height = 600;
  const initialScale = 1;
  const initialTranslate = [0, 0];

  useEffect(() => {
    const loadBundeslandMap = async () => {
      try {
        if (!bundeslandAggregatedData) return;

        const response = await fetch("/2_hoch.geo.json");
        const data = await response.json();

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const projection = d3.geoMercator().fitSize([width, height], data);
        const pathGenerator = d3.geoPath().projection(projection);

        const g = svg.append("g");

        // Tooltip setup
        const tooltip = d3
          .select("body")
          .append("div")
          .attr("id", "tooltip")
          .style("position", "absolute")
          .style("background", "rgba(0, 0, 0, 0.7)")
          .style("color", "#fff")
          .style("padding", "5px 10px")
          .style("border-radius", "5px")
          .style("font-size", "14px")
          .style("pointer-events", "none")
          .style("opacity", 0);

        // Mapping for selected data
        const dataKeyMap = {
          Population: "population",
          "Death Rate": "death_rate",
          Cases: "cases",
          "Cases per 100K": "cases_per_100k",
        };

        const dataKey = dataKeyMap[selectedData];

        // Compute color scale
        const values = Object.values(bundeslandAggregatedData)
          .map((d) => d[dataKey])
          .filter((v) => v !== undefined);

        const min = d3.min(values);
        const max = d3.max(values);
        const colorScale = d3
          .scaleSequential(d3.interpolateBlues)
          .domain([min, max]);

        g.selectAll("path")
          .data(data.features)
          .enter()
          .append("path")
          .attr("d", pathGenerator)
          .attr("fill", (d) => {
            const bundeslandName = d.properties.name;
            const value = bundeslandAggregatedData[bundeslandName]?.[dataKey];
            return value !== undefined ? colorScale(value) : "#ccc";
          })
          .attr("stroke", "#000")
          .attr("stroke-width", (d) =>
            d.properties.name === selectedBundesland ? 2 : 1
          )
          .on("mouseover", function (event, d) {
            const bundeslandName = d.properties.name;
            const value = bundeslandAggregatedData[bundeslandName]?.[dataKey];
            const displayValue =
              value !== undefined ? value.toLocaleString() : "N/A";

            tooltip
              .style("opacity", 1)
              .html(
                `<strong>${bundeslandName}</strong>${
                  selectedData ? `<br>${selectedData}: ${displayValue}` : ""
                }`
              );

            d3.select(this).attr("fill", "rgba(0, 0, 0, 0.3)");
          })
          .on("mousemove", function (event) {
            tooltip
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY - 20 + "px");
          })
          .on("mouseout", function (event, d) {
            tooltip.style("opacity", 0);
            const bundeslandName = d.properties.name;
            const value = bundeslandAggregatedData[bundeslandName]?.[dataKey];

            d3.select(this)
              .attr("fill", value !== undefined ? colorScale(value) : "#ccc")
              .attr("stroke", "#000");
          })
          .on("click", function (event, d) {
            setSelectedBundesland(d.properties.name);
            zoomToFeature(d);
          });

        // D3 zoom functionality
        const zoom = d3.zoom().on("zoom", (event) => {
          g.attr("transform", event.transform);
        });

        svg.call(zoom);

        const zoomToFeature = (feature) => {
          const [[x0, y0], [x1, y1]] = pathGenerator.bounds(feature);
          const dx = x1 - x0;
          const dy = y1 - y0;
          const x = (x0 + x1) / 2;
          const y = (y0 + y1) / 2;
          const scale = Math.min(4, 0.9 / Math.max(dx / width, dy / height));
          const translate = [width / 2 - scale * x, height / 2 - scale * y];

          svg
            .transition()
            .duration(750)
            .call(
              zoom.transform,
              d3.zoomIdentity.translate(...translate).scale(scale)
            );
        };

        const resetZoom = () => {
          setSelectedBundesland(null);
          svg
            .transition()
            .duration(750)
            .call(
              zoom.transform,
              d3.zoomIdentity.translate(...initialTranslate).scale(initialScale)
            );
        };

        window.resetBundeslandZoom = resetZoom;
      } catch (error) {
        console.error("Error loading Bundesland map:", error);
      }
    };

    loadBundeslandMap();
  }, [bundeslandAggregatedData, selectedData]);

  return (
    <div className="relative">
      <svg ref={svgRef} width={width} height={height} className="border" />
      {selectedBundesland && (
        <button
          onClick={() => window.resetBundeslandZoom()}
          className="absolute top-2 left-2 bg-red-500 text-white px-4 py-2 rounded"
        >
          Reset View
        </button>
      )}
    </div>
  );
};

export default BundeslandMap;
