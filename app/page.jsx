"use client";

import { useState, useEffect } from "react";
import MapTabs from "@/components/MapTabs";
import Sidebar from "@/components/Sidebar";

export default function Home() {
  const [selectedData, setSelectedData] = useState(null);
  const [bundAggregatedData, setBundAggregatedData] = useState({});
  const [bundeslandAggregatedData, setBundeslandAggregatedData] = useState({});

  useEffect(() => {
    const fetchAndAggregateData = async () => {
      try {
        const response = await fetch("/covid-19-germany-landkreise.geojson");
        const kreisData = await response.json();

        const bundeslandAggregation = {};
        let bundAggregation = {
          population: 0,
          cases: 0,
          cases_per_100k: 0, // Will be recalculated later
          death_rate: 0, // Will be recalculated later
        };

        kreisData.features.forEach((feature) => {
          const { bl, ewz, death_rate, cases, cases_per_100k } =
            feature.properties;

          if (!bundeslandAggregation[bl]) {
            bundeslandAggregation[bl] = {
              population: 0,
              cases: 0,
              death_rate_numerator: 0, // Sum of (death_rate * population)
              cases_per_100k: 0, // Will be recalculated
            };
          }

          bundeslandAggregation[bl].population += ewz;
          bundeslandAggregation[bl].cases += cases;
          bundeslandAggregation[bl].death_rate_numerator += death_rate * ewz; // Weighted sum

          // Aggregating for Bund level
          bundAggregation.population += ewz;
          bundAggregation.cases += cases;
          bundAggregation.death_rate_numerator += death_rate * ewz;
        });

        // Calculate death rate and cases per 100K correctly
        Object.keys(bundeslandAggregation).forEach((bl) => {
          bundeslandAggregation[bl].death_rate =
            bundeslandAggregation[bl].population > 0
              ? bundeslandAggregation[bl].death_rate_numerator /
                bundeslandAggregation[bl].population
              : 0;

          bundeslandAggregation[bl].cases_per_100k =
            bundeslandAggregation[bl].population > 0
              ? (bundeslandAggregation[bl].cases /
                  bundeslandAggregation[bl].population) *
                100000
              : 0;
        });

        // Calculate Bundes-level death rate and cases per 100K
        bundAggregation.death_rate =
          bundAggregation.population > 0
            ? bundAggregation.death_rate_numerator / bundAggregation.population
            : 0;

        bundAggregation.cases_per_100k =
          bundAggregation.population > 0
            ? (bundAggregation.cases / bundAggregation.population) * 100000
            : 0;

        setBundeslandAggregatedData(bundeslandAggregation);
        setBundAggregatedData(bundAggregation);
      } catch (error) {
        console.error("Error fetching or aggregating data:", error);
      }
    };

    fetchAndAggregateData();
  }, []);

  return (
    <div className="flex">
      <Sidebar onSelect={setSelectedData} />

      <MapTabs
        selectedData={selectedData}
        bundAggregatedData={bundAggregatedData}
        bundeslandAggregatedData={bundeslandAggregatedData}
      />
    </div>
  );
}
