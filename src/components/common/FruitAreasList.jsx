import React from 'react';

export default function FruitAreasList({ fruit_areas }) {
  if (!Array.isArray(fruit_areas) || fruit_areas.length === 0) return null;

  return (
    <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 shadow-md mb-6">
      <div className="flex items-center gap-2 mb-2 text-white">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4c-3 0-5 2-5 5 0 4 5 9 5 9s5-5 5-9c0-3-2-5-5-5z"/></svg>
        <span className="font-semibold">Mevali hududlar</span>
      </div>
      <div className="space-y-2 text-gray-300 text-sm">
        {fruit_areas.map((area, idx) => (
          <div key={area.id || idx} className="border-b border-gray-600 pb-2 last:border-b-0">
            <p>Meva: <span className="text-white font-medium">{area.fruit}</span></p>
            {area.variety && (
              <p>Nav: <span className="text-white font-medium">{area.variety}</span></p>
            )}
            {area.area != null && (
              <p>Maydoni: <span className="text-white font-bold">{area.area} GA</span></p>
            )}
            {area.planted_year != null && (
              <p>Ekilgan yili: <span className="text-white">{area.planted_year}</span></p>
            )}
            {area.rootstock && (
              <p>Podvoy: <span className="text-white">{area.rootstock}</span></p>
            )}
            {area.schema && (
              <p>Sxema: <span className="text-white">{area.schema}</span></p>
            )}
            {area.weight != null && (
              <p>Og'irlik: <span className="text-white">{area.weight}</span></p>
            )}
            {area.hundredweight != null && (
              <p>Sentner: <span className="text-white">{area.hundredweight}</span></p>
            )}
            {area.kochat_soni != null && (
              <p>Ko'chat soni: <span className="text-white">{area.kochat_soni}</span></p>
            )}
            {typeof area.fenced === 'boolean' && (
              <p>O'ralgan: <span className="text-white">{area.fenced ? '✅' : '🚫'}</span></p>
            )}
            {area.trellis_installed_area != null && (
              <p>Shpalla maydoni: <span className="text-white font-bold">{area.trellis_installed_area} GA</span></p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


