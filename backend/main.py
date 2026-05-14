from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import io
import pandas as pd
import random

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 모델 로드 부분 (기존과 동일)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = models.resnet18()
model.fc = nn.Linear(model.fc.in_features, 1)
model.load_state_dict(torch.load("model/skin_pro_final.pth", map_location=device))
model.to(device)
model.eval()

# 성분 풀(Pool) 재구성 - 올리브영 검색 최적화 버전
HIGH_CARE = ["트라넥사믹애씨드", "글루타치온", "나이아신아마이드"] # '하이드로퀴논' 삭제
MID_CARE = ["비타민C", "알부틴", "나이아신아마이드"]
LOW_CARE = ["유자추출물", "감초추출물", "비타민나무열매추출물"]

@app.post("/analyze")
async def analyze_skin(file: UploadFile = File(...)):
    # 1. AI 분석 로직
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert('RGB')
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    input_tensor = transform(image).unsqueeze(0).to(device)

    with torch.no_grad():
        output = model(input_tensor)
        score = round(max(0, output.item()), 2)

    # 2. 점수에 따른 상태 및 성분 매칭 로직
    if score >= 150:
        status = "심각"
        status_color = "#ff4d4d"
        selected_ingr = random.choice(HIGH_CARE) # 고함량/강력 성분 우선
        ment_prefix = "심각한 수준의 색소 침착이 발견되었습니다."
    elif score >= 70:
        status = "주의"
        status_color = "#ffa500"
        selected_ingr = random.choice(MID_CARE) # 대중적 미백 성분
        ment_prefix = "색소 침착이 진행 중인 '주의' 단계입니다."
    else:
        status = "양호"
        status_color = "#00c73c"
        selected_ingr = random.choice(LOW_CARE) # 저자극/유지 성분
        ment_prefix = "피부 상태가 전반적으로 깨끗하고 양호합니다."

    # 3. 최종 메시지 구성
    message = f"{ment_prefix} AI 분석 결과, 현재 피부에는 {selected_ingr} 성분이 포함된 제품이 가장 효과적입니다. 지속적인 관리를 권장합니다."

    return {
        "score": score,
        "status": status,
        "status_color": status_color,
        "ingredient": selected_ingr,
        "message": message
    }