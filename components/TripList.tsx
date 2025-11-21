import React, { useState } from 'react';
import { Trip } from '../types';
import { Button } from './Button';
import { Plus, Calendar, Users, Trash2 } from 'lucide-react';
import { getRandomImage, generateId } from '../services/utils';

interface TripListProps {
  trips: Trip[];
  onSelectTrip: (tripId: string) => void;
  onCreateTrip: (trip: Trip) => void;
  onDeleteTrip: (tripId: string) => void;
}

export const TripList: React.FC<TripListProps> = ({ trips, onSelectTrip, onCreateTrip, onDeleteTrip }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTripName, setNewTripName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripName.trim()) return;

    const newTrip: Trip = {
      id: generateId(),
      name: newTripName,
      startDate: new Date().toISOString().split('T')[0],
      coverImage: getRandomImage(600, 400, newTripName),
      members: [],
      expenses: []
    };

    onCreateTrip(newTrip);
    setNewTripName('');
    setIsCreating(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Chuyến Đi Của Bạn</h1>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <Plus size={20} /> Tạo Chuyến Đi
        </Button>
      </div>

      {isCreating && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md border border-indigo-100 animate-fade-in-down">
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={newTripName}
              onChange={(e) => setNewTripName(e.target.value)}
              placeholder="Tên chuyến đi (VD: Đà Lạt 2024)"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
              autoFocus
            />
            <div className="flex gap-2">
              <Button type="submit">Lưu</Button>
              <Button type="button" variant="secondary" onClick={() => setIsCreating(false)}>Hủy</Button>
            </div>
          </form>
        </div>
      )}

      {trips.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <p className="text-gray-500 text-lg mb-4">Chưa có chuyến đi nào.</p>
          <Button variant="ghost" onClick={() => setIsCreating(true)}>Tạo chuyến đi đầu tiên ngay!</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map(trip => (
            <div key={trip.id} className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200 flex flex-col h-full">
              <div className="relative h-40 overflow-hidden cursor-pointer" onClick={() => onSelectTrip(trip.id)}>
                <img 
                  src={trip.coverImage} 
                  alt={trip.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <h3 className="absolute bottom-3 left-4 text-xl font-bold text-white shadow-black/50 drop-shadow-md">
                  {trip.name}
                </h3>
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center text-gray-500 text-sm mb-2">
                  <Calendar size={16} className="mr-2" />
                  {new Date(trip.startDate).toLocaleDateString('vi-VN')}
                </div>
                <div className="flex items-center text-gray-500 text-sm mb-4">
                  <Users size={16} className="mr-2" />
                  {trip.members.length} thành viên
                </div>
                
                <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-100">
                  <Button variant="secondary" className="text-xs py-1 px-3" onClick={() => onSelectTrip(trip.id)}>
                    Xem Chi Tiết
                  </Button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteTrip(trip.id); }}
                    className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                    title="Xóa chuyến đi"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
