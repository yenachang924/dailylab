import { escapeHtml as e, markdown, safeUrl } from './markdown.mjs';

export const statusLabels = { building: '만드는 중', active: '사용 중', paused: '잠시 멈춤', archived: '보관됨' };
export const tags = (items) => items.map((tag) => '<span class="tag">' + e(tag) + '</span>').join('');
const dateLabel = (date) => date.replaceAll('-', '.');
const anchor = (href, label, cls = '') => '<a class="' + cls + '" href="' + e(href) + '">' + label + '</a>';

export function layout({ config, base, active, title, description, body }) {
  const url = (route = '') => base + '/' + route;
  const nav = [['', 'Home', 'home'], ['daily/', 'Daily', 'daily'], ['tools/', 'Tools', 'tools']];
  return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + e(title ? title + ' — ' + config.title : config.title + ' — ' + config.description) + '</title>' +
    '<meta name="description" content="' + e(description ?? config.description) + '">' +
    '<meta name="theme-color" content="#1e1f24"><link rel="icon" href="' + url('favicon.svg') + '">' +
    '<link rel="stylesheet" href="' + url('style.css') + '"><link rel="stylesheet" href="' + url('theme.css') + '"><script src="' + url('app.js') + '" defer></script></head><body>' +
    '<a class="skip" href="#main">본문으로 건너뛰기</a><div class="shell"><header class="site-header">' +
    anchor(url(), '<span class="brand-icon">↗</span><span>' + e(config.title) + '<small>A SMALL, OPEN WORKSHOP</small></span>', 'brand') +
    '<nav aria-label="주 메뉴">' + nav.map(([route, label, key]) => '<a href="' + url(route) + '"' + (active === key ? ' aria-current="page"' : '') + '>' + label + '</a>').join('') +
    (safeUrl(config.repository) ? anchor(config.repository, 'GitHub ↗', 'github-nav') : '') + '</nav></header>' +
    '<main id="main">' + body + '</main><footer><span>© ' + new Date().getFullYear() + ' ' + e(config.name) + ' · 작은 것들을 꾸준히.</span>' +
    '<span>1 input <span class="orange">→</span> 1 output <span class="footer-dot">·</span> Built in the open</span></footer></div></body></html>';
}

export function entryCard(entry, index, base) {
  return '<article class="entry-row" data-record data-tags="' + e(JSON.stringify(entry.tags)) + '" data-search="' + e([entry.title, entry.summary, ...entry.tags].join(' ').toLowerCase()) + '">' +
    '<div class="entry-index">' + String(index + 1).padStart(2, '0') + '</div><div class="entry-content"><div class="eyebrow entry-meta"><time datetime="' + entry.date + '">' + dateLabel(entry.date) + '</time><span>DAILY OUTPUT</span></div>' +
    '<h3>' + anchor(base + '/daily/' + entry.slug + '/', e(entry.title)) + '</h3><p>' + e(entry.summary) + '</p><div class="tags">' + tags(entry.tags) + '</div></div><span class="row-arrow" aria-hidden="true">↗</span></article>';
}

export function toolCard(tool, base) {
  return '<article class="tool-card" data-record data-tags="' + e(JSON.stringify(tool.tags)) + '" data-status="' + tool.status + '" data-search="' + e([tool.title, tool.summary, ...tool.tags].join(' ').toLowerCase()) + '">' +
    '<div class="tool-top"><span class="tool-symbol">' + (tool.slug === 'daily-lab' ? '↗' : '⌘') + '</span><span class="status ' + tool.status + '"><i></i>' + (tool.sample ? '작성 예시' : statusLabels[tool.status]) + '</span></div>' +
    '<h3>' + anchor(base + '/tools/' + tool.slug + '/', e(tool.title)) + '</h3><p>' + e(tool.summary) + '</p><div class="tool-bottom"><div class="tags">' + tags(tool.tags) + '</div><span aria-hidden="true">↗</span></div></article>';
}

function heading(kicker, title, description) {
  return '<div class="page-heading"><div class="eyebrow"><span class="orange">●</span> ' + kicker + '</div><h1>' + title + '</h1><p>' + description + '</p></div>';
}

