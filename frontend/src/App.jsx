import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Camera, Search, Sparkles, ShoppingCart, AlertCircle, CheckCircle } from 'lucide-react';

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [displayedMessage, setDisplayedMessage] = useState("");

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
        } else {
          clearInterval(timer);
        }
      }, 30);
      return () => clearInterval(timer);
    }
  }, [result]);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setTimeout(async () => {
        const res = await axios.post('http://localhost:8000/analyze', formData);
        setResult(res.data);
        setLoading(false);
      }, 3000);
    } catch (err) {
      console.error(err);
      alert("서버 연결을 확인해주세요!");
      setLoading(false);
    }
  };

  const goToOliveYoung = (keyword) => {
    const url = `https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=${encodeURIComponent(keyword)}`;
    window.open(url, '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff5f8', padding: '40px 20px', fontFamily: '"Pretendard", sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <header style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ color: '#ff4d94', fontSize: '2.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
            <Sparkles size={40} fill="#ff4d94" /> Skin AI Specialist
          </h1>
          <p style={{ color: '#666', fontSize: '1.1rem', marginTop: '10px' }}>식약처 공공데이터 기반 초정밀 피부 진단 솔루션</p>
        </header>

        <main style={{ backgroundColor: '#fff', borderRadius: '30px', padding: '40px', boxShadow: '0 20px 40px rgba(255, 77, 148, 0.1)' }}>
          
          <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', paddingBottom: '30px', borderBottom: '2px solid #f0f0f0' }}>
            <div style={{ width: '100%', maxWidth: '400px', height: '300px', border: '3px dashed #ffb3d1', borderRadius: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: '#fffafc' }}>
              {preview ? (
                <img src={preview} alt="미리보기" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center', color: '#ffb3d1' }}>
                  <Camera size={60} />
                  <p>분석할 피부 사진을 업로드하세요</p>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} id="skin-upload" />
            <div style={{ display: 'flex', gap: '15px' }}>
              <label htmlFor="skin-upload" style={{ backgroundColor: '#fff', color: '#ff4d94', border: '2px solid #ff4d94', padding: '12px 25px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' }}>사진 선택</label>
              <button onClick={handleUpload} disabled={loading || !file} style={{ backgroundColor: '#ff4d94', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', opacity: loading || !file ? 0.6 : 1 }}>
                {loading ? "분석 중..." : <><Search size={20} /> AI 정밀 분석 시작</>}
              </button>
            </div>
          </section>

          {result && (
            <section style={{ marginTop: '40px', animation: 'fadeIn 0.5s ease-in' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <CheckCircle color={result.status_color} />
                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>분석 결과 리포트</h2>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px' }}>
                {/* [지수 카드 수정됨] */}
                <div style={{ padding: '25px', borderRadius: '20px', backgroundColor: '#fff', border: `2px solid ${result.status_color}20`, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: 'bold' }}>색소침착 지수 (Pigmentation Index)</span>
                  <div style={{ fontSize: '3.5rem', fontWeight: '800', color: result.status_color, margin: '10px 0' }}>
                    {result.score}<span style={{ fontSize: '1.5rem' }}>점</span>
                  </div>
                  <div style={{ 
                    display: 'inline-block', 
                    padding: '6px 16px', 
                    borderRadius: '20px', 
                    backgroundColor: result.status_color, 
                    color: '#fff', 
                    fontSize: '0.95rem',
                    fontWeight: 'bold'
                  }}>
                    상태: {result.status}
                  </div>
                </div>
                {/* 성분 추천 카드 내부 */}  
                <div style={{ padding: '25px', borderRadius: '20px', backgroundColor: '#f8f9ff', border: '1px solid #e0e7ff', display: 'flex',  flexDirection: 'column', justifyContent: 'center',minHeight: '200px' }}>
                  <span style={{ fontSize: '0.9rem', color: '#4d61ff', fontWeight: 'bold' }}>식약처 매칭 추천 성분</span>
                  <div style={{ 
                    fontSize: result.ingredient.length > 10 ? '1.3rem' : '1.7rem', // 글자가 길면 더 작게 조정
                    fontWeight: '700', 
                    color: '#1a1a1a', 
                    margin: '15px 0',
                    lineHeight: '1.4',
                    wordBreak: 'keep-all' // 단어 중간에서 잘리지 않게 함   
                  }}>✨ {result.ingredient}</div>
                  <button 
                    onClick={() => goToOliveYoung(result.ingredient)}
                    style={{ width: '100%', backgroundColor: '#00c73c', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '600' }}
                  >
                    <ShoppingCart size={18} /> 올리브영에서 찾기
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '30px', padding: '25px', borderRadius: '20px', backgroundColor: '#333', color: '#fff', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: result.status_color }}>
                  <AlertCircle size={20} />
                  <span style={{ fontWeight: 'bold' }}>AI 맞춤 케어 어드바이스</span>
                </div>
                <p style={{ fontSize: '1.1rem', lineHeight: '1.6', margin: 0, minHeight: '3em' }}>
                  {displayedMessage}<span className="cursor" style={{ color: result.status_color }}>|</span>
                </p>
              </div>
            </section>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <div className="loader" style={{ marginBottom: '20px' }}></div>
              <p style={{ color: '#ff4d94', fontWeight: 'bold' }}>AI가 픽셀 단위로 색소침착 데이터를 분석하고 있습니다...</p>
            </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .loader { border: 4px solid #f3f3f3; border-top: 4px solid #ff4d94; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .cursor { animation: blink 0.7s infinite; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}

export default App;