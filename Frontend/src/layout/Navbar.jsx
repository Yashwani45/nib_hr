import { Bars3Icon, BellIcon, UserCircleIcon } from "@heroicons/react/24/outline";

const Navbar = ({ isOpen, setIsOpen }) => {
  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-white shadow-md z-20 flex items-center justify-between px-4 transition-all duration-300 sm:px-6 ${
        isOpen ? "lg:left-64" : "lg:left-20"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <Bars3Icon className="w-7 h-7 text-gray-700" />
        </button>

        <h1 className="truncate text-lg font-bold text-gray-800 sm:text-xl">
          HR Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <BellIcon className="w-6 h-6 text-gray-600 cursor-pointer" />

        <div className="flex items-center gap-2">
          <UserCircleIcon className="w-8 h-8 text-gray-700" />
          <span className="hidden font-medium text-gray-700 sm:inline">Admin</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
