"use client";

import { useState } from "react";

const Sidebar = ({ onSelect }) => {
  const options = ["Population", "Death Rate", "Cases", "Cases per 100K"];
  const [selectedOption, setSelectedOption] = useState(null);

  const handleSelect = (option) => {
    setSelectedOption(option);
    onSelect(option);
  };

  return (
    <div className="w-64 min-h-screen bg-gray-800 text-white p-4">
      <h2 className="text-lg font-bold mb-4">Color the map:</h2>
      <ul>
        {options.map((option) => (
          <li
            key={option}
            className={`p-2 cursor-pointer rounded ${
              selectedOption === option ? "bg-gray-600" : "hover:bg-gray-700"
            }`}
            onClick={() => handleSelect(option)}
          >
            {option}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
