UX-исследование — инструкция (короткая)

Цель: собрать мнение 5–10 пользователей о удобстве Student Portal, выявить 3 главные проблемы и предложить идеи.

Шаги:
1) Подготовка
   - Откройте `UX-RESEARCH/google-form-questions.txt` и создайте Google Form
   - Вставьте поле согласия из `UX-RESEARCH/consent.txt`
   - Настройте сбор ответов в Google Forms и экспорт в CSV (Google Sheets → File → Download → CSV)

2) Рекрутинг
   - Отправьте `UX-RESEARCH/recruitment-message.txt` в чат/канал/почту
   - Раcположите 5–10 человек (студенты/преподаватели)

3) Сбор данных
   - Пусть участники заполняют форму
   - При согласии: проведите интервью по `UX-RESEARCH/interview-script.txt` и запишите заметки в CSV

4) Анализ
   - Соберите все ответы в один CSV (например: `responses.csv`)
   - Запустите: `python UX-RESEARCH/analyze_responses.py UX-RESEARCH/responses.csv UX-RESEARCH/summary.json`
   - Откройте `summary.json` и перенесите ключевые наблюдения в слайд

5) Создание слайда
   - Откройте `UX-RESEARCH/slide.html` в браузере, замените текст/числа по результатам
   - Печать → Save as PDF (или скриншот) — получите PDF/слайд

6) Итог
   - У вас должен быть 1 слайд (PDF) с таблицей наблюдение → инсайт → идея

Советы:
- Записывайте точные цитаты (короткие) — они ценны в презентации
- Старайтесь задавать нейтральные вопросы
- Для 5–10 человек вы получите быстрые качественные инсайты

Файлы в этой папке:
- google-form-questions.txt
- interview-script.txt
- consent.txt
- responses-template.csv
- analyze_responses.py
- slide.html
- recruitment-message.txt
- README.md

Если хотите, я могу:
- Сформировать готовую Google Form (пошаговая инструкция)
- Подготовить CSV из ваших ответов и запустить анализ
- Отредактировать slide.html по реальным данным

Скажите, что сделать следующим шагом — подготовить саму форму или помочь с анализом?