from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import io
import json
import os
import pandas as pd
import random
import re
import urllib.error
import urllib.parse
import urllib.request

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

GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
OLIVEYOUNG_SEARCH_API_URL = "https://m.oliveyoung.co.kr/search/api/v3/common/unified-search/goods"
OLIVEYOUNG_SEARCH_URL = "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query="
PRODUCT_SEARCH_CACHE = {}

SUPPORT_INGREDIENTS = [
    {
        "name": "비타민C",
        "category": "항산화",
        "effectiveness": "칙칙한 피부 톤과 산화 스트레스 관리에 도움을 주는 성분입니다."
    },
    {
        "name": "알부틴",
        "category": "미백",
        "effectiveness": "멜라닌 생성을 억제해 색소 침착 완화에 도움을 줄 수 있습니다."
    },
    {
        "name": "판테놀",
        "category": "장벽/진정",
        "effectiveness": "피부 장벽을 보조하고 건조로 인한 자극감을 완화하는 데 도움을 줍니다."
    },
    {
        "name": "감초추출물",
        "category": "진정/톤 개선",
        "effectiveness": "피부를 편안하게 관리하면서 칙칙한 톤 개선을 보조합니다."
    },
    {
        "name": "글루타치온",
        "category": "톤 개선",
        "effectiveness": "맑은 피부 톤 관리와 항산화 케어에 활용되는 성분입니다."
    }
]


def load_env_file(path=".env"):
    if not os.path.exists(path):
        return

    with open(path, encoding="utf-8") as env_file:
        for line in env_file:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env_file()


def fallback_llm_result(score, status, selected_ingr):
    product_name = f"{selected_ingr} 세럼"
    product_uri = "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + urllib.parse.quote(product_name)
    return {
        "message": f"AI 분석 결과, 현재 피부 상태는 {status} 단계이며 {selected_ingr} 성분 중심의 관리를 권장합니다.",
        "advice": [
            "외출 전 자외선 차단제를 충분히 바르세요.",
            "저녁 세안 후 자극이 적은 미백 기능성 제품을 사용하세요.",
            "피부가 민감해지지 않도록 각질 관리는 주 1회 정도로 조절하세요."
        ],
        "ingredients": [
            {
                "name": selected_ingr,
                "category": "미백",
                "effectiveness": "색소 침착 완화와 피부 톤 개선을 돕는 성분입니다."
            },
            next((item for item in SUPPORT_INGREDIENTS if item["name"] != selected_ingr), SUPPORT_INGREDIENTS[0])
        ],
        "products": [
            {
                "name": product_name,
                "brand": "올리브영 검색",
                "rating": 4.7,
                "price": product_name,
                "ingredients": [selected_ingr],
                "match": 92,
                "uri": product_uri
            },
            {
                "name": "미백 기능성 앰플",
                "brand": "올리브영 검색",
                "rating": 4.6,
                "price": "미백 기능성 앰플",
                "ingredients": [selected_ingr, "나이아신아마이드"],
                "match": 88,
                "uri": "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + urllib.parse.quote("미백 기능성 앰플")
            }
        ]
    }


def normalize_products(products):
    normalized = []
    for product in products or []:
        name = str(product.get("name", "")).strip()
        if not name:
            continue
        uri = str(product.get("uri", "")).strip()
        if not uri:
            uri = "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=" + urllib.parse.quote(name)
        ingredient_tags = []
        seen_tags = set()
        if isinstance(product.get("ingredients"), list):
            for ingredient in product.get("ingredients"):
                tag = str(ingredient).strip()
                if tag and tag not in seen_tags:
                    ingredient_tags.append(tag)
                    seen_tags.add(tag)
        for ingredient in SUPPORT_INGREDIENTS:
            if len(ingredient_tags) >= 3:
                break
            tag = ingredient["name"]
            if tag not in seen_tags:
                ingredient_tags.append(tag)
                seen_tags.add(tag)
        normalized.append({
            "name": name,
            "brand": str(product.get("brand", "올리브영 검색")).strip() or "올리브영 검색",
            "rating": float(product.get("rating", 4.7)),
            "price": str(product.get("price", name)).strip() or name,
            "ingredients": ingredient_tags[:4],
            "match": int(product.get("match", 90)),
            "uri": uri
        })
    return normalized[:3]


def format_price(value):
    if value is None or value == "":
        return ""
    if isinstance(value, str):
        clean = value.strip()
        if not clean:
            return ""
        if "원" in clean:
            return clean
        number = re.sub(r"[^0-9]", "", clean)
        return f"{int(number):,}원" if number else clean
    if isinstance(value, (int, float)):
        return f"{int(value):,}원"
    return str(value)


