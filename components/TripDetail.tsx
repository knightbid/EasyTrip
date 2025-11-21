import React, { useState, useMemo } from 'react';
import { Trip, Expense } from '../types';
import { Button } from './Button';
import { Modal } from './Modal';
import { formatCurrency, generateId, encodeData } from '../services/utils';
import { parseExpenseWithGemini } from '../services/geminiService';
import { Users, ArrowLeft, Plus, Share2, Sparkles, Trash2, Receipt, Wallet, Check, Edit2, BarChart3, PieChart, TrendingUp, Lock, Unlock } from 'lucide-react';

interface TripDetailProps {
  trip: Trip;
  isReadOnly?: boolean;
  onBack: () => void;
  onUpdateTrip: (updatedTrip: Trip) => void;
  onEnableEditing?: () => void;
}

export const TripDetail: React.FC<TripDetailProps> = ({ trip, isReadOnly = false, onBack, onUpdateTrip, onEnableEditing }) => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'members' | 'report'>('expenses');
  
  // Member State
  const [newMemberName, setNewMemberName] = useState('');
  
  // Expense State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null); // Track editing
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expensePayer, setExpensePayer] = useState<string>('');
  const [expenseInvolved, setExpenseInvolved] = useState<string[]>([]);
  
  // AI State
  const [quickAddText, setQuickAddText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Actions - Members
  const addMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    const updatedMembers = [...trip.members, { id: generateId(), name: newMemberName.trim() }];
    onUpdateTrip({ ...trip, members: updatedMembers });
    setNewMemberName('');
  };

  const removeMember = (id: string) => {
    // Warning: removing member logic should handle existing expenses in a real app
    const updatedMembers = trip.members.filter(m => m.id !== id);
    onUpdateTrip({ ...trip, members: updatedMembers });
  };

  // Actions - Expenses
  const openExpenseModal = (expenseToEdit?: Expense) => {
    if (expenseToEdit) {
        // Edit Mode
        setEditingExpenseId(expenseToEdit.id);
        setExpenseDesc(expenseToEdit.description);
        setExpenseAmount(expenseToEdit.amount.toString());
        setExpensePayer(expenseToEdit.payerId);
        setExpenseInvolved(expenseToEdit.involvedMemberIds || trip.members.map(m => m.id));
    } else {
        // Create Mode
        setEditingExpenseId(null);
        setExpenseDesc('');
        setExpenseAmount('');
        setExpensePayer(''); 
        // Default: All members are involved
        setExpenseInvolved(trip.members.map(m => m.id));
    }
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = () => {
    if (!expenseDesc || !expenseAmount || !expensePayer) return;
    if (expenseInvolved.length === 0) {
        alert("Cần ít nhất 1 thành viên tham gia khoản chi này.");
        return;
    }
    
    const amount = parseInt(expenseAmount.replace(/[^0-9]/g, ''), 10);
    
    if (editingExpenseId) {
        // Update existing
        const updatedExpenses = trip.expenses.map(e => {
            if (e.id === editingExpenseId) {
                return {
                    ...e,
                    description: expenseDesc,
                    amount: amount,
                    payerId: expensePayer,
                    involvedMemberIds: expenseInvolved
                };
            }
            return e;
        });
        onUpdateTrip({ ...trip, expenses: updatedExpenses });
    } else {
        // Create new
        const newExpense: Expense = {
            id: generateId(),
            description: expenseDesc,
            amount: amount,
            payerId: expensePayer,
            date: new Date().toISOString(),
            involvedMemberIds: expenseInvolved,
        };
        onUpdateTrip({ ...trip, expenses: [newExpense, ...trip.expenses] });
    }

    closeExpenseModal();
  };

  const deleteExpense = (id: string) => {
    if (window.confirm("Bạn có chắc muốn xóa khoản chi này?")) {
        onUpdateTrip({ ...trip, expenses: trip.expenses.filter(e => e.id !== id) });
    }
  };

  const closeExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setEditingExpenseId(null);
    setExpenseDesc('');
    setExpenseAmount('');
    setExpensePayer('');
    setQuickAddText('');
    setExpenseInvolved([]);
  };

  const toggleInvolvedMember = (memberId: string) => {
    setExpenseInvolved(prev => {
        if (prev.includes(memberId)) {
            return prev.filter(id => id !== memberId);
        } else {
            return [...prev, memberId];
        }
    });
  };

  const toggleSelectAll = () => {
      if (expenseInvolved.length === trip.members.length) {
          setExpenseInvolved([]);
      } else {
          setExpenseInvolved(trip.members.map(m => m.id));
      }
  };

  // AI Integration
  const handleQuickAdd = async () => {
    if (!quickAddText.trim()) return;
    
    setIsAnalyzing(true);
    const memberNames = trip.members.map(m => m.name);
    const result = await parseExpenseWithGemini(quickAddText, memberNames);
    
    setIsAnalyzing(false);
    
    if (result) {
      setExpenseDesc(result.description);
      setExpenseAmount(result.amount.toString());
      
      // Try to match payer
      const matchedMember = trip.members.find(m => 
        m.name.toLowerCase() === result.payerName.toLowerCase()
      );
      
      if (matchedMember) {
        setExpensePayer(matchedMember.id);
      }

      // Default involved to all for AI quick add (can be edited in modal)
      setExpenseInvolved(trip.members.map(m => m.id));
      setEditingExpenseId(null); // Ensure create mode
      
      setIsExpenseModalOpen(true);
    }
  };

  // Calculation Logic (Split based on involved members)
  const memberStats = useMemo(() => {
    const memberIds = trip.members.map(m => m.id);
    const stats: Record<string, { paid: number, consumed: number, balance: number }> = {};
    
    trip.members.forEach(m => {
        stats[m.id] = { paid: 0, consumed: 0, balance: 0 };
    });

    trip.expenses.forEach(expense => {
      const amount = expense.amount;
      const payerId = expense.payerId;
      const involvedIds = (expense.involvedMemberIds && expense.involvedMemberIds.length > 0) 
                          ? expense.involvedMemberIds 
                          : trip.members.map(m => m.id);

      const splitCount = involvedIds.length;
      if (splitCount === 0) return;
      const splitAmount = amount / splitCount;

      // Add to paid
      if (stats[payerId]) {
        stats[payerId].paid += amount;
      }
      
      // Add to consumed
      involvedIds.forEach(memId => {
         if (stats[memId]) {
            stats[memId].consumed += splitAmount;
         }
      });
    });

    // Calculate balances
    Object.keys(stats).forEach(id => {
        stats[id].balance = stats[id].paid - stats[id].consumed;
    });

    return trip.members.map(m => ({
        member: m,
        ...stats[m.id]
    })).sort((a, b) => a.balance - b.balance);
  }, [trip]);

  const totalSpent = trip.expenses.reduce((sum, e) => sum + e.amount, 0);

  const copyShareLink = () => {
     const encoded = encodeData(trip); // Use robust utility for unicode
     const url = `${window.location.origin}${window.location.pathname}#share=${encoded}`;
     
     if (url.length > 8000) {
        alert("Dữ liệu chuyến đi quá lớn để tạo link chia sẻ nhanh (giới hạn URL).");
     } else {
        navigator.clipboard.writeText(url);
        alert("Đã sao chép link chia sẻ! Người nhận sẽ xem ở chế độ 'Chỉ xem'.");
     }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Read Only Banner */}
      {isReadOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between animate-fade-in-down">
            <div className="flex items-center gap-2 text-blue-700">
                <Lock size={18} />
                <span className="text-sm font-medium">Bạn đang xem chế độ chỉ đọc (View Only).</span>
            </div>
            {onEnableEditing && (
                <Button size="sm" variant="secondary" onClick={onEnableEditing} className="text-xs py-1 h-8 flex items-center gap-1">
                    <Unlock size={14} /> Chỉnh sửa
                </Button>
            )}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <button onClick={onBack} className="text-gray-500 hover:text-indigo-600 flex items-center mb-4">
          <ArrowLeft size={18} className="mr-1" /> Quay lại
        </button>
        
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="h-48 w-full relative">
                <img src={trip.coverImage} alt={trip.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-end p-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">{trip.name}</h1>
                        <p className="text-white/90 text-sm flex items-center gap-2">
                            <Users size={16} /> {trip.members.length} thành viên
                            <span className="mx-2">•</span>
                            Tổng chi: <span className="font-bold text-green-300">{formatCurrency(totalSpent)}</span>
                        </p>
                    </div>
                </div>
                <button onClick={copyShareLink} className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm p-2 rounded-full text-white hover:bg-white/40 transition-all" title="Chia sẻ chuyến đi">
                    <Share2 size={20} />
                </button>
            </div>

            {/* Navigation */}
            <div className="flex border-b border-gray-200 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('expenses')}
                    className={`flex-1 py-4 px-4 text-sm font-medium text-center border-b-2 whitespace-nowrap ${activeTab === 'expenses' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <div className="flex items-center justify-center gap-2"><Receipt size={18}/> Chi Tiêu</div>
                </button>
                <button 
                    onClick={() => setActiveTab('balances')}
                    className={`flex-1 py-4 px-4 text-sm font-medium text-center border-b-2 whitespace-nowrap ${activeTab === 'balances' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                     <div className="flex items-center justify-center gap-2"><Wallet size={18}/> Công Nợ</div>
                </button>
                <button 
                    onClick={() => setActiveTab('report')}
                    className={`flex-1 py-4 px-4 text-sm font-medium text-center border-b-2 whitespace-nowrap ${activeTab === 'report' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                     <div className="flex items-center justify-center gap-2"><BarChart3 size={18}/> Tổng kết</div>
                </button>
                <button 
                    onClick={() => setActiveTab('members')}
                    className={`flex-1 py-4 px-4 text-sm font-medium text-center border-b-2 whitespace-nowrap ${activeTab === 'members' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                     <div className="flex items-center justify-center gap-2"><Users size={18}/> Thành Viên</div>
                </button>
            </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
        
        {/* Tab: Expenses */}
        {activeTab === 'expenses' && (
            <div>
                {/* Quick Add Bar */}
                {!isReadOnly && trip.members.length > 0 && (
                    <div className="mb-8">
                         <div className="relative">
                            <input
                                type="text"
                                value={quickAddText}
                                onChange={(e) => setQuickAddText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                                placeholder='Nhập nhanh: "Ăn tối 500k Hùng trả" ...'
                                className="w-full pl-4 pr-32 py-3 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                disabled={isAnalyzing}
                            />
                            <div className="absolute right-1 top-1 bottom-1 flex items-center gap-1">
                                <Button 
                                    onClick={handleQuickAdd} 
                                    disabled={!quickAddText.trim() || isAnalyzing}
                                    className="rounded-full h-full px-4 bg-gradient-to-r from-indigo-600 to-purple-600 border-none"
                                >
                                    {isAnalyzing ? <Sparkles className="animate-spin" size={18}/> : <Sparkles size={18} />}
                                </Button>
                                <Button 
                                    onClick={() => openExpenseModal()}
                                    variant="secondary"
                                    className="rounded-full h-full w-10 p-0 flex items-center justify-center border-none bg-gray-100 text-gray-600 hover:bg-gray-200"
                                >
                                    <Plus size={20} />
                                </Button>
                            </div>
                        </div>
                        {process.env.API_KEY ? null : <p className="text-xs text-red-400 mt-1 ml-4">Cần cấu hình API Key để dùng tính năng AI.</p>}
                    </div>
                )}
                
                {!isReadOnly && trip.members.length === 0 && (
                    <div className="text-center p-4 bg-yellow-50 text-yellow-700 rounded-lg mb-6">
                        Hãy thêm thành viên trước khi thêm khoản chi!
                    </div>
                )}

                {/* List */}
                <div className="space-y-4">
                    {trip.expenses.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Receipt size={48} className="mx-auto mb-2 opacity-20" />
                            <p>Chưa có khoản chi nào.</p>
                        </div>
                    ) : (
                        trip.expenses.map(expense => {
                            const payer = trip.members.find(m => m.id === expense.payerId);
                            const involvedCount = expense.involvedMemberIds ? expense.involvedMemberIds.length : trip.members.length;
                            const isAll = involvedCount === trip.members.length;
                            
                            return (
                                <div key={expense.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors group">
                                    <div className={`flex items-start gap-3 flex-1 ${!isReadOnly ? 'cursor-pointer' : ''}`} onClick={() => !isReadOnly && openExpenseModal(expense)}>
                                        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 mt-1">
                                            <Receipt size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{expense.description}</h4>
                                            <p className="text-sm text-gray-500">
                                                <span className="font-medium text-gray-700">{payer?.name || 'Unknown'}</span> đã trả • 
                                                <span className="text-gray-400 italic ml-1">
                                                    {isAll ? ' Cho tất cả' : ` Cho ${involvedCount} người`}
                                                </span>
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">{new Date(expense.date).toLocaleDateString('vi-VN')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-gray-900">{formatCurrency(expense.amount)}</span>
                                        {!isReadOnly && (
                                            <>
                                                <button 
                                                    onClick={() => openExpenseModal(expense)}
                                                    className="text-gray-400 hover:text-indigo-500 p-2 rounded-full hover:bg-indigo-50 transition-colors"
                                                    title="Sửa"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => deleteExpense(expense.id)}
                                                    className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                                                    title="Xóa"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        )}

        {/* Tab: Balances */}
        {activeTab === 'balances' && (
            <div className="space-y-6">
                <div className="grid gap-4">
                    {memberStats.map(({ member, balance }) => (
                         <div key={member.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${balance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                                    {member.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium text-lg">{member.name}</span>
                            </div>
                            <div className={`text-lg font-bold ${balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                {balance > 0 ? '+' : ''}{formatCurrency(balance)}
                            </div>
                         </div>
                    ))}
                </div>
                
                {trip.expenses.length > 0 && (
                    <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                        <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                            <Wallet size={18} /> Gợi ý thanh toán
                        </h3>
                        <p className="text-sm text-indigo-700">
                            Người âm tiền (đỏ) chuyển cho người dương tiền (xanh) để cân bằng.
                            <br/>
                            <span className="text-xs italic opacity-70">*Tính năng tối ưu hóa chuyển tiền chi tiết đang phát triển.*</span>
                        </p>
                    </div>
                )}
            </div>
        )}

        {/* Tab: Report */}
        {activeTab === 'report' && (
            <div className="space-y-8 animate-fade-in-up">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                        <p className="text-blue-600 text-sm font-medium mb-1 flex items-center gap-1"><Receipt size={14}/> Tổng Chi Phí</p>
                        <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalSpent)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                         <p className="text-purple-600 text-sm font-medium mb-1 flex items-center gap-1"><Users size={14}/> Bình Quân</p>
                         <p className="text-2xl font-bold text-purple-900">
                             {formatCurrency(trip.members.length ? totalSpent / trip.members.length : 0)}
                             <span className="text-xs font-normal text-purple-700 ml-1">/người</span>
                         </p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
                        <p className="text-amber-600 text-sm font-medium mb-1 flex items-center gap-1"><TrendingUp size={14}/> Chi Nhiều Nhất</p>
                        {(() => {
                            const topSpender = [...memberStats].sort((a, b) => b.paid - a.paid)[0];
                            return topSpender && topSpender.paid > 0 ? (
                                <div>
                                    <p className="text-lg font-bold text-amber-900">{topSpender.member.name}</p>
                                    <p className="text-sm text-amber-700">{formatCurrency(topSpender.paid)}</p>
                                </div>
                            ) : <p className="text-gray-400 text-sm italic">Chưa có dữ liệu</p>;
                        })()}
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Payment Chart */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <BarChart3 size={18} className="text-indigo-500"/> Ai đã chi tiền?
                        </h3>
                        <div className="space-y-3">
                            {memberStats.map(stat => {
                                const percent = totalSpent > 0 ? (stat.paid / totalSpent) * 100 : 0;
                                return (
                                    <div key={stat.member.id}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-medium">{stat.member.name}</span>
                                            <span className="text-gray-500">{formatCurrency(stat.paid)}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                            <div className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Consumption Chart */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <PieChart size={18} className="text-pink-500"/> Ai sử dụng nhiều nhất?
                        </h3>
                        <div className="space-y-3">
                            {memberStats.sort((a,b) => b.consumed - a.consumed).map(stat => {
                                const percent = totalSpent > 0 ? (stat.consumed / totalSpent) * 100 : 0;
                                return (
                                    <div key={stat.member.id}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-medium">{stat.member.name}</span>
                                            <span className="text-gray-500">{formatCurrency(stat.consumed)}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                            <div className="bg-pink-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Detailed Grid Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-bold text-gray-800">Chi tiết công nợ</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3">Thành viên</th>
                                    <th className="px-6 py-3 text-right text-indigo-600">Đã Chi</th>
                                    <th className="px-6 py-3 text-right text-pink-600">Sử Dụng</th>
                                    <th className="px-6 py-3 text-right">Chênh Lệch</th>
                                </tr>
                            </thead>
                            <tbody>
                                {memberStats.map((stat) => (
                                    <tr key={stat.member.id} className="bg-white border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{stat.member.name}</td>
                                        <td className="px-6 py-4 text-right text-indigo-600 font-medium">{formatCurrency(stat.paid)}</td>
                                        <td className="px-6 py-4 text-right text-pink-600 font-medium">{formatCurrency(stat.consumed)}</td>
                                        <td className={`px-6 py-4 text-right font-bold ${stat.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {stat.balance > 0 ? '+' : ''}{formatCurrency(stat.balance)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-gray-50 text-center">
                        <p className="text-xs text-gray-500 italic">
                            "Chuyến đi càng dài, kỷ niệm càng nhiều, và tiền chia càng... đau đầu!" <br/>
                            Hãy thanh toán sòng phẳng để lần sau còn đi tiếp nhé! 🚗💨
                        </p>
                    </div>
                </div>
            </div>
        )}

        {/* Tab: Members */}
        {activeTab === 'members' && (
            <div>
                {!isReadOnly && (
                    <form onSubmit={addMember} className="flex gap-2 mb-6">
                        <input
                            type="text"
                            value={newMemberName}
                            onChange={(e) => setNewMemberName(e.target.value)}
                            placeholder="Tên thành viên mới..."
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                        />
                        <Button type="submit" disabled={!newMemberName.trim()}>Thêm</Button>
                    </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trip.members.map(member => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                    {member.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium">{member.name}</span>
                            </div>
                            {!isReadOnly && (
                                <button 
                                    onClick={() => removeMember(member.id)}
                                    className="text-gray-400 hover:text-red-500 p-1"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                    {trip.members.length === 0 && (
                        <p className="text-gray-500 italic text-center col-span-2 py-4">Chưa có thành viên nào.</p>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* Add/Edit Expense Modal */}
      {!isReadOnly && (
        <Modal 
            isOpen={isExpenseModalOpen} 
            onClose={closeExpenseModal}
            title={editingExpenseId ? "Sửa Khoản Chi" : "Thêm Khoản Chi Mới"}
        >
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                    <input
                        type="text"
                        value={expenseDesc}
                        onChange={(e) => setExpenseDesc(e.target.value)}
                        className="w-full rounded-md border-gray-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="VD: Vé tham quan"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền (VNĐ)</label>
                    <input
                        type="number"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        className="w-full rounded-md border-gray-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Người trả</label>
                    <select
                        value={expensePayer}
                        onChange={(e) => setExpensePayer(e.target.value)}
                        className="w-full rounded-md border-gray-300 border p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">-- Chọn người trả --</option>
                        {trip.members.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Thành viên tham gia ({expenseInvolved.length})</label>
                        <button 
                            type="button" 
                            onClick={toggleSelectAll}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            {expenseInvolved.length === trip.members.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                        {trip.members.map(member => {
                            const isSelected = expenseInvolved.includes(member.id);
                            return (
                                <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => toggleInvolvedMember(member.id)}
                                    className={`
                                        px-3 py-1.5 rounded-full text-sm font-medium border transition-all flex items-center gap-1
                                        ${isSelected 
                                            ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}
                                    `}
                                >
                                    {isSelected && <Check size={14} />}
                                    {member.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t mt-2">
                    <Button variant="secondary" onClick={closeExpenseModal}>Hủy</Button>
                    <Button onClick={handleSaveExpense} disabled={!expenseDesc || !expenseAmount || !expensePayer || expenseInvolved.length === 0}>
                        {editingExpenseId ? "Lưu thay đổi" : "Thêm"}
                    </Button>
                </div>
            </div>
        </Modal>
      )}
    </div>
  );
};