import { useState, useRef, useEffect } from "react";
import { 
  Bars3Icon, 
  BellIcon, 
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon 
} from "@heroicons/react/24/outline";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import technoLogo from "../assets/shortlogo1.png";

const Navbar = ({ isOpen, setIsOpen }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuItemClick = (tabName) => {
    setIsDropdownOpen(false);
    if (tabName === "Logout") {
      logout();
    } else {
      navigate(`/hr-hub?category=PROFILE&tab=${encodeURIComponent(tabName)}`);
    }
  };

  const userName = user?.name || user?.username || (user?.email ? user.email.split("@")[0] : "Admin");
  const userRole = typeof user?.role === "object" ? user?.role?.name : (user?.role || "Employee");
  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-white border-b border-gray-200/80 z-20 flex items-center justify-between px-4 transition-all duration-300 sm:px-6 ${
        isOpen ? "lg:left-64" : "lg:left-20"
      }`}
    >
      {/* Left: Sidebar Toggle + Logo & HRMS Brand */}
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition focus:outline-none"
          title="Toggle Navigation"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2.5">
          <img
            src={technoLogo}
            alt="TechnoVani"
            className="h-8 w-8 object-contain shrink-0"
          />
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-gray-900 tracking-tight">HRMS</span>
            <span className="text-blue-600 font-bold text-xs px-2.5 py-0.5 bg-blue-50/80 rounded-full border border-blue-100 select-none">
              Enterprise
            </span>
          </div>
        </div>
      </div>

      {/* Center: Search Bar from Reference Image */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <MagnifyingGlassIcon className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search settings, employees, policies, reports..."
            className="w-full bg-slate-50/80 border border-gray-200/80 text-gray-700 text-xs rounded-xl pl-9 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
          <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <kbd className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">⌘K</kbd>
          </span>
        </div>
      </div>

      {/* Right: Quick Actions & User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Messages / Chat Icon with online status dot */}
        <button 
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition focus:outline-none"
          title="Messages"
        >
          <ChatBubbleLeftRightIcon className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* Notifications Bell */}
        <button 
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition focus:outline-none"
          title="Notifications"
        >
          <BellIcon className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white"></span>
        </button>

        {/* Profile Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-gray-100 transition focus:outline-none"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs uppercase select-none">
              {initials}
            </div>
            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-xs font-extrabold text-gray-800 capitalize truncate max-w-[120px]">
                {userName}
              </span>
              <span className="text-[10px] font-semibold text-gray-400 truncate max-w-[120px]">
                {userRole}
              </span>
            </div>
            <ChevronDownIcon className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 z-30">
              <button
                onClick={() => handleMenuItemClick("Employee Profile")}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 transition"
              >
                My Profile
              </button>
              <button
                onClick={() => handleMenuItemClick("Login History")}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 transition"
              >
                Change Password
              </button>
              <button
                onClick={() => handleMenuItemClick("Preferences")}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 transition"
              >
                Preferences
              </button>
              <hr className="my-1 border-gray-100" />
              <button
                onClick={() => handleMenuItemClick("Logout")}
                className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 hover:text-red-700 transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
