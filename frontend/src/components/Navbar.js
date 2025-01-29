import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <div className="fixed top-0 left-0 right-0 bg-gray-900 text-white flex items-center justify-between px-4 py-3 shadow-lg z-50">
      <Link to="/" className="text-2xl font-bold">
        Daily matches
      </Link>
      <div className="flex space-x-6">
        <Link to="/biletul-zilei" className="hover:text-yellow-400">BILETUL ZILEI</Link>
        <Link to="/contact" className="hover:text-yellow-400">CONTACT</Link>
      </div>
    </div>
  );
};

export default Navbar;
