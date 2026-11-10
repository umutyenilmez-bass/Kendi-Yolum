/* KENDİ YOLUM — kişisel ilkeler ve öz yönetim
   Bağımlılık yok. Veriler tarayıcının localStorage alanında saklanır. */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Sabit içerik (metinler kullanıcının belirlediği şekliyle, değiştirilmeden)
  // ---------------------------------------------------------------------------
  const PRINCIPLES = [
    { t: 'Kendimi ispatlamak zorunda değilim.', d: 'Ne bildiğimi, ne yapabildiğimi ve ne kadar deneyimli olduğumu biliyorum.' },
    { t: 'Her sorumluluğu üstlenmek zorunda değilim.', d: 'Yardımcı olabilirim ama herkesin sorununu çözmek benim görevim değil.' },
    { t: 'Başkalarının davranışlarını yönetmek benim işim değil.', d: 'Herkes kendi davranışından sorumlu. Saygısızlığı normalleştirmem.' },
    { t: 'Emeğimin karşılığını alırım.', d: 'İşimi iyi yaparım, profesyonel ilişkilerimi korurum. Gereksiz mücadelelere girmem.' },
    { t: 'Asıl yatırımım kendime.', d: 'Zamanımı, enerjimi, bilgi ve deneyimimi kendi müziğime, projelerime ve geleceğime aktarırım.' }
  ];
  const REMEMBER = 'İyi niyetimi koruyacağım ama kendimi ihmal etmeyeceğim. Her fırsata yetişmek, her sorunu çözmek ve herkes tarafından anlaşılmak zorunda değilim.';
  const SLOGAN = 'İşimi yap. Kendimi koru. Kendi geleceğimi kur.';

  const CARDS = [
    { n: 1, tag: 'SINIRLAR', l1: 'Bu benim sorumluluğum mu?', l2: 'Her sorunu çözmek zorunda değilim.' },
    { n: 2, tag: 'ÖZDEĞER', l1: 'Kendimi ispatlamak zorunda değilim.', l2: 'Deneyimim ve bilgim başkalarının değerlendirmesine bağlı değil.' },
    { n: 3, tag: 'SAKİNLİK', l1: 'Başkalarının paniğini üstlenme.', l2: 'Sakin kal. Kendi işine odaklan.' },
    { n: 4, tag: 'ÖNCELİK', l1: 'Benim de kendi yolum var.', l2: 'Enerjimi kendi üretimime ve geleceğime yatırıyorum.' },
    { n: 5, tag: 'PROFESYONELLİK', l1: 'İşimi yap. Emeğimin karşılığını al.', l2: 'Saygılı ol. Sınırlarını koru. Gereksiz mücadeleye girme.' }
  ];

  const DAILY_Q = [
    { id: 'q1', text: 'Bana ait olmayan bir sorumluluğu üstlendim mi?', short: 'Başkasının sorumluluğu', opts: [['evet', 'Evet'], ['hayir', 'Hayır']] },
    { id: 'q2', text: 'Gerektiğinde sınırımı korudum mu?', short: 'Sınır', opts: [['evet', 'Evet'], ['hayir', 'Hayır'], ['gerekmedi', 'Gerekmedi']] },
    { id: 'q3', text: 'Başkasının davranışını kişisel mesele hâline getirdim mi?', short: 'Kişisel mesele', opts: [['evet', 'Evet'], ['hayir', 'Hayır']] }
  ];
  const DAILY_Q4 = 'Kendi geleceğim için bugün ne yaptım?';

  const WEEKLY_Q = [
    'Bu hafta enerjimi gereksiz yere nerede harcadım?',
    'Kendi işlerim için somut olarak ne ürettim?',
    'Gelecek hafta neyi farklı yapacağım?'
  ];
  const MONTHLY_Q = [
    'Kendi projelerimde ne kadar ilerledim?',
    'Zamanımı ve enerjimi nasıl kullandım?',
    'Kişisel ilkelerimi ne ölçüde uyguladım?',
    'Grup gelirine ekonomik bağımlılığımı azaltmak için ne yaptım?',
    'Gelecek ayın öncelikleri neler?'
  ];

  const STATUS = { baslamadi: 'Başlamadı', devam: 'Devam ediyor', tamam: 'Tamamlandı' };
  const STATUS_ORDER = { devam: 0, baslamadi: 1, tamam: 2 };
  const WEEKLY_SESSION_TARGET = 2;

  // ---------------------------------------------------------------------------
  // Yardımcılar
  // ---------------------------------------------------------------------------
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
  const str = (v) => (typeof v === 'string' ? v : '');
  const oneOf = (v, list) => (list.indexOf(v) >= 0 ? v : '');
  const pad = (n) => String(n).padStart(2, '0');

  // Tarihler yerel saate göre "YYYY-MM-DD" anahtarlarıyla tutulur.
  const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseDate = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const todayKey = () => dateKey(new Date());
  const isDateKey = (k) => /^\d{4}-\d{2}-\d{2}$/.test(k) && !isNaN(parseDate(k));

  // ISO hafta (pazartesi başlar, pazar biter)
  function weekKey(d) {
    const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    t.setDate(t.getDate() - ((t.getDay() + 6) % 7) + 3); // haftanın perşembesi
    const firstThu = new Date(t.getFullYear(), 0, 4);
    const w = 1 + Math.round(((t - firstThu) / 86400000 - 3 + ((firstThu.getDay() + 6) % 7)) / 7);
    return `${t.getFullYear()}-W${pad(w)}`;
  }
  const isWeekKey = (k) => /^\d{4}-W\d{2}$/.test(k);
  function weekStart(k) {
    const [y, w] = k.split('-W').map(Number);
    const jan4 = new Date(y, 0, 4);
    const mon = addDays(jan4, -((jan4.getDay() + 6) % 7));
    return addDays(mon, (w - 1) * 7);
  }
  const weekDays = (k) => { const s = weekStart(k); return [0, 1, 2, 3, 4, 5, 6].map((i) => dateKey(addDays(s, i))); };
  const shiftWeek = (k, n) => weekKey(addDays(weekStart(k), n * 7));

  const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  const isMonthKey = (k) => /^\d{4}-(0[1-9]|1[0-2])$/.test(k);
  const shiftMonth = (k, n) => { const [y, m] = k.split('-').map(Number); return monthKey(new Date(y, m - 1 + n, 1)); };

  const F = {
    long: new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }),
    dm: new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' }),
    dmw: new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }),
    short: new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }),
    my: new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }),
    month: new Intl.DateTimeFormat('tr-TR', { month: 'long' }),
    dmy: new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
    time: new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' })
  };
  const fmtLong = (k) => F.long.format(parseDate(k));
  const fmtShort = (k) => F.short.format(parseDate(k));
  const fmtDmw = (k) => F.dmw.format(parseDate(k));
  const fmtDmy = (k) => F.dmy.format(parseDate(k));
  const fmtMonth = (k) => { const [y, m] = k.split('-').map(Number); return F.my.format(new Date(y, m - 1, 1)); };
  function fmtWeek(k) {
    const s = weekStart(k), e = addDays(s, 6);
    const sameMonth = s.getMonth() === e.getMonth(), sameYear = s.getFullYear() === e.getFullYear();
    const left = s.getDate() + (sameMonth ? '' : ' ' + F.month.format(s)) + (sameYear ? '' : ' ' + s.getFullYear());
    return `${left} – ${e.getDate()} ${F.month.format(e)} ${e.getFullYear()}`;
  }
  const nowTime = () => F.time.format(new Date());

  // ---------------------------------------------------------------------------
  // Veri
  // ---------------------------------------------------------------------------
  const STORAGE_KEY = 'kendiYolum.data.v1';
  let data = emptyData();
  let storageOk = true;

  function emptyData() {
    return { app: 'kendi-yolum', version: 1, daily: {}, weekly: {}, monthly: {}, projects: [] };
  }

  // Dışarıdan gelen (localStorage veya yedek dosyası) veriyi güvenli biçime getirir.
  function normalize(d) {
    const out = emptyData();
    if (!isObj(d)) return out;
    if (isObj(d.daily)) {
      for (const [k, v] of Object.entries(d.daily)) {
        if (!isDateKey(k) || !isObj(v)) continue;
        const rec = {
          q1: oneOf(v.q1, ['evet', 'hayir']),
          q2: oneOf(v.q2, ['evet', 'hayir', 'gerekmedi']),
          q3: oneOf(v.q3, ['evet', 'hayir']),
          q4: str(v.q4),
          updatedAt: str(v.updatedAt)
        };
        if (hasDaily(rec)) out.daily[k] = rec;
      }
    }
    if (isObj(d.weekly)) {
      for (const [k, v] of Object.entries(d.weekly)) {
        if (!isWeekKey(k) || !isObj(v)) continue;
        const w = {
          a1: str(v.a1), a2: str(v.a2), a3: str(v.a3),
          goals: (Array.isArray(v.goals) ? v.goals : []).filter(isObj)
            .map((g) => ({ id: str(g.id) || uid(), text: str(g.text), done: !!g.done })).filter((g) => g.text),
          sessions: (Array.isArray(v.sessions) ? v.sessions : []).filter(isObj)
            .map((s) => ({ id: str(s.id) || uid(), date: isDateKey(str(s.date)) ? s.date : '', note: str(s.note) })).filter((s) => s.date),
          updatedAt: str(v.updatedAt)
        };
        if (!weekIsEmpty(w)) out.weekly[k] = w;
      }
    }
    if (isObj(d.monthly)) {
      for (const [k, v] of Object.entries(d.monthly)) {
        if (!isMonthKey(k) || !isObj(v)) continue;
        const m = { a1: str(v.a1), a2: str(v.a2), a3: str(v.a3), a4: str(v.a4), a5: str(v.a5), updatedAt: str(v.updatedAt) };
        if (hasMonthly(m)) out.monthly[k] = m;
      }
    }
    if (Array.isArray(d.projects)) {
      out.projects = d.projects.filter((p) => isObj(p) && str(p.name).trim()).map((p) => ({
        id: str(p.id) || uid(),
        name: str(p.name).trim(),
        desc: str(p.desc),
        next: str(p.next),
        due: isDateKey(str(p.due)) ? p.due : '',
        status: STATUS[p.status] ? p.status : 'baslamadi',
        createdAt: str(p.createdAt),
        updatedAt: str(p.updatedAt),
        completedAt: str(p.completedAt)
      }));
    }
    return out;
  }

  function looksLikeBackup(d) {
    return isObj(d) && (isObj(d.daily) || isObj(d.weekly) || isObj(d.monthly) || Array.isArray(d.projects));
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      data = raw ? normalize(JSON.parse(raw)) : emptyData();
      // Yazma testi
      localStorage.setItem(STORAGE_KEY + '.test', '1');
      localStorage.removeItem(STORAGE_KEY + '.test');
    } catch (e) {
      storageOk = false;
    }
    $('#storageWarning').hidden = storageOk;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      storageOk = false;
      $('#storageWarning').hidden = false;
      return false;
    }
  }

  const hasDaily = (d) => !!d && !!(d.q1 || d.q2 || d.q3 || (d.q4 && d.q4.trim()));
  const hasWeeklyReview = (w) => !!w && !!((w.a1 || '').trim() || (w.a2 || '').trim() || (w.a3 || '').trim());
  const weekIsEmpty = (w) => !hasWeeklyReview(w) && !(w.goals && w.goals.length) && !(w.sessions && w.sessions.length);
  const hasMonthly = (m) => !!m && ['a1', 'a2', 'a3', 'a4', 'a5'].some((k) => (m[k] || '').trim());

  function getWeek(k) {
    if (!data.weekly[k]) data.weekly[k] = { a1: '', a2: '', a3: '', goals: [], sessions: [], updatedAt: '' };
    return data.weekly[k];
  }
  function touchWeek(k) {
    const w = data.weekly[k];
    if (!w) return;
    if (weekIsEmpty(w)) delete data.weekly[k];
    else w.updatedAt = new Date().toISOString();
  }

  function allSessions() {
    const out = [];
    for (const w of Object.values(data.weekly)) for (const s of w.sessions || []) out.push(s);
    return out;
  }

  // Belirli günler için günlük kayıt gözlemleri (puan değil, yalnızca sayım).
  function dailyStats(keys) {
    const s = { days: 0, q1: 0, q2evet: 0, q2hayir: 0, q2gerekmedi: 0, q3: 0, notes: [] };
    for (const k of keys) {
      const d = data.daily[k];
      if (!hasDaily(d)) continue;
      s.days++;
      if (d.q1 === 'evet') s.q1++;
      if (d.q2 === 'evet') s.q2evet++;
      if (d.q2 === 'hayir') s.q2hayir++;
      if (d.q2 === 'gerekmedi') s.q2gerekmedi++;
      if (d.q3 === 'evet') s.q3++;
      if (d.q4 && d.q4.trim()) s.notes.push({ date: k, text: d.q4.trim() });
    }
    return s;
  }

  function monthDayKeys(mk) {
    const [y, m] = mk.split('-').map(Number);
    const n = new Date(y, m, 0).getDate();
    const out = [];
    for (let i = 1; i <= n; i++) out.push(`${mk}-${pad(i)}`);
    return out;
  }

  function monthStats(mk) {
    const s = dailyStats(monthDayKeys(mk));
    s.sessions = allSessions().filter((x) => x.date.slice(0, 7) === mk).length;
    s.completed = data.projects.filter((p) => p.status === 'tamam' && (p.completedAt || '').slice(0, 7) === mk);
    return s;
  }

  function obsList(s, opts) {
    const rows = [
      [opts.daysLabel, opts.daysValue],
      ['Bana ait olmayan bir sorumluluğu üstlendiğim gün', s.q1],
      ['Sınırımı koruduğum gün', s.q2evet],
      ['Sınırımı korumadığım gün', s.q2hayir],
      ['Sınır gerekmeyen gün', s.q2gerekmedi],
      ['Başkasının davranışını kişisel mesele hâline getirdiğim gün', s.q3]
    ];
    if (opts.extra) rows.push(...opts.extra);
    return `<ul class="obs">${rows.map(([a, b]) => `<li><span>${esc(a)}</span><span>${esc(b)}</span></li>`).join('')}</ul>`;
  }

  // ---------------------------------------------------------------------------
  // Otomatik kaydetme (yazarken kısa gecikmeyle kaydeder, sayfa değişince hemen)
  // ---------------------------------------------------------------------------
  let pending = null;
  function schedule(fn, delay) {
    if (pending) clearTimeout(pending.timer);
    pending = { fn, timer: setTimeout(() => { pending = null; fn(); }, delay || 500) };
  }
  function flush() {
    if (!pending) return;
    clearTimeout(pending.timer);
    const f = pending.fn;
    pending = null;
    f();
  }
  function setStatus(root, text) {
    const el = $('.status', root);
    if (el) el.textContent = text;
  }
  const savedText = (ok) => (ok ? `Kaydedildi · ${nowTime()}` : 'Kaydedilemedi — tarayıcı depolaması kullanılamıyor.');

  // Satır içi onay ("Emin misin?") — tarayıcı diyaloğu kullanmadan.
  function inlineConfirm(btn, question, yesLabel, onYes) {
    const box = document.createElement('span');
    box.className = 'confirm';
    box.innerHTML = `<span class="muted small">${esc(question)}</span>
      <button type="button" class="btn danger small" data-yes>${esc(yesLabel)}</button>
      <button type="button" class="btn ghost small" data-no>Vazgeç</button>`;
    btn.replaceWith(box);
    $('[data-no]', box).addEventListener('click', () => box.replaceWith(btn));
    $('[data-yes]', box).addEventListener('click', onYes);
    $('[data-no]', box).focus();
  }

  // ---------------------------------------------------------------------------
  // Görünümler
  // ---------------------------------------------------------------------------
  const back = (href, label) => `<a class="back" href="${href}">← ${esc(label)}</a>`;

  // ---- Ana sayfa -----------------------------------------------------------
  function viewHome() {
    const tk = todayKey();
    const d = data.daily[tk];
    const wk = weekKey(new Date());
    const w = data.weekly[wk];
    const reviewDone = hasWeeklyReview(w);
    const sessions = w ? w.sessions.length : 0;
    const goals = w ? w.goals : [];
    const goalsDone = goals.filter((g) => g.done).length;
    const isSunday = new Date().getDay() === 0;

    const active = data.projects.filter((p) => p.status !== 'tamam').sort(projectSort).slice(0, 4);

    // Kendi projelerim için yaptığım son çalışmalar: günlük 4. soru + 45 dk oturumları
    const work = [];
    for (const [k, v] of Object.entries(data.daily)) if (v.q4 && v.q4.trim()) work.push({ date: k, text: v.q4.trim() });
    for (const s of allSessions()) work.push({ date: s.date, text: '45 dk çalışma' + (s.note ? ' — ' + s.note : '') });
    work.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    const recent = work.slice(0, 5);

    const marks = Array.from({ length: Math.max(WEEKLY_SESSION_TARGET, sessions) }, (_, i) => `<i class="${i < sessions ? 'on' : ''}"></i>`).join('');

    const html = `
      <section class="hero">
        <h1>KENDİ YOLUM</h1>
        <p class="slogan">${esc(SLOGAN)}</p>
      </section>

      ${isSunday && !reviewDone ? `<div class="notice"><strong>Bugün pazar.</strong> Haftalık değerlendirmeyi yapmak için birkaç dakika ayırabilirsin. <a href="#/hafta">Haftalık değerlendirmeye git →</a></div>` : ''}

      <div class="grid">
        <section class="panel">
          <h2>Bugün</h2>
          <p class="muted small">${esc(fmtLong(tk))}</p>
          ${hasDaily(d)
            ? `<p>Günlük kontrol kaydedildi.</p>
               ${d.q4 && d.q4.trim() ? `<blockquote>${esc(d.q4.trim())}</blockquote>` : ''}
               <a class="btn ghost" href="#/gunluk">Görüntüle / düzenle</a>`
            : `<p>Günlük kontrol henüz yapılmadı. Yaklaşık 30 saniye sürer.</p>
               <a class="btn" href="#/gunluk">Günlük kontrole başla</a>`}
        </section>

        <section class="panel">
          <h2>Bu hafta</h2>
          <p class="muted small">${esc(fmtWeek(wk))}</p>
          <dl class="facts">
            <div><dt>Haftalık değerlendirme</dt><dd>${reviewDone ? 'Yapıldı' : 'Henüz yapılmadı'}</dd></div>
            <div><dt>Projelerime 45 dk</dt><dd><span class="marks" aria-hidden="true">${marks}</span>${sessions} / ${WEEKLY_SESSION_TARGET}</dd></div>
            <div><dt>Çalışma hedefleri</dt><dd>${goals.length ? `${goalsDone} / ${goals.length} tamamlandı` : 'Belirlenmedi'}</dd></div>
          </dl>
          <a class="btn ghost" href="#/hafta">Haftaya git</a>
        </section>
      </div>

      <section class="panel">
        <div class="panel-head"><h2>Kendi projelerim</h2><a href="#/projeler">Tümü →</a></div>
        ${active.length
          ? `<ul class="list">${active.map((p) => `
              <li><a class="row-link" href="#/projeler/${esc(p.id)}">
                <span class="row-title">${esc(p.name)} <span class="pill ${p.status}">${STATUS[p.status]}</span></span>
                ${p.next ? `<span class="row-meta">Sonraki adım: ${esc(p.next)}</span>` : ''}
              </a></li>`).join('')}</ul>`
          : `<p class="muted">Aktif proje yok. <a href="#/projeler/yeni">Proje ekle</a></p>`}
        <h3 style="margin-top:18px">Son çalışmalarım</h3>
        ${recent.length
          ? `<ul class="worklist">${recent.map((r) => `<li><span class="when">${esc(fmtShort(r.date))}</span><span class="what">${esc(r.text)}</span></li>`).join('')}</ul>`
          : `<p class="muted small">Günlük kontroldeki “Kendi geleceğim için bugün ne yaptım?” notların ve haftalık 45 dakikalık çalışmaların burada görünür.</p>`}
      </section>

      <div class="grid">
        <section class="panel">
          <div class="panel-head"><h2>İlkelerim</h2><a href="#/ilkeler">Tamamı →</a></div>
          <ol class="mini-principles">${PRINCIPLES.map((p, i) => `<li><a href="#/ilkeler/${i + 1}">${esc(p.t)}</a></li>`).join('')}</ol>
        </section>
        <section class="panel">
          <h2>İlerleme</h2>
          <ul class="links">
            <li><a href="#/gecmis"><span>Günlük kayıtlar</span><span>${Object.keys(data.daily).length} kayıt</span></a></li>
            <li><a href="#/hafta"><span>Haftalık değerlendirme</span><span>→</span></a></li>
            <li><a href="#/ay"><span>Aylık değerlendirme</span><span>→</span></a></li>
            <li><a href="#/kartlar"><span>Kişisel kartlar</span><span>→</span></a></li>
          </ul>
        </section>
      </div>`;
    return { html, title: '' };
  }

  // ---- İlkeler -------------------------------------------------------------
  function viewPrinciples(focus) {
    const html = `
      ${back('#/', 'Ana sayfa')}
      <div class="principles-head">
        <h1>KENDİ YOLUM</h1>
        <p class="slogan">${esc(SLOGAN)}</p>
      </div>
      <ol class="principles">
        ${PRINCIPLES.map((p, i) => `<li id="ilke-${i + 1}" class="${focus === i + 1 ? 'focus' : ''}"><div><h2>${esc(p.t)}</h2><p>${esc(p.d)}</p></div></li>`).join('')}
      </ol>
      <div class="remember">
        <strong>UNUTMA:</strong>
        <p>${esc(REMEMBER)}</p>
      </div>
      <p class="muted small" style="margin-top:20px">Bu ilkelerin cebe sığan hâlleri için <a href="#/kartlar">kişisel kartlara</a> bakabilirsin.</p>`;
    return {
      html, title: 'İlkeler',
      bind() {
        if (focus) { const el = $('#ilke-' + focus); if (el) el.scrollIntoView({ block: 'start' }); }
      },
      keepScroll: !!focus
    };
  }

  // ---- Günlük kontrol --------------------------------------------------------
  function viewDaily(key) {
    const tk = todayKey();
    const d = data.daily[key] || {};
    const isToday = key === tk;
    const exists = hasDaily(d);

    const html = `
      ${isToday ? back('#/', 'Ana sayfa') : back('#/gecmis', 'Günlük kayıtlar')}
      <div class="page-head">
        <h1>Günlük kontrol</h1>
        <p>${esc(fmtLong(key))}${isToday ? ' · bugün' : ''}</p>
      </div>
      <div class="datebar no-print">
        <label class="muted small" for="dsel">Başka bir gün:</label>
        <input type="date" id="dsel" value="${key}" max="${tk}">
        ${!isToday ? `<a href="#/gunluk" class="small">Bugüne dön</a>` : ''}
      </div>

      <form id="dailyForm" class="panel" autocomplete="off" onsubmit="return false">
        ${DAILY_Q.map((q, i) => `
          <fieldset class="q">
            <legend>${i + 1}. ${esc(q.text)}</legend>
            <div class="seg">
              ${q.opts.map(([v, l]) => `<label><input type="radio" name="${q.id}" value="${v}" ${d[q.id] === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}
            </div>
          </fieldset>`).join('')}
        <fieldset class="q">
          <legend><label for="q4">4. ${esc(DAILY_Q4)}</label></legend>
          <textarea id="q4" name="q4" rows="3" placeholder="Kısa bir not">${esc(d.q4 || '')}</textarea>
        </fieldset>
      </form>

      <div class="actions">
        <span class="status" aria-live="polite">${exists ? 'Kayıtlı. Değişiklikler otomatik kaydedilir.' : 'Hiçbir soru zorunlu değil. Yanıtların otomatik kaydedilir.'}</span>
        <span class="spacer"></span>
        <span id="delWrap">${exists ? `<button type="button" class="linkbtn" id="delDaily">Bu günün kaydını sil</button>` : ''}</span>
        <a class="btn" href="#/">Tamam</a>
      </div>
      <p class="small" style="margin-top:22px"><a href="#/gecmis">Geçmiş günlük kayıtlar →</a></p>`;

    return {
      html, title: 'Günlük kontrol',
      bind(root) {
        const form = $('#dailyForm', root);
        const doSave = () => {
          const fd = new FormData(form);
          const rec = {
            q1: oneOf(fd.get('q1'), ['evet', 'hayir']),
            q2: oneOf(fd.get('q2'), ['evet', 'hayir', 'gerekmedi']),
            q3: oneOf(fd.get('q3'), ['evet', 'hayir']),
            q4: String(fd.get('q4') || '').trim(),
            updatedAt: new Date().toISOString()
          };
          if (hasDaily(rec)) data.daily[key] = rec; else delete data.daily[key];
          setStatus(root, savedText(save()));
          const wrap = $('#delWrap', root);
          if (wrap && hasDaily(rec) && !$('#delDaily', root) && !$('.confirm', wrap)) {
            wrap.innerHTML = `<button type="button" class="linkbtn" id="delDaily">Bu günün kaydını sil</button>`;
            bindDelete();
          }
        };
        form.addEventListener('change', (e) => { if (e.target.type === 'radio') { flush(); doSave(); } });
        form.addEventListener('input', (e) => { if (e.target.name === 'q4') schedule(doSave, 500); });
        $('#q4', root).addEventListener('blur', flush);

        $('#dsel', root).addEventListener('change', (e) => {
          const v = e.target.value;
          if (isDateKey(v) && v <= tk) location.hash = v === tk ? '#/gunluk' : '#/gunluk/' + v;
        });

        function bindDelete() {
          const btn = $('#delDaily', root);
          if (!btn) return;
          btn.addEventListener('click', () => inlineConfirm(btn, 'Bu günün kaydı silinsin mi?', 'Sil', () => {
            if (pending) { clearTimeout(pending.timer); pending = null; }
            delete data.daily[key];
            save();
            route();
          }));
        }
        bindDelete();
      }
    };
  }

  // ---- Günlük kayıtlar (geçmiş) -------------------------------------------
  function viewHistory() {
    const keys = Object.keys(data.daily).filter((k) => hasDaily(data.daily[k])).sort().reverse();
    const label = (q, v) => (q.opts.find((o) => o[0] === v) || [, '—'])[1];
    let body = '';
    if (!keys.length) {
      body = `<p class="muted">Henüz günlük kayıt yok. <a href="#/gunluk">Bugünkü kontrolü yap</a></p>`;
    } else {
      let lastMonth = '';
      for (const k of keys) {
        const mk = k.slice(0, 7);
        if (mk !== lastMonth) {
          if (lastMonth) body += '</ul>';
          body += `<h3 class="month-group">${esc(fmtMonth(mk))}</h3><ul class="list">`;
          lastMonth = mk;
        }
        const d = data.daily[k];
        body += `<li><a class="row-link" href="#/gunluk/${k}">
          <span class="row-title">${esc(fmtDmw(k))}</span>
          <span class="tags">${DAILY_Q.map((q) => `<span>${esc(q.short)}: ${esc(label(q, d[q.id]))}</span>`).join('')}</span>
          ${d.q4 && d.q4.trim() ? `<span class="row-meta">${esc(d.q4.trim().length > 140 ? d.q4.trim().slice(0, 140) + '…' : d.q4.trim())}</span>` : ''}
        </a></li>`;
      }
      body += '</ul>';
    }
    const html = `
      ${back('#/', 'Ana sayfa')}
      <div class="page-head"><h1>Günlük kayıtlar</h1><p>Bir güne dokunarak kaydı görüntüleyebilir veya düzenleyebilirsin.</p></div>
      <section class="panel">${body}</section>`;
    return { html, title: 'Günlük kayıtlar' };
  }

  // ---- Haftalık ------------------------------------------------------------
  function viewWeek(key) {
    const tk = todayKey();
    const cur = weekKey(new Date());
    const w = data.weekly[key] || { a1: '', a2: '', a3: '', goals: [], sessions: [] };
    const days = weekDays(key);
    const allowedDays = days.filter((k) => k <= tk);
    const defaultDay = allowedDays.indexOf(tk) >= 0 ? tk : allowedDays[allowedDays.length - 1];
    const stats = dailyStats(days);
    const sessions = w.sessions.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
    const marks = Array.from({ length: Math.max(WEEKLY_SESSION_TARGET, sessions.length) }, (_, i) => `<i class="${i < sessions.length ? 'on' : ''}"></i>`).join('');
    const isSunday = new Date().getDay() === 0;

    const pastWeeks = Object.keys(data.weekly).filter((k) => k !== key).sort().reverse();
    const projectOpts = data.projects.filter((p) => p.status !== 'tamam');

    const html = `
      ${back('#/', 'Ana sayfa')}
      <div class="page-head"><h1>Haftalık değerlendirme</h1></div>
      <div class="period">
        <a href="#/hafta/${shiftWeek(key, -1)}">‹ Önceki hafta</a>
        <span class="label">${esc(fmtWeek(key))}${key === cur ? '<br><span class="muted small">bu hafta</span>' : ''}</span>
        ${key < cur ? `<a href="#/hafta${shiftWeek(key, 1) === cur ? '' : '/' + shiftWeek(key, 1)}">Sonraki hafta ›</a>` : `<span class="off">Sonraki hafta ›</span>`}
      </div>

      <section class="panel" id="sessionsPanel">
        <h2>Kendi projelerime zaman</h2>
        <p class="muted small">Hedef: haftada en az iki kez, 45 dakika.</p>
        <p><span class="marks" aria-hidden="true">${marks}</span>Bu hafta: ${sessions.length} / ${WEEKLY_SESSION_TARGET}</p>
        ${sessions.length ? `<ul class="checklist">${sessions.map((s) => `
          <li><span class="meta">${esc(fmtShort(s.date))}</span><span style="flex:1;overflow-wrap:anywhere">45 dk${s.note ? ' — ' + esc(s.note) : ''}</span>
          <button type="button" class="linkbtn" data-del-session="${esc(s.id)}" aria-label="Çalışmayı kaldır">Kaldır</button></li>`).join('')}</ul>` : ''}
        ${allowedDays.length ? `
        <form class="inline-form" id="sessionForm" autocomplete="off">
          <select name="date" aria-label="Gün">${allowedDays.map((k) => `<option value="${k}" ${k === defaultDay ? 'selected' : ''}>${esc(fmtDmw(k))}</option>`).join('')}</select>
          <input type="text" name="note" maxlength="140" placeholder="Ne üzerinde çalıştın? (isteğe bağlı)" list="projectNames">
          <datalist id="projectNames">${projectOpts.map((p) => `<option value="${esc(p.name)}">`).join('')}</datalist>
          <button type="submit" class="btn">45 dk ekle</button>
        </form>` : `<p class="muted small">Bu hafta henüz başlamadı.</p>`}
      </section>

      <section class="panel" id="goalsPanel">
        <h2>Haftalık çalışma hedeflerim</h2>
        ${w.goals.length ? `<ul class="checklist">${w.goals.map((g) => `
          <li><label><input type="checkbox" data-goal="${esc(g.id)}" ${g.done ? 'checked' : ''}><span class="${g.done ? 'done-text' : ''}">${esc(g.text)}</span></label>
          <button type="button" class="linkbtn" data-del-goal="${esc(g.id)}" aria-label="Hedefi sil">Sil</button></li>`).join('')}</ul>`
          : `<p class="muted small">Bu hafta için henüz hedef yok.</p>`}
        <form class="inline-form" id="goalForm" autocomplete="off">
          <input type="text" name="goal" maxlength="160" placeholder="Yeni hedef (ör. iki şarkının demosunu bitir)" aria-label="Yeni hedef">
          <button type="submit" class="btn ghost">Ekle</button>
        </form>
      </section>

      <section class="panel">
        <h2>Değerlendirme</h2>
        ${isSunday && key === cur ? `<p class="muted small">Bugün pazar — haftayı değerlendirmek için iyi bir zaman.</p>` : `<p class="muted small">Pazar günü birkaç dakika ayırman yeterli.</p>`}
        <form id="weekForm" autocomplete="off" onsubmit="return false">
          ${WEEKLY_Q.map((q, i) => `
            <div class="field">
              <label for="wa${i + 1}">${i + 1}. ${esc(q)}</label>
              <textarea id="wa${i + 1}" name="a${i + 1}" rows="3">${esc(w['a' + (i + 1)] || '')}</textarea>
            </div>`).join('')}
        </form>
        <div class="actions" style="margin-top:0"><span class="status" aria-live="polite">${hasWeeklyReview(w) ? 'Kayıtlı. Değişiklikler otomatik kaydedilir.' : 'Yanıtların otomatik kaydedilir.'}</span></div>
      </section>

      <section class="panel">
        <h2>Haftanın gözlemleri</h2>
        <p class="muted small">Günlük kontrollerden derlenir. Yalnızca kayıt girilen günler sayılır.</p>
        ${obsList(stats, { daysLabel: 'Günlük kontrol yapılan gün', daysValue: `${stats.days} / 7` })}
        ${stats.notes.length ? `<h3 style="margin-top:18px">Kendi geleceğim için yaptıklarım</h3>
          <ul class="worklist">${stats.notes.map((n) => `<li><span class="when">${esc(fmtShort(n.date))}</span><span class="what">${esc(n.text)}</span></li>`).join('')}</ul>` : ''}
      </section>

      <section class="panel">
        <h2>Geçmiş haftalar</h2>
        ${pastWeeks.length ? `<ul class="list">${pastWeeks.map((k) => {
          const pw = data.weekly[k];
          const bits = [hasWeeklyReview(pw) ? 'değerlendirme yapıldı' : 'değerlendirme yok', `45 dk: ${pw.sessions.length}`];
          if (pw.goals.length) bits.push(`hedef: ${pw.goals.filter((g) => g.done).length}/${pw.goals.length}`);
          return `<li><a class="row-link" href="#/hafta/${k}"><span class="row-title">${esc(fmtWeek(k))}</span><span class="row-meta">${esc(bits.join(' · '))}</span></a></li>`;
        }).join('')}</ul>` : `<p class="muted small">Kayıtlı başka hafta yok.</p>`}
      </section>`;

    return {
      html, title: 'Haftalık',
      bind(root) {
        // Değerlendirme yanıtları
        const form = $('#weekForm', root);
        const doSave = () => {
          const ww = getWeek(key);
          for (let i = 1; i <= 3; i++) ww['a' + i] = $('#wa' + i, root).value;
          touchWeek(key);
          setStatus(form.parentElement, savedText(save()));
        };
        form.addEventListener('input', () => schedule(doSave, 500));
        $$('textarea', form).forEach((t) => t.addEventListener('blur', flush));

        // 45 dk oturumları
        const sf = $('#sessionForm', root);
        if (sf) sf.addEventListener('submit', (e) => {
          e.preventDefault();
          flush();
          const date = sf.elements.date.value;
          if (!isDateKey(date) || days.indexOf(date) < 0 || date > todayKey()) return;
          getWeek(key).sessions.push({ id: uid(), date, note: sf.elements.note.value.trim() });
          touchWeek(key); save(); rerender('#sessionsPanel');
        });
        $$('[data-del-session]', root).forEach((b) => b.addEventListener('click', () => {
          flush();
          const ww = getWeek(key);
          ww.sessions = ww.sessions.filter((s) => s.id !== b.dataset.delSession);
          touchWeek(key); save(); rerender('#sessionsPanel');
        }));

        // Hedefler
        $('#goalForm', root).addEventListener('submit', (e) => {
          e.preventDefault();
          flush();
          const input = e.target.elements.goal;
          const text = input.value.trim();
          if (!text) { input.focus(); return; }
          getWeek(key).goals.push({ id: uid(), text, done: false });
          touchWeek(key); save(); rerender('#goalForm input');
        });
        $$('[data-goal]', root).forEach((cb) => cb.addEventListener('change', () => {
          flush();
          const g = getWeek(key).goals.find((x) => x.id === cb.dataset.goal);
          if (g) g.done = cb.checked;
          touchWeek(key); save();
          cb.nextElementSibling.className = cb.checked ? 'done-text' : '';
        }));
        $$('[data-del-goal]', root).forEach((b) => b.addEventListener('click', () => {
          flush();
          const ww = getWeek(key);
          ww.goals = ww.goals.filter((g) => g.id !== b.dataset.delGoal);
          touchWeek(key); save(); rerender('#goalsPanel');
        }));
      }
    };
  }

  // ---- Aylık ---------------------------------------------------------------
  function viewMonth(key) {
    const cur = monthKey(new Date());
    const m = data.monthly[key] || {};
    const st = monthStats(key);

    // Karşılaştırılabilecek aylar: değerlendirmesi ya da kaydı olan diğer aylar
    const months = new Set(Object.keys(data.monthly));
    Object.keys(data.daily).forEach((k) => months.add(k.slice(0, 7)));
    allSessions().forEach((s) => months.add(s.date.slice(0, 7)));
    months.delete(key);
    const cmpOptions = Array.from(months).filter((k) => k <= cur).sort().reverse();
    const prev = shiftMonth(key, -1);
    const defaultCmp = cmpOptions.indexOf(prev) >= 0 ? prev : (cmpOptions[0] || '');

    const pastMonths = Object.keys(data.monthly).filter((k) => k !== key).sort().reverse();

    const html = `
      ${back('#/', 'Ana sayfa')}
      <div class="page-head"><h1>Aylık değerlendirme</h1></div>
      <div class="period">
        <a href="#/ay/${shiftMonth(key, -1)}">‹ Önceki ay</a>
        <span class="label">${esc(fmtMonth(key))}${key === cur ? '<br><span class="muted small">bu ay</span>' : ''}</span>
        ${key < cur ? `<a href="#/ay${shiftMonth(key, 1) === cur ? '' : '/' + shiftMonth(key, 1)}">Sonraki ay ›</a>` : `<span class="off">Sonraki ay ›</span>`}
      </div>

      <section class="panel">
        <form id="monthForm" autocomplete="off" onsubmit="return false">
          ${MONTHLY_Q.map((q, i) => `
            <div class="field">
              <label for="ma${i + 1}">${i + 1}. ${esc(q)}</label>
              <textarea id="ma${i + 1}" name="a${i + 1}" rows="3">${esc(m['a' + (i + 1)] || '')}</textarea>
            </div>`).join('')}
        </form>
        <div class="actions" style="margin-top:0"><span class="status" aria-live="polite">${hasMonthly(m) ? 'Kayıtlı. Değişiklikler otomatik kaydedilir.' : 'Yanıtların otomatik kaydedilir.'}</span></div>
      </section>

      <section class="panel">
        <h2>Ayın gözlemleri</h2>
        <p class="muted small">Günlük kontroller, haftalık çalışmalar ve projelerden derlenir.</p>
        ${obsList(st, {
          daysLabel: 'Günlük kontrol yapılan gün', daysValue: st.days,
          extra: [['Kendi projelerime 45 dk çalışma', st.sessions], ['Tamamlanan proje', st.completed.length]]
        })}
        ${st.completed.length ? `<p class="small muted" style="margin-top:10px">Tamamlananlar: ${st.completed.map((p) => esc(p.name)).join(', ')}</p>` : ''}
      </section>

      <section class="panel">
        <h2>Geçmiş aylarla karşılaştır</h2>
        ${cmpOptions.length ? `
          <div class="datebar">
            <label class="muted small" for="cmpSel">Karşılaştırılacak ay:</label>
            <select id="cmpSel" style="max-width:240px">${cmpOptions.map((k) => `<option value="${k}" ${k === defaultCmp ? 'selected' : ''}>${esc(fmtMonth(k))}</option>`).join('')}</select>
          </div>
          <div id="cmpOut" class="cmp"></div>`
          : `<p class="muted small">Karşılaştırma için başka bir ayda kayıt bulunmuyor.</p>`}
      </section>

      <section class="panel">
        <h2>Geçmiş aylık değerlendirmeler</h2>
        ${pastMonths.length ? `<ul class="list">${pastMonths.map((k) => `<li><a class="row-link" href="#/ay/${k}"><span class="row-title">${esc(fmtMonth(k))}</span></a></li>`).join('')}</ul>`
          : `<p class="muted small">Kayıtlı başka aylık değerlendirme yok.</p>`}
      </section>`;

    function renderCompare(root, other) {
      const out = $('#cmpOut', root);
      if (!out || !other) return;
      const a = data.monthly[key] || {}, b = data.monthly[other] || {};
      const sa = monthStats(key), sb = monthStats(other);
      const cell = (label, v) => `<div class="cmp-cell ${v === '' ? 'empty' : ''}"><small>${esc(label)}</small>${v === '' ? '—' : esc(v)}</div>`;
      const la = fmtMonth(key), lb = fmtMonth(other);
      let html = MONTHLY_Q.map((q, i) => `
        <p class="cmp-q">${i + 1}. ${esc(q)}</p>
        <div class="cmp-row">${cell(lb, (b['a' + (i + 1)] || '').trim())}${cell(la, (a['a' + (i + 1)] || '').trim())}</div>`).join('');
      const nums = [
        ['Günlük kontrol yapılan gün', sa.days, sb.days],
        ['Bana ait olmayan sorumluluk üstlendiğim gün', sa.q1, sb.q1],
        ['Sınırımı koruduğum gün', sa.q2evet, sb.q2evet],
        ['Kişisel mesele hâline getirdiğim gün', sa.q3, sb.q3],
        ['Projelerime 45 dk çalışma', sa.sessions, sb.sessions],
        ['Tamamlanan proje', sa.completed.length, sb.completed.length]
      ];
      html += `<p class="cmp-q">Gözlemler</p>
        <ul class="obs"><li><span></span><span class="muted small">${esc(lb)} · ${esc(la)}</span></li>
        ${nums.map(([l, x, y]) => `<li><span>${esc(l)}</span><span>${y} · ${x}</span></li>`).join('')}</ul>`;
      out.innerHTML = html;
    }

    return {
      html, title: 'Aylık',
      bind(root) {
        const form = $('#monthForm', root);
        const doSave = () => {
          const rec = { updatedAt: new Date().toISOString() };
          for (let i = 1; i <= 5; i++) rec['a' + i] = $('#ma' + i, root).value;
          if (hasMonthly(rec)) data.monthly[key] = rec; else delete data.monthly[key];
          setStatus(form.parentElement, savedText(save()));
          const sel = $('#cmpSel', root);
          if (sel) renderCompare(root, sel.value);
        };
        form.addEventListener('input', () => schedule(doSave, 500));
        $$('textarea', form).forEach((t) => t.addEventListener('blur', flush));
        const sel = $('#cmpSel', root);
        if (sel) {
          sel.addEventListener('change', () => renderCompare(root, sel.value));
          renderCompare(root, sel.value);
        }
      }
    };
  }

  // ---- Projeler --------------------------------------------------------------
  function projectSort(a, b) {
    const s = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (s) return s;
    if (a.due && b.due && a.due !== b.due) return a.due < b.due ? -1 : 1;
    if (a.due && !b.due) return -1;
    if (!a.due && b.due) return 1;
    return a.name.localeCompare(b.name, 'tr');
  }

  function viewProjects() {
    const list = data.projects.slice().sort(projectSort);
    const html = `
      ${back('#/', 'Ana sayfa')}
      <div class="page-head" style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">
        <div><h1>Kendi projelerim</h1><p>Müziğim, albümlerim, kitaplarım, eğitim çalışmalarım ve diğerleri.</p></div>
        <a class="btn" href="#/projeler/yeni">Yeni proje</a>
      </div>
      <section class="panel">
        ${list.length ? list.map((p) => `
          <article class="project ${p.status === 'tamam' ? 'is-done' : ''}">
            <div class="project-head">
              <h3>${esc(p.name)}</h3>
              <span class="pill ${p.status}">${STATUS[p.status]}</span>
            </div>
            ${p.desc ? `<p class="muted">${esc(p.desc)}</p>` : ''}
            ${p.next && p.status !== 'tamam' ? `<p class="next"><b>Sonraki adım:</b> ${esc(p.next)}</p>` : ''}
            ${p.due ? `<p class="muted small">Hedef tarih: ${esc(fmtDmy(p.due))}</p>` : ''}
            <p style="margin-top:8px"><a class="small" href="#/projeler/${esc(p.id)}">Düzenle</a></p>
          </article>`).join('')
          : `<p class="muted">Henüz proje eklenmedi.</p><a class="btn ghost" href="#/projeler/yeni">İlk projeni ekle</a>`}
      </section>`;
    return { html, title: 'Projeler' };
  }

  function viewProjectForm(id) {
    const isNew = id === 'yeni';
    const p = isNew ? { name: '', desc: '', next: '', due: '', status: 'baslamadi' } : data.projects.find((x) => x.id === id);
    if (!p) {
      return { html: `${back('#/projeler', 'Projeler')}<p class="muted">Bu proje bulunamadı. Silinmiş olabilir.</p>`, title: 'Proje' };
    }
    const html = `
      ${back('#/projeler', 'Projeler')}
      <div class="page-head"><h1>${isNew ? 'Yeni proje' : 'Projeyi düzenle'}</h1></div>
      <form id="projectForm" class="panel" autocomplete="off" novalidate>
        <div class="field">
          <label for="pname">Proje adı</label>
          <input type="text" id="pname" name="name" maxlength="120" value="${esc(p.name)}" required>
          <div class="hint" id="nameHint" hidden>Proje adı gerekli.</div>
        </div>
        <div class="field">
          <label for="pdesc">Kısa açıklama</label>
          <textarea id="pdesc" name="desc" rows="2" maxlength="400">${esc(p.desc)}</textarea>
        </div>
        <div class="field">
          <label for="pnext">Bir sonraki somut adım</label>
          <input type="text" id="pnext" name="next" maxlength="200" value="${esc(p.next)}">
        </div>
        <div class="field">
          <label for="pdue">Hedef tarih <span class="muted small">(isteğe bağlı)</span></label>
          <input type="date" id="pdue" name="due" value="${esc(p.due)}">
        </div>
        <fieldset class="field">
          <legend class="label" style="font-family:var(--serif);font-size:1.08rem;margin-bottom:10px">Durum</legend>
          <div class="seg">
            ${Object.entries(STATUS).map(([v, l]) => `<label><input type="radio" name="status" value="${v}" ${p.status === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}
          </div>
        </fieldset>
        <div class="actions">
          <button type="submit" class="btn">Kaydet</button>
          <a class="btn ghost" href="#/projeler">Vazgeç</a>
          <span class="spacer"></span>
          ${isNew ? '' : `<button type="button" class="linkbtn" id="delProject">Projeyi sil</button>`}
        </div>
      </form>`;

    return {
      html, title: isNew ? 'Yeni proje' : 'Projeyi düzenle',
      bind(root) {
        const form = $('#projectForm', root);
        if (isNew) $('#pname', root).focus();
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const f = form.elements;
          const name = f.name.value.trim();
          if (!name) { $('#nameHint', root).hidden = false; f.name.focus(); return; }
          const status = STATUS[f.status.value] ? f.status.value : 'baslamadi';
          const now = new Date().toISOString();
          const vals = { name, desc: f.desc.value.trim(), next: f.next.value.trim(), due: isDateKey(f.due.value) ? f.due.value : '', status };
          if (isNew) {
            data.projects.push(Object.assign({ id: uid(), createdAt: now, updatedAt: now, completedAt: status === 'tamam' ? now : '' }, vals));
          } else {
            const target = data.projects.find((x) => x.id === id);
            if (!target) return;
            if (status === 'tamam' && target.status !== 'tamam') target.completedAt = now;
            if (status !== 'tamam') target.completedAt = '';
            Object.assign(target, vals, { updatedAt: now });
          }
          save();
          location.hash = '#/projeler';
        });
        const del = $('#delProject', root);
        if (del) del.addEventListener('click', () => inlineConfirm(del, 'Bu proje kalıcı olarak silinsin mi?', 'Sil', () => {
          data.projects = data.projects.filter((x) => x.id !== id);
          save();
          location.hash = '#/projeler';
        }));
      }
    };
  }

  // ---- Kartlar ---------------------------------------------------------------
  const cardHTML = (c) => `
    <article class="kcard">
      <div class="kcard-top">KART ${c.n} — ${esc(c.tag)}</div>
      <div><p class="kcard-l1">${esc(c.l1)}</p><p class="kcard-l2">${esc(c.l2)}</p></div>
      <div class="kcard-foot">KENDİ YOLUM</div>
    </article>`;
  const printCardHTML = (c) => `
    <section class="pcard">
      <div class="pcard-top">KART ${c.n} — ${esc(c.tag)}</div>
      <div><p class="pcard-l1">${esc(c.l1)}</p><p class="pcard-l2">${esc(c.l2)}</p></div>
      <div class="pcard-foot">KENDİ YOLUM</div>
    </section>`;

  const PRINT_HINT = `<p class="muted small">Yazdırma penceresinde hedef olarak <strong>“PDF olarak kaydet”</strong> seçeneğini kullanabilirsin. Kartlar 148 × 105 mm (A6) boyutundadır; her A4 sayfaya iki kart sığar, çerçeve çizgisinden kesilebilir. En iyi sonuç için “Kenar boşlukları: Varsayılan”, “Ölçek: %100” seç.</p>`;

  function viewCards() {
    const html = `
      ${back('#/', 'Ana sayfa')}
      <div class="page-head" style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">
        <div><h1>Kişisel kartlar</h1><p>Tek tek görüntülemek için bir karta dokun.</p></div>
        <button type="button" class="btn" id="printAll">Tümünü yazdır / PDF</button>
      </div>
      <div class="cards-grid">
        ${CARDS.map((c) => `<a href="#/kartlar/${c.n}" aria-label="Kart ${c.n}: ${esc(c.tag)}">${cardHTML(c)}</a>`).join('')}
      </div>
      <div style="margin-top:20px">${PRINT_HINT}</div>`;
    return {
      html, title: 'Kartlar', print: CARDS,
      bind(root) { $('#printAll', root).addEventListener('click', () => window.print()); }
    };
  }

  function viewCard(n) {
    const c = CARDS[n - 1];
    const prev = n > 1 ? n - 1 : CARDS.length, next = n < CARDS.length ? n + 1 : 1;
    const html = `
      ${back('#/kartlar', 'Tüm kartlar')}
      <div class="card-single">${cardHTML(c)}</div>
      <div class="period" style="max-width:620px;margin:0 auto 20px">
        <a href="#/kartlar/${prev}">‹ Kart ${prev}</a>
        <span class="label small muted">${n} / ${CARDS.length}</span>
        <a href="#/kartlar/${next}">Kart ${next} ›</a>
      </div>
      <div style="max-width:620px;margin:0 auto;text-align:center">
        <button type="button" class="btn" id="printOne">Bu kartı yazdır / PDF</button>
        <div style="margin-top:16px;text-align:left">${PRINT_HINT}</div>
      </div>`;
    return {
      html, title: `Kart ${n}`, print: [c],
      bind(root) { $('#printOne', root).addEventListener('click', () => window.print()); }
    };
  }

  // ---- Yedekleme -----------------------------------------------------------
  function counts(d) {
    return {
      daily: Object.keys(d.daily).length,
      weekly: Object.keys(d.weekly).length,
      monthly: Object.keys(d.monthly).length,
      projects: d.projects.length
    };
  }
  const countsText = (c) => `${c.daily} günlük kayıt, ${c.weekly} hafta, ${c.monthly} aylık değerlendirme, ${c.projects} proje`;

  function viewBackup() {
    const c = counts(data);
    const html = `
      ${back('#/', 'Ana sayfa')}
      <div class="page-head"><h1>Yedekleme</h1><p>Kayıtların yalnızca bu tarayıcıda saklanır. Tarayıcı verilerini silersen ya da başka bir cihaza geçersen yedek dosyası ile geri yükleyebilirsin.</p></div>

      <section class="panel">
        <h2>Yedek al</h2>
        <p class="muted small">Şu anki veriler: ${esc(countsText(c))}.</p>
        <div class="actions" style="margin-top:0">
          <button type="button" class="btn" id="exportBtn">JSON olarak indir</button>
          <button type="button" class="btn ghost" id="shareBtn" hidden>Paylaş / Dosyalara kaydet</button>
        </div>
        <p class="status small" id="exportStatus" aria-live="polite" style="margin:10px 0 0"></p>
      </section>

      <section class="panel">
        <h2>Yedekten geri yükle</h2>
        <p class="muted small">Seçtiğin yedek, bu tarayıcıdaki <strong>tüm mevcut verilerin yerine</strong> geçer. Önce yedek almak iyi olur.</p>
        <input type="file" id="importFile" accept="application/json,.json">
        <div id="importPreview" style="margin-top:14px"></div>
      </section>

      <section class="panel">
        <h2>Telefonda kullanım</h2>
        <p class="muted small">Ana ekrana eklediğinde Kendi Yolum ayrı bir uygulama gibi açılır ve internet olmadan da çalışır.</p>
        <ul class="small" style="padding-left:1.2em;margin:0 0 10px">
          <li><strong>iPhone (Safari):</strong> Paylaş düğmesi → “Ana Ekrana Ekle”.</li>
          <li><strong>Android (Chrome):</strong> ⋮ menüsü → “Ana ekrana ekle” veya “Uygulamayı yükle”.</li>
        </ul>
        <p class="muted small" style="margin:0">Telefon ve bilgisayardaki kayıtlar birbirinden ayrıdır. Taşımak için bir cihazda yedek alıp diğerinde geri yükle.</p>
      </section>`;

    return {
      html, title: 'Yedekleme',
      bind(root) {
        const backupFile = () => {
          flush();
          const payload = Object.assign({}, data, { exportedAt: new Date().toISOString() });
          const name = `kendi-yolum-yedek-${todayKey()}.json`;
          return { name, blob: new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }) };
        };
        $('#exportBtn', root).addEventListener('click', () => {
          const { name, blob } = backupFile();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = name;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 2000);
          $('#exportStatus', root).textContent = `İndirildi: ${name}`;
        });

        // Telefonlarda paylaşım menüsü (Dosyalar, Drive, e-posta...) ile kaydetme
        const shareBtn = $('#shareBtn', root);
        let canShareFiles = false;
        try {
          canShareFiles = !!(navigator.canShare && navigator.canShare({ files: [new File(['{}'], 't.json', { type: 'application/json' })] }));
        } catch (e) { canShareFiles = false; }
        shareBtn.hidden = !canShareFiles;
        shareBtn.addEventListener('click', () => {
          const { name, blob } = backupFile();
          const file = new File([blob], name, { type: 'application/json' });
          navigator.share({ files: [file], title: 'Kendi Yolum yedeği' })
            .then(() => { $('#exportStatus', root).textContent = `Paylaşıldı: ${name}`; })
            .catch((err) => { if (err && err.name !== 'AbortError') $('#exportStatus', root).textContent = 'Paylaşım yapılamadı; “JSON olarak indir” düğmesini dene.'; });
        });

        const fileInput = $('#importFile', root);
        const preview = $('#importPreview', root);
        fileInput.addEventListener('change', () => {
          const file = fileInput.files && fileInput.files[0];
          preview.innerHTML = '';
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            let parsed;
            try { parsed = JSON.parse(String(reader.result)); } catch (e) { parsed = null; }
            if (!looksLikeBackup(parsed)) {
              preview.innerHTML = `<div class="notice warn" style="margin:0">Bu dosya bir Kendi Yolum yedeği gibi görünmüyor. Hiçbir şey değiştirilmedi.</div>`;
              return;
            }
            const incoming = normalize(parsed);
            const ic = counts(incoming);
            preview.innerHTML = `
              <p>Yedek içeriği: ${esc(countsText(ic))}${parsed.exportedAt && !isNaN(new Date(parsed.exportedAt)) ? ` · alınma tarihi ${esc(F.dmy.format(new Date(parsed.exportedAt)))}` : ''}.</p>
              <div class="actions" style="margin-top:8px">
                <button type="button" class="btn" id="doImport">Geri yükle</button>
                <button type="button" class="btn ghost" id="cancelImport">Vazgeç</button>
              </div>`;
            $('#cancelImport', preview).addEventListener('click', () => { preview.innerHTML = ''; fileInput.value = ''; });
            $('#doImport', preview).addEventListener('click', () => {
              data = incoming;
              const ok = save();
              route();
              const p = $('#importPreview');
              if (p) p.innerHTML = `<div class="notice" style="margin:0">${ok ? 'Yedek geri yüklendi.' : 'Yedek yüklendi ama tarayıcı depolamasına yazılamadı.'} ${esc(countsText(counts(data)))}.</div>`;
            });
          };
          reader.onerror = () => { preview.innerHTML = `<div class="notice warn" style="margin:0">Dosya okunamadı.</div>`; };
          reader.readAsText(file);
        });
      }
    };
  }

  // ---------------------------------------------------------------------------
  // Yönlendirme (hash tabanlı; tarayıcının geri/ileri tuşlarıyla çalışır)
  // ---------------------------------------------------------------------------
  const main = $('#main');
  let currentView = null;

  function resolve(parts) {
    const [a, b] = parts;
    switch (a) {
      case undefined: return viewHome();
      case 'ilkeler': {
        const n = Number(b);
        return viewPrinciples(n >= 1 && n <= 5 ? n : 0);
      }
      case 'gunluk': {
        if (b === undefined) return viewDaily(todayKey());
        if (isDateKey(b) && b <= todayKey()) return viewDaily(b);
        return null;
      }
      case 'gecmis': return viewHistory();
      case 'hafta': {
        if (b === undefined) return viewWeek(weekKey(new Date()));
        if (isWeekKey(b) && b <= weekKey(new Date())) return viewWeek(weekKey(weekStart(b)));
        return null;
      }
      case 'ay': {
        if (b === undefined) return viewMonth(monthKey(new Date()));
        if (isMonthKey(b) && b <= monthKey(new Date())) return viewMonth(b);
        return null;
      }
      case 'projeler': return b === undefined ? viewProjects() : viewProjectForm(b);
      case 'kartlar': {
        if (b === undefined) return viewCards();
        const n = Number(b);
        return n >= 1 && n <= CARDS.length ? viewCard(n) : null;
      }
      case 'yedek': return viewBackup();
      default: return null;
    }
  }

  function route() {
    flush();
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map((p) => { try { return decodeURIComponent(p); } catch (e) { return p; } });
    const view = resolve(parts);
    if (!view) { location.replace('#/'); return; }
    currentView = { parts, view };
    main.innerHTML = view.html;
    if (view.bind) view.bind(main);
    document.title = view.title ? `${view.title} · Kendi Yolum` : 'Kendi Yolum';

    // Menüde etkin bölüm
    const section = parts[0] === 'gecmis' ? 'gunluk' : (parts[0] || '');
    $$('#nav a').forEach((a) => {
      if (a.dataset.nav === section) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    // Yazdırma alanı (yalnızca kart sayfalarında dolu)
    const pa = $('#print-area');
    pa.innerHTML = view.print ? view.print.map(printCardHTML).join('') : '';
    document.body.classList.toggle('has-print', !!view.print);

    closeMenu();
    if (!view.keepScroll) window.scrollTo(0, 0);
    if (!document.activeElement || document.activeElement === document.body) main.focus({ preventScroll: true });
  }

  // Aynı sayfayı yeniden çizip odağı istenen öğeye taşır (ekleme/silme sonrası).
  function rerender(focusSel) {
    const y = window.scrollY;
    const view = resolve(currentView.parts);
    if (!view) return route();
    currentView.view = view;
    main.innerHTML = view.html;
    if (view.bind) view.bind(main);
    window.scrollTo(0, y);
    const el = focusSel && $(focusSel, main);
    if (el) {
      const target = el.matches('input, button, select, textarea, a') ? el : $('input, button, select', el) || el;
      target.focus({ preventScroll: true });
    }
  }

  // ---- Menü (mobil) ----------------------------------------------------------
  const menuBtn = $('#menuBtn');
  const nav = $('#nav');
  function closeMenu() { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  menuBtn.addEventListener('click', () => {
    const open = !nav.classList.contains('open');
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('open') && !nav.contains(e.target) && e.target !== menuBtn) closeMenu();
  });

  // Sayfa kapanırken bekleyen yazıyı kaydet
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });

  // Başka sekmede değişiklik olursa güncel veriyi al
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    try { data = normalize(JSON.parse(e.newValue || 'null')); } catch (err) { return; }
    const ae = document.activeElement;
    if (!(ae && (ae.tagName === 'TEXTAREA' || ae.tagName === 'INPUT'))) rerender();
  });

  window.addEventListener('hashchange', route);
  load();
  route();

  // Telefonda: internetsiz açılma ve kayıtların tarayıcı tarafından silinmemesi
  if (/^https?:$/.test(location.protocol)) {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
    }
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persisted().then((p) => (p ? p : navigator.storage.persist())).catch(() => {});
    }
  }
})();
