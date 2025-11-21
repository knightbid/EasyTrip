import React, { useState, useEffect } from 'react';
import { TripList } from './components/TripList';
import { TripDetail } from './components/TripDetail';
import { Trip } from './types';
import { decodeData } from './services/utils';

const STORAGE_KEY = 'trip_split_data';

const App: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    // Check for hash data (Share link simulation)
    const hash = window.location.hash;
    if (hash.startsWith('#share=')) {
      try {
        const encoded = hash.substring(7); // remove #share=
        const sharedTrip = decodeData(encoded) as Trip;
        
        if (sharedTrip && sharedTrip.id) {
          // Add shared trip to list if not exists
          setTrips(prev => {
            if (prev.some(t => t.id === sharedTrip.id)) return prev;
            return [...prev, sharedTrip];
          });
          setActiveTripId(sharedTrip.id);
          setIsReadOnly(true); // Enable Read Only mode for shared links
          
          // Clear hash to clean URL but keep state
          window.history.pushState("", document.title, window.location.pathname);
        }
      } catch (e) {
        console.error("Invalid share link", e);
      }
    } else {
        // Load from local storage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setTrips(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse local storage", e);
            }
        }
    }
    setIsLoading(false);
  }, []);

  // Persist data
  useEffect(() => {
    if (!isLoading) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
    }
  }, [trips, isLoading]);

  const handleCreateTrip = (newTrip: Trip) => {
    setTrips([newTrip, ...trips]);
    setActiveTripId(newTrip.id);
    setIsReadOnly(false);
  };

  const handleUpdateTrip = (updatedTrip: Trip) => {
    setTrips(trips.map(t => t.id === updatedTrip.id ? updatedTrip : t));
  };

  const handleDeleteTrip = (tripId: string) => {
    if (window.confirm("Bạn có chắc muốn xóa chuyến đi này không?")) {
        setTrips(trips.filter(t => t.id !== tripId));
        if (activeTripId === tripId) setActiveTripId(null);
    }
  };

  const handleSelectTrip = (id: string) => {
    setActiveTripId(id);
    setIsReadOnly(false); // Selecting from list implies ownership/editing rights
  };

  const activeTrip = trips.find(t => t.id === activeTripId);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {activeTrip ? (
        <TripDetail 
          trip={activeTrip} 
          isReadOnly={isReadOnly}
          onBack={() => setActiveTripId(null)}
          onUpdateTrip={handleUpdateTrip}
          onEnableEditing={() => setIsReadOnly(false)}
        />
      ) : (
        <TripList 
          trips={trips} 
          onSelectTrip={handleSelectTrip}
          onCreateTrip={handleCreateTrip}
          onDeleteTrip={handleDeleteTrip}
        />
      )}
    </div>
  );
};

export default App;