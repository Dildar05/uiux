"""
analyze_responses.py
Простая утилита для анализа CSV с ответами и генерации таблицы наблюдение->инсайт->идея

Как использовать:
python analyze_responses.py responses.csv summary.json

Выход:
- summary.json: агрегированные значения по шкалам и список открытых ответов
- в консоль: сводка и предложенные инсайты (черновые)
"""
import csv
import json
import sys
from collections import Counter, defaultdict


def load_csv(path):
    with open(path, encoding='utf-8') as f:
        reader = csv.DictReader(f)
        return list(reader)


def numeric(v):
    try:
        return float(v)
    except:
        return None


def summarize(rows):
    summary = {}
    n = len(rows)
    summary['n_responses'] = n
    # numeric fields
    fields_num = ['find_schedule_1_5','sidebar_clarity_1_5','visual_1_5']
    for f in fields_num:
        vals = [numeric(r.get(f)) for r in rows if numeric(r.get(f)) is not None]
        if vals:
            summary[f+'_mean'] = sum(vals)/len(vals)
            summary[f+'_median'] = sorted(vals)[len(vals)//2]
        else:
            summary[f+'_mean'] = None
            summary[f+'_median'] = None

    # open answers
    open_fields = ['confusing_element','most_useful','improvement_suggestion','notes']
    open_answers = {f: [r.get(f) for r in rows if r.get(f) and r.get(f).strip()] for f in open_fields}
    summary['open_answers'] = open_answers

    # quick top issues by counting tokens (very naive)
    issues = Counter()
    for text in open_answers['confusing_element']:
        for w in text.lower().split():
            if len(w)>3:
                issues[w]+=1
    summary['top_issue_tokens'] = issues.most_common(20)

    return summary


def generate_observation_insight_idea(summary):
    # Simple heuristics to produce candidate insights
    rows = []
    if summary.get('find_schedule_1_5_mean') and summary['find_schedule_1_5_mean']<3.5:
        rows.append({
            'observation':'Пользователи затрудняются найти расписание (низкий средний балл).',
            'insight':'Навигация или видимость расписания недостаточно явная.',
            'idea':'Добавить быстрый видимый CTA или повести пользователя к расписанию; выделить карточку расписания ярче.'
        })
    if summary.get('sidebar_clarity_1_5_mean') and summary['sidebar_clarity_1_5_mean']<3.5:
        rows.append({
            'observation':'Сайдбар выглядит запутанно для части пользователей.',
            'insight':'Много пунктов/ширина или контраст мешают восприятию.',
            'idea':'Уменьшить width, сгруппировать пункты, добавить иконки и разрывные заголовки.'
        })
    if summary.get('visual_1_5_mean') and summary['visual_1_5_mean']<4:
        rows.append({
            'observation':'Часть пользователей жалуется на читаемость/контраст.',
            'insight':'Цвета и контраст не оптимальны для всех условий освещения.',
            'idea':'Проверить контраст, увеличить размер шрифта важных меток, улучшить цветовые акценты.'
        })
    # fallback: use top open issues tokens to craft observation
    if not rows and summary.get('top_issue_tokens'):
        # pick a common token
        token = summary['top_issue_tokens'][0][0]
        rows.append({
            'observation':f'Частое упоминание: "{token}" в открытых ответах.',
            'insight':f'"{token}" вызывает вопросы у пользователей.',
            'idea':f'Провести ревизию области, связанной с "{token}", записать конкретные проблемы и прототипировать изменение.'
        })
    return rows


def main():
    if len(sys.argv)<3:
        print('Usage: python analyze_responses.py responses.csv summary.json')
        return
    csv_path = sys.argv[1]
    out_json = sys.argv[2]
    rows = load_csv(csv_path)
    summary = summarize(rows)
    rows_i = generate_observation_insight_idea(summary)
    res = {'summary':summary,'candidate_insights':rows_i}
    with open(out_json,'w',encoding='utf-8') as f:
        json.dump(res,f,ensure_ascii=False,indent=2)
    print('Processed', summary['n_responses'],'responses')
    print('Candidate insights:')
    for i,r in enumerate(rows_i,1):
        print(i, r['observation'])

if __name__=='__main__':
    main()
