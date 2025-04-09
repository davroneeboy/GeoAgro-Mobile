import React from "react";

const Contacts = () => {
  return (
    <div className="h-screen bg-gray-300 flex flex-col items-center justify-center text-center">
      <h1 className="text-5xl font-bold mb-6 text-gray-800">
        Technical Support
      </h1>
      <div className="text-2xl space-y-4">
        <p>+998 (97) 129-97-07</p>
        {/* <p>+998 (97) 129-97-07</p> */}
        <p>
          Telegram:{" "}
          <a
            href="https://t.me/rokki_khazratov"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            @agro_support
          </a>
        </p>
      </div>
    </div>
  );
};

export default Contacts;
