"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

const BundMap = () => {
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

        svg
          .append("g")
          .selectAll("path")
          .data(data.features)
          .enter()
          .append("path")
          .attr("d", pathGenerator)
          .attr("fill", "rgba(0, 0, 0, 0.1)") // Light fill
          .attr("stroke", "none"); // No borders
      } catch (error) {
        console.error("Error loading Bund map:", error);
      }
    };

    loadBundMap();
  }, []);

  return <svg ref={svgRef} width={width} height={height} />;
};

export default BundMap;
