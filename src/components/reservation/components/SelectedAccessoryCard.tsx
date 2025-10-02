"use client";

import { X } from "lucide-react";
import { Accessory } from "./AccessoriesSelectionGrid";

interface SelectedAccessoryCardProps {
  accessory: Accessory;
  onClear: () => void;
}

export default function SelectedAccessoryCard({
  accessory,
  onClear,
}: SelectedAccessoryCardProps) {
  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 border rounded-lg">
      <h3 className="font-medium">{accessory.name}</h3>
      <button
        onClick={onClear}
        className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
