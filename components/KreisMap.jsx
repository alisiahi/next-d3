"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const KreisMap = ({ selectedData }) => {
  const svgRef = useRef(null);
  const [selectedKreis, setSelectedKreis] = useState(null);
  const [kreisData, setKreisData] = useState(null);
  const width = 800;
  const height = 600;
  const initialScale = 1;
  const initialTranslate = [0, 0];

  useEffect(() => {
    const loadKreisMap = async () => {
      try {
        const response = await fetch("/covid-19-germany-landkreise.geojson");
        const data = await response.json();
        setKreisData(data);
      } catch (error) {
        console.error("Error loading Kreis map:", error);
      }
    };

    loadKreisMap();
  }, []);

  useEffect(() => {
    if (!kreisData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const projection = d3.geoMercator().fitSize([width, height], kreisData);
    const pathGenerator = d3.geoPath().projection(projection);

    const g = svg.append("g");

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

    // Mapping for selected data
    const dataKeyMap = {
      Population: "ewz",
      "Death Rate": "death_rate",
      Cases: "cases",
      "Cases per 100K": "cases_per_100k",
    };

    const dataKey = dataKeyMap[selectedData];

    // Compute color scale
    const values = kreisData.features
      .map((d) => d.properties[dataKey])
      .filter((v) => v !== undefined);

    const min = d3.min(values);
    const max = d3.max(values);

    const colorScale = d3
      .scaleSequential(d3.interpolateBlues)
      .domain([min, max]);

    g.selectAll("path")
      .data(kreisData.features)
      .enter()
      .append("path")
      .attr("d", pathGenerator)
      .attr("fill", (d) => {
        if (!selectedData) return "rgba(0, 0, 0, 0.1)"; // Default color
        const value = d.properties[dataKey];
        return value !== undefined ? colorScale(value) : "#ccc";
      })
      .attr("stroke", "#000")
      .attr("stroke-width", 0.5)
      .on("click", function (event, d) {
        setSelectedKreis(d.properties.name);
        zoomToFeature(d);

        g.selectAll("path").attr("stroke", "#000").attr("stroke-width", 1);
        d3.select(this).attr("stroke", "#ff0000").attr("stroke-width", 2);
      })
      .on("mouseover", function (event, d) {
        const value = d.properties[dataKey]; // Get the selected data value
        const displayValue =
          value !== undefined ? value.toLocaleString() : "N/A"; // Format number

        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${d.properties.name}</strong>${
              selectedData ? `<br>${selectedData}: ${displayValue}` : ""
            }`
          );

        d3.select(this).attr("fill", "rgba(0, 0, 0, 0.3)"); // Slight highlight on hover
      })

      .on("mousemove", function (event) {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 20 + "px");
      })
      .on("mouseout", function (event, d) {
        tooltip.style("opacity", 0);
        d3.select(this).attr(
          "fill",
          selectedData
            ? colorScale(d.properties[dataKey])
            : "rgba(0, 0, 0, 0.1)"
        );
      });

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
      setSelectedKreis(null);
      svg
        .transition()
        .duration(750)
        .call(
          zoom.transform,
          d3.zoomIdentity.translate(...initialTranslate).scale(initialScale)
        );
    };

    window.resetKreisZoom = resetZoom;
  }, [kreisData, selectedData]);

  return (
    <div className="relative">
      <svg ref={svgRef} width={width} height={height} className="border" />
      {selectedKreis && (
        <button
          onClick={() => window.resetKreisZoom()}
          className="absolute top-2 left-2 bg-red-500 text-white px-4 py-2 rounded"
        >
          Reset View
        </button>
      )}
    </div>
  );
};

export default KreisMap;
