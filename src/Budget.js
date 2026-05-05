import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Budget = ({ transactions = [] }) => {
    // Lấy ID chuẩn xác từ Local Storage (Bọc thêm fallback đề phòng)
    const userId = localStorage.getItem('userId') || localStorage.getItem('user_id');
    const [categories, setCategories] = useState([]);
    const [budgets, setBudgets] = useState({}); 
    const [savedBudgets, setSavedBudgets] = useState({});
    
    // State quản lý ô nhập liệu đang mở
    const [activeInput, setActiveInput] = useState(null); 
    
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        return `${today.getFullYear()}-${mm}`;
    });

    const getBackendMonthYear = (dateStr) => dateStr.split('-').reverse().join('/');

    // Đặt chung 1 biến Base URL để sau này dễ đổi (Lúc test ở nhà mày có thể đổi thành http://localhost:8080)
    const BASE_URL = 'https://expense-backend-2qzn.onrender.com';

    const targetCategories = [
        { name: 'Ăn uống', icon: '🍽️' },
        { name: 'Chi tiêu hàng ngày', icon: '🛒' },
        { name: 'Quần áo', icon: '👕' },
        { name: 'Mỹ phẩm', icon: '💄' },
        { name: 'Phí giao lưu', icon: '🍻' },
        { name: 'Y tế', icon: '💊' },
        { name: 'Giáo dục', icon: '📚' },
        { name: 'Tiền điện', icon: '💡' },
        { name: 'Đi lại', icon: '🚌' },
        { name: 'Tiền nhà', icon: '🏠' },
    ];

    useEffect(() => {
        if (!userId) return;
        axios.get(`${BASE_URL}/api/categories?userId=${userId}&type=EXPENSE`)
            .then(res => setCategories(res.data))
            .catch(err => console.error(err));
    }, [userId]);

    useEffect(() => {
        if (!userId) return;
        const monthYear = getBackendMonthYear(selectedDate);
        axios.get(`${BASE_URL}/api/budgets/${userId}?monthYear=${monthYear}`)
            .then(res => {
                const budgetMap = {};
                res.data.forEach(b => { budgetMap[b.category.id] = b.amount; });
                setSavedBudgets(budgetMap);
            })
            .catch(err => console.error(err));
    }, [userId, selectedDate, categories]);

    const calculateActualSpent = (catId) => {
        const [year, month] = selectedDate.split('-');
        return transactions
            .filter(t => {
                if (t.type !== 'EXPENSE' || !t.category || t.category.id !== catId) return false;
                const d = new Date(t.transactionDate);
                return (d.getMonth() + 1) === parseInt(month) && d.getFullYear() === parseInt(year);
            })
            .reduce((sum, t) => sum + t.amount, 0);
    };

    // Hàm lưu tích hợp tạo danh mục
    const handleSaveBudget = async (targetName, dbCat) => {
        const itemKey = dbCat ? dbCat.id : targetName;
        const amount = budgets[itemKey];
        
        if (!amount || amount <= 0) return alert("Vui lòng nhập số tiền!");

        const isRecurring = window.confirm("Áp dụng mức ngân sách này cho các tháng sau luôn không?");
        
        try {
            let categoryId = dbCat ? dbCat.id : null;

            if (!categoryId) {
                const newCatRes = await axios.post(`${BASE_URL}/api/categories`, {
                    name: targetName,
                    type: 'EXPENSE',
                    userId: parseInt(userId)
                });
                categoryId = newCatRes.data.id;
                setCategories(prev => [...prev, newCatRes.data]); 
            }

            await axios.post(`${BASE_URL}/api/budgets/save`, {
                userId: parseInt(userId),
                categoryId: categoryId,
                amount: parseFloat(amount),
                monthYear: getBackendMonthYear(selectedDate),
                recurring: isRecurring
            });

            alert("Đã chốt ngân sách thành công! 🎯");
            setSavedBudgets({ ...savedBudgets, [categoryId]: amount });
            setActiveInput(null); 
            setBudgets({ ...budgets, [itemKey]: '' }); // Reset ô nhập
        } catch (err) {
            console.error(err);
            alert("Lỗi lưu dữ liệu! Vui lòng thử lại.");
        }
    };

    const totalLimit = Object.values(savedBudgets).reduce((s, v) => s + parseFloat(v || 0), 0);
    const totalSpent = categories.reduce((s, c) => {
        const isTarget = targetCategories.some(t => t.name.toLowerCase() === c.name.toLowerCase());
        return isTarget ? s + calculateActualSpent(c.id) : s;
    }, 0);
    const totalPercent = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

    return (
        <div className="w-full max-w-3xl mx-auto px-4 py-8 flex flex-col items-center pb-24 font-sans animate-fade-in">
            
            {/* TIÊU ĐỀ & CHỌN THÁNG */}
            <div className="text-center mb-8 w-full">
                <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter uppercase mb-4">
                    🎯 Ngân Sách
                </h2>
                <div className="inline-flex bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <input 
                        type="month" 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="p-3 bg-transparent font-black text-teal-600 outline-none cursor-pointer"
                    />
                </div>
            </div>

            {/* THẺ TỔNG QUAN SIÊU ĐẸP */}
            <div className="w-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white shadow-2xl mb-10 relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-teal-400 text-xs font-black uppercase tracking-[0.2em] mb-2 text-center opacity-80">Tổng định mức tháng</p>
                    <h3 className="text-4xl md:text-5xl text-center font-black tabular-nums tracking-tighter">
                        {totalLimit.toLocaleString('vi-VN')} <span className="text-2xl text-teal-400">đ</span>
                    </h3>
                    
                    <div className="mt-8 bg-white/10 p-5 rounded-3xl backdrop-blur-md border border-white/10">
                        <div className="flex justify-between items-end mb-3">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Tiến độ chi tiêu</span>
                            <span className={`text-2xl font-black ${totalPercent > 100 ? 'text-rose-400' : 'text-teal-300'}`}>
                                {totalPercent.toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full h-3 bg-slate-950/50 rounded-full overflow-hidden mb-3">
                            <div className={`h-full rounded-full transition-all duration-1000 ${totalPercent > 100 ? 'bg-rose-500' : 'bg-gradient-to-r from-teal-500 to-emerald-400'}`} style={{ width: `${Math.min(100, totalPercent)}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-300">Đã tiêu: <span className="text-white">{totalSpent.toLocaleString('vi-VN')}đ</span></span>
                            <span className={totalPercent > 100 ? 'text-rose-400' : 'text-teal-300'}>
                                Còn lại: {(totalLimit - totalSpent).toLocaleString('vi-VN')}đ
                            </span>
                        </div>
                    </div>
                </div>
                {/* Hiệu ứng ánh sáng nền */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
            </div>

            {/* DANH SÁCH 10 MỤC CHI */}
            <div className="w-full grid grid-cols-1 gap-5">
                {targetCategories.map((target) => {
                    const dbCat = categories.find(c => c.name.toLowerCase() === target.name.toLowerCase());
                    const itemKey = dbCat ? dbCat.id : target.name; 
                    
                    const limit = dbCat ? parseFloat(savedBudgets[dbCat.id] || 0) : 0;
                    const spent = dbCat ? calculateActualSpent(dbCat.id) : 0;
                    const percent = limit > 0 ? (spent / limit) * 100 : 0;
                    const isOver = spent > limit && limit > 0;

                    return (
                        <div key={itemKey} className={`bg-white p-5 md:p-6 rounded-[2rem] shadow-lg border border-slate-100 flex flex-col gap-4 transition-all duration-300 hover:shadow-xl ${!dbCat ? 'bg-slate-50 border-dashed opacity-80' : ''}`}>
                            
                            {/* Dòng Tiêu Đề Danh Mục */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm border ${dbCat ? 'bg-teal-50/50 border-teal-100' : 'bg-white border-slate-200 grayscale'}`}>
                                        {target.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800 text-base md:text-lg uppercase tracking-tight">{target.name}</h4>
                                        <p className="text-[11px] font-bold mt-1">
                                            {!dbCat ? (
                                                <span className="text-slate-400 italic">Chưa phát sinh dữ liệu</span>
                                            ) : (
                                                <span className="text-teal-600 bg-teal-50 px-2 py-1 rounded-md">
                                                    Định mức: {limit.toLocaleString('vi-VN')} đ
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => setActiveInput(activeInput === itemKey ? null : itemKey)}
                                    className={`text-[11px] px-5 py-2.5 rounded-xl font-black transition-all shadow-sm shrink-0 uppercase tracking-widest ${
                                        limit > 0 
                                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                                        : 'bg-teal-500 text-white hover:bg-teal-600 shadow-teal-500/30'
                                    }`}
                                >
                                    {limit > 0 ? 'Sửa mức' : 'Thiết lập'}
                                </button>
                            </div>

                            {/* Khu Vực Hiển Thị Phần Trăm & Thanh Tiến Độ (Chỉ hiện nếu đã đặt ngân sách) */}
                            {limit > 0 && (
                                <div className="mt-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiến độ chi tiêu</span>
                                        <span className={`text-xl font-black ${isOver ? 'text-rose-500' : 'text-teal-600'}`}>
                                            {percent.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mb-3">
                                        <div className={`h-full rounded-full transition-all duration-1000 ${isOver ? 'bg-rose-500' : 'bg-teal-500'}`} style={{ width: `${Math.min(100, percent)}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-[11px] font-black uppercase text-slate-500">
                                        <span>Đã tiêu: <span className="text-slate-800">{spent.toLocaleString('vi-VN')}đ</span></span>
                                        <span className={isOver ? 'text-rose-500' : 'text-teal-600'}>
                                            {isOver ? '⚠️ Vượt ngân sách!' : `Còn lại: ${(limit - spent).toLocaleString('vi-VN')}đ`}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Ô Nhập Tiền Cực Xịn (Có dấu chấm phân cách) */}
                            {activeInput === itemKey && (
                                <div className="flex gap-3 pt-4 border-t border-dashed border-slate-200 mt-2 animate-fade-in">
                                    <div className="relative flex-1">
                                        <input 
                                            type="text" // Dùng text để format dấu chấm
                                            placeholder="Nhập số tiền..."
                                            value={budgets[itemKey] ? Number(budgets[itemKey]).toLocaleString('vi-VN') : ''}
                                            onChange={(e) => {
                                                // Chỉ giữ lại số, xóa hết các ký tự khác (chữ, dấu chấm, dấu phẩy)
                                                const numericValue = e.target.value.replace(/\D/g, '');
                                                setBudgets({ ...budgets, [itemKey]: numericValue });
                                            }}
                                            className="w-full bg-slate-50 p-4 rounded-xl font-black text-right text-lg text-teal-700 outline-none border border-slate-200 focus:border-teal-400 focus:ring-4 focus:ring-teal-50 transition-all"
                                        />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-black">VND</span>
                                    </div>
                                    <button 
                                        onClick={() => handleSaveBudget(target.name, dbCat)}
                                        className="bg-slate-900 text-white px-6 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg active:scale-95"
                                    >
                                        Lưu lại
                                    </button>
                                </div>
                            )}

                        </div>
                    );
                })}
            </div>
            
        </div>
    );
};

export default Budget;