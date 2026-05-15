# 🌸 Skin AI Specialist
AI 기반 개인 맞춤형 피부 진단 및 토탈 케어 솔루션

## 🛠 Tech Stack
- **Frontend:** React, Vite, Lucide-React, Axios
- **Backend:** FastAPI, PyTorch, Pandas
- **AI Model:** ResNet18 (Regression)

## 🚀 시작하기
1. **Gemini API 키 설정**
   - `cd backend`
   - `copy .env.example .env`
   - `.env` 파일을 열고 본인의 Google Gemini API 키를 입력합니다.
   - 예시: `GEMINI_API_KEY=your_google_gemini_api_key`
   - `.env` 파일은 GitHub에 올라가지 않도록 `.gitignore`에 포함되어 있습니다.
2. **Backend 실행**
   - `cd backend`
   - `python -m uvicorn main:app --reload`
3. **Frontend 실행**
   - `cd frontend`
   - `npm install`
   - `npm run dev`
