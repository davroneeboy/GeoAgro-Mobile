import React from 'react';
import { landTypeMapping } from '../../context/constants';

export default function PlantationMetaCards({ plantation }) {
  if (!plantation) return null;

  const formatDate = (d) => new Date(d).toLocaleString("ru-RU", {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const konturBlock = () => (
    <div className="bg-gray-700 p-3 rounded-lg">
      <p className="font-semibold text-gray-300">Kontur raqami:</p>
      <div className="flex items-center gap-2 text-white text-sm">
        <span className="break-all">
          {Array.isArray(plantation.kontur_number)
            ? (() => {
                const arr = plantation.kontur_number.map((v) => String(v)).filter((s) => s.trim().length > 0);
                if (arr.length === 0) return '—';
                const limit = 5;
                const shown = arr.slice(0, limit).join(', ');
                const extra = arr.length - limit;
                return extra > 0 ? `${shown} … va yana ${extra} ta` : shown;
              })()
            : (plantation.kontur_number || '—')}
        </span>
        {Array.isArray(plantation.kontur_number) && plantation.kontur_number.length > 0 && (
          <button
            onClick={() => { try { navigator.clipboard.writeText(plantation.kontur_number.map((v) => String(v)).join(', ')); } catch(_) {} }}
            className="text-gray-300 hover:text-white"
            title="Nusxa olish"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <div className="bg-gray-700 p-3 rounded-lg">
        <p className="font-semibold text-gray-300">Yer turi:</p>
        <p className="text-white">{landTypeMapping[plantation.land_type]}</p>
      </div>
      <div className="bg-gray-700 p-3 rounded-lg">
        <p className="font-semibold text-gray-300">Maydoni:</p>
        <p className="text-white font-bold">{Number(plantation.total_area).toFixed(1)} GA</p>
      </div>
      <div className="bg-gray-700 p-3 rounded-lg">
        <p className="font-semibold text-gray-300">Banitet bali:</p>
        <p className="text-white">{Number(plantation.fertility_score ?? 0).toFixed(1)}</p>
      </div>
      <div className="bg-gray-700 p-3 rounded-lg">
        <p className="font-semibold text-gray-300">Devor bilan o'ralgan:</p>
        <p className="text-white">{plantation.fenced ? "✅" : "🚫"}</p>
      </div>
      <div className="bg-gray-700 p-3 rounded-lg">
        <p className="font-semibold text-gray-300">Bo'sh maydon:</p>
        <p className="text-white font-bold">{plantation.empty_area ?? '—'} GA</p>
      </div>
      <div className="bg-gray-700 p-3 rounded-lg">
        <p className="font-semibold text-gray-300">Yaroqsiz maydon:</p>
        <p className="text-white font-bold">{plantation.not_usable_area ?? '—'} GA</p>
      </div>
      <div className="bg-gray-700 p-3 rounded-lg">
        <p className="font-semibold text-gray-300">Suv xovuzlari soni:</p>
        <p className="text-white">{plantation.reservoir_count ?? 0}</p>
      </div>
      <div className="bg-gray-700 p-3 rounded-lg">
        <p className="font-semibold text-gray-300">Quduqlar soni:</p>
        <p className="text-white">{plantation.pump_station_count ?? 0}</p>
      </div>
      <div className="bg-gray-700 p-3 rounded-lg">
        <p className="font-semibold text-gray-300">Qo'shilgan vaqti:</p>
        <p className="text-white">{plantation.created_at ? formatDate(plantation.created_at) : '—'}</p>
        {plantation.updated_at && (
          <div className="mt-2 text-xs text-amber-300 flex items-center gap-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-900/50 border border-amber-600/60">Yangilangan</span>
            <span className="text-white">{formatDate(plantation.updated_at)}</span>
          </div>
        )}
      </div>
      <div className="bg-gray-700 p-3 rounded-lg">
        <p className="font-semibold text-gray-300">Tomchilab sug'oriladigan maydon:</p>
        <p className="text-white font-bold">{plantation.irrigation_area ?? 0} GA</p>
      </div>
      {plantation.investments && plantation.investments.length > 0 && (
        <div className="bg-gray-700 p-3 rounded-lg">
          <p className="font-semibold text-gray-300 mb-2">Investitsiyalar:</p>
          <div className="space-y-1 mb-3">
            {plantation.investments.map((investment, index) => (
              <div key={investment.id || index} className="text-white text-sm">
                <span className="text-gray-400">
                  {investment.invest_type === 1 ? 'Mahalliy' : investment.invest_type === 2 ? 'Xorijiy' : `Turi ${investment.invest_type}`}:
                </span>
                <span className="ml-2 font-medium">
                  {new Intl.NumberFormat('uz-UZ').format(investment.investment_amount)} UZS
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-600 pt-2">
            <p className="font-semibold text-gray-300">Jami investitsiyalar:</p>
            <p className="text-white font-bold text-green-400 text-lg">
              {new Intl.NumberFormat('uz-UZ').format(
                plantation.investments.reduce((total, inv) => total + (inv.investment_amount || 0), 0)
              )} UZS
            </p>
          </div>
        </div>
      )}
      {konturBlock()}
    </div>
  );
}


