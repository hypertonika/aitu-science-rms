import React, { useState } from "react";
import { publicationTypeMap } from "../../pages/PublicationPage/PublicationsPage";
import { allHigherSchools } from "../../pages/AdminPublications";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/react";

export default function PublicationComponents({
  setYear,
  setName,
  type,
  setType,
  school,
  setSchool,
}) {
  const [preyear, setPreyear] = useState("");
  const [prename, setPrename] = useState("");

  const handleSearch = () => {
    setYear(preyear);
    if (setName) {
      setName(prename);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
      {/* Search Input (Optional Name Search) */}
      {/* Uncomment and adjust if name search is needed 
      <div className="flex flex-1 w-full md:w-auto">
        <input
          type="text"
          onChange={(e) => setPrename(e.target.value)}
          value={prename}
          placeholder="Поиск по названию..."
          className="w-full border border-gray-600 bg-[#2a2a2a] text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-l-lg"
        />
      </div>
      */}

      {/* Year Search Input and Button */}
      <div className="flex w-full md:w-auto">
        <input
          type="text"
          onChange={(e) => setPreyear(e.target.value)}
          value={preyear}
          placeholder="Поиск по году..."
          className="flex-grow border border-gray-300 bg-white text-gray-800 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-l-lg min-w-0"
        />
        <button
          className="border border-l-0 border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-r-lg rounded-l-none transition duration-200 flex-shrink-0"
          onClick={handleSearch}
        >
          Найти
        </button>
      </div>

      {/* Publication Type Dropdown */}
      <div className="w-full md:w-72 flex-shrink-0">
        <Listbox value={type} onChange={setType}>
          <div className="relative">
            <ListboxButton className="w-full border border-gray-300 bg-white text-gray-800 text-left px-4 py-2 cursor-pointer rounded-lg hover:border-gray-400 transition-colors duration-200 flex items-center justify-between">
              <span className="block overflow-hidden whitespace-nowrap text-ellipsis">
                {type ? publicationTypeMap[type] : "Тип публикации: Все"}
              </span>
              <span className="pointer-events-none flex items-center">
                <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 3a.75.75 0 01.53.22l3.5 3.5a.75.75 0 01-1.06 1.06L10 4.81 6.03 8.78a.75.75 0 01-1.06-1.06l3.5-3.5A.75.75 0 0110 3zm-3.97 9.28a.75.75 0 011.06 0L10 15.19l2.97-2.91a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 010-1.06z" clipRule="evenodd" />
                </svg>
              </span>
            </ListboxButton>
            <ListboxOptions className="absolute z-10 mt-1 w-full rounded-lg shadow-lg overflow-hidden bg-white border border-gray-300">
              <ListboxOption 
                value={null} 
                className={({ active }) =>
                  `py-2 px-4 cursor-pointer ${active ? 'bg-blue-500 text-white' : 'text-gray-800'}`
                }
              >
                Все
              </ListboxOption>
              {Object.entries(publicationTypeMap).map(([value, label]) => (
                <ListboxOption
                  key={value}
                  value={value}
                  className={({ active }) =>
                    `py-2 px-4 cursor-pointer ${active ? 'bg-blue-500 text-white' : 'text-gray-800'}`
                  }
                >
                  {label}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </div>
        </Listbox>
      </div>
        
      {/* Higher School Dropdown */}
      <div className="w-full md:w-72 flex-shrink-0">
        <Listbox value={school} onChange={setSchool}>
          <div className="relative">
            <ListboxButton className="w-full border border-gray-300 bg-white text-gray-800 text-left px-4 py-2 cursor-pointer rounded-lg hover:border-gray-400 transition-colors duration-200 flex items-center justify-between">
              <span className="block overflow-hidden whitespace-nowrap text-ellipsis">
                {school ? school : "Высшая школа: Все"}
              </span>
               <span className="pointer-events-none flex items-center">
                 <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 3a.75.75 0 01.53.22l3.5 3.5a.75.75 0 01-1.06 1.06L10 4.81 6.03 8.78a.75.75 0 01-1.06-1.06l3.5-3.5A.75.75 0 0110 3zm-3.97 9.28a.75.75 0 011.06 0L10 15.19l2.97-2.91a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 010-1.06z" clipRule="evenodd" />
                </svg>
              </span>
            </ListboxButton>
            <ListboxOptions className="absolute z-10 mt-1 w-full rounded-lg shadow-lg overflow-hidden bg-white border border-gray-300">
              <ListboxOption 
                value={null} 
                className={({ active }) =>
                  `py-2 px-4 cursor-pointer ${active ? 'bg-blue-500 text-white' : 'text-gray-800'}`
                }
              >
                Все
              </ListboxOption>
              {allHigherSchools.map((schoolItem, i) => (
                <ListboxOption
                  key={i}
                  value={schoolItem}
                  className={({ active }) =>
                    `py-2 px-4 cursor-pointer ${active ? 'bg-blue-500 text-white' : 'text-gray-800'}`
                  }
                >
                  {schoolItem}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </div>
        </Listbox>
      </div>
    </div>
  );
}
