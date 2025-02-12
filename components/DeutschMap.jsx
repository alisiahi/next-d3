"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

const DeutschMap = ({ showBorders }) => {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);

  const width = 800;
  const height = 600;

  useEffect(() => {
    const loadGermanyMap = async () => {
      try {
        const response = await fetch("/2_hoch.geo.json");
        const data = await response.json();

        const svg = d3.select(svgRef.current);
        const tooltip = d3.select(tooltipRef.current);

        const projection = d3.geoMercator().fitSize([width, height], data);
        const pathGenerator = d3.geoPath().projection(projection);

        const zoom = d3
          .zoom()
          .scaleExtent([1, 8])
          .on("zoom", (event) => {
            svg.selectAll("g").attr("transform", event.transform.toString());
          });

        svg.call(zoom);

        // Clear previous render
        svg.selectAll(".state").remove();

        // Render Germany map
        svg
          .append("g")
          .attr("class", "states-group")
          .selectAll("path")
          .data(data.features)
          .enter()
          .append("path")
          .attr("class", "state")
          .attr("d", pathGenerator)
          .attr("fill", "#ffff66")
          .attr("stroke", showBorders ? "#333" : "none")
          .attr("stroke-width", showBorders ? 1 : 0)
          .on("mouseenter", function (event, d) {
            if (showBorders) {
              d3.select(this).attr("fill", "#cc3300");
              tooltip
                .style("visibility", "visible")
                .html(`${d.properties.name}`);
            }
          })
          .on("mousemove", (event) => {
            if (showBorders) {
              tooltip
                .style("top", `${event.clientY}px`)
                .style("left", `${event.clientX - 200}px`);
            }
          })
          .on("mouseleave", function () {
            if (showBorders) {
              d3.select(this).attr("fill", "#ffff66");
              tooltip.style("visibility", "hidden");
            }
          })
          .on("click", (event, d) => {
            if (showBorders) {
              console.log("Selected State:", d.properties.name);
              // Implement zoomToRegion function if needed
              // zoomToRegion(d);
            }
          });
      } catch (error) {
        console.error("Error loading GeoJSON:", error);
      }
    };

    loadGermanyMap();
  }, [showBorders]);

  return (
    <div style={{ position: "relative" }}>
      <svg ref={svgRef} width={width} height={height}></svg>
      <div
        ref={tooltipRef}
        style={{
          position: "absolute",
          background: "rgba(0, 0, 0, 0.8)",
          color: "#fff",
          padding: "6px 12px",
          borderRadius: "5px",
          visibility: "hidden",
          pointerEvents: "none",
          fontSize: "14px",
          whiteSpace: "nowrap",
        }}
      ></div>
    </div>
  );
};

export default DeutschMap;
