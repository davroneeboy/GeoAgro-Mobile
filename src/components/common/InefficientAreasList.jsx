import React from 'react';

export default function InefficientAreasList({ fruit_areas }) {
  if (!Array.isArray(fruit_areas) || fruit_areas.length === 0) return null;
  const inefficient = fruit_areas.filter(a => a?.iqtisodiy_samarasiz);
  if (inefficient.length === 0) return null;

  return (
    <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 shadow-md mb-6">
      <div className="flex items-center gap-2 mb-2 text-white">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-semibold">Iqtisodiy samarasiz</span>
      </div>
      <div className="pr-1 space-y-2 text-gray-300 text-sm">
        {inefficient.map((area, idx) => (
          <div key={area.id || idx} className="border-b border-gray-600 pb-2 last:border-b-0">
            <p>Meva: <span className="text-white/90">{area.fruit}</span></p>
            {area.variety && <p>Nav: <span className="text-white/90">{area.variety}</span></p>}
            {area.planted_year != null && <p>Ekilgan yili: <span className="text-white/90">{area.planted_year}</span></p>}
            <p>Iqtisodiy samarasiz maydoni: <span className="font-bold">{area.economic_inefficient_area || 0} GA</span></p>
          </div>
        ))}
      </div>
    </div>
  );
}


