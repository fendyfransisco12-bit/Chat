"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { db } from "@/lib/firebase";
import { ref, onValue, push, remove } from "firebase/database";

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

  // Add or update destination
  const handleSaveDestination = async (e) => {
    e.preventDefault();

    if (!newDestination.name || !newDestination.imageUrl || !newDestination.estimatedDate) {
      alert("Please fill in: Name, Image URL, and Date");
      return;
    }

    try {
      if (editingId) {
        // Update existing
        const destRef = ref(db, `users/${user.uid}/destinations/${editingId}`);
        await push(destRef, {
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
            ✈️ Travel Planning
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
                type="number"
                placeholder="Budget (Rp)"
                value={newDestination.budget}
                onChange={(e) => setNewDestination({ ...newDestination, budget: e.target.value })}
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
    </div>
  );
}
