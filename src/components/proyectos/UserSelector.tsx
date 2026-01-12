"use client";

import { useState, useRef, useEffect } from 'react';
import type { Usuario } from '@/types/proyecto.types';

interface UserSelectorProps {
  label: string;
  availableUsers: Usuario[];
  selectedUsers: (Usuario | number)[];
  onSelectionChange: (userIds: number[]) => void;
  loading?: boolean;
  required?: boolean;
  placeholder?: string;
}

export default function UserSelector({
  label,
  availableUsers,
  selectedUsers,
  onSelectionChange,
  loading = false,
  required = false,
  placeholder = "Buscar y seleccionar usuarios..."
}: UserSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Convertir selectedUsers a IDs
  const selectedIds = selectedUsers.map(u => typeof u === 'object' ? u.id : u);

  // Obtener objetos completos de usuarios seleccionados
  const selectedUserObjects = availableUsers.filter(u => selectedIds.includes(u.id));

  // Filtrar usuarios disponibles (excluir seleccionados + aplicar búsqueda)
  const filteredUsers = availableUsers.filter(user => {
    const isNotSelected = !selectedIds.includes(user.id);
    const matchesSearch = searchTerm === '' || 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return isNotSelected && matchesSearch;
  });

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddUser = (userId: number) => {
    onSelectionChange([...selectedIds, userId]);
    setSearchTerm('');
  };

  const handleRemoveUser = (userId: number) => {
    onSelectionChange(selectedIds.filter(id => id !== userId));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Selected Users - Tags/Chips */}
      <div className="min-h-[100px] p-3 border-2 border-gray-300 rounded-lg bg-white mb-2">
        {selectedUserObjects.length === 0 ? (
          <p className="text-gray-400 text-sm italic">
            No hay usuarios seleccionados
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedUserObjects.map(user => (
              <div
                key={user.id}
                className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-full border border-red-200 hover:bg-red-100 transition"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {(user.username || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">
                    {user.username || user.name || user.email}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveUser(user.id)}
                  className="hover:bg-red-200 rounded-full p-0.5 transition"
                  title="Remover usuario"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add User Button / Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
          className="w-full px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition flex items-center justify-between disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <span className="text-gray-700 font-medium flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {loading ? 'Cargando usuarios...' : 'Agregar usuario'}
          </span>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-80 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={placeholder}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 transition"
                  autoFocus
                />
              </div>
            </div>

            {/* User List */}
            <div className="overflow-y-auto max-h-60">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? (
                    <>
                      <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p>No se encontraron usuarios</p>
                    </>
                  ) : (
                    <>
                      <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p>Todos los usuarios están seleccionados</p>
                    </>
                  )}
                </div>
              ) : (
                filteredUsers.map(user => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleAddUser(user.id)}
                    className="w-full px-4 py-3 hover:bg-red-50 transition flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full flex items-center justify-center font-bold">
                      {(user.username || user.email || 'U')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900">
                        {user.username || user.name || 'Sin nombre'}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Counter */}
      <p className="text-xs text-gray-600 font-semibold mt-2">
        {selectedUserObjects.length} usuario(s) seleccionado(s)
      </p>
    </div>
  );
}
