// Loader.js
import React from "react";

const Loader = ({ message = "Loading..." }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-transparent pointer-events-none">
      <div className="bg-white/90 p-6 rounded-lg flex flex-col items-center space-y-4 shadow-lg pointer-events-auto">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
};

export default Loader;