export function home(config, entries, tools, base) {
  const actualTools = tools.filter((tool) => !tool.sample);
  const allTags = [...new Set(entries.flatMap((entry) => entry.tags))].toSorted();
  const recordedDays = new Set(entries.map((entry) => entry.date));
  const now = new Date();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() - 13 + index);
    const value = date.toISOString().slice(0, 10);
    return '<span class="activity-day' + (recordedDays.has(value) ? ' recorded' : '') + '" title="' + value + (recordedDays.has(value) ? ' · 기록 있음' : ' · 기록 없음') + '"><span class="sr-only">' + value + (recordedDays.has(value) ? ' 기록 있음' : ' 기록 없음') + '</span></span>';
  }).join('');
  return '<section class="personal-intro"><div class="personal-heading"><div class="avatar" aria-hidden="true">y.</div><div><span class="eyebrow">A PERSONAL CORNER OF THE INTERNET</span><h1>' + e(config.name) + '<span class="orange">.</span></h1></div></div><p class="personal-statement">' + e(config.description) + '</p><p class="personal-description">' + e(config.intro) + '</p>' +
    '<div class="personal-links">' + anchor(base + '/tools/', '작은 도구들 ↗') + anchor(base + '/daily/', '매일의 제작 기록 ↗') + (safeUrl(config.repository) ? anchor(config.repository, 'GitHub ↗') : '') + '</div></section>' +
    '<div class="home-dashboard"><section class="dashboard-panel latest-panel"><div class="panel-heading"><h2>최근 만든 것</h2>' + anchor(base + '/daily/', '전체 보기 ↗') + '</div><span class="eyebrow">DAILY / ' + entries.length + ' OUTPUTS</span>' +
    (entries.length ? entries.slice(0, 3).map((entry) => '<article class="compact-entry"><time datetime="' + entry.date + '">' + dateLabel(entry.date) + '</time><h3>' + anchor(base + '/daily/' + entry.slug + '/', e(entry.title) + ' <span>↗</span>') + '</h3><p>' + e(entry.summary) + '</p><div class="tags">' + tags(entry.tags) + '</div></article>').join('') : '<p class="empty">첫 기록을 기다리고 있어요.</p>') + '</section>' +
    '<section class="dashboard-panel practice-panel"><div class="panel-heading"><h2>매일 하나씩</h2><span class="orange">↗</span></div><div class="practice-count">' + String(recordedDays.size).padStart(2, '0') + '<span>기록한 날</span></div><div class="activity-grid" role="img" aria-label="최근 14일 중 ' + entries.filter((entry) => entry.date <= today && entry.date >= new Date(Date.parse(today) - 13 * 86400000).toISOString().slice(0, 10)).map((entry) => entry.date).filter((date, index, values) => values.indexOf(date) === index).length + '일 기록">' + days + '</div><span class="activity-caption">최근 14일 · 기록한 날에 색을 남깁니다.</span><div class="practice-rule"><span>01</span> 작동하는 작은 코드<br><span>02</span> 짧은 제작 기록<br><span>03</span> GitHub 커밋</div></section>' +
    '<section class="dashboard-panel topics-panel"><div class="panel-heading"><h2>탐색하기</h2><span class="eyebrow">TOPICS</span></div><div class="topic-list">' +
    (allTags.length ? allTags.map((tag) => anchor(base + '/daily/?tag=' + encodeURIComponent(tag), '<span>' + e(tag) + '</span><span>' + entries.filter((entry) => entry.tags.includes(tag)).length + ' ↗</span>')).join('') : '<p>기록에 태그를 추가하면 주제별로 모입니다.</p>') + '</div></section>' +
    '<section class="dashboard-panel about-panel"><div class="panel-heading"><h2>이곳에 대하여</h2><span class="eyebrow">ABOUT THIS LAB</span></div><p>개인적인 불편을 해결하는 도구와, 만드는 과정에서 배운 것들을 모읍니다.</p><p>코드가 작아도 괜찮습니다. 직접 확인한 결과와 다음 시도를 함께 남깁니다.</p><div class="about-foot">' + actualTools.length + '개의 도구 · ' + entries.length + '개의 공개 기록</div></section></div>' +
    '<section class="section home-tools"><div class="section-heading"><div><span class="eyebrow">MINI TOOLS</span><h2>내가 쓰려고 만든 것들</h2></div>' + anchor(base + '/tools/', '모든 도구 ↗', 'text-link') + '</div><div class="tool-grid">' + (actualTools.map((tool) => toolCard(tool, base)).join('') || '<p class="empty">첫 도구를 기다리고 있어요.</p>') + '</div></section>';
}


