import React, { useState } from "react";

export default function CustomAccordion({ text, header }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };
  return (
    <div
      className="w-full  mx-auto mt-5 rounded-md"
      style={{ backgroundColor: "#f9f9f9" }}
    >
      <div
        style={{ backgroundColor: "#f9f9f9" }}
        className={`p-4  border border-gray-300 rounded-md cursor-pointer ${
          isOpen ? "rounded-b-none" : ""
        }`}
        onClick={toggleAccordion}
      >
        <h2 className="font-medium text-gray-700">{header}</h2>
      </div>
      <div
        className={`overflow-hidden transition-[max-height] duration-300 ease-in-out  ${
          isOpen ? "max-h-[500px]" : "max-h-0"
        }`}
        style={{ backgroundColor: "#f9f9f9" }}
      >
        <div className="p-4 border border-t-0 border-gray-300 rounded-b-md">
          <p className="text-gray-600">{text}</p>
        </div>
      </div>
    </div>
  );
}
