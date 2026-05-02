import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx'; 

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // === QUẢN LÝ TRẠNG THÁI GIAO DIỆN ===
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  
  // Trạng thái cho Mobile Menu (Hamburger)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // === STATE CHO ĐĂNG KÝ CÓ OTP ===
  const [regStep, setRegStep] = useState(1); 
  const [regOtp, setRegOtp] = useState('');

  // === STATE CHO QUÊN MẬT KHẨU ===
  const [fpStep, setFpStep] = useState(1); 
  const [fpEmail, setFpEmail] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpNewPassword, setFpNewPassword] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  
  const [message, setMessage] = useState({ text: '', isError: false });

  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [type, setType] = useState('EXPENSE'); 
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const [editingTxId, setEditingTxId] = useState(null);   

  const [reportType, setReportType] = useState('EXPENSE'); 
  const [reportPeriod, setReportPeriod] = useState('MONTH');
  
  // === STATE QUẢN LÝ THỜI GIAN ===
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  
  // 👈 CÔNG TẮC: Xem TẤT CẢ hay Xem THEO THÁNG
  const [viewMode, setViewMode] = useState('ALL'); 

  useEffect(() => {
    if (user) {
      axios.get(`https://expense-backend-2qzn.onrender.com/api/categories?userId=${user.id}&type=${type}`)
        .then(res => {
          setCategories(res.data);
          if(res.data.length > 0 && !editingTxId) setSelectedCategoryId(res.data[0].id);
        })
        .catch(err => console.error("Lỗi fetch danh mục:", err));
    }
  }, [type, user, editingTxId]);

  // ==========================================
  // HÀM FETCH DỮ LIỆU THÔNG MINH
  // ==========================================
  const fetchTransactions = async (userId, m = reportMonth, y = reportYear, mode = viewMode) => {
    try {
      let url = `https://expense-backend-2qzn.onrender.com/api/transactions/user/${userId}`;
      if (mode === 'ALL') {
          url += `?all=true`;
      } else {
          url += `?month=${m}&year=${y}`;
      }

      const res = await axios.get(url);
      const sortedTransactions = res.data.sort((a, b) => {
        const dateA = new Date(a.transactionDate || 0);
        const dateB = new Date(b.transactionDate || 0);
        if (dateB.getTime() !== dateA.getTime()) {
          return dateB - dateA;
        }
        return b.id - a.id; 
      });
      setTransactions(sortedTransactions);
    } catch (err) {
      console.error("Lỗi fetch:", err);
    }
  };

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchTransactions(user.id, reportMonth, reportYear, viewMode);
    }
  }, [reportMonth, reportYear, viewMode, isLoggedIn, user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`https://expense-backend-2qzn.onrender.com/api/auth/login`, { username, password });
      if (res.status === 200) {
        setUser(res.data);
        setIsLoggedIn(true);
        setMessage({ text: '', isError: false }); 
      }
    } catch (err) {
      const errorMsg = (err.response && typeof err.response.data === 'string') ? err.response.data : 'Sai tài khoản hoặc mật khẩu!';
      setMessage({ text: errorMsg, isError: true });
    }
  };

  const handleRegisterStep1 = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://expense-backend-2qzn.onrender.com/api/auth/send-register-otp', { email });
      setMessage({ text: res.data || 'Mã xác nhận đã được gửi đến Email của bạn!', isError: false });
      setRegStep(2); 
    } catch (err) {
      const errorMsg = (err.response && typeof err.response.data === 'string') ? err.response.data : 'Lỗi hệ thống khi gửi mã OTP!';
      setMessage({ text: errorMsg, isError: true });
    }
  };

  const handleRegisterStep2 = async (e) => {
    e.preventDefault();
    try {
      const payload = { username, password, email, otp: regOtp };
      await axios.post('https://expense-backend-2qzn.onrender.com/api/auth/register-with-otp', payload);
      
      setMessage({ text: 'Đăng ký thành công! Hãy đăng nhập.', isError: false });
      setTimeout(() => {
        setIsRegisterMode(false);
        setRegStep(1);
        setPassword(''); 
        setRegOtp('');
        setMessage({ text: '', isError: false });
      }, 2000);
    } catch (err) {
      const errorMsg = (err.response && typeof err.response.data === 'string') ? err.response.data : 'Mã xác nhận không đúng hoặc đã hết hạn!';
      setMessage({ text: errorMsg, isError: true });
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://expense-backend-2qzn.onrender.com/api/auth/forgot-password', { email: fpEmail });
      setMessage({ text: res.data, isError: false });
      setFpStep(2); 
    } catch (err) {
      const errorMsg = (err.response && typeof err.response.data === 'string') ? err.response.data : 'Lỗi gửi email!';
      setMessage({ text: errorMsg, isError: true });
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://expense-backend-2qzn.onrender.com/api/auth/verify-otp', { email: fpEmail, otp: fpOtp });
      setMessage({ text: res.data, isError: false });
      setFpStep(3); 
    } catch (err) {
      const errorMsg = (err.response && typeof err.response.data === 'string') ? err.response.data : 'Mã OTP không hợp lệ!';
      setMessage({ text: errorMsg, isError: true });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://expense-backend-2qzn.onrender.com/api/auth/reset-password', { email: fpEmail, newPassword: fpNewPassword });
      setMessage({ text: res.data, isError: false });
      setTimeout(() => {
        setIsForgotPasswordMode(false); 
        setFpStep(1);
        setFpEmail(''); setFpOtp(''); setFpNewPassword('');
        setMessage({ text: 'Đổi mật khẩu thành công! Mời đăng nhập lại.', isError: false });
      }, 2000);
    } catch (err) {
      const errorMsg = (err.response && typeof err.response.data === 'string') ? err.response.data : 'Lỗi đổi mật khẩu!';
      setMessage({ text: errorMsg, isError: true });
    }
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setType('EXPENSE');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setEditingTxId(null);
    if(categories.length > 0) setSelectedCategoryId(categories[0].id);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    if (!selectedCategoryId) return alert("Chưa có danh mục nào!");

    const payload = {
      userId: user.id,
      amount: Math.round(parseFloat(amount)),
      description: description,
      categoryId: selectedCategoryId,
      type: type,
      transactionDate: transactionDate 
    };

    try {
      if (editingTxId) {
        await axios.put(`https://expense-backend-2qzn.onrender.com/api/transactions/${editingTxId}`, payload);
      } else {
        await axios.post('https://expense-backend-2qzn.onrender.com/api/transactions', payload);
      }
      
      setIsModalOpen(false);
      resetForm();

      const d = new Date(transactionDate);
      const newMonth = d.getMonth() + 1;
      const newYear = d.getFullYear();

      setViewMode('MONTH'); 
      setReportMonth(newMonth);
      setReportYear(newYear);

      fetchTransactions(user.id, newMonth, newYear, 'MONTH');

    } catch (err) {
      alert("Lưu thất bại!");
    }
  };

  const handleEditClick = (t) => {
    setEditingTxId(t.id);
    setAmount(t.amount);
    setDescription(t.description);
    setType(t.type);
    setTransactionDate(t.transactionDate || new Date().toISOString().split('T')[0]);
    setSelectedCategoryId(t.category?.id || '');
    setIsModalOpen(true);  
  };

  const handleDeleteTransaction = async (id) => {
    if(window.confirm("Bạn có chắc chắn muốn xóa giao dịch này không? Xóa xong không khôi phục được đâu!")) {
      try {
        await axios.delete(`https://expense-backend-2qzn.onrender.com/api/transactions/${id}`);
        fetchTransactions(user.id, reportMonth, reportYear, viewMode);
      } catch (error) {
        alert("Lỗi khi xóa giao dịch!");
      }
    }
  };

  const formatMoney = (num) => Math.round(num).toLocaleString('vi-VN');
  
  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const getCategoryIcon = (iconName) => {
    const icons = {
      'utensils': '🍽️', 'shopping-cart': '🛒', 'tshirt': '👕', 'magic': '💄',
      'glass-cheers': '🍻', 'pills': '💊', 'book': '📚', 'bolt': '💡',
      'train': '🚌', 'mobile-alt': '📱', 'home': '🏠',
      'wallet': '💼', 'piggy-bank': '🐷', 'gift': '🎁', 'money-bag': '💰',
      'coins': '📈', 'hand-holding-usd': '🤲'
    };
    return icons[iconName] || '🏷️';
  };

  const generateReport = () => {
    const timeFilteredTx = transactions.filter(t => {
        if (!t.transactionDate) return false;
        const d = new Date(t.transactionDate);
        if (reportPeriod === 'MONTH') {
            return (d.getMonth() + 1) === reportMonth && d.getFullYear() === reportYear;
        } else {
            return d.getFullYear() === reportYear;
        }
    });

    const periodIncome = timeFilteredTx.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const periodExpense = timeFilteredTx.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    const periodBalance = periodIncome - periodExpense;

    const typeFilteredTx = timeFilteredTx.filter(t => t.type === reportType);
    const total = typeFilteredTx.reduce((sum, t) => sum + t.amount, 0);

    const grouped = {};
    typeFilteredTx.forEach(t => {
        const catId = t.category?.id || 'other';
        if (!grouped[catId]) {
            grouped[catId] = {
                name: t.category?.name || 'Khác',
                color: t.category?.colorCode || '#cbd5e1',
                icon: t.category?.iconName || '🏷️',
                amount: 0
            };
        }
        grouped[catId].amount += t.amount;
    });

    const dataArr = Object.values(grouped).map(item => ({
        ...item,
        percentage: total === 0 ? 0 : parseFloat(((item.amount / total) * 100).toFixed(1))
    })).sort((a, b) => b.amount - a.amount);

    let currentAngle = 0;
    const gradientStops = dataArr.map(item => {
        const startAngle = currentAngle;
        const endAngle = currentAngle + (item.percentage / 100) * 360;
        currentAngle = endAngle;
        return `${item.color} ${startAngle}deg ${endAngle}deg`;
    }).join(', ');

    const conicGradient = dataArr.length > 0 ? `conic-gradient(${gradientStops})` : 'conic-gradient(#f1f5f9 0deg 360deg)';

    return { data: dataArr, total, conicGradient, periodIncome, periodExpense, periodBalance };
  };

  const report = generateReport();

  const handleExportExcel = () => {
    const timeFilteredTx = transactions.filter(t => {
      if (!t.transactionDate) return false;
      const d = new Date(t.transactionDate);
      if (reportPeriod === 'MONTH') {
        return (d.getMonth() + 1) === reportMonth && d.getFullYear() === reportYear;
      } else {
        return d.getFullYear() === reportYear;
      }
    });

    if (timeFilteredTx.length === 0) {
      alert("Không có dữ liệu chi tiêu nào trong khoảng thời gian này để xuất!");
      return;
    }

    const dataToExport = timeFilteredTx.map((t, index) => ({
      "STT": index + 1,
      "Ngày giao dịch": t.transactionDate,
      "Loại": t.type === 'INCOME' ? 'Thu nhập (+)' : 'Chi tiêu (-)',
      "Danh mục": t.category?.name || 'Khác',
      "Số tiền (VNĐ)": t.amount,
      "Ghi chú": t.description
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const wscols = [
      { wch: 5 },  
      { wch: 15 }, 
      { wch: 15 }, 
      { wch: 20 }, 
      { wch: 15 }, 
      { wch: 30 }  
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Lich_Su_Chi_Tieu");
    const fileName = `BaoCao_ChiTieu_${reportPeriod === 'MONTH' ? `Thang${reportMonth}_` : ''}Nam${reportYear}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const changeDate = (direction) => {
      if (reportPeriod === 'YEAR') {
          setReportYear(prev => prev + direction);
      } else {
          let newMonth = reportMonth + direction;
          let newYear = reportYear;
          if (newMonth > 12) { newMonth = 1; newYear++; }
          else if (newMonth < 1) { newMonth = 12; newYear--; }
          setReportMonth(newMonth);
          setReportYear(newYear);
      }
  };

  // Hàm chuyển tab và tự động đóng menu mobile
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  // ==========================================
  // GIAO DIỆN CHƯA ĐĂNG NHẬP (LANDING PAGE + ĐĂNG KÝ/ĐĂNG NHẬP)
  // ==========================================
  if (!isLoggedIn) {
    return (
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col overflow-y-auto">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>
        
        <header className="px-6 lg:px-12 py-5 flex justify-between items-center bg-white border-b border-slate-100 shadow-sm z-20 relative sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center text-white shadow-xl shadow-teal-500/20 transform rotate-[-10deg]">
              <span className="text-xl">💰</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black leading-tight uppercase tracking-tighter text-slate-800">Quản lý</h1>
              <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest -mt-1">CHI TIÊU</span>
            </div>
          </div>
          <button onClick={() => { setIsRegisterMode(true); setIsForgotPasswordMode(false); setRegStep(1); setMessage({text:'', isError:false}); }} className="px-4 py-2 md:px-6 md:py-2.5 bg-teal-50 text-teal-600 rounded-xl font-bold text-xs md:text-sm hover:bg-teal-100 hover:shadow-lg hover:shadow-teal-100/50 transition-all active:scale-95">
            Tạo tài khoản mới
          </button>
        </header>

        {/* PHẦN NỘI DUNG CHÍNH (HERO + FORM) */}
        <main className="flex-1 flex flex-col lg:flex-row bg-white">
          <div className="w-full lg:w-[55%] p-6 md:p-8 lg:p-24 flex flex-col justify-center relative overflow-hidden">
            <div className="hidden xl:block absolute top-24 right-10 space-y-6 transform rotate-3 opacity-60 scale-90 z-0">
               <div className="bg-white p-5 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-50 w-56 hover:shadow-2xl transition-all">
                  <div className="flex justify-between mb-2"><span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Học phí</span><span className="text-[10px] font-black text-sky-500 tracking-tight">Target</span></div>
                  <div className="h-2 bg-slate-100 rounded-full"><div className="w-[80%] h-full bg-sky-400 rounded-full shadow-sm"></div></div>
               </div>
               <div className="bg-white p-5 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-50 w-56 ml-12 hover:shadow-2xl transition-all">
                  <div className="flex justify-between mb-2"><span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tiết kiệm</span><span className="text-[10px] font-black text-teal-500 tracking-tight">Target</span></div>
                  <div className="h-2 bg-slate-100 rounded-full"><div className="w-[60%] h-full bg-teal-400 rounded-full shadow-sm"></div></div>
               </div>
            </div>

            <div className="max-w-2xl relative z-10 text-center lg:text-left">
              <div className="inline-block px-4 py-1.5 rounded-full bg-sky-50 text-sky-600 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-4 md:mb-6 border border-sky-100 shadow-inner">Khởi đầu mới</div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.15] mb-4 md:mb-8 text-slate-800 tracking-tight">Làm chủ <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-sky-500">tài chính cá nhân</span> một cách tinh tế.</h2>
              <p className="text-base md:text-lg text-slate-500 font-medium mb-8 md:mb-12 leading-relaxed max-w-lg mx-auto lg:mx-0">Hành trình hướng tới sự thịnh vượng tài chính bắt đầu từ đây. Kiểm soát chi tiêu, thiết lập mục tiêu và theo dõi mọi thứ trên một giao diện tuyệt đẹp.</p>
              <button onClick={() => { setIsRegisterMode(true); setIsForgotPasswordMode(false); setRegStep(1); setMessage({text:'', isError:false}); }} className="px-8 py-3 md:px-10 md:py-4 bg-slate-900 text-white rounded-2xl font-black text-base md:text-lg shadow-2xl shadow-slate-300/50 hover:bg-slate-800 hover:-translate-y-1 hover:shadow-slate-300 transition-all active:scale-95 flex items-center gap-3 w-max mx-auto lg:mx-0 tracking-tight">
                Bắt đầu ngay <span>→</span>
              </button>
            </div>
          </div>

          <div className="w-full lg:w-[45%] bg-gradient-to-br from-sky-50 via-white to-teal-50 p-6 md:p-8 lg:p-16 flex flex-col justify-center items-center border-t lg:border-t-0 lg:border-l border-slate-100 relative shadow-inner">
            <div className="absolute inset-0 bg-white/60"></div>
            <div className="w-full max-w-sm relative z-10">
              <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-2xl shadow-teal-900/10 relative overflow-hidden border border-slate-100/50 hover:shadow-teal-900/15 transition-all">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-sky-400 to-teal-400 z-10"></div>
                <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.2em] mb-6 text-center">{isForgotPasswordMode ? 'QUÊN MẬT KHẨU' : (isRegisterMode ? 'ĐĂNG KÝ TÀI KHOẢN' : 'ĐĂNG NHẬP')}</p>

                {message.text && (
                  <div className={`mb-6 p-3 md:p-4 rounded-xl text-[10px] md:text-xs font-bold text-center border transition-all flex items-center justify-center gap-2 ${message.isError ? 'bg-red-50 text-red-600 border-red-100' : 'bg-teal-50 text-teal-600 border-teal-100'}`}>
                    <span>{message.isError ? '⚠️' : '✅'}</span>
                    {message.text}
                  </div>
                )}

                {isForgotPasswordMode ? (
                  <>
                    {fpStep === 1 && (
                      <form onSubmit={handleSendOtp} className="space-y-4">
                        <input type="email" placeholder="Nhập Email của bạn" className="w-full px-5 md:px-6 py-3 md:py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-teal-300 font-bold text-slate-800 placeholder-slate-400 transition-all border border-slate-100 hover:bg-slate-100/50 text-sm md:text-base" value={fpEmail} onChange={(e) => setFpEmail(e.target.value)} required />
                        <button className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 md:py-4 rounded-2xl font-black text-xs md:text-sm shadow-lg shadow-teal-500/20 transition-all transform active:scale-95 mt-4 uppercase tracking-widest">Gửi mã xác nhận</button>
                      </form>
                    )}
                    {fpStep === 2 && (
                      <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <p className="text-xs text-slate-500 text-center mb-2">Kiểm tra hộp thư đến của bạn</p>
                        <input type="text" placeholder="Nhập mã OTP 6 số" maxLength="6" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-sky-300 font-black text-slate-800 placeholder-slate-400 transition-all border border-slate-100 hover:bg-slate-100/50 tracking-[0.5em] text-center text-lg md:text-xl" value={fpOtp} onChange={(e) => setFpOtp(e.target.value)} required />
                        <button className="w-full bg-sky-500 hover:bg-sky-600 text-white py-3 md:py-4 rounded-2xl font-black text-xs md:text-sm shadow-lg shadow-sky-500/20 transition-all transform active:scale-95 mt-4 uppercase tracking-widest">Xác nhận OTP</button>
                      </form>
                    )}
                    {fpStep === 3 && (
                      <form onSubmit={handleResetPassword} className="space-y-4">
                        <input type="password" placeholder="Nhập Mật khẩu mới" minLength="6" className="w-full px-5 md:px-6 py-3 md:py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-emerald-300 font-bold text-slate-800 placeholder-slate-400 transition-all border border-slate-100 hover:bg-slate-100/50 text-sm md:text-base" value={fpNewPassword} onChange={(e) => setFpNewPassword(e.target.value)} required />
                        <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 md:py-4 rounded-2xl font-black text-xs md:text-sm shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95 mt-4 uppercase tracking-widest">Đổi mật khẩu</button>
                      </form>
                    )}
                    <button onClick={() => { setIsForgotPasswordMode(false); setFpStep(1); setMessage({ text: '', isError: false }); }} className="w-full mt-6 text-slate-400 hover:text-teal-600 font-bold text-[10px] md:text-[11px] transition-colors uppercase tracking-widest hover:scale-105">← Quay lại đăng nhập</button>
                  </>
                ) : isRegisterMode ? (
                  <>
                    {regStep === 1 && (
                      <form onSubmit={handleRegisterStep1} className="space-y-3 md:space-y-4">
                        <div className="space-y-1">
                          <input type="text" placeholder="Tài khoản đăng nhập" className="w-full px-5 md:px-6 py-3 md:py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-teal-300 font-bold text-slate-800 placeholder-slate-400 transition-all border border-slate-100 hover:bg-slate-100/50 text-sm md:text-base" value={username} onChange={(e) => setUsername(e.target.value)} required />
                        </div>
                        <div className="space-y-1">
                          <input type="email" placeholder="Email thực để nhận OTP" className="w-full px-5 md:px-6 py-3 md:py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-teal-300 font-bold text-slate-800 placeholder-slate-400 transition-all border border-slate-100 hover:bg-slate-100/50 text-sm md:text-base" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-1">
                          <input type="password" placeholder="Mật khẩu" minLength="6" className="w-full px-5 md:px-6 py-3 md:py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-teal-300 font-bold text-slate-800 placeholder-slate-400 transition-all border border-slate-100 hover:bg-slate-100/50 text-sm md:text-base" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 md:py-4 rounded-2xl font-black text-xs md:text-sm shadow-lg shadow-teal-500/20 transition-all transform active:scale-95 hover:shadow-teal-500/30 mt-4 uppercase tracking-widest">GỬI MÃ XÁC NHẬN</button>
                      </form>
                    )}

                    {regStep === 2 && (
                      <form onSubmit={handleRegisterStep2} className="space-y-4">
                        <p className="text-xs text-slate-500 text-center mb-2">Mã đã gửi về: <br className="md:hidden" /><span className="font-bold text-teal-600">{email}</span></p>
                        <input type="text" placeholder="Nhập mã OTP 6 số" maxLength="6" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-teal-300 font-black text-slate-800 placeholder-slate-400 transition-all border border-slate-100 hover:bg-slate-100/50 tracking-[0.5em] text-center text-lg md:text-xl" value={regOtp} onChange={(e) => setRegOtp(e.target.value)} required />
                        <button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 md:py-4 rounded-2xl font-black text-xs md:text-sm shadow-lg shadow-teal-500/20 transition-all transform active:scale-95 mt-4 uppercase tracking-widest">XÁC NHẬN & ĐĂNG KÝ</button>
                        <button type="button" onClick={() => { setRegStep(1); setMessage({text:'', isError:false}) }} className="w-full text-slate-400 hover:text-teal-600 font-bold text-[10px] md:text-[11px] transition-colors hover:underline mt-2">Nhập sai email? Quay lại</button>
                      </form>
                    )}

                    <button onClick={() => { setIsRegisterMode(false); setRegStep(1); setMessage({ text: '', isError: false }); }} className="w-full mt-6 text-slate-400 hover:text-teal-600 font-bold text-[10px] md:text-[11px] transition-colors uppercase tracking-widest hover:scale-105">← Đã có tài khoản? Đăng nhập</button>
                  </>
                ) : (
                  <>
                    <form onSubmit={handleLogin} className="space-y-3 md:space-y-4">
                      <div className="space-y-1">
                        <input type="text" placeholder="Tài khoản" className="w-full px-5 md:px-6 py-3 md:py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-teal-300 font-bold text-slate-800 placeholder-slate-400 transition-all border border-slate-100 hover:bg-slate-100/50 text-sm md:text-base" value={username} onChange={(e) => setUsername(e.target.value)} required />
                      </div>
                      <div className="space-y-1">
                        <input type="password" placeholder="Mật khẩu" className="w-full px-5 md:px-6 py-3 md:py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-teal-300 font-bold text-slate-800 placeholder-slate-400 transition-all border border-slate-100 hover:bg-slate-100/50 text-sm md:text-base" value={password} onChange={(e) => setPassword(e.target.value)} required />
                      </div>
                      <button className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 md:py-4 rounded-2xl font-black text-xs md:text-sm shadow-lg shadow-teal-500/20 transition-all transform active:scale-95 hover:shadow-teal-500/30 mt-4 uppercase tracking-widest">ĐĂNG NHẬP</button>
                    </form>

                    <button onClick={() => { setIsForgotPasswordMode(true); setMessage({ text: '', isError: false }); }} className="w-full mt-4 text-sky-500 hover:text-sky-600 font-bold text-[11px] md:text-[12px] transition-colors hover:underline">Quên mật khẩu?</button>
                    <button onClick={() => { setIsRegisterMode(true); setRegStep(1); setMessage({ text: '', isError: false }); }} className="w-full mt-4 text-slate-400 hover:text-teal-600 font-bold text-[10px] md:text-[11px] transition-colors uppercase tracking-widest hover:scale-105">Bạn chưa có tài khoản?</button>
                  </>
                )}
              </div>

              <div className="mt-8 md:mt-12 w-full max-w-sm flex flex-col">
                 <div className="flex items-center gap-4 group cursor-pointer border-b border-slate-200/60 pb-4 mb-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-500 group-hover:bg-sky-200 transition-all text-base md:text-lg shadow-md hover:shadow-sky-200/50">⚡</div>
                    <p className="text-slate-500 text-xs md:text-sm font-bold group-hover:text-sky-600 transition-all">Theo dõi hóa đơn Điện/Nước</p>
                 </div>
                 <div className="flex items-center gap-4 group cursor-pointer border-b border-slate-200/60 pb-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 group-hover:bg-amber-200 transition-all text-base md:text-lg shadow-md hover:shadow-amber-200/50">🛍️</div>
                    <p className="text-slate-500 text-xs md:text-sm font-bold group-hover:text-amber-600 transition-all">Kiểm soát đi chợ hàng ngày</p>
                 </div>
              </div>
            </div>
          </div>
        </main>

        {/* ========================================== */}
        {/* FOOTER HIỂN THỊ Ở TRANG ĐĂNG NHẬP Ở ĐÂY NÀY */}
        {/* ========================================== */}
        <footer className="border-t border-slate-200 pt-8 md:pt-12 pb-6 md:pb-8 text-slate-500 relative z-10 px-6 lg:px-24 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-8 md:mb-12">
                <div className="space-y-3 md:space-y-4 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                        <span className="text-xl">💰</span>
                        <h4 className="text-slate-800 font-black uppercase tracking-tight">Quản lý Chi Tiêu v1.0</h4>
                    </div>
                    <p className="text-xs md:text-sm leading-relaxed font-medium">
                        Dự án được xây dựng với mục tiêu giúp người dùng làm chủ tài chính cá nhân, 
                        theo dõi dòng tiền thông minh và tối ưu hóa kế hoạch chi tiêu hàng ngày.
                    </p>
                </div>

                <div className="space-y-3 md:space-y-4">
                    <h4 className="text-slate-800 font-black uppercase text-[10px] md:text-xs tracking-[0.2em] text-center md:text-left">Sinh viên thực hiện</h4>
                    <div className="space-y-2 flex flex-col items-center md:items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-500 font-bold text-xs">TV</div>
                            <div>
                                <p className="text-slate-800 font-black text-sm tracking-tight">Trịnh Công Vĩnh</p>
                                <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase">Mã SV: 2722246330</p>
                                <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase">Lớp : PM27.16</p>
                            </div>
                        </div>
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 md:pl-11 text-center md:text-left">Chuyên ngành: Kỹ thuật phần mềm</p>
                    </div>
                </div>

                <div className="space-y-3 md:space-y-4">
                    <h4 className="text-slate-800 font-black uppercase text-[10px] md:text-xs tracking-[0.2em] text-center md:text-left">Hệ sinh thái công nghệ</h4>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                        {['ReactJS', 'Tailwind CSS', 'Spring Boot', 'MySQL', 'REST API', 'XLSX Export'].map((tech) => (
                            <span key={tech} className="px-2 md:px-3 py-1 md:py-1.5 bg-slate-50 border border-slate-100 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black text-slate-600 hover:bg-white hover:shadow-md transition-all cursor-default">
                                {tech}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="pt-6 md:pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-slate-400">
                    © 2026 TRỊNH CÔNG VĨNH - ĐỒ ÁN TỐT NGHIỆP
                </p>
                <div className="flex gap-4 md:gap-6 text-[9px] md:text-[10px] font-black uppercase tracking-wider md:tracking-widest text-slate-400">
                    <span className="hover:text-teal-500 cursor-pointer transition-colors">Báo cáo dự án</span>
                    <span className="hover:text-teal-500 cursor-pointer transition-colors">Tài liệu hướng dẫn</span>
                </div>
            </div>
        </footer>

      </div>
    );
  }

  // ==========================================
  // GIAO DIỆN SAU KHI ĐĂNG NHẬP (DASHBOARD)
  // ==========================================
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} className="flex flex-col md:flex-row h-screen bg-white text-slate-800 overflow-hidden overflow-x-hidden">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* 🔴 MENU CHO ĐIỆN THOẠI (NAVBAR TRÊN CÙNG) */}
      <div className="md:hidden flex items-center justify-between bg-teal-50 p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-sky-400 rounded-lg flex items-center justify-center text-white shadow-lg"><span className="text-sm">💰</span></div>
            <h1 className="text-lg font-black tracking-tighter text-slate-800 uppercase">Quản lý Chi Tiêu</h1>
        </div>
        {/* Nút Hamburger 3 gạch */}
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-teal-600 focus:outline-none">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
      </div>

      {/* 🔴 MODAL MENU MOBILE CHƯA NÚT CHUYỂN TAB (Hiện khi bấm nút 3 gạch) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Lớp nền mờ */}
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          {/* Panel Menu trượt từ trái ra */}
          <div className="relative w-3/4 max-w-sm bg-white h-full shadow-2xl flex flex-col p-6 animate-fade-in-right">
            <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <div className="flex items-center gap-3 mb-8 mt-2">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-sky-400 rounded-xl flex items-center justify-center text-white shadow-lg"><span className="text-lg">💰</span></div>
              <h1 className="text-lg font-black uppercase tracking-tighter text-slate-800">Menu</h1>
            </div>
            <nav className="space-y-3 flex-1">
              <button onClick={() => handleTabChange('dashboard')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black transition-all tracking-tight ${activeTab === 'dashboard' ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-100' : 'text-slate-500 hover:bg-slate-50 hover:text-teal-600'}`}>📊 Tổng quan</button>
              <button onClick={() => handleTabChange('transactions')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black transition-all tracking-tight ${activeTab === 'transactions' ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-100' : 'text-slate-500 hover:bg-slate-50 hover:text-teal-600'}`}>💸 Giao dịch</button>
              <button onClick={() => handleTabChange('reports')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black transition-all tracking-tight ${activeTab === 'reports' ? 'bg-teal-50 text-teal-700 shadow-sm border border-teal-100' : 'text-slate-500 hover:bg-slate-50 hover:text-teal-600'}`}>📈 Thống kê</button>
            </nav>
            <button onClick={() => { setIsLoggedIn(false); setIsMobileMenuOpen(false); }} className="w-full p-4 text-rose-500 bg-rose-50 rounded-2xl font-black transition-all tracking-tight flex items-center justify-center gap-2 mt-4">🚪 Đăng xuất</button>
          </div>
        </div>
      )}

      {/* 🔴 MENU DÀNH CHO LAPTOP (SIDEBAR TRÁI CỐ ĐỊNH) */}
      <div className="hidden md:flex w-72 bg-teal-50/30 border-r border-slate-100 p-8 flex-col shadow-xl z-10 flex-shrink-0"> 
        <div className="flex items-center gap-3.5 mb-12">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-sky-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-500/20 transform rotate-[-10deg]"><span className="text-2xl">💰</span></div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black leading-tight uppercase tracking-tighter text-slate-800">Quản lý</h1>
              <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest -mt-1 z-10 relative">Chi Tiêu</span>
            </div>
        </div>
        <nav className="space-y-2 flex-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black transition-all tracking-tight ${activeTab === 'dashboard' ? 'bg-teal-100/70 text-teal-700 shadow-md shadow-teal-100/50' : 'text-slate-500 hover:bg-slate-100/80 hover:text-teal-600'}`}>📊 Tổng quan</button>
          <button onClick={() => setActiveTab('transactions')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black transition-all tracking-tight ${activeTab === 'transactions' ? 'bg-teal-100/70 text-teal-700 shadow-md shadow-teal-100/50' : 'text-slate-500 hover:bg-slate-100/80 hover:text-teal-600'}`}>💸 Giao dịch</button>
          <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center gap-3 p-4 rounded-2xl font-black transition-all tracking-tight ${activeTab === 'reports' ? 'bg-teal-100/70 text-teal-700 shadow-md shadow-teal-100/50' : 'text-slate-500 hover:bg-slate-100/80 hover:text-teal-600'}`}>📈 Thống kê</button>
        </nav>
        <button onClick={() => setIsLoggedIn(false)} className="w-full p-4 text-rose-400 hover:bg-rose-50/80 rounded-2xl font-black border-t border-slate-100 mt-4 transition-all tracking-tight">🚪 Đăng xuất</button>
      </div>

      {/* 🔴 VÙNG NỘI DUNG CHÍNH BÊN PHẢI (HOẶC BÊN DƯỚI NẾU LÀ MOBILE) */}
      <div className="flex-1 p-4 md:p-12 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 relative z-10 pb-4 md:divide-y md:divide-slate-100 gap-4 md:gap-0">
            <div>
                <h1 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tight">
                    Xin chào, <span className="text-teal-500">@{user?.username}</span> 👋
                </h1>
                <p className="text-sm md:text-base text-slate-400 font-medium mt-1">Cùng kiểm tra ví tiền của bạn hôm nay nhé!</p>
            </div>
            <button onClick={handleOpenCreateModal} className="w-full md:w-auto bg-teal-500 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black shadow-lg shadow-teal-500/20 hover:bg-teal-600 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 hover:shadow-teal-500/30 tracking-tight text-sm md:text-base">+ THÊM GIAO DỊCH</button>
        </header>

        {activeTab === 'dashboard' && (
          <div className="relative z-10 space-y-6 md:space-y-8">
            
            {/* 👈 CÔNG TẮC LỌC DỮ LIỆU FRONTEND NẰM Ở ĐÂY NÈ */}
            <div className="flex justify-center md:justify-start">
              <div className="bg-slate-50 p-1.5 rounded-xl md:rounded-2xl flex gap-1 border border-slate-200 shadow-inner w-full md:w-auto">
                  <button onClick={() => setViewMode('ALL')} className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl font-black text-xs md:text-sm transition-all tracking-tight ${viewMode === 'ALL' ? 'bg-white shadow-md text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}>🌍 Tất cả thời gian</button>
                  <button onClick={() => setViewMode('MONTH')} className={`flex-1 md:flex-none px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl font-black text-xs md:text-sm transition-all tracking-tight ${viewMode === 'MONTH' ? 'bg-white shadow-md text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}>📅 Từng tháng</button>
              </div>
            </div>

            {viewMode === 'MONTH' && (
              <div className="flex items-center justify-center md:justify-start gap-4 text-teal-600 font-black">
                  <button onClick={() => {
                    let newM = reportMonth - 1; let newY = reportYear;
                    if(newM < 1){ newM = 12; newY--;}
                    setReportMonth(newM); setReportYear(newY);
                  }} className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-teal-50 hover:bg-teal-100 flex items-center justify-center transition-all">&lt;</button>
                  <span className="text-base md:text-lg">Tháng {reportMonth} / {reportYear}</span>
                  <button onClick={() => {
                    let newM = reportMonth + 1; let newY = reportYear;
                    if(newM > 12){ newM = 1; newY++;}
                    setReportMonth(newM); setReportYear(newY);
                  }} className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-teal-50 hover:bg-teal-100 flex items-center justify-center transition-all">&gt;</button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
              <div className="p-6 md:p-8 bg-emerald-50 rounded-2xl md:rounded-[2rem] shadow-xl shadow-emerald-900/5 border border-emerald-100 relative overflow-hidden group hover:shadow-2xl hover:border-emerald-200 transition-all border-l-4 border-l-emerald-400">
                <div className="flex justify-between items-start mb-2 md:mb-4">
                    <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Tổng thu ({viewMode === 'ALL' ? 'Tất cả' : `T${reportMonth}/${reportYear}`})</p>
                    <span className="text-xl md:text-3xl">🤲</span>
                </div>
                <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter tabular-nums">{formatMoney(totalIncome)} đ</p>
              </div>

              <div className="p-6 md:p-8 bg-rose-50 rounded-2xl md:rounded-[2rem] shadow-xl shadow-rose-900/5 border border-rose-100 relative overflow-hidden group hover:shadow-2xl hover:border-rose-200 transition-all border-l-4 border-l-rose-400">
                <div className="flex justify-between items-start mb-2 md:mb-4">
                    <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Tổng chi ({viewMode === 'ALL' ? 'Tất cả' : `T${reportMonth}/${reportYear}`})</p>
                    <span className="text-xl md:text-3xl">💸</span>
                </div>
                <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter tabular-nums">{formatMoney(totalExpense)} đ</p>
              </div>

              <div className="p-6 md:p-8 bg-gradient-to-br from-teal-500 to-emerald-400 rounded-2xl md:rounded-[2rem] shadow-xl shadow-teal-500/30 text-white relative overflow-hidden border border-teal-600/20 hover:shadow-2xl hover:shadow-teal-500/40 transition-all group">
                <div className="absolute right-0 bottom-0 opacity-10 text-7xl md:text-9xl -mr-4 -mb-4 md:-mr-6 md:-mb-6 group-hover:rotate-[-20deg] transition-transform">💰</div>
                <div className="flex justify-between items-start mb-2 md:mb-4 relative z-10">
                    <p className="text-[10px] md:text-xs font-bold text-teal-100 uppercase tracking-widest relative z-10">Số dư ({viewMode === 'ALL' ? 'Tất cả' : `T${reportMonth}/${reportYear}`})</p>
                    <span className="text-xl md:text-3xl">🏦</span>
                </div>
                <p className="text-2xl md:text-3xl font-black relative z-10 tracking-tighter tabular-nums">{formatMoney(balance)} đ</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl md:rounded-[2rem] shadow-xl md:shadow-2xl shadow-slate-200/50 border border-slate-100 p-6 md:p-8 hover:shadow-slate-200/70 transition-all overflow-x-auto">
                <h2 className="text-lg md:text-xl font-black text-slate-800 mb-4 md:mb-6 flex items-center gap-2 tracking-tight"><span>🔄</span> Giao dịch gần đây</h2>
                <div className="space-y-3 md:space-y-4 min-w-[300px]">
                    {transactions.length === 0 && <p className="text-center text-slate-400 py-4 font-bold text-sm md:text-base">Chưa có giao dịch nào!</p>}
                    {transactions.slice(0, 5).map((t, i) => (
                        <div key={i} className="flex justify-between items-center p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100 hover:bg-white hover:shadow-xl hover:border-slate-200 transition-all hover:-translate-y-0.5 relative">
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl bg-white shadow-inner border border-slate-100 flex-shrink-0" style={{ color: t.category?.colorCode || '#94a3b8' }}>
                                    {getCategoryIcon(t.category?.iconName)}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-black text-slate-800 text-sm md:text-lg tracking-tight truncate max-w-[120px] sm:max-w-[200px] md:max-w-[300px]">{t.description}</p>
                                    <p className="text-[9px] md:text-[11px] font-bold uppercase mt-0.5 md:mt-1 tracking-wider md:tracking-widest truncate" style={{ color: t.category?.colorCode || '#94a3b8' }}>{t.transactionDate} • {t.category?.name || 'Chưa phân loại'}</p>
                                </div>
                            </div>
                            <span className={`font-black text-base md:text-xl tracking-tighter tabular-nums whitespace-nowrap pl-2 ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'}`}>{t.type === 'INCOME' ? '+' : '-'} {formatMoney(t.amount)}</span>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl md:shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden text-slate-800 relative z-10 hover:shadow-slate-200 transition-all">
             <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                 <h2 className="text-base md:text-lg font-black text-slate-700">Danh sách Giao dịch <span className="block sm:inline text-xs md:text-base font-medium text-slate-400">{viewMode === 'ALL' ? '(Tất cả)' : `(Tháng ${reportMonth}/${reportYear})`}</span></h2>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 uppercase text-[9px] md:text-[11px] font-black tracking-widest border-b border-slate-100">
                      <th className="p-4 md:p-6 whitespace-nowrap">Ngày</th>
                      <th className="p-4 md:p-6 whitespace-nowrap">Danh Mục</th>
                      <th className="p-4 md:p-6 min-w-[150px]">Mô tả</th>
                      <th className="p-4 md:p-6 whitespace-nowrap">Loại</th>
                      <th className="p-4 md:p-6 text-right whitespace-nowrap">Số tiền</th>
                      <th className="p-4 md:p-6 text-center whitespace-nowrap">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {transactions.length === 0 && (
                      <tr><td colSpan="6" className="text-center p-6 md:p-8 text-slate-400 text-sm md:text-base">Không có giao dịch nào!</td></tr>
                  )}
                  {transactions.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-100/50 transition-all even:bg-slate-50/30">
                      <td className="p-4 md:p-6 text-slate-400 text-xs md:text-sm font-medium tracking-tight tabular-nums whitespace-nowrap">{t.transactionDate}</td>
                      <td className="p-4 md:p-6">
                          <div className="flex items-center gap-2 md:gap-3">
                            <span className="text-lg md:text-2xl drop-shadow-sm">{getCategoryIcon(t.category?.iconName)}</span>
                            <span className="font-black tracking-tight text-xs md:text-base whitespace-nowrap" style={{ color: t.category?.colorCode || '#94a3b8' }}>{t.category?.name || 'N/A'}</span>
                          </div>
                      </td>
                      <td className="p-4 md:p-6 text-slate-600 tracking-tight text-xs md:text-base">{t.description}</td>
                      <td className="p-4 md:p-6"><span className={`px-2 py-1 md:px-4 md:py-1.5 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${t.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-500 border border-rose-100'}`}>{t.type === 'INCOME' ? 'Thu' : 'Chi'}</span></td>
                      <td className={`p-4 md:p-6 text-right text-sm md:text-lg font-black tracking-tighter tabular-nums whitespace-nowrap ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'}`}>{t.type === 'INCOME' ? '+' : '-'} {formatMoney(t.amount)} đ</td>
                      <td className="p-4 md:p-6 text-center">
                          <div className="flex justify-center items-center gap-2">
                              <button onClick={() => handleEditClick(t)} className="p-2 md:px-3 md:py-2 bg-amber-50 text-amber-500 hover:bg-amber-500 hover:text-white rounded-lg md:rounded-xl transition-all shadow-sm border border-amber-100 text-xs md:text-sm flex items-center justify-center active:scale-95" title="Sửa">✏️ <span className="hidden md:inline ml-1">Sửa</span></button>
                              <button onClick={() => handleDeleteTransaction(t.id)} className="p-2 md:px-3 md:py-2 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg md:rounded-xl transition-all shadow-sm border border-rose-100 text-xs md:text-sm flex items-center justify-center active:scale-95" title="Xóa">🗑️ <span className="hidden md:inline ml-1">Xóa</span></button>
                          </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
               </table>
             </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl md:shadow-2xl shadow-slate-200/50 border border-slate-100 p-4 md:p-8 max-w-3xl mx-auto relative z-10 hover:shadow-slate-200 transition-all">
             <div className="flex flex-col sm:flex-row justify-between items-center mb-6 md:mb-8 gap-4 border-b border-slate-100 pb-6 md:pb-8">
                <div className="bg-slate-50 p-1.5 rounded-xl md:rounded-2xl flex gap-1 border border-slate-100 shadow-inner w-full sm:w-auto">
                    <button onClick={() => setReportPeriod('MONTH')} className={`flex-1 sm:flex-none px-4 md:px-8 py-2.5 md:py-3 rounded-lg md:rounded-xl font-black text-xs md:text-sm transition-all tracking-tight ${reportPeriod === 'MONTH' ? 'bg-white shadow-md text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}>Hàng Tháng</button>
                    <button onClick={() => setReportPeriod('YEAR')} className={`flex-1 sm:flex-none px-4 md:px-8 py-2.5 md:py-3 rounded-lg md:rounded-xl font-black text-xs md:text-sm transition-all tracking-tight ${reportPeriod === 'YEAR' ? 'bg-white shadow-md text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}>Hàng Năm</button>
                </div>

                <button onClick={handleExportExcel} className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 active:scale-95 text-xs md:text-sm hover:shadow-emerald-500/20 tracking-tight">📥 Xuất Excel</button>
             </div>

             <div className="flex justify-between items-center bg-teal-50 text-teal-600 p-4 md:p-5 rounded-xl md:rounded-2xl mb-6 md:mb-8 font-black border border-teal-100/50 shadow-inner">
                <button onClick={() => changeDate(-1)} className="text-xl md:text-2xl hover:scale-125 transition-transform px-2">&lt;</button>
                <span className="text-sm md:text-xl tracking-tight tabular-nums">{reportPeriod === 'MONTH' ? `Tháng ${reportMonth} / ${reportYear}` : `Năm ${reportYear}`}</span>
                <button onClick={() => changeDate(1)} className="text-xl md:text-2xl hover:scale-125 transition-transform px-2">&gt;</button>
             </div>

             <div className="flex justify-between mb-6 md:mb-8 border-b border-slate-100 pb-6 md:pb-8 gap-2 md:gap-4">
                <div className="text-center w-1/2 border-r border-slate-100 px-2 md:px-4">
                    <p className="text-slate-400 font-bold text-xs md:text-sm mb-1 md:mb-2 uppercase tracking-widest">Chi tiêu</p>
                    <p className="text-rose-500 font-black text-lg md:text-2xl tracking-tighter tabular-nums break-words">-{formatMoney(report.periodExpense)}</p>
                </div>
                <div className="text-center w-1/2 px-2 md:px-4">
                    <p className="text-slate-400 font-bold text-xs md:text-sm mb-1 md:mb-2 uppercase tracking-widest">Thu nhập</p>
                    <p className="text-emerald-500 font-black text-lg md:text-2xl tracking-tighter tabular-nums break-words">+{formatMoney(report.periodIncome)}</p>
                </div>
             </div>

             <div className="flex border-b border-slate-100 mb-8 md:mb-10 divide-x divide-slate-100">
                <button onClick={() => setReportType('EXPENSE')} className={`flex-1 pb-3 md:pb-4 text-base md:text-lg font-black transition-all border-b-4 tracking-tight ${reportType === 'EXPENSE' ? 'border-teal-500 text-teal-500' : 'border-transparent text-slate-400 hover:text-slate-500'}`}>Chi tiêu</button>
                <button onClick={() => setReportType('INCOME')} className={`flex-1 pb-3 md:pb-4 text-base md:text-lg font-black transition-all border-b-4 tracking-tight ${reportType === 'INCOME' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-400 hover:text-slate-500'}`}>Thu nhập</button>
             </div>

             <div className="flex justify-center mb-8 md:mb-12 relative">
                 <div className="w-48 h-48 md:w-64 md:h-64 rounded-full flex items-center justify-center shadow-2xl shadow-slate-200/50 transition-all duration-500 border border-slate-50 p-2 bg-slate-50 shadow-inner" style={{ background: report.conicGradient }}>
                     <div className="w-32 h-32 md:w-44 md:h-44 bg-white rounded-full flex flex-col items-center justify-center shadow-2xl shadow-inner z-10 p-2 text-center">
                         <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Tổng cộng</span>
                         <span className="text-lg md:text-2xl font-black text-slate-800 tracking-tighter tabular-nums break-all leading-none" style={{ color: reportType === 'EXPENSE' ? '#f43f5e' : '#10b981' }}>
                            {formatMoney(report.total)} đ
                         </span>
                     </div>
                 </div>
             </div>

             <div className="space-y-2 md:space-y-3 max-h-60 md:max-h-80 overflow-y-auto p-1 md:p-2 border-t border-slate-100 pt-4 md:pt-6">
                 {report.data.length === 0 && <p className="text-center text-slate-400 font-bold p-6 md:p-8 bg-slate-50/50 rounded-xl md:rounded-2xl border border-slate-100 text-sm md:text-base">Không có dữ liệu trong thời gian này!</p>}
                 {report.data.map((item, idx) => (
                     <div key={idx} className="flex items-center justify-between p-3 md:p-4 bg-slate-50/10 rounded-xl md:rounded-2xl hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-slate-100 hover:-translate-y-0.5 even:bg-slate-50/20">
                         <div className="flex items-center gap-3 md:gap-4 overflow-hidden pr-2">
                             <div className="text-2xl md:text-3xl drop-shadow-sm flex-shrink-0">{getCategoryIcon(item.icon)}</div>
                             <span className="font-black text-slate-700 text-sm md:text-lg tracking-tight truncate">{item.name}</span>
                         </div>
                         <div className="text-right flex items-center gap-2 md:gap-6 flex-shrink-0">
                             <p className="font-black text-slate-800 text-sm md:text-lg tracking-tighter tabular-nums">{formatMoney(item.amount)} đ</p>
                             <div className="w-10 md:w-16 text-right">
                                <p className="text-xs md:text-sm font-black tracking-tight tabular-nums" style={{ color: item.color }}>{item.percentage}%</p>
                             </div>
                         </div>
                     </div>
                 ))}
             </div>
             
          </div>
        )}

      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4 transition-all">
          <div className="bg-white rounded-t-3xl md:rounded-[2.5rem] p-6 md:p-10 w-full max-w-md shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto animate-fade-in-up md:animate-none">
            {/* Thanh kéo vuốt trên mobile */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 md:hidden"></div>
            
            <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-center text-slate-800 tracking-tight">
                {editingTxId ? 'Cập Nhật Giao Dịch' : 'Tạo Giao Dịch mới'}
            </h2>
            <form onSubmit={handleSaveTransaction} className="space-y-4 md:space-y-5">
              <div className="flex gap-2 md:gap-3 border-b border-slate-100 pb-4 md:pb-5 mb-4 md:mb-5">
                <button type="button" onClick={() => setType('EXPENSE')} className={`flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl border-2 font-black text-sm md:text-base transition-all tracking-tight ${type === 'EXPENSE' ? 'border-rose-300 bg-rose-50 text-rose-500 shadow-inner' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}>CHI (-) </button>
                <button type="button" onClick={() => setType('INCOME')} className={`flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl border-2 font-black text-sm md:text-base transition-all tracking-tight ${type === 'INCOME' ? 'border-emerald-300 bg-emerald-50 text-emerald-500 shadow-inner' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}>THU (+) </button>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-3 max-h-48 md:max-h-56 overflow-y-auto p-1 md:p-2 border border-slate-100 rounded-xl md:rounded-2xl shadow-inner bg-slate-50/50">
                {categories.length === 0 && <p className="col-span-3 text-center text-slate-400 font-medium p-4 bg-white rounded-xl text-sm">Chưa có danh mục nào</p>}
                {categories.map((cat) => (
                  <button key={cat.id} type="button" onClick={() => setSelectedCategoryId(cat.id)} className={`p-2 md:p-4 rounded-xl md:rounded-2xl border-2 flex flex-col items-center justify-center gap-1 md:gap-2 transition-all min-h-[80px] md:min-h-[100px] ${selectedCategoryId === cat.id ? 'bg-white border-teal-300 shadow-lg shadow-teal-500/10 scale-105' : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50 hover:shadow-md'}`} style={{ borderColor: selectedCategoryId === cat.id ? cat.colorCode : '' }}>
                    <span className="text-2xl md:text-3xl drop-shadow-sm">{getCategoryIcon(cat.iconName)}</span>
                    <span className="text-[9px] md:text-[11px] font-bold text-slate-600 text-center leading-tight line-clamp-2 tracking-tight px-1">{cat.name}</span>
                  </button>
                ))}
              </div>

              <input type="number" placeholder="Số tiền (VNĐ)..." className="w-full bg-slate-50/50 p-4 md:p-5 rounded-xl md:rounded-2xl font-black text-lg md:text-xl outline-none focus:ring-2 focus:ring-teal-300 focus:bg-white focus:shadow-lg transition-all text-slate-800 placeholder-slate-400 border border-slate-100 shadow-inner tabular-nums tracking-tight" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              <input type="text" placeholder="Ghi chú thêm..." className="w-full bg-slate-50/50 p-4 md:p-5 rounded-xl md:rounded-2xl font-bold text-sm md:text-base outline-none focus:ring-2 focus:ring-teal-300 focus:bg-white focus:shadow-lg transition-all text-slate-800 placeholder-slate-400 border border-slate-100 shadow-inner tracking-tight" value={description} onChange={(e) => setDescription(e.target.value)} required />
              
              <input 
                type="date" 
                className="w-full bg-slate-50/50 p-4 md:p-5 rounded-xl md:rounded-2xl font-bold text-sm md:text-base outline-none focus:ring-2 focus:ring-teal-300 focus:bg-white focus:shadow-lg transition-all text-slate-500 border border-slate-100 shadow-inner tabular-nums" 
                value={transactionDate} 
                onChange={(e) => setTransactionDate(e.target.value)} 
                required 
              />

              <div className="flex gap-3 md:gap-4 pt-4 md:pt-6 divide-x divide-slate-100 border-t border-slate-100 mt-4 md:mt-6 pb-4 md:pb-0">
                  <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="flex-1 py-3 md:py-4 text-slate-400 font-black text-sm md:text-base hover:text-slate-600 transition-all active:scale-95 tracking-tight">HỦY</button>
                  <button type="submit" className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-sm md:text-base shadow-lg shadow-teal-500/20 transition-all active:scale-95 hover:shadow-teal-500/30 tracking-tight">
                      {editingTxId ? 'LƯU' : 'TẠO MỚI'}
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;