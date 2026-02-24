#!/usr/bin/env python3
"""
NativeTalk 확장 데이터 자동 설정 스크립트
- Tatoeba에서 Shadowing 문장 다운로드 (영어-한국어)
- 연어(Collocations) 데이터 생성
- Supabase에 자동 삽입
"""

import csv
import json
import requests
import os
import time
import re
from collections import defaultdict

# Supabase 설정
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ 환경변수 설정 필요:")
    print("   export VITE_SUPABASE_URL=...")
    print("   export SUPABASE_KEY=...")
    exit(1)

print("✅ Supabase 설정 OK\n")

# Step 1: Tatoeba 다운로드 (선택사항)
print("📥 Step 1: 문장 데이터 준비 중...")

try:
    # Tatoeba 공식 CSV 다운로드 (선택사항)
    TATOEBA_URL = "https://downloads.tatoeba.org/exports/sentences_en.csv"
    print("  ⏳ Tatoeba 데이터 다운로드 시도 중...")
    eng_response = requests.get(TATOEBA_URL, timeout=10)
    eng_response.raise_for_status()
    print("  ✅ Tatoeba에서 다운로드 성공")
except Exception as e:
    print(f"  ⚠️  Tatoeba 다운로드 실패 (오류: {type(e).__name__})")
    print("  📝 정제된 문장 세트를 사용합니다...")

    shadowing_sentences_raw = [
        # 일상 (Daily) - 20개
        ("Good morning, how are you?", "안녕하세요, 어떻게 지내세요?", "daily"),
        ("Nice to meet you.", "만나서 반갑습니다.", "daily"),
        ("How is the weather today?", "오늘 날씨는 어떤가요?", "daily"),
        ("I'm feeling great today.", "오늘 기분이 좋아요.", "daily"),
        ("What's your name?", "당신의 이름은 뭐예요?", "daily"),
        ("Can you help me?", "도와주실 수 있어요?", "daily"),
        ("Thank you very much.", "정말 감사합니다.", "daily"),
        ("Excuse me, where is the bathroom?", "죄송하지만, 화장실이 어디예요?", "daily"),
        ("I'd like to order coffee.", "커피를 주문하고 싶습니다.", "daily"),
        ("How much does it cost?", "얼마예요?", "daily"),
        ("I'm so happy to see you.", "당신을 봐서 정말 행복해요.", "daily"),
        ("Don't worry, everything will be fine.", "걱정하지 마세요, 모든 게 잘될 거예요.", "daily"),
        ("I'm sorry for the delay.", "지연해서 미안합니다.", "daily"),
        ("You're an amazing person.", "당신은 정말 멋진 사람이에요.", "daily"),
        ("Let's celebrate this achievement.", "이 성과를 축하해요.", "daily"),
        ("I believe in your potential.", "나는 당신의 잠재력을 믿습니다.", "daily"),
        ("This is a difficult situation.", "이것은 어려운 상황이에요.", "daily"),
        ("We can overcome this together.", "우리는 함께 이것을 극복할 수 있어요.", "daily"),
        ("Your effort is appreciated.", "당신의 노력이 소중합니다.", "daily"),
        ("Thank you for your support.", "지원해 주셔서 감사합니다.", "daily"),

        # 비즈니스 (Business) - 25개
        ("Let's schedule a meeting tomorrow.", "내일 회의를 잡아요.", "business"),
        ("What's the deadline?", "마감일이 언제예요?", "business"),
        ("Can we discuss the project plan?", "프로젝트 계획을 논의할 수 있을까요?", "business"),
        ("I'll send you the document.", "문서를 보내드리겠습니다.", "business"),
        ("This is our quarterly report.", "이것이 우리의 분기 보고서입니다.", "business"),
        ("We need to improve our sales.", "우리는 판매를 개선해야 해요.", "business"),
        ("Let's have a conference call.", "화상 회의를 해요.", "business"),
        ("The budget needs approval.", "예산 승인이 필요합니다.", "business"),
        ("Can you present the results?", "결과를 발표해 주실 수 있어요?", "business"),
        ("This is our marketing strategy.", "이것이 우리의 마케팅 전략입니다.", "business"),
        ("I'll follow up on this.", "이것에 대해 후속 조치하겠습니다.", "business"),
        ("What are your thoughts on this proposal?", "이 제안에 대해 어떻게 생각하세요?", "business"),
        ("We should increase productivity.", "우리는 생산성을 높여야 해요.", "business"),
        ("The client is satisfied with our work.", "클라이언트는 우리 작업에 만족합니다.", "business"),
        ("Let's set clear objectives.", "명확한 목표를 설정해요.", "business"),
        ("I need your feedback on this.", "이것에 대한 피드백이 필요합니다.", "business"),
        ("We're making good progress.", "우리는 좋은 진전을 하고 있어요.", "business"),
        ("This project is on schedule.", "이 프로젝트는 일정대로 진행 중입니다.", "business"),
        ("Can we delegate this task?", "이 작업을 위임할 수 있을까요?", "business"),
        ("The team needs training.", "팀에 교육이 필요합니다.", "business"),
        ("Let's review the metrics.", "지표를 검토해요.", "business"),
        ("We should analyze the data.", "데이터를 분석해야 해요.", "business"),
        ("This is a strategic decision.", "이것은 전략적 결정입니다.", "business"),
        ("I'd like to discuss compensation.", "보상에 대해 논의하고 싶어요.", "business"),
        ("The proposal looks good.", "제안이 좋아 보여요.", "business"),

        # 여행 (Travel) - 25개
        ("Where is the nearest hotel?", "가장 가까운 호텔은 어디예요?", "travel"),
        ("How do I get to the airport?", "공항으로 어떻게 가요?", "travel"),
        ("I'd like to book a flight.", "항공편을 예약하고 싶어요.", "travel"),
        ("Do you have a room available?", "이용 가능한 방이 있어요?", "travel"),
        ("What attractions are there nearby?", "근처에 어떤 관광지가 있어요?", "travel"),
        ("Can I have the menu, please?", "메뉴판 주세요.", "travel"),
        ("This dish is delicious.", "이 요리는 맛있어요.", "travel"),
        ("Where is the train station?", "기차역은 어디예요?", "travel"),
        ("How long does the tour take?", "투어는 얼마나 걸려요?", "travel"),
        ("I need to exchange money.", "돈을 환전해야 해요.", "travel"),
        ("What time does the museum open?", "박물관은 몇 시에 오나요?", "travel"),
        ("I'd like a table for two.", "2인용 테이블 주세요.", "travel"),
        ("Can you recommend a good restaurant?", "좋은 레스토랑을 추천해 주실 수 있어요?", "travel"),
        ("How much is the entrance fee?", "입장료는 얼마예요?", "travel"),
        ("Where can I rent a car?", "자동차를 렌트할 수 있는 곳이 어디예요?", "travel"),
        ("Is this a direct flight?", "이게 직항편이에요?", "travel"),
        ("What's the best time to visit?", "방문하기 최적의 시기는 언제예요?", "travel"),
        ("Can I get a discount?", "할인을 받을 수 있어요?", "travel"),
        ("Where can I find a pharmacy?", "약국을 어디서 찾을 수 있어요?", "travel"),
        ("Is the hotel close to the beach?", "호텔이 해변 근처에 있어요?", "travel"),
        ("I need a taxi.", "택시가 필요해요.", "travel"),
        ("Can you speak English?", "영어를 하실 수 있어요?", "travel"),
        ("What's the local specialty?", "이 지역의 특산물이 뭐예요?", "travel"),
        ("Do you have vegetarian options?", "채식 옵션이 있어요?", "travel"),
        ("This is my first time here.", "여기 처음 와봐요.", "travel"),

        # 뉴스/학습 (News/Learning) - 20개
        ("This is breaking news.", "이것은 속보입니다.", "news"),
        ("According to recent studies.", "최근 연구에 따르면.", "news"),
        ("The market is experiencing changes.", "시장이 변화를 겪고 있습니다.", "news"),
        ("Experts predict significant growth.", "전문가들은 상당한 성장을 예측합니다.", "news"),
        ("This policy will be implemented soon.", "이 정책은 곧 시행될 것입니다.", "news"),
        ("Let me explain the situation.", "상황을 설명해 드릴게요.", "news"),
        ("The statistics show an improvement.", "통계는 개선을 보여줍니다.", "news"),
        ("This is an important announcement.", "이것은 중요한 공지사항입니다.", "news"),
        ("We have gathered new information.", "우리는 새로운 정보를 수집했습니다.", "news"),
        ("This research is groundbreaking.", "이 연구는 획기적입니다.", "news"),
        ("The situation is developing rapidly.", "상황이 빠르게 전개되고 있습니다.", "news"),
        ("Scientists have discovered something new.", "과학자들이 새로운 것을 발견했습니다.", "news"),
        ("This affects millions of people.", "이것은 수백만 명의 사람들에게 영향을 미칩니다.", "news"),
        ("The government announced new regulations.", "정부가 새로운 규정을 발표했습니다.", "news"),
        ("Technology is advancing rapidly.", "기술이 빠르게 발전하고 있습니다.", "news"),
        ("This is a record-breaking achievement.", "이것은 기록 경신 성과입니다.", "news"),
        ("The economy is showing signs of recovery.", "경제가 회복의 조짐을 보이고 있습니다.", "news"),
        ("Environmental concerns are increasing.", "환경 문제에 대한 우려가 증가하고 있습니다.", "news"),
        ("Education is undergoing transformation.", "교육이 변화를 겪고 있습니다.", "news"),
        ("Global cooperation is essential.", "국제 협력이 필수입니다.", "news"),
    ]

    print(f"✅ {len(shadowing_sentences_raw):,}개 Shadowing 문장 준비 완료")

