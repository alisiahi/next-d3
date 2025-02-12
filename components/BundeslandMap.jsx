"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const BundeslandMap = () => {
  const svgRef = useRef(null);
  const [selectedBundesland, setSelectedBundesland] = useState(null);
  const width = 800;
  const height = 600;
  const initialScale = 1; // Default zoom level
  const initialTranslate = [0, 0]; // Default position

  useEffect(() => {
    const loadBundeslandMap = async () => {
      try {
        const response = await fetch("/2_hoch.geo.json");
        const data = await response.json();

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous map

        const projection = d3.geoMercator().fitSize([width, height], data);
        const pathGenerator = d3.geoPath().projection(projection);

        // Append the group element for zooming
        const g = svg.append("g");

        // Create a tooltip div
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

        // Add Bundesländer paths
        g.selectAll("path")
          .data(data.features)
          .enter()
          .append("path")
          .attr("d", pathGenerator)
          .attr("fill", "rgba(0, 0, 0, 0.1)") // Light fill
          .attr("stroke", "#000") // Bundesland borders
          .attr("stroke-width", 1)
          .on("click", function (event, d) {
            setSelectedBundesland(d.properties.name);
            zoomToFeature(d);

            // Reset all paths before highlighting the clicked one
            g.selectAll("path")
              .attr("stroke", "#000") // Reset to black
              .attr("stroke-width", 1);

            // Highlight the selected Bundesland
            d3.select(this).attr("stroke", "#ff0000").attr("stroke-width", 2);
          })
          .on("mouseover", function (event, d) {
            tooltip.style("opacity", 1).html(d.properties.name); // Display Bundesland name
            d3.select(this).attr("fill", "rgba(0, 0, 0, 0.3)"); // Slight highlight on hover
          })
          .on("mousemove", function (event) {
            tooltip
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY - 20 + "px");
          })
          .on("mouseout", function () {
            tooltip.style("opacity", 0);
            d3.select(this).attr("fill", "rgba(0, 0, 0, 0.1)"); // Reset fill color
          });

        // Zoom behavior
        const zoom = d3.zoom().on("zoom", (event) => {
          g.attr("transform", event.transform);
        });

        svg.call(zoom);

        // Function to zoom into a Bundesland
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

        // Function to reset zoom
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

        // Store reset function globally
        window.resetBundeslandZoom = resetZoom;
      } catch (error) {
        console.error("Error loading Bundesland map:", error);
      }
    };

    loadBundeslandMap();
  }, []);

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
