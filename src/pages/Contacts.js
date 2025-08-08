import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";
import AuthContext from "../context/AuthContext";

const Contacts = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Мобильное меню */}
      <div className="lg:hidden bg-gray-800 shadow-lg p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate("/")}
          >
            <img
              className="h-10 w-auto mr-3"
              src={uzbekistanEmblem}
              alt="O'zbekiston gerbi"
            />
            <div>
              <p className="text-sm font-bold text-white leading-tight">
                Agrosanoatni rivojlantirish agentligi
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button className="px-2 py-1 border border-gray-600 text-white rounded text-xs flex items-center">
              <svg className="w-3 h-3 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ko'rish
            </button>
            <button 
              onClick={handleLogout}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs flex items-center"
            >
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              Chiqish
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Мобильное меню выпадающее */}
        {isMobileMenuOpen && (
          <div className="mt-4 space-y-2">
            <Link
              to="/plantations/uz"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-2 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Bog'larga o'tish
            </Link>
            <Link
              to="/statistics/regions"
              className="block w-full bg-green-500 text-white py-2 rounded-lg font-medium text-center hover:bg-green-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              To'liq statistika
            </Link>
            <Link
              to="/farmers"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-2 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Fermerlar
            </Link>
            <Link
              to="/contacts"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-2 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Kontaktlar
            </Link>
            <Link
              to="/moderation"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-2 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Moderatsiya
            </Link>
            <Link
              to="/controllers"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-2 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Nazoratchilar
            </Link>
          </div>
        )}
      </div>

      {/* Десктопная версия */}
      <div className="hidden lg:flex h-screen">
        {/* Левая панель */}
        <div className="w-1/4 p-4 border-r border-gray-700 bg-gray-800 shadow-lg overflow-y-auto">
          <div
            className="flex justify-start items-center mb-5 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate("/")}
          >
            <img
              className="h-20 w-auto mr-3"
              src={uzbekistanEmblem}
              alt="O'zbekiston gerbi"
            />
            <p className="text-start font-extrabold text-white max-w-64">
              Qishloq xo'jaligi Vazirligi huzuridagi Agrosanoatni rivojlantirish
              agentligi
            </p>
          </div>

          <div className="space-y-3">
            <Link
              to="/plantations/uz"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-3 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
              </svg>
              Bog'larga o'tish
            </Link>

            <Link
              to="/statistics/regions"
              className="block w-full bg-green-500 text-white py-3 rounded-lg font-medium text-center hover:bg-green-600 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              To'liq statistika
            </Link>

            <Link
              to="/farmers"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-3 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Fermerlar
            </Link>
          </div>
        </div>

        {/* Центральная панель */}
        <div className="flex-1 bg-gray-900 flex flex-col">
          <div className="p-6">
            <h1 className="text-white text-3xl font-bold mb-6">
              Aloqa ma'lumotlari
            </h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Контактная информация */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Bog'lanish
                </h2>
                
                <div className="space-y-4">
                  <div className="p-4 border border-gray-600 rounded-lg flex items-center justify-between bg-gray-700 hover:bg-gray-600 transition-colors">
                    <div>
                      <h3 className="text-sm font-medium text-gray-300">Telefon</h3>
                      <a 
                        href="tel:+998971299707"
                        className="text-green-400 hover:text-green-300 font-medium"
                      >
                        +998 (97) 129-97-07
                      </a>
                    </div>
                    <div className="text-2xl">📞</div>
                  </div>

                  <div className="p-4 border border-gray-600 rounded-lg flex items-center justify-between bg-gray-700 hover:bg-gray-600 transition-colors">
                    <div>
                      <h3 className="text-sm font-medium text-gray-300">Telegram</h3>
                      <a 
                        href="https://t.me/rokki_khazratov"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        @agro_support
                      </a>
                    </div>
                    <div className="text-2xl">💬</div>
                  </div>

                  <div className="p-4 border border-gray-600 rounded-lg flex items-center justify-between bg-gray-700 hover:bg-gray-600 transition-colors">
                    <div>
                      <h3 className="text-sm font-medium text-gray-300">Email</h3>
                      <a 
                        href="mailto:info@agro.uz"
                        className="text-green-400 hover:text-green-300 font-medium"
                      >
                        info@agro.uz
                      </a>
                    </div>
                    <div className="text-2xl">📧</div>
                  </div>
                </div>
              </div>

              {/* Часы работы */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-3 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Ish vaqti
                </h2>
                
                <div className="space-y-4">
                  <div className="p-4 border border-gray-600 rounded-lg flex items-center justify-between bg-gray-700">
                    <span className="text-sm text-gray-300">Dushanba - Juma:</span>
                    <span className="text-sm font-medium text-green-400">09:00 - 18:00</span>
                  </div>
                  <div className="p-4 border border-gray-600 rounded-lg flex items-center justify-between bg-gray-700">
                    <span className="text-sm text-gray-300">Shanba:</span>
                    <span className="text-sm font-medium text-red-400">Yopiq</span>
                  </div>
                  <div className="p-4 border border-gray-600 rounded-lg flex items-center justify-between bg-gray-700">
                    <span className="text-sm text-gray-300">Yakshanba:</span>
                    <span className="text-sm font-medium text-red-400">Yopiq</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Адрес */}
            <div className="mt-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Manzil
              </h2>
              
              <div className="p-4 border border-gray-600 rounded-lg bg-gray-700">
                <p className="text-gray-300 text-lg">
                  Toshkent shahri, Chilonzor tumani, <br />
                  Qishloq xo'jaligi ko'chasi, 123-uy
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Metro: Chilonzor, 5-daqiqa yurish masofasida
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Правая панель */}
        <div className="w-1/4 p-4 border-l border-gray-700 bg-gray-800 shadow-lg overflow-y-auto">
          <div className="space-y-4">
            <Link
              to="/contacts"
              className="block w-full bg-green-500 text-white py-3 rounded-lg font-medium text-center hover:bg-green-600 transition-colors"
            >
              Kontaktlar
            </Link>
            <button
              onClick={handleLogout}
              className="block w-full bg-gray-700 border border-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              Chiqish
            </button>
          </div>
          

        </div>
      </div>

      {/* Мобильная версия контента */}
      <div className="lg:hidden p-4">
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">
            Aloqa ma'lumotlari
          </h2>
          
          <div className="space-y-4">
            {/* Контактная информация */}
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Bog'lanish
              </h3>
              
              <div className="space-y-3">
                <div className="p-3 border border-gray-600 rounded-lg flex items-center justify-between bg-gray-600">
                  <div>
                    <h4 className="text-xs font-medium text-gray-300">Telefon</h4>
                    <a 
                      href="tel:+998971299707"
                      className="text-green-400 hover:text-green-300 text-sm font-medium"
                    >
                      +998 (97) 129-97-07
                    </a>
                  </div>
                  <div className="text-xl">📞</div>
                </div>

                <div className="p-3 border border-gray-600 rounded-lg flex items-center justify-between bg-gray-600">
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

                <div className="p-3 border border-gray-600 rounded-lg flex items-center justify-between bg-gray-600">
                  <div>
                    <h4 className="text-xs font-medium text-gray-300">Email</h4>
                    <a 
                      href="mailto:info@agro.uz"
                      className="text-green-400 hover:text-green-300 text-sm font-medium"
                    >
                      info@agro.uz
                    </a>
                  </div>
                  <div className="text-xl">📧</div>
                </div>
              </div>
            </div>

            {/* Часы работы */}
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ish vaqti
              </h3>
              
              <div className="space-y-3">
                <div className="p-3 border border-gray-600 rounded-lg flex items-center justify-between bg-gray-600">
                  <span className="text-xs text-gray-300">Dushanba - Juma:</span>
                  <span className="text-xs font-medium text-green-400">09:00 - 18:00</span>
                </div>
                <div className="p-3 border border-gray-600 rounded-lg flex items-center justify-between bg-gray-600">
                  <span className="text-xs text-gray-300">Shanba:</span>
                  <span className="text-xs font-medium text-red-400">Yopiq</span>
                </div>
                <div className="p-3 border border-gray-600 rounded-lg flex items-center justify-between bg-gray-600">
                  <span className="text-xs text-gray-300">Yakshanba:</span>
                  <span className="text-xs font-medium text-red-400">Yopiq</span>
                </div>
              </div>
            </div>

            {/* Адрес */}
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Manzil
              </h3>
              
              <div className="p-3 border border-gray-600 rounded-lg bg-gray-600">
                <p className="text-gray-300 text-sm">
                  Toshkent shahri, Chilonzor tumani, <br />
                  Qishloq xo'jaligi ko'chasi, 123-uy
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  Metro: Chilonzor, 5-daqiqa yurish masofasida
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contacts;