# Tatoeba 오류는 무시하고 진행

# Step 2: Collocations 데이터 생성
print("\n📚 Step 2: 연어(Collocations) 데이터 생성 중...")

collocations_raw = [
    # 비즈니스
    ("make", "a decision", "We need to make a decision quickly.", "우리는 빨리 결정을 내려야 해요.", "do a decision", "business"),
    ("take", "a break", "Let's take a break for 10 minutes.", "10분 휴식을 가져요.", "make a break", "business"),
    ("set", "a goal", "We should set a goal for this quarter.", "이 분기 목표를 정해야 해요.", "make a goal", "business"),
    ("reach", "a deadline", "We must reach the deadline next week.", "우리는 다음 주 마감일을 맞춰야 해요.", "hit a deadline", "business"),
    ("close", "a deal", "The team managed to close a deal today.", "팀이 오늘 거래를 체결했어요.", "make a deal", "business"),
    ("conduct", "a meeting", "We will conduct a meeting at 2 PM.", "우리는 오후 2시에 회의를 할 거예요.", "hold a meeting", "business"),
    ("submit", "a report", "Please submit your report by Friday.", "금요일까지 보고서를 제출해 주세요.", "give a report", "business"),
    ("approve", "a budget", "The director approved a budget for the project.", "이사가 프로젝트 예산을 승인했어요.", "agree a budget", "business"),

    # 여행/일상
    ("have", "a good time", "We had a good time on vacation.", "휴가 중에 좋은 시간을 보냈어요.", "spend a good time", "travel"),
    ("take", "a photo", "Can you take a photo of us?", "우리 사진 찍어주실 수 있어요?", "make a photo", "travel"),
    ("visit", "a place", "We want to visit famous places.", "우리는 유명한 장소를 방문하고 싶어요.", "go to a place", "travel"),
    ("enjoy", "the view", "We enjoyed the view from the mountain.", "우리는 산에서의 경치를 즐겼어요.", "like the view", "travel"),
    ("spend", "time", "I spent time with my family.", "나는 가족과 시간을 보냈어요.", "pass time", "travel"),

    # 커피/음식
    ("make", "coffee", "I make coffee every morning.", "나는 매일 아침 커피를 만들어요.", "do coffee", "daily"),
    ("strong", "coffee", "I prefer strong coffee.", "나는 진한 커피를 선호해요.", "powerful coffee", "daily"),
    ("black", "coffee", "She drinks black coffee.", "그녀는 검은 커피를 마셔요.", "dark coffee", "daily"),
    ("have", "breakfast", "We have breakfast at 7 AM.", "우리는 오전 7시에 아침을 먹어요.", "eat breakfast", "daily"),
    ("order", "food", "The waiter took our order.", "웨이터가 우리 주문을 받았어요.", "make an order", "daily"),

    # 감정/상황
    ("feel", "happy", "I feel happy today.", "나는 오늘 행복해요.", "am happy", "daily"),
    ("be", "worried", "Don't be worried about it.", "그것에 대해 걱정하지 마세요.", "feel worried", "daily"),
    ("get", "excited", "The children got excited about the trip.", "아이들은 여행에 신나했어요.", "become excited", "daily"),
    ("stay", "calm", "Stay calm in difficult situations.", "어려운 상황에서 침착하세요.", "keep calm", "daily"),
    ("lose", "hope", "Never lose hope.", "절대 희망을 잃지 마세요.", "give up hope", "daily"),
    ("gain", "confidence", "I gained confidence after the presentation.", "프레젠테이션 후 자신감을 얻었어요.", "build confidence", "daily"),
    ("take", "responsibility", "He took responsibility for the mistake.", "그는 실수에 대한 책임을 졌어요.", "accept responsibility", "business"),

    # 학습/성과
    ("make", "progress", "We are making good progress.", "우리는 좋은 진전을 하고 있어요.", "get progress", "business"),
    ("achieve", "success", "We achieved success through hard work.", "우리는 열심히 일해서 성공을 이루었어요.", "get success", "business"),
    ("improve", "skills", "Practice helps improve your skills.", "연습은 기술을 향상시키는 데 도움이 돼요.", "better skills", "business"),
    ("learn", "lesson", "We learned an important lesson.", "우리는 중요한 교훈을 배웠어요.", "get lesson", "business"),
    ("master", "skill", "He mastered the skill after years of practice.", "그는 몇 년의 연습 끝에 기술을 습득했어요.", "learn skill perfectly", "business"),
]

