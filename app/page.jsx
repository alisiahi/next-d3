"use client";

import { useState } from "react";
import MapTabs from "@/components/MapTabs";
import Sidebar from "@/components/Sidebar";

export default function Home() {
  const [selectedData, setSelectedData] = useState(null);

  return (
    <div className="flex">
      <Sidebar onSelect={setSelectedData} />

      <MapTabs selectedData={selectedData} />
    </div>
  );
}
