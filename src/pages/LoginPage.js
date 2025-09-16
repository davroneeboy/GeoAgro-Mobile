import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";
import { API_BASE_URL2 } from "../config";

const API_LOGIN_URL = `${API_BASE_URL2}api/login/`;

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log("Attempting login to:", API_LOGIN_URL);
      console.log("Login data:", { username, password });

      const response = await fetch(API_LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (response.ok) {
        const data = await response.json();
        console.log("Login successful, data:", data);
        
        // --- RBAC redirect logic ---
        const userInfo = data.user_info || data;
        const numericRole = Number(userInfo?.user_role);
        if (numericRole === 1 || numericRole === 2) {
          login({ ...data, username });
          navigate("/");
        } else if (numericRole === 3) {
          login({ ...data, username });
          navigate("/statistics/regions");
        } else {
          // 0 или отсутствие роли — нет доступа
          setError("Sizda tizimga kirish huquqi yo'q!");
          setIsLoading(false);
          return;
        }
      } else {
        const errorData = await response.text();
        console.error("Login failed:", response.status, errorData);
        
        if (response.status === 401) {
          setError("Noto'g'ri foydalanuvchi nomi yoki parol");
        } else if (response.status === 404) {
          setError("Server topilmadi. Iltimos, keyinroq urinib ko'ring");
        } else if (response.status >= 500) {
          setError("Server xatosi. Iltimos, keyinroq urinib ko'ring");
        } else {
          setError(`Xatolik: ${response.status} - ${errorData}`);
        }
      }
    } catch (error) {
      console.error("Network error:", error);
      setError("Tarmoq xatosi. Internet aloqasini tekshiring");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <img
            className="mx-auto h-36 w-auto"
            src={uzbekistanEmblem}
            alt="O'zbekiston gerbi"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Tizimga kirish
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Agrosanoatni rivojlantirish agentligi
          </p>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <input type="hidden" name="remember" value="true" />
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Foydalanuvchi nomi
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                disabled={isLoading}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm transition-colors disabled:opacity-50"
                placeholder="Foydalanuvchi nomini kiriting"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Parol
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isLoading}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm transition-colors disabled:opacity-50"
                placeholder="Parolni kiriting"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Yuklanmoqda...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Kirish
                </>
              )}
            </button>
          </div>
        </form>
        
        {/* Дополнительная информация */}
        <div className="mt-8 text-center">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-2">
              Tizim haqida
            </h3>
            <p className="text-xs text-gray-400">
              Qishloq xo'jaligi Vazirligi huzuridagi Agrosanoatni rivojlantirish agentligi tizimi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
