"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import BarChart from "./BarChart"; // Import the BarChart component
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
          .on("click", function (event, d) {
            setSelectedBundesland(d.properties.name);
          });

        // D3 zoom functionality
        const zoom = d3.zoom().on("zoom", (event) => {
          g.attr("transform", event.transform);
        });

        svg.call(zoom);
      } catch (error) {
        console.error("Error loading Bundesland map:", error);
      }
    };

    loadBundeslandMap();
  }, [bundeslandAggregatedData, selectedData]);

  return (
    <div className="flex flex-col items-center">
      <svg ref={svgRef} width={width} height={height} className="border" />

      {/* Render the bar chart below the map when a data type is selected */}
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
