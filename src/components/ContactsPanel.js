import React, { useState } from "react";

export default function ContactsPanel({ buttonClassName = "p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors", label = "Kontaktlar" }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={buttonClassName}
        aria-label="Contacts"
        title="Kontaktlar"
      >
        <span className="inline-flex items-center text-white text-xs sm:text-sm">
          <svg className="w-4 h-4 mr-1 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498A1 1 0 0121 16v3a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          {label}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Kontaktlar</h3>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <div className="p-4 space-y-3">
            <div className="p-3 border border-gray-600 rounded-lg flex items-center justify-between bg-gray-700">
              <div>
                <h4 className="text-xs font-medium text-gray-300">Telefon</h4>
                <a href="tel:+998971299707" className="text-green-400 hover:text-green-300 text-sm font-medium">
                  +998 (97) 129-97-07
                </a>
              </div>
              <div className="text-xl">📞</div>
            </div>
            <div className="p-3 border border-gray-600 rounded-lg flex items-center justify-between bg-gray-700">
              <div>
                <h4 className="text-xs font-medium text-gray-300">Telegram</h4>
                <a
                  href="https://t.me/rokki_khazratov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                  @agro_support
                </a>
              </div>
              <div className="text-xl">💬</div>
            </div>
            <div className="p-3 border border-gray-600 rounded-lg flex items-center justify-between bg-gray-700">
              <div>
                <h4 className="text-xs font-medium text-gray-300">Email</h4>
                <a href="mailto:info@agro.uz" className="text-green-400 hover:text-green-300 text-sm font-medium">
                  info@agro.uz
                </a>
              </div>
              <div className="text-xl">📧</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 