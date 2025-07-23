import React from "react";
import { useNavigate } from "react-router-dom";
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";

const Contacts = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header - такой же как в других страницах */}
      <div
        className="flex justify-start items-center mb-5 poiner cursor-pointer border-b-4 pb-5"
        onClick={() => navigate("/")}
      >
        <img
          className="h-20 w-auto mr-3"
          src={uzbekistanEmblem}
          alt="O'zbekiston gerbi"
        />
        <p className="text-start font-extrabold text-gray-900 max-w-64">
          Qishloq xo'jaligi Vazirligi huzuridagi Agrosanoatni rivojlantirish
          agentligi
        </p>
      </div>

      {/* Заголовок страницы */}
      <div>
        <h1 className="text-xl font-bold">Aloqa ma'lumotlari</h1>
      </div>

      {/* Контактная информация */}
      <div className="mt-6 flex justify-center">
        <div className="max-w-md w-full">
          <div className="space-y-4">
            <div className="p-4 border rounded-lg flex items-center justify-between bg-gray-100 hover:shadow-lg transition">
              <div>
                <h3 className="text-sm font-medium text-gray-800">Телефон</h3>
                <a 
                  href="tel:+998971299707"
                  className="text-blue-600 hover:text-blue-800"
                >
                  +998 (97) 129-97-07
                </a>
              </div>
              <div className="text-2xl">📞</div>
            </div>

            <div className="p-4 border rounded-lg flex items-center justify-between bg-gray-100 hover:shadow-lg transition">
              <div>
                <h3 className="text-sm font-medium text-gray-800">Telegram</h3>
                <a 
                  href="https://t.me/rokki_khazratov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  @agro_support
                </a>
              </div>
              <div className="text-2xl">💬</div>
            </div>
          </div>

          {/* Часы работы */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Ish vaqti</h2>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg flex items-center justify-between bg-gray-100">
                <span className="text-sm text-gray-800">Dushanba - Juma:</span>
                <span className="text-sm font-medium text-gray-800">09:00 - 18:00</span>
              </div>
              <div className="p-4 border rounded-lg flex items-center justify-between bg-gray-100">
                <span className="text-sm text-gray-800">Shanba:</span>
                <span className="text-sm font-medium text-red-600">Yopiq</span>
              </div>
              <div className="p-4 border rounded-lg flex items-center justify-between bg-gray-100">
                <span className="text-sm text-gray-800">Yakshanba:</span>
                <span className="text-sm font-medium text-red-600">Yopiq</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contacts;
