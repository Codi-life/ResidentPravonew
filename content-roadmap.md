# Content roadmap — internal linking TODOs

Notes moved out of production HTML (`ru/company-registration-cyprus.html`) —
these were leaking as visible HTML comments in the shipped page source.
When each future article is published, wrap the referenced phrase in the
listed link.

## Редомициляция компании на Кипр

Когда будет готова статья про редомициляцию — обернуть фразу
"редомициляцию (redomicile) на Кипр" (в разделе про регулируемые виды
деятельности) в ссылку:

```html
<a href="/ru/redomicilyatsiya-kompanii-na-kipr" style="color:var(--blue);">редомициляцию (redomicile) на Кипр</a>
```

## FIC (Foreign Interest Company) — детальная статья

Когда будет готова отдельная статья про FIC — обернуть фразу
"Компания с иностранным участием (FIC)" в ссылку:

```html
<a href="/ru/company/foreign-interest-company/" style="color:var(--blue);">Компания с иностранным участием (FIC)</a>
```

В полной статье обязательно раскрыть:
- оба сценария по €200 000 (>50% акций у нерезидентов ЕС vs ≤50%)
- зарплатный порог для ключевого персонала — от €2 500/мес
- квоту сотрудников-граждан ЕС/Кипра — 30% к 2027 году

## Ликвидация компании

Когда будет готова статья про ликвидацию — добавить в TOC страницы
company-registration-cyprus строку:

```html
<li><a href="#company-closure">Закрытие компании</a></li>
```

и обернуть фразу "Strike Off и добровольная ликвидация" в ссылку:

```html
<a href="/ru/likvidatsiya-kompanii-na-kipre" style="color:var(--blue);">Strike Off и добровольная ликвидация</a>
```

## Готовые (полочные) компании — DONE (2026-07-08)

Статья опубликована: `/ru/blog/gotovaya-kompaniya-ili-registraciya-kipr-2026`.
Ссылка из FAQ на company-registration-cyprus добавлена. Нужно ещё:
EN-версия статьи (`en/blog/...`) + рассылка hreflang-alternate после публикации EN.
