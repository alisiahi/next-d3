"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import BarChart from "./BarChart";
import PieChart from "./PieChart";

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

        ///////////////////////////////////////////////// Tooltip /////////////////////////////////////////////////
        const tooltip = d3
          .select("body")
          .append("div")
          .style("position", "absolute")
          .style("background", "rgba(0, 0, 0, 0.7)")
          .style("color", "#fff")
          .style("padding", "5px 10px")
          .style("border-radius", "5px")
          .style("font-size", "14px")
          .style("pointer-events", "none")
          .style("opacity", 0);

        ///////////////////////////////////////////////// Mapping for selected data /////////////////////////////////////////////////
        const dataKeyMap = {
          Population: "population",
          "Death Rate": "death_rate",
          Cases: "cases",
          "Cases per 100K": "cases_per_100k",
        };
        const dataKey = dataKeyMap[selectedData];

        ///////////////////////////////////////////////// Compute color scale /////////////////////////////////////////////////
        const values = Object.values(bundeslandAggregatedData)
          .map((d) => d[dataKey])
          .filter((v) => v !== undefined);

        const min = d3.min(values);
        const max = d3.max(values);
        const colorScale = d3
          .scaleSequential(d3.interpolateBlues)
          .domain([min, max]);

        ///////////////////////////////////////////////// adding features to group /////////////////////////////////////////////////
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
          .on("click", function (event, d) {
            setSelectedBundesland(d.properties.name);
            zoomToFeature(d);
          })
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
              .style("left", event.clientX + 10 + "px")
              .style("top", event.clientY - 20 + "px");
          })
          .on("mouseout", function (event, d) {
            tooltip.style("opacity", 0);
            const bundeslandName = d.properties.name;
            const value = bundeslandAggregatedData[bundeslandName]?.[dataKey];
            d3.select(this).attr(
              "fill",
              value !== undefined ? colorScale(value) : "#ccc"
            );
          });

        ///////////////////////////////////////////////// D3 zoom functionality /////////////////////////////////////////////////
        const zoom = d3.zoom().on("zoom", (event) => {
          g.attr("transform", event.transform);
        });

        svg.call(zoom);

        const zoomToFeature = (feature) => {
          if (!feature || !feature.geometry) return;

          const bounds = pathGenerator.bounds(feature);
          if (!bounds || bounds.some((b) => isNaN(b[0]) || isNaN(b[1]))) return;

          const [[x0, y0], [x1, y1]] = bounds;
          const dx = x1 - x0;
          const dy = y1 - y0;
          const x = (x0 + x1) / 2;
          const y = (y0 + y1) / 2;
          const scale = Math.min(2, 0.9 / Math.max(dx / width, dy / height));
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

        window.resetZoom = resetZoom;
      } catch (error) {
        console.error("Error loading Bundesland map:", error);
      }
    };

    loadBundeslandMap();
  }, [bundeslandAggregatedData, selectedData]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg ref={svgRef} width={width} height={height} className="border" />
        {selectedBundesland && (
          <button
            onClick={() => window.resetZoom()}
            className="absolute top-2 left-2 bg-red-500 text-white px-4 py-2 rounded"
          >
            Reset View
          </button>
        )}
      </div>
      {/* Render the bar chart and the pie chart below the map when a data type is selected */}
      {selectedData && (
        <div className="flex flex-col">
          <div className="mt-4 p-20">
            <h2 className="text-lg font-bold text-center mb-2">
              {selectedData} by Bundesland
            </h2>
            <BarChart
              bundeslandAggregatedData={bundeslandAggregatedData}
              selectedData={selectedData}
            />
          </div>
          <div className="flex flex-col justify-center items-center mt-4">
            <h2 className="text-lg font-bold text-center mb-2">
              {selectedData} by Bundesland
            </h2>
            <PieChart
              bundeslandAggregatedData={bundeslandAggregatedData}
              selectedData={selectedData}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BundeslandMap;
