"use client";

import { useState } from "react";
import type { Usuario } from "@/types/proyecto.types";

interface UserMultiSelectProps {
  label: string;
  selectedIds: number[];
  availableUsers: Usuario[];
  loading: boolean;
  onChange: (ids: number[]) => void;
  required?: boolean;
}

export default function UserMultiSelect({
  label,
  selectedIds,
  availableUsers,
  loading,
  onChange,
  required = false
}: UserMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleUser = (userId: number) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter(id => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  const selectedUsers = availableUsers.filter(u => selectedIds.includes(u.id));

  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {/* Selected Users Display */}
      <div 
        onClick={() => !loading && setIsOpen(!isOpen)}
        className={`w-full min-h-[48px] px-4 py-2 border-2 border-gray-300 rounded-lg cursor-pointer transition ${
          loading ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-red-400'
        } ${isOpen ? 'border-red-500 ring ring-red-200' : ''}`}
      >
        {selectedUsers.length === 0 ? (
          <span className="text-gray-400">Selecciona {label.toLowerCase()}</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map(user => (
              <span
                key={user.id}
                className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"
              >
                {user.username || user.email}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleUser(user.id);
                  }}
                  className="hover:bg-red-200 rounded-full p-0.5"
                  title="Remover"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Dropdown List */}
      {isOpen && !loading && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Options */}
          <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {availableUsers.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-sm">
                No hay {label.toLowerCase()} disponibles
              </div>
            ) : (
              availableUsers.map(user => {
                const isSelected = selectedIds.includes(user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    className={`w-full text-left px-4 py-3 transition flex items-center gap-3 ${
                      isSelected 
                        ? 'bg-red-50 hover:bg-red-100' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                      isSelected 
                        ? 'bg-red-600 border-red-600' 
                        : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {user.username || 'Sin nombre'}
                      </div>
                      {user.email && (
                        <div className="text-xs text-gray-500">
                          {user.email}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Info Text */}
      <p className="text-xs text-gray-500 mt-1">
        {selectedUsers.length} seleccionado{selectedUsers.length !== 1 ? 's' : ''} de {availableUsers.length} disponible{availableUsers.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
