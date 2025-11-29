"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { db } from "@/lib/firebase";
import { ref, onValue, push, remove, set } from "firebase/database";

export default function PlanningDestination() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [destinations, setDestinations] = useState([]);
  const [newDestination, setNewDestination] = useState({
    name: "",
    description: "",
    imageUrl: "",
    estimatedDate: "",
    budget: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);

  // Fetch destinations
  useEffect(() => {
    if (!user || !db) return;

    const destRef = ref(db, `users/${user.uid}/destinations`);
    const unsubscribe = onValue(destRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const destList = Object.entries(data)
          .map(([id, dest]) => ({ id, ...dest }))
          .sort((a, b) => new Date(a.estimatedDate) - new Date(b.estimatedDate));
        setDestinations(destList);
      } else {
        setDestinations([]);
      }
    });

    return unsubscribe;
  }, [user]);

  // Format budget input dengan separator ribuan
  const formatBudget = (value) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/\D/g, "");
    // Format dengan separator ribuan
    if (!numericValue) return "";
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleBudgetChange = (e) => {
    const inputValue = e.target.value;
    const formatted = formatBudget(inputValue);
    setNewDestination({ ...newDestination, budget: inputValue.replace(/\D/g, "") }); // Store raw number
  };

  // Add or update destination
  const handleSaveDestination = async (e) => {
    e.preventDefault();

    if (!newDestination.name || !newDestination.imageUrl || !newDestination.estimatedDate) {
      alert("Please fill in: Name, Image URL, and Date");
      return;
    }

    try {
      if (editingId) {
        // Update existing - gunakan set() bukan push()
        const destRef = ref(db, `users/${user.uid}/destinations/${editingId}`);
        await set(destRef, {
          ...newDestination,
          updatedAt: Date.now(),
        });
        setEditingId(null);
      } else {
        // Add new
        const destRef = ref(db, `users/${user.uid}/destinations`);
        await push(destRef, {
          ...newDestination,
          createdAt: Date.now(),
          status: "planning",
        });
      }

      setNewDestination({
        name: "",
        description: "",
        imageUrl: "",
        estimatedDate: "",
        budget: "",
      });
    } catch (error) {
      console.error("Error saving destination:", error);
      alert("Failed to save destination");
    }
  };

  // Delete destination
  const handleDeleteDestination = async (destId) => {
    if (!window.confirm("Delete this destination?")) return;

    try {
      const destRef = ref(db, `users/${user.uid}/destinations/${destId}`);
      await remove(destRef);
    } catch (error) {
      console.error("Error deleting destination:", error);
      alert("Failed to delete destination");
    }
  };

  return (
    <div className={`h-full overflow-y-auto p-6 transition-colors duration-300 ${
      isDark ? "bg-gray-800" : "bg-gray-50"
    }`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
            Planning New Journey
          </h1>
          <p className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Plan your next amazing destination
          </p>
        </div>

        {/* Add Destination Form */}
        <div className={`rounded-lg shadow-lg p-6 mb-8 ${
          isDark ? "bg-gray-700" : "bg-white"
        }`}>
          <h2 className={`text-2xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
            {editingId ? "Edit Destination" : "Add New Destination"}
          </h2>
          
          <form onSubmit={handleSaveDestination} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Destination Name */}
              <input
                type="text"
                placeholder="Destination Name"
                value={newDestination.name}
                onChange={(e) => setNewDestination({ ...newDestination, name: e.target.value })}
                className={`px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  isDark
                    ? "bg-gray-600 text-white placeholder-gray-400"
                    : "bg-gray-100 text-gray-900 placeholder-gray-500"
                }`}
              />

              {/* Estimated Date */}
              <input
                type="date"
                value={newDestination.estimatedDate}
                onChange={(e) => setNewDestination({ ...newDestination, estimatedDate: e.target.value })}
                className={`px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  isDark
                    ? "bg-gray-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              />

              {/* Budget */}
              <input
                type="text"
                placeholder="Budget (Rp)"
                value={formatBudget(newDestination.budget)}
                onChange={handleBudgetChange}
                className={`px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  isDark
                    ? "bg-gray-600 text-white placeholder-gray-400"
                    : "bg-gray-100 text-gray-900 placeholder-gray-500"
                }`}
              />

              {/* Image URL */}
              <input
                type="url"
                placeholder="Image URL"
                value={newDestination.imageUrl}
                onChange={(e) => setNewDestination({ ...newDestination, imageUrl: e.target.value })}
                className={`px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  isDark
                    ? "bg-gray-600 text-white placeholder-gray-400"
                    : "bg-gray-100 text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>

            {/* Description */}
            <textarea
              placeholder="Description"
              value={newDestination.description}
              onChange={(e) => setNewDestination({ ...newDestination, description: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none ${
                isDark
                  ? "bg-gray-600 text-white placeholder-gray-400"
                  : "bg-gray-100 text-gray-900 placeholder-gray-500"
              }`}
              rows="3"
            />

            {/* Image Preview */}
            {newDestination.imageUrl && (
              <div className="rounded-lg overflow-hidden">
                <img
                  src={newDestination.imageUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/400x300?text=Invalid+Image";
                  }}
                />
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                {editingId ? "Update" : "Add"} Destination
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setNewDestination({
                      name: "",
                      description: "",
                      imageUrl: "",
                      estimatedDate: "",
                      budget: "",
                    });
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Destinations Grid */}
        {destinations.length === 0 ? (
          <div className={`text-center py-12 rounded-lg ${isDark ? "bg-gray-700" : "bg-white"}`}>
            <p className={`text-xl ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              No destinations yet. Add one to get started! 🌍
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations.map((dest) => (
              <div
                key={dest.id}
                className={`rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105 ${
                  isDark ? "bg-gray-700" : "bg-white"
                }`}
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-gray-200">
                  <img
                    src={dest.imageUrl}
                    alt={dest.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/400x300?text=Image+Not+Found";
                    }}
                  />
                  {dest.status && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {dest.status}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                    {dest.name}
                  </h3>

                  {dest.description && (
                    <p className={`text-sm mb-3 line-clamp-2 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}>
                      {dest.description}
                    </p>
                  )}

                  {/* Date and Budget */}
                  <div className="space-y-2 mb-4">
                    {dest.estimatedDate && (
                      <p className={`text-sm flex items-center gap-2 ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}>
                        📅 {new Date(dest.estimatedDate).toLocaleDateString()}
                      </p>
                    )}
                    {dest.budget && (
                      <p className={`text-sm flex items-center gap-2 font-semibold text-green-500`}>
                        💰 Rp {parseInt(dest.budget).toLocaleString("id-ID")}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedDestination(dest)}
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-3 rounded-lg transition-colors duration-200 text-sm"
                    >
                      View
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(dest.id);
                        setNewDestination(dest);
                      }}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded-lg transition-colors duration-200 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteDestination(dest.id)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-lg transition-colors duration-200 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail View Modal */}
      {selectedDestination && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}>
            {/* Close Button */}
            <div className="sticky top-0 flex justify-end p-4 bg-opacity-95">
              <button
                onClick={() => setSelectedDestination(null)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              {/* Image */}
              <div className="rounded-lg overflow-hidden mb-6">
                <img
                  src={selectedDestination.imageUrl}
                  alt={selectedDestination.name}
                  className="w-full h-80 object-cover"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/600x400?text=Image+Not+Found";
                  }}
                />
              </div>

              {/* Title */}
              <h1 className={`text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                {selectedDestination.name}
              </h1>

              {/* Status */}
              {selectedDestination.status && (
                <div className="mb-4">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    {selectedDestination.status}
                  </span>
                </div>
              )}

              {/* Date and Budget */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {selectedDestination.estimatedDate && (
                  <div className={`p-4 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Estimated Date</p>
                    <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                      📅 {new Date(selectedDestination.estimatedDate).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </p>
                  </div>
                )}
                {selectedDestination.budget && (
                  <div className={`p-4 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Budget</p>
                    <p className="text-lg font-semibold text-green-500">
                      💰 Rp {parseInt(selectedDestination.budget).toLocaleString("id-ID")}
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedDestination.description && (
                <div className="mb-6">
                  <h2 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                    Description
                  </h2>
                  <p className={`leading-relaxed whitespace-pre-wrap ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}>
                    {selectedDestination.description}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEditingId(selectedDestination.id);
                    setNewDestination(selectedDestination);
                    setSelectedDestination(null);
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    handleDeleteDestination(selectedDestination.id);
                    setSelectedDestination(null);
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedDestination(null)}
                  className={`flex-1 font-bold py-2 px-4 rounded-lg transition-colors duration-200 ${
                    isDark
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