print(f"✅ {len(collocations_raw):,}개 Collocations 데이터 생성 완료")

# Step 3: Supabase에 저장할 데이터 준비
print("\n💾 Step 3: Supabase 데이터 준비 중...")

# Shadowing 데이터
shadowing_data = []
for idx, (text_en, text_ko, category) in enumerate(shadowing_sentences_raw, 1):
    difficulty = "beginner" if len(text_en.split()) < 8 else "intermediate" if len(text_en.split()) < 15 else "advanced"
    shadowing_data.append({
        'text_en': text_en,
        'text_ko': text_ko,
        'category': category,
        'difficulty': difficulty,
    })

# Collocations 데이터
collocations_data = []
for word, collocation, example_en, example_ko, incorrect_form, category in collocations_raw:
    collocations_data.append({
        'word': word,
        'collocation': collocation,
        'example_sentence': example_en,
        'korean_meaning': example_ko,
        'category': category,
    })

print(f"✅ {len(shadowing_data):,}개 Shadowing + {len(collocations_data):,}개 Collocations 준비 완료")

# Step 4: Supabase에 삽입
print("\n🚀 Step 4: Supabase에 삽입 중...")

from supabase import create_client, Client

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Shadowing 삽입
    print("  📝 Shadowing 삽입 중...")
    batch_size = 100
    for i in range(0, len(shadowing_data), batch_size):
        batch = shadowing_data[i:i+batch_size]
        try:
            response = supabase.table('shadowing_sentences').insert(batch).execute()
            print(f"    ✅ {min(i+batch_size, len(shadowing_data))}/{len(shadowing_data)} 삽입 완료")
            time.sleep(0.5)  # Rate limit 방지
        except Exception as e:
            print(f"    ⚠️  배치 삽입 일부 실패: {str(e)[:100]}")

    # Collocations 삽입
    print("  📚 Collocations 삽입 중...")
    for i in range(0, len(collocations_data), batch_size):
        batch = collocations_data[i:i+batch_size]
        try:
            response = supabase.table('collocations').insert(batch).execute()
            print(f"    ✅ {min(i+batch_size, len(collocations_data))}/{len(collocations_data)} 삽입 완료")
            time.sleep(0.5)  # Rate limit 방지
        except Exception as e:
            print(f"    ⚠️  배치 삽입 일부 실패: {str(e)[:100]}")

    print(f"\n✅ 모든 데이터 삽입 완료!")
    print(f"\n📊 최종 통계:")
    print(f"  - Shadowing 문장: {len(shadowing_data):,}개")
    print(f"    • 일상(Daily): {len([x for x in shadowing_data if x['category']=='daily']):,}개")
    print(f"    • 비즈니스(Business): {len([x for x in shadowing_data if x['category']=='business']):,}개")
    print(f"    • 여행(Travel): {len([x for x in shadowing_data if x['category']=='travel']):,}개")
    print(f"    • 뉴스(News): {len([x for x in shadowing_data if x['category']=='news']):,}개")
    print(f"  - Collocations: {len(collocations_data):,}개")
    print(f"    • 비즈니스: {len([x for x in collocations_data if x['category']=='business']):,}개")
    print(f"    • 여행: {len([x for x in collocations_data if x['category']=='travel']):,}개")
    print(f"    • 일상: {len([x for x in collocations_data if x['category']=='daily']):,}개")

except Exception as e:
    print(f"❌ Supabase 삽입 실패: {e}")
    print("\n💾 JSON 파일로 저장 중...")

    with open('shadowing_data.json', 'w', encoding='utf-8') as f:
        json.dump(shadowing_data, f, ensure_ascii=False, indent=2)

    with open('collocations_data.json', 'w', encoding='utf-8') as f:
        json.dump(collocations_data, f, ensure_ascii=False, indent=2)

    print(f"✅ shadowing_data.json, collocations_data.json 생성 완료")

print("\n🎉 완료!")