export function archive(kind, records, base) {
  const isDaily = kind === 'daily';
  const allTags = [...new Set(records.flatMap((record) => record.tags))].toSorted();
  const filters = '<div class="filter-tags" role="group" aria-label="태그 필터"><button class="filter active" data-tag="" aria-pressed="true">전체</button>' + allTags.map((tag) => '<button class="filter" data-tag="' + e(tag) + '" aria-pressed="false">' + e(tag) + '</button>').join('') + '</div>';
  return heading(isDaily ? 'A LITTLE PROGRESS, EVERY DAY' : 'SMALL TOOLS, REAL PROBLEMS', isDaily ? '매일의 제작 기록<span class="orange">.</span>' : '나의 작은 도구함<span class="orange">.</span>',
    isDaily ? '하나의 입력이 어떤 결과물이 되었는지, 만드는 과정을 남깁니다.' : '직접 쓰기 위해 만든 도구와 실험을 모았습니다. 각 도구의 변화도 함께 기록합니다.') +
    '<section data-collection><div class="archive-toolbar"><label class="search"><span aria-hidden="true">⌕</span><span class="sr-only">기록 검색</span><input type="search" data-search-input placeholder="' + (isDaily ? '제목, 설명, 태그로 검색' : '도구 이름이나 태그로 검색') + '"></label><span class="result-count" data-count aria-live="polite">' + records.length + '개의 ' + (isDaily ? '기록' : '도구') + '</span></div>' +
    filters + '<div class="' + (isDaily ? 'entries' : 'tool-grid') + '">' + records.map((record, index) => isDaily ? entryCard(record, index, base) : toolCard(record, base)).join('') + '</div><p class="empty" data-empty' + (records.length ? ' hidden' : '') + '>아직 일치하는 결과가 없어요. 다른 검색어로 찾아보세요.</p></section>';
}

export function detail(kind, record, entries, tools, base, sourceUrl, commitUrl) {
  const isDaily = kind === 'daily';
  const tool = isDaily ? tools.find((item) => item.slug === record.tool) : record;
  const related = isDaily ? [] : entries.filter((entry) => entry.tool === record.slug);
  const actions = [
    safeUrl(commitUrl) && anchor(commitUrl, '커밋 보기 ↗', 'button secondary'),
    safeUrl(record.repo) && anchor(record.repo, 'GitHub 저장소 ↗', 'button secondary'),
    safeUrl(record.demo) && anchor(record.demo, '직접 사용하기 ↗', 'button primary'),
    safeUrl(sourceUrl) && anchor(sourceUrl, '원본 Markdown ↗', 'text-link')
  ].filter(Boolean).join('');
  return '<div class="detail">' + anchor(base + '/' + kind + '/', '← ' + (isDaily ? '모든 제작 기록' : '모든 도구'), 'back-link') +
    '<header class="article-heading"><div class="eyebrow">' + (isDaily ? dateLabel(record.date) + ' / DAILY OUTPUT' : 'TOOL / ' + (record.sample ? '작성 예시' : statusLabels[record.status])) + '</div><h1>' + e(record.title) + '</h1><p>' + e(record.summary) + '</p><div class="tags">' + tags(record.tags) + '</div></header>' +
    (record.sample ? '<aside class="notice">작성 형식을 보여주는 예시입니다. 실제 구현·사용 실적을 의미하지 않습니다.</aside>' : '') +
    '<div class="article-actions">' + actions + '</div><article class="prose">' + markdown(record.body) + '</article>' +
    (isDaily && tool ? '<aside class="related-tool"><span class="eyebrow">CONNECTED TOOL</span>' + anchor(base + '/tools/' + tool.slug + '/', '<strong>' + e(tool.title) + '</strong><span>이 도구의 다른 제작 기록 보기 ↗</span>') + '</aside>' : '') +
    (!isDaily ? '<section class="section"><div class="section-heading"><h2>이 도구의 제작 기록</h2><span class="eyebrow">' + related.length + ' OUTPUTS</span></div>' + (related.length ? related.map((entry, index) => entryCard(entry, index, base)).join('') : '<p class="empty">첫 제작 기록을 기다리고 있어요.</p>') + '</section>' : '') + '</div>';
}
