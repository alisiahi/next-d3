"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BundMap from "./BundMap";
import BundeslandMap from "./BundeslandMap";
import KreisMap from "./KreisMap";

const MapTabs = ({
  selectedData,
  bundAggregatedData,
  bundeslandAggregatedData,
}) => {
  const [activeTab, setActiveTab] = useState("bund");

  return (
    <div className="w-full flex flex-col items-center">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex justify-center space-x-2 p-2">
          <TabsTrigger value="bund">Bund</TabsTrigger>
          <TabsTrigger value="bundesland">Bundesland</TabsTrigger>
          <TabsTrigger value="kreis">Kreis</TabsTrigger>
        </TabsList>

        <TabsContent value="bund" className="flex justify-center p-4">
          <BundMap
            selectedData={selectedData}
            bundAggregatedData={bundAggregatedData}
          />
        </TabsContent>

        <TabsContent value="bundesland" className="flex justify-center p-4">
          <BundeslandMap
            selectedData={selectedData}
            bundeslandAggregatedData={bundeslandAggregatedData}
          />
        </TabsContent>

        <TabsContent value="kreis" className="flex justify-center p-4">
          <KreisMap selectedData={selectedData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MapTabs;
