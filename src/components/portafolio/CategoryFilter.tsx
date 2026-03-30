"use client";
import { Button } from "antd";
import { useState } from "react";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  loading?: boolean;
}

const CATEGORY_DESCRIPTIONS: { [key: string]: string } = {
  "Residencial": "Casas, apartamentos y quintas",
  "Comercial": "Restaurantes, locales y oficinas", 
  "Naval": "Diseño y construcción de barcos/yates",
  "Remodelaciones": "Reformas y ampliaciones",
  "Interiorismo": "Acabados y diseño de interiores"
};

export default function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  loading = false,
}: CategoryFilterProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Filtrar por categoría:</span>
        
        <Button
          type={selectedCategory === null ? "primary" : "default"}
          onClick={() => onCategoryChange(null)}
          disabled={loading}
          size="middle"
          className="!rounded-full !font-medium transition-all duration-200"
        >
          Todos
        </Button>
        
        {categories.map((category) => (
          <Button
            key={category}
            type={selectedCategory === category ? "primary" : "default"}
            onClick={() => onCategoryChange(category)}
            disabled={loading}
            size="middle"
            className="!rounded-full !font-medium transition-all duration-200"
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
}
