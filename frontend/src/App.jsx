import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Camera, Search, Sparkles, ShoppingCart, AlertCircle,
  User, Users, Target, Zap, ShieldCheck, TrendingUp, TrendingDown, Award, Lock, Beaker,
  ShoppingBag, Star, ExternalLink, Bot, Lightbulb, Sun, Moon, Coffee, Droplets, Apple, Shield
} from 'lucide-react';

// [컴포넌트 1] 메인 점수 카드
const ScoreCard = ({ score, title, result }) => {
  const statusColor = result.status_color;
  const statusLabel = result.status;
  const getGradient = (status) => {
    if (status === "심각") return "linear-gradient(135deg, #fff5f5 0%, #fff 100%)";
    if (status === "주의") return "linear-gradient(135deg, #fffaf0 0%, #fff 100%)";
    return "linear-gradient(135deg, #f0fff4 0%, #fff 100%)";
  };

  return (
    <div style={{
      padding: '20px', borderRadius: '16px', background: getGradient(statusLabel),
      border: `2px solid ${statusColor}20`, boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
      position: 'relative', overflow: 'hidden', height: 'auto', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', justifyContent: 'center'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={18} color={statusColor} fill={statusColor} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>{title}</h3>
        </div>
        <div style={{ padding: '4px 10px', borderRadius: '15px', backgroundColor: statusColor, color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' }}>{statusLabel}</div>
      </div>
      <div style={{ fontSize: '2.4rem', fontWeight: '900', color: statusColor, letterSpacing: '-2px', lineHeight: 1 }}>{score.toFixed(2)}</div>
      <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '5px' }}>색소침착 지수</div>
      <p style={{ fontSize: '0.85rem', color: '#555', marginTop: '10px', lineHeight: 1.4, margin: 0 }}>전문 관리가 권장되는 단계입니다.</p>
      <Sparkles size={100} color={statusColor} style={{ position: 'absolute', right: '-15px', bottom: '-15px', opacity: 0.05 }} />
    </div>
  );
};

// [컴포넌트 2] 게이지 차트
const ProgressChart = ({ result }) => {
  const getStatus = (val) => val >= 150 ? "critical" : val >= 70 ? "warning" : "good";
  const progressData = [
    { label: "색소침착", current: result.score, max: 250, status: getStatus(result.score) },
    { label: "수분도", current: 85, max: 100, status: "good" },
    { label: "탄력도", current: 72, max: 100, status: "good" }
  ];
  const getStatusConfig = (s) => s === "critical" ? { bg: "#fee2e2", bar: "#dc2626", text: "#b91c1c" } : s === "warning" ? { bg: "#ffedd5", bar: "#ea580c", text: "#c2410c" } : { bg: "#dcfce7", bar: "#16a34a", text: "#15803d" };

  return (
    <div style={{ padding: '20px', borderRadius: '16px', border: '1px solid #e9d5ff', background: '#fff', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 15px 0' }}><Award size={18} color="#a855f7" /> 종합 지표</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap:'8px'}}>
        {progressData.map((item, index) => {
          const config = getStatusConfig(item.status);
          return (
            <div key={index}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
                <span>{item.label}</span><span style={{ fontWeight: 'bold', color: config.text }}>{item.current}</span>
              </div>
              <div style={{ height: '8px', backgroundColor: config.bg, borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: 'auto', background: config.bar, width: `${(item.current / item.max) * 100}%`, transition: '1s' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// [컴포넌트 3] 추천 성분 카드
const IngredientCard = ({ ingredients, skinType, onButtonClick }) => {
  return (
    <div style={{ padding: '16px', borderRadius: '16px', backgroundColor: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', height: 'auto', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexShrink: 0 }}>
        <div style={{ padding: '8px', backgroundColor: '#f0f4ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Beaker size={24} color="#4d61ff" /></div>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0, color: '#1a1a1a' }}>추천 성분</h3>
          <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>피부타입: {skinType}</p>
        </div>
      </div>
      <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
        {ingredients.map((ingredient, index) => (
          <div key={index} style={{ padding: '16px', borderRadius: '16px', background: 'linear-gradient(90deg, #f8faff 0%, #fcfaff 100%)', border: '1px solid #eef2ff' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold', color: '#333' }}>{ingredient.name}</h4>
              <span style={{ padding: '4px 10px', backgroundColor: '#eef2ff', color: '#4d61ff', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>{ingredient.category}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', lineHeight: 1.5 }}>{ingredient.effectiveness}</p>
          </div>
        ))}
      </div>
      <button onClick={onButtonClick} style={{ width: '100%', padding: '14px', background: 'linear-gradient(90deg, #4d61ff 0%, #9333ea 100%)', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexShrink: 0 }}>
        추천 제품 보기 <ExternalLink size={18} />
      </button>
    </div>
  );
};

// [컴포넌트 4] AI 추천 제품 카드
const ProductRecommendation = () => {
  const products = [
    { name: "화이트닝 앰플", brand: "스킨 랩", rating: 4.7, price: "38,000원", ingredients: ["알부틴 2%", "트라넥삼산", "글루타치온"], match: 95 },
    { name: "톤업 크림", brand: "퓨어 뷰티", rating: 4.9, price: "52,000원", ingredients: ["나이아신아마이드", "아스코르빅애씨드", "알파-알부틴"], match: 92 }
  ];
  const handleProductClick = (productName) => { window.open(`https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=${productName}`); };

  return (
    <div style={{ padding: '16px', borderRadius: '16px', border: '2px solid #bfdbfe', background: 'linear-gradient(135deg, #eff6ff 0%, #ecfeff 100%)', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', height: 'auto', boxSizing: 'border-box', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexShrink: 0 }}>
        <div style={{ padding: '8px', background: 'linear-gradient(135deg, #3b82f6 0%, #0891b2 100%)', borderRadius: '10px' }}><ShoppingBag size={24} color="white" /></div>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0, color: '#1a1a1a' }}>AI 추천 제품</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>피부 타입 맞춤 큐레이션</p>
        </div>
      </div>
      <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
        {products.map((product, index) => (
          <div key={index} style={{ padding: '12px', borderRadius: '16px', backgroundColor: '#fff', border: '2px solid #dbeafe', transition: 'all 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold', color: '#1a1a1a' }}>{product.name}</h4>
                  <span style={{ padding: '2px 8px', background: 'linear-gradient(90deg, #ec4899 0%, #f43f5e 100%)', color: '#fff', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>{product.match}% 매칭</span>
                </div>
                <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: '#64748b' }}>{product.brand}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={14} fill="#facc15" color="#facc15" /><span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#334155' }}>{product.rating}</span></div>
                  <span style={{ color: '#cbd5e1' }}>•</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#2563eb' }}>{product.price}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {product.ingredients.map((ingredient, idx) => (
                <span key={idx} style={{ padding: '4px 8px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '500' }}>{ingredient}</span>
              ))}
            </div>
            <button onClick={() => handleProductClick(product.name)} style={{ width: '100%', padding: '8px', background: 'linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%)', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              상세정보 보기 <ExternalLink size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// [컴포넌트 5] AI 맞춤 케어 가이드
const AIAdviceCard = ({ advice, summary }) => {
  return (
    <div style={{ padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', height: 'auto', boxSizing: 'border-box', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexShrink: 0 }}>
        <div style={{ padding: '8px', background: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)', borderRadius: '8px' }}><Bot size={24} color="white" /></div>
        <div>
          <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#1a1a1a', fontWeight: 'bold' }}>AI 맞춤 케어 가이드</h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>전문가 수준의 피부 관리 솔루션</p>
        </div>
      </div>
      
      <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: 'rgba(255, 255, 255, 0.7)', borderRadius: '12px', border: '1px solid #e0e7ff', flexShrink: 0 }}>
        <p style={{ fontSize: '0.8rem', lineHeight: 1.6, color: '#334155', margin: 0, fontWeight: '500' }}>
          {summary}<span style={{ color: '#6366f1', fontWeight: 'bold', animation: 'blink 1s step-end infinite' }}>|</span>
        </p>
      </div>

      <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
          <Lightbulb size={16} color="#ca8a04" /><span>추천 케어 루틴</span>
        </div>
        {advice.map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
            <div style={{ flexShrink: 0, width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', marginTop: '2px' }}>{index + 1}</div>
            <p style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.5, flex: 1, margin: 0 }}>{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// [컴포넌트 6] 일일 케어 팁
const DailyTips = () => {
  const tips = [
    { icon: Sun, time: "아침", title: "자외선 차단", description: "SPF 50+ 선크림 사용", bg: "linear-gradient(135deg, #facc15 0%, #fb923c 100%)" },
    { icon: Coffee, time: "오전", title: "수분 섭취", description: "물 2L 이상 마시기", bg: "linear-gradient(135deg, #60a5fa 0%, #22d3ee 100%)" },
    { icon: Apple, time: "점심", title: "항산화 식단", description: "비타민C 채소 섭취", bg: "linear-gradient(135deg, #4ade80 0%, #34d399 100%)" },
    { icon: Droplets, time: "오후", title: "보습 케어", description: "미스트 수분 보충", bg: "linear-gradient(135deg, #2dd4bf 0%, #60a5fa 100%)" },
    { icon: Moon, time: "저녁", title: "이중 세안", description: "오일+폼 깨끗하게", bg: "linear-gradient(135deg, #818cf8 0%, #c084fc 100%)" },
    { icon: Shield, time: "야간", title: "집중 관리", description: "나이트 세럼 재생", bg: "linear-gradient(135deg, #c084fc 0%, #f472b6 100%)" }
  ];

  return (
    <div style={{ padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', border: '2px solid #bbf7d0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', height: 'auto', boxSizing: 'border-box', minHeight: 0 }}>
      <div style={{ marginBottom: '12px', flexShrink: 0 }}>
        <h3 style={{ fontSize: '1.1rem', margin: '0 0 4px 0', color: '#1a1a1a', fontWeight: 'bold' }}>오늘의 케어 루틴</h3>
        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>시간대별 맞춤 피부 관리 가이드</p>
      </div>
      <div className="custom-scrollbar" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', flex: 1, overflowY: 'auto', paddingRight: '4px', alignContent: 'start' }}>
        {tips.map((tip, index) => {
          const Icon = tip.icon;
          return (
            <div key={index} style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#fff', border: '1px solid #dcfce7', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ padding: '8px', background: tip.bg, borderRadius: '8px' }}><Icon size={16} color="white" /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '2px' }}>{tip.time}</div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', margin: '0 0 2px 0', color: '#1a1a1a' }}>{tip.title}</h4>
                <p style={{ fontSize: '0.7rem', color: '#334155', lineHeight: 1.4, margin: 0 }}>{tip.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// === [메인 App] ===
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState('');
  const [userPw, setUserPw] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [displayedMessage, setDisplayedMessage] = useState("");

  const handleLogin = (e) => { if (e) e.preventDefault(); setIsLoggedIn(true); };
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  useEffect(() => {
    if (result && result.message) {
      setDisplayedMessage("");
      let i = 0;
      const timer = setInterval(() => {
        if (i < result.message.length) {
          setDisplayedMessage((prev) => prev + result.message.charAt(i));
          i++;
        } else { clearInterval(timer); }
      }, 20);
      return () => clearInterval(timer);
    }
  }, [result]);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true); setResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      setTimeout(async () => {
        const res = await axios.post('http://localhost:8000/analyze', formData);
        setResult(res.data);
        setLoading(false);
      }, 2000);
    } catch (err) { console.error(err); setLoading(false); }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', width: '100%', margin: 0, padding: 0, background: 'linear-gradient(135deg, #fff5f8 0%, #f0f4ff 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative', fontFamily: '"Pretendard", sans-serif' }}>
        <div style={{ position: 'absolute', top: '15%', left: '10%', width: '300px', height: '300px', background: 'rgba(255, 77, 148, 0.07)', borderRadius: '50%', filter: 'blur(60px)', animation: 'float 8s infinite ease-in-out' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '400px', height: '400px', background: 'rgba(77, 97, 255, 0.05)', borderRadius: '50%', filter: 'blur(80px)', animation: 'float 10s infinite ease-in-out' }} />
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(15px)', padding: '50px 45px', borderRadius: '16px', boxShadow: '0 25px 60px -15px rgba(255, 77, 148, 0.15)', width: '90%', maxWidth: '420px', textAlign: 'center', zIndex: 10, border: '1px solid rgba(255, 255, 255, 0.6)', boxSizing: 'border-box' }}>
          <div style={{ width: '75px', height: '75px', backgroundColor: '#ff4d94', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px', boxShadow: '0 10px 25px rgba(255, 77, 148, 0.3)' }}><Sparkles size={38} color="white" fill="white" /></div>
          <h2 style={{ color: '#1a1a1a', fontSize: '1.9rem', fontWeight: '900', margin: '0 0 12px 0' }}>Skin AI Specialist</h2>
          <p style={{ color: '#888', fontSize: '1rem', marginBottom: '35px' }}>당신만을 위한 정밀 피부 진단 솔루션</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ position: 'relative' }}><input type="text" placeholder="아이디" value={userId} onChange={(e) => setUserId(e.target.value)} style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px', border: '1px solid #eee', outline: 'none', boxSizing: 'border-box', fontSize: '1rem', backgroundColor: '#fff' }} /><User size={20} color="#bbb" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} /></div>
            <div style={{ position: 'relative' }}><input type="password" placeholder="비밀번호" value={userPw} onChange={(e) => setUserPw(e.target.value)} style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '14px', border: '1px solid #eee', outline: 'none', boxSizing: 'border-box', fontSize: '1rem', backgroundColor: '#fff' }} /><Lock size={20} color="#bbb" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} /></div>
            <button type="button" onClick={handleLogin} style={{ backgroundColor: '#ff4d94', color: '#fff', padding: '15px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', boxShadow: '0 12px 25px rgba(255, 77, 148, 0.25)' }}>로그인</button>
          </form>
          <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '0.9rem', color: '#999' }}><span style={{ cursor: 'pointer' }}>회원가입</span><span style={{ color: '#eee' }}>|</span><span style={{ cursor: 'pointer' }}>아이디/비밀번호 찾기</span></div>
          <div style={{ marginTop: '35px', borderTop: '1px solid #f2f2f2', paddingTop: '20px' }}><p style={{ fontSize: '0.85rem', color: '#ccc', margin: 0 }}>© 2026 Team Skin-Specialist</p></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', width: '100%', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', padding: '20px', boxSizing: 'border-box', overflowX: 'hidden', overflowY: 'auto', fontFamily: '"Pretendard", sans-serif' }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0 }}>AI 피부 분석 리포트</h1>
          <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>ResNet18 모델 기반 실시간 진단</p>
        </div>
        <div style={{ fontSize: '0.85rem' }}><strong>{userId || '에이스'}</strong> 님 환영합니다</div>
      </header>

      {/* 🚨 상단 통계 카드 4개 삭제 요청 반영 완료! 바로 메인 컨텐츠로 이어집니다. */}

      <main style={{ flex: 1, backgroundColor: '#fff', borderRadius: '16x', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'visible' }}>
        
        <section style={{ display: 'flex', gap: '25px', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px', flexShrink: 0 }}>
          <div style={{ width: '220px', height: '150px', borderRadius: '16x', overflow: 'hidden', border: '1px solid #eee', flexShrink: 0, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
            {preview ? <img src={preview} style={{ width: '100%', height: 'auto', objectFit: 'cover' }}/> : <div style={{ height: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fcfcfc', color: '#ccc' }}><Camera size={30} /></div>}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#333' }}>피부 사진 분석</h4>
              <span style={{ fontSize: '0.75rem', color: '#ff4d94', backgroundColor: '#fff5f8', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>정면 사진 권장</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#888' }}>ResNet18 딥러닝 모델이 사진의 색소침착 정도를 수치화하여 분석합니다.</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
              <label htmlFor="skin-upload" style={{ border: '1px solid #ddd', padding: '12px 25px', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem', backgroundColor: '#fff', fontWeight: '600', transition: '0.2s' }}>사진 선택</label>
              <input type="file" id="skin-upload" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              <button onClick={handleUpload} style={{ backgroundColor: '#ff4d94', color: '#fff', border: 'none', padding: '12px 40px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(255, 77, 148, 0.2)' }}>
                {loading ? "AI 분석 중..." : "분석 시작"}
              </button>
            </div>
          </div>

          <div style={{ padding: '15px', backgroundColor: '#fdfdfd', borderRadius: '15px', border: '1px dashed #eee', textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#bbb' }}>Current Analysis Status</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: loading ? '#ff4d94' : '#00c73c' }}>{loading ? "Processing..." : "Ready to Scan"}</div>
          </div>
        </section>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {result ? (
            <section style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeIn 0.5s' }}>
              
              {/* 🚨 화면 비율 상관없이 무조건 3개씩 꽉 차게! (3x2 벤토 박스 레이아웃 강제 고정) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', alignItems: 'stretch' }}>
                {/* 윗줄 3개 */}
                <ScoreCard score={result.score} title="분석 결과" result={result} />
                <ProgressChart result={result} />
                <IngredientCard
                  skinType="복합성"
                  ingredients={[
                    { name: result.ingredient, category: '미백', effectiveness: '멜라닌 생성을 억제하고 피부 톤을 균일하게 개선합니다.' },
                    { name: '비타민C', category: '항산화', effectiveness: '강력한 항산화 효과로 피부 밝기를 개선합니다.' }
                  ]}
                  onButtonClick={() => window.open(`https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=${result.ingredient}`)}
                />  
                {/* 아랫줄 3개 */}
                <AIAdviceCard 
                  summary={displayedMessage || "AI가 피부 상태를 실시간 분석 중입니다..."}
                  advice={["외출 30분 전 자외선 차단제 필수", "저녁 세안 후 비타민C 앰플 사용", "주 1~2회 가벼운 각질 제거"]}
                />
                <DailyTips />
                <ProductRecommendation />
              </div>

              {/* 하단 검은색 AI 가이드 박스 유지 */}
              <div style={{ padding: '12px 25px', borderRadius: '12px', backgroundColor: '#1a1a1a', color: '#fff', flexShrink: 0, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', color: result.status_color, fontSize: '0.8rem' }}>
                  <AlertCircle size={18} /><strong>AI 맞춤 케어 솔루션</strong>
                </div>
                <p style={{ fontSize: '1rem', lineHeight: '1.6', margin: 0, fontWeight: '300', letterSpacing: '-0.3px' }}>
                  {displayedMessage}<span style={{ color: result.status_color, fontWeight: 'bold', animation: 'blink 1s step-end infinite' }}>|</span>
                </p>
              </div>

            </section>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ccc', backgroundColor: '#fcfcfc', borderRadius: '12x', border: '1px dashed #eee' }}>
              <Sparkles size={60} style={{ marginBottom: '15px', opacity: 0.3, color: '#ff4d94' }} />
              <p style={{ fontSize: '1rem', fontWeight: '500' }}>분석할 사진을 선택하고 '분석 시작' 버튼을 눌러주세요.</p>
              <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>실시간 AI 엔진이 피부 상태를 정밀 진단합니다.</p>
            </div>
          )}
        </div>
      </main>
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { width: 100%; height: auto; margin: 0; padding: 0; overflow-x: hidden; }
        body { font-family: "Pretendard", sans-serif; background: #fafafa; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes blink { 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}

export default App;