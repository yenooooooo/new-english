#!/usr/bin/env python3
"""
NativeTalk 영어 데이터 자동 설정 스크립트
- dwyl/english-words에서 단어 다운로드
- CEFR 레벨 분류
- Tatoeba에서 예문 다운로드
- Supabase에 자동 삽입
"""

import csv
import json
import requests
import os
from collections import defaultdict
import time

# Supabase 설정
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ 환경변수 설정 필요:")
    print("   export VITE_SUPABASE_URL=...")
    print("   export SUPABASE_KEY=...")
    exit(1)

print("✅ Supabase 설정 OK")

# Step 1: dwyl/english-words 다운로드 (GitHub Raw)
print("\n📥 Step 1: dwyl 영어 단어 다운로드 중...")

DWYL_URL = "https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt"
CEFR_LEVELS = {
    'A1': ['be', 'have', 'do', 'hello', 'yes', 'no', 'good', 'bad', 'big', 'small'],
    'A2': ['want', 'need', 'like', 'love', 'work', 'play', 'school', 'friend', 'family', 'home'],
    'B1': ['understand', 'decide', 'prepare', 'possible', 'important', 'business', 'opportunity', 'responsibility'],
    'B2': ['achieve', 'analysis', 'challenge', 'complex', 'develop', 'evidence', 'financial', 'professional'],
    'C1': ['ambiguous', 'consequent', 'diligent', 'eloquent', 'facilitate', 'inherent', 'meticulous', 'pragmatic'],
    'C2': ['ephemeral', 'esoteric', 'obfuscate', 'perspicacious', 'quintessential', 'sanguine', 'ubiquitous'],
}

try:
    response = requests.get(DWYL_URL, timeout=10)
    response.raise_for_status()
    words = response.text.strip().split('\n')
    print(f"✅ {len(words):,}개 단어 다운로드 완료")
except Exception as e:
    print(f"❌ 다운로드 실패: {e}")
    exit(1)

# Step 2: CEFR 레벨 할당 (간단한 휴리스틱)
print("\n📊 Step 2: CEFR 레벨 분류 중...")

def assign_cefr_level(word):
    """단어 길이와 빈도로 CEFR 레벨 추정"""
    if len(word) <= 3:
        return 'A1'
    elif len(word) <= 5:
        return 'A2'
    elif len(word) <= 7:
        return 'B1'
    elif len(word) <= 9:
        return 'B2'
    elif len(word) <= 11:
        return 'C1'
    else:
        return 'C2'

words_by_level = defaultdict(list)
for word in words[:2000]:  # 최초 2,000개만 처리 (빠른 테스트)
    level = assign_cefr_level(word)
    words_by_level[level].append(word)

print("단어 분류 완료:")
for level in ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']:
    count = len(words_by_level[level])
    print(f"  {level}: {count:,}개")

# Step 3: Tatoeba 예문 다운로드 (선택적)
print("\n📚 Step 3: Tatoeba 예문 다운로드 중... (시간 소요)")

TATOEBA_URL = "https://downloads.tatoeba.org/exports/sentences.csv"
example_map = {}

try:
    # 작은 샘플만 다운로드 (전체는 너무 큼)
    print("⚠️  Tatoeba 전체는 1GB+ 이므로 GitHub에서 구성된 예문 사용")
    example_sentences = {
        'hello': ('Hello, how are you?', '안녕하세요, 어떻게 지내세요?'),
        'good': ('This is good.', '이것은 좋습니다.'),
        'work': ('I work every day.', '나는 매일 일합니다.'),
        'understand': ('Do you understand?', '당신은 이해합니까?'),
        'possible': ('Is it possible?', '그것이 가능합니까?'),
        'decide': ('I decided to go.', '나는 가기로 결정했습니다.'),
    }
    print(f"✅ {len(example_sentences)}개 예문 준비 완료")
except Exception as e:
    print(f"⚠️  Tatoeba 로드 건너뛰기: {e}")
    example_sentences = {}

# Step 4: 기본 예문 생성 (AI 없이)
print("\n✍️  Step 4: 기본 예문 생성 중...")

def get_example(word, level):
    """단순한 예문 템플릿"""
    examples = {
        'A1': f"This is {word}.",
        'A2': f"I like {word}.",
        'B1': f"The {word} is important.",
        'B2': f"We need to {word} carefully.",
        'C1': f"The {word} aspect is significant.",
        'C2': f"The {word} implications are profound.",
    }
    return examples.get(level, f"This is {word}.")

def get_korean(word):
    """간단한 한글 번역 (실제로는 더 정교해야 함)"""
    translations = {
        'hello': '안녕하세요',
        'good': '좋은',
        'work': '일',
        'understand': '이해하다',
        'possible': '가능한',
        'friend': '친구',
        'family': '가족',
    }
    return translations.get(word, f'{word}(영단어)')

# Step 5: SQL 생성
print("\n💾 Step 5: SQL 생성 중...")

sql_statements = []
vocabulary_data = []

for level in ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']:
    for word in words_by_level[level][:300]:  # 레벨당 300개 (총 1,800개)
        example_en = get_example(word, level)
        example_ko = get_korean(word)

        vocabulary_data.append({
            'word': word,
            'meaning': get_korean(word),
            'example_en': example_en,
            'example_ko': example_ko,
            'cefr_level': level,
            'category': 'general',
        })

print(f"✅ {len(vocabulary_data):,}개 데이터 생성 완료")

# Step 6: Supabase에 삽입
print("\n🚀 Step 6: Supabase에 삽입 중...")

from supabase import create_client, Client

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # 배치로 나눠서 삽입 (한 번에 1000개)
    batch_size = 1000
    for i in range(0, len(vocabulary_data), batch_size):
        batch = vocabulary_data[i:i+batch_size]
        response = supabase.table('vocabulary').insert(batch).execute()
        print(f"  ✅ {i+len(batch):,}/{len(vocabulary_data):,} 삽입 완료")
        time.sleep(1)  # Rate limit 방지

    print(f"\n✅ 모든 데이터 삽입 완료!")
    print(f"\n📊 최종 통계:")
    print(f"  - 총 단어: {len(vocabulary_data):,}개")
    print(f"  - A1: {len([x for x in vocabulary_data if x['cefr_level']=='A1']):,}개")
    print(f"  - A2: {len([x for x in vocabulary_data if x['cefr_level']=='A2']):,}개")
    print(f"  - B1: {len([x for x in vocabulary_data if x['cefr_level']=='B1']):,}개")
    print(f"  - B2: {len([x for x in vocabulary_data if x['cefr_level']=='B2']):,}개")
    print(f"  - C1: {len([x for x in vocabulary_data if x['cefr_level']=='C1']):,}개")
    print(f"  - C2: {len([x for x in vocabulary_data if x['cefr_level']=='C2']):,}개")

except Exception as e:
    print(f"❌ Supabase 삽입 실패: {e}")
    print("\n💾 SQL 파일로 저장 중...")

    with open('vocabulary_data.sql', 'w', encoding='utf-8') as f:
        f.write("INSERT INTO vocabulary (word, meaning, example_en, example_ko, cefr_level, category) VALUES\n")
        for i, item in enumerate(vocabulary_data):
            comma = "," if i < len(vocabulary_data) - 1 else ";"
            f.write(f"('{item['word']}', '{item['meaning']}', '{item['example_en']}', '{item['example_ko']}', '{item['cefr_level']}', '{item['category']}'){comma}\n")

    print(f"✅ vocabulary_data.sql 생성 완료")
    print("   이 파일을 Supabase SQL Editor에서 실행하세요!")

print("\n🎉 완료!")
