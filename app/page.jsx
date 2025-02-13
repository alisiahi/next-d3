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
          death_rate: 0,
          cases: 0,
          cases_per_100k: 0,
        };

        kreisData.features.forEach((feature) => {
          const { bl, ewz, death_rate, cases, cases_per_100k } =
            feature.properties;

          if (!bundeslandAggregation[bl]) {
            bundeslandAggregation[bl] = {
              population: 0,
              death_rate: 0,
              cases: 0,
              cases_per_100k: 0,
            };
          }

          bundeslandAggregation[bl].population += ewz;
          bundeslandAggregation[bl].cases += cases;
          bundeslandAggregation[bl].cases_per_100k += cases_per_100k;

          // Aggregating for Bund
          bundAggregation.population += ewz;
          bundAggregation.cases += cases;
          bundAggregation.cases_per_100k += cases_per_100k;
        });

        // Calculate weighted average for death rate
        Object.keys(bundeslandAggregation).forEach((bl) => {
          bundeslandAggregation[bl].death_rate =
            bundeslandAggregation[bl].cases > 0
              ? (bundeslandAggregation[bl].cases /
                  bundeslandAggregation[bl].population) *
                100
              : 0;
        });

        bundAggregation.death_rate =
          bundAggregation.cases > 0
            ? (bundAggregation.cases / bundAggregation.population) * 100
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