def find_first_product_node(data):
    candidates = []

    def walk(value):
        if isinstance(value, dict):
            keys = set(value.keys())
            has_name = keys & {"goodsName", "goodsNm", "productName", "goodsDisplayName", "name"}
            has_number = keys & {"goodsNumber", "goodsNo", "goodsNoStr", "productNumber"}
            if has_name and has_number:
                candidates.append(value)
            for child in value.values():
                walk(child)
        elif isinstance(value, list):
            for child in value:
                walk(child)

    walk(data)
    return candidates[0] if candidates else None


def get_first_existing(product, keys):
    for key in keys:
        value = product.get(key)
        if value not in (None, ""):
            return value
    return ""


def search_oliveyoung_first_product(query, ingredient_tags):
    cache_key = query.strip()
    if cache_key in PRODUCT_SEARCH_CACHE:
        cached = PRODUCT_SEARCH_CACHE[cache_key].copy()
        cached["ingredients"] = ingredient_tags
        return cached

    body = {
        "query": query,
        "sortCode": "POPULAR_ORDER",
        "from": 0,
        "size": 24,
        "includeAll": True,
        "displayMediaTypes": "Mobile",
        "benefits": []
    }

    for _ in range(1):
        request = urllib.request.Request(
            OLIVEYOUNG_SEARCH_API_URL,
            data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Origin": "https://m.oliveyoung.co.kr",
                "Referer": "https://m.oliveyoung.co.kr/m/search/getSearchMain.do?query=" + urllib.parse.quote(query),
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148"
            },
            method="POST"
        )

        try:
            with urllib.request.urlopen(request, timeout=8) as response:
                data = json.loads(response.read().decode("utf-8"))
            product = find_first_product_node(data)
            if not product:
                continue

            goods_number = get_first_existing(product, ["goodsNumber", "goodsNo", "goodsNoStr", "productNumber"])
            name = get_first_existing(product, ["goodsName", "goodsNm", "productName", "goodsDisplayName", "name"])
            brand = get_first_existing(product, ["onlineBrandName", "brandName", "brandNm", "onlBrndNm", "brand"])
            price = format_price(get_first_existing(product, [
                "priceToPay", "salePrice", "salePrc", "finalPrice", "presentPrice", "discountPrice", "goodsPrice", "price"
            ]))
            rating = get_first_existing(product, [
                "goodsEvaluationScoreValue", "reviewScore", "rating", "ratingAvg", "goodsReviewScore"
            ])
            detail_uri = f"https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo={goods_number}" if goods_number else OLIVEYOUNG_SEARCH_URL + urllib.parse.quote(query)

            searched_product = {
                "name": str(name or query).strip(),
                "brand": str(brand or "올리브영").strip(),
                "rating": float(rating) if rating not in ("", None) else 4.7,
                "price": price or str(name or query).strip(),
                "ingredients": ingredient_tags,
                "uri": detail_uri
            }
            PRODUCT_SEARCH_CACHE[cache_key] = searched_product.copy()
            return searched_product
        except (ValueError, TypeError, urllib.error.URLError, TimeoutError):
            continue

    return None


def enrich_products_from_oliveyoung(products):
    enriched = []
    for product in products:
        query = product.get("name") or "미백 기능성 앰플"
        real_product = search_oliveyoung_first_product(query, product.get("ingredients", []))
        if real_product:
            enriched.append({
                **product,
                **real_product,
                "match": product.get("match", 90),
            })
        else:
            enriched.append(product)
    return enriched


def normalize_ingredients(ingredients, selected_ingr):
    normalized = []
    seen = set()

    for ingredient in ingredients or []:
        name = str(ingredient.get("name", "")).strip()
        if not name or name in seen:
            continue
        seen.add(name)
        normalized.append({
            "name": name,
            "category": str(ingredient.get("category", "추천 성분")).strip() or "추천 성분",
            "effectiveness": str(ingredient.get("effectiveness", "")).strip()
        })

    if selected_ingr and selected_ingr not in seen:
        normalized.insert(0, {
            "name": selected_ingr,
            "category": "미백/톤 개선",
            "effectiveness": "색소 침착 완화와 피부 톤 개선을 돕는 핵심 추천 성분입니다."
        })
        seen.add(selected_ingr)

    for ingredient in SUPPORT_INGREDIENTS:
        if len(normalized) >= 2:
            break
        if ingredient["name"] in seen:
            continue
        normalized.append(ingredient)
        seen.add(ingredient["name"])

    return normalized[:3]


def normalize_llm_result(result, selected_ingr):
    result["ingredients"] = normalize_ingredients(result.get("ingredients"), selected_ingr)
    result["products"] = normalize_products(result.get("products"))
    result["products"] = enrich_products_from_oliveyoung(result["products"])
    return result


def build_care_solution_message(base_message, ingredients, products):
    ingredient_names = [
        str(ingredient.get("name", "")).strip()
        for ingredient in ingredients or []
        if str(ingredient.get("name", "")).strip()
    ][:2]
    product_names = [
        str(product.get("name", "")).strip()
        for product in products or []
        if str(product.get("name", "")).strip()
    ][:2]

    message_parts = [str(base_message or "").strip()]
    if ingredient_names:
        message_parts.append(f"추천 성분은 {'와 '.join(ingredient_names)} 중심으로 잡아 피부 톤과 장벽 균형을 함께 관리하는 방향이 좋습니다.")
    if product_names:
        message_parts.append(f"추천 제품 후보는 {', '.join(product_names)}입니다.")

    return "\n".join(part for part in message_parts if part)


def ask_gemini(score, status, selected_ingr):
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return normalize_llm_result(fallback_llm_result(score, status, selected_ingr), selected_ingr)

    prompt = f"""
너는 피부 진단 앱의 한국어 화장품 상담 LLM이다.
CV 모델 분석값:
- 색소침착 점수: {score}
- 상태: {status}
- 1차 추천 성분: {selected_ingr}

의학적 확정 진단처럼 말하지 말고, 화장품/생활 관리 관점으로만 답해라.
올리브영에서 검색 가능한 실제 화장품명 또는 구체적인 제품 검색어를 추천하라.
백엔드가 검색어로 올리브영 첫 번째 상품 정보를 다시 조회하므로, name에는 너무 긴 설명 대신 검색에 잘 걸리는 제품명/검색어만 넣어라.
ingredients와 products.ingredients에는 같은 성분명을 중복해서 넣지 마라.
추천 성분이 같아질 경우 같은 화장품 성분 태그 안의 다른 보조 성분을 골라라.
products는 기존 추천 제품 카드에 표시할 name, brand, rating, price, ingredients, match, uri를 넣어라.
실시간 가격을 확실히 모르면 price에는 "검색 필요"라고 쓰지 말고 제품명 또는 검색어를 그대로 넣어라.
uri는 제품 상세 URL을 확실히 아는 경우에만 상세 URL로 쓰고, 확실하지 않으면 올리브영 검색 URL을 만들어 넣어라.
반드시 아래 JSON 형식만 출력하라. 마크다운은 쓰지 마라.

{{
  "message": "사용자에게 보여줄 2~3문장의 맞춤 분석 메시지. 추천 성분 2개와 추천 제품명 1~2개가 자연스럽게 연결될 여지를 남겨라.",
  "advice": ["짧은 케어 루틴 1", "짧은 케어 루틴 2", "짧은 케어 루틴 3"],
  "ingredients": [
    {{"name": "성분명", "category": "카테고리", "effectiveness": "효과 설명"}},
    {{"name": "성분명", "category": "카테고리", "effectiveness": "효과 설명"}}
  ],
  "products": [
    {{"name": "화장품명 또는 구체적인 검색어", "brand": "브랜드명 또는 올리브영 검색", "rating": 4.7, "price": "가격 또는 제품명", "ingredients": ["성분1", "성분2"], "match": 95, "uri": "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=검색어"}},
    {{"name": "화장품명 또는 구체적인 검색어", "brand": "브랜드명 또는 올리브영 검색", "rating": 4.6, "price": "가격 또는 제품명", "ingredients": ["성분1", "성분2"], "match": 90, "uri": "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=검색어"}}
  ]
}}
"""
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "responseMimeType": "application/json"
        }
    }
    request = urllib.request.Request(
        f"{GEMINI_API_URL}?key={api_key}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            response_body = json.loads(response.read().decode("utf-8"))
        text = response_body["candidates"][0]["content"]["parts"][0]["text"]
        llm_result = json.loads(text)
        fallback = fallback_llm_result(score, status, selected_ingr)
        result = {**fallback, **llm_result}
        normalized = normalize_llm_result(result, selected_ingr)
        normalized["products"] = normalized["products"] or normalize_products(fallback["products"])
        return normalized
    except (KeyError, json.JSONDecodeError, urllib.error.URLError, TimeoutError):
        return normalize_llm_result(fallback_llm_result(score, status, selected_ingr), selected_ingr)

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

    # 3. LLM 맞춤 응답 구성
    llm_result = ask_gemini(score, status, selected_ingr)
    care_solution_message = build_care_solution_message(
        llm_result.get("message"),
        llm_result.get("ingredients"),
        llm_result.get("products")
    )

    return {
        "score": score,
        "status": status,
        "status_color": status_color,
        "ingredient": selected_ingr,
        "message": care_solution_message,
        "advice": llm_result["advice"],
        "ingredients": llm_result["ingredients"],
        "products": llm_result["products"]
    }
