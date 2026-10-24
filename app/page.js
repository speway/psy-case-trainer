"use client";

import React, { useState, useEffect, useMemo } from "react";
import { sources } from "./data/sources";
import { cases } from "./data/cases";
import { benchmarks } from "./data/benchmarks";

const kartaSteps = [
  {
    letter: "К",
    title: "Контекст и факты",
    text: "Что известно буквально, от кого получены сведения и чего мы пока не знаем?",
  },
  {
    letter: "А",
    title: "Альтернативы",
    text: "Какие 2–4 рабочие гипотезы объясняют данные и чем их можно различить?",
  },
  {
    letter: "Р",
    title: "Риски и ресурсы",
    text: "Есть ли угроза жизни, насилие, риск синдрома отмены, психоз, люди в уязвимом положении и доступная поддержка?",
  },
  {
    letter: "Т",
    title: "Терапевтическая рамка",
    text: "Кто клиент, в чём запрос, каковы границы конфиденциальности и вашей компетентности?",
  },
  {
    letter: "А",
    title: "Алгоритм действий",
    text: "Что делать сначала, что после оценки и по каким признакам менять маршрут помощи?",
  },
];

const guideTips = [
  "Пишите «данные могут указывать на…», а не «у клиента точно…» — гипотеза должна оставаться проверяемой.",
  "Если в кейсе есть фраза о смерти, самоповреждении или насилии, общая формулировка «оценить риск» слишком пустая: перечислите прямые вопросы.",
  "Сначала безопасность и рамка, потом техника. Профессионализм часто виден именно по порядку действий.",
  "Отдельно выписывайте слова клиента, наблюдения специалиста и сообщения третьих лиц — это данные разной надёжности.",
  "Хороший план содержит развилки: «если риск непосредственный — …; если риск неострый — …».",
  "Не обещайте результат метода и не называйте перенаправление отказом: это часть ответственной помощи.",
];

function BrandMark() {
  return (
    <span className="brand">
      <span className="brand-mark">Ψ</span>
      <span>
        <b>ТРЕНАЖЁР ДЛЯ ПСИХОЛОГОВ</b>
        <small>ПРАКТИКУМ РЕШЕНИЯ КЕЙСОВ</small>
      </span>
    </span>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8h10m0 0L8.5 3.5M13 8l-4.5 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getCaseSources(c) {
  if (!c || !c.sourceIds) return [];
  return c.sourceIds.map((id) => sources.find((s) => s.id === id)).filter(Boolean);
}

export default function Page() {
  // Navigation
  const [tab, setTab] = useState("home");
  const [currentCaseId, setCurrentCaseId] = useState(cases[0].id);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState(Array(cases[0].questions.length).fill(""));
  const [evaluation, setEvaluation] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [hasDraft, setHasDraft] = useState(false);

  // Catalog Filters
  const [selectedDirection, setSelectedDirection] = useState("all"); // 'all' | 'org' | 'clin'
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [searchQuery, setSearchQuery] = useState("");

  // Practice state
  const [isContextDrawerOpen, setIsContextDrawerOpen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(1500); // 25 min default
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [toast, setToast] = useState(null);

  // Sources Filter
  const [sourceLang, setSourceLang] = useState("all");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const currentCase = useMemo(() => {
    return cases.find((c) => c.id === currentCaseId) ?? cases[0];
  }, [currentCaseId]);

  const currentBenchmark = benchmarks[currentCase.id];

  const orgCount = useMemo(() => cases.filter((c) => c.direction.includes("Организационн")).length, []);
  const clinCount = useMemo(() => cases.filter((c) => !c.direction.includes("Организационн")).length, []);

  const platformStats = useMemo(() => {
    const counts = cases.map((c) => c.questions.length);
    return {
      cases: cases.length,
      topics: Object.keys(benchmarks).length,
      sources: sources.length,
      methodSteps: kartaSteps.length,
      totalQuestions: counts.reduce((sum, n) => sum + n, 0),
      questionsPerCase:
        Math.min(...counts) === Math.max(...counts)
          ? String(counts[0])
          : `${Math.min(...counts)}–${Math.max(...counts)}`,
    };
  }, []);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored =
        localStorage.getItem("psy-trainer-attempts-v2") ||
        localStorage.getItem("psy-trainer-attempts");
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setAttempts(
          parsed
            .filter((e) => typeof e.score === "number")
            .map((e) => ({
              id: e.id ?? Date.now(),
              caseId: e.caseId ?? cases[0].id,
              caseTitle: e.caseTitle ?? cases[0].title,
              score: e.score ?? 0,
              passed: !!e.passed,
              date: e.date ?? "Ранее",
              dimensions: e.dimensions ?? [],
            }))
        );
      }
    } catch {}
  }, []);

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [tab, currentStep, currentCaseId]);

  // Sync draft existence
  useEffect(() => {
    try {
      const draft = localStorage.getItem(`psy-trainer-draft-${currentCase.id}`);
      setHasDraft(!!draft);
    } catch {
      setHasDraft(false);
    }
  }, [currentCase.id, tab]);

  // Auto-save draft in practice
  useEffect(() => {
    if (tab === "practice" && answers.some((e) => e && e.trim().length > 0)) {
      try {
        localStorage.setItem(
          `psy-trainer-draft-${currentCase.id}`,
          JSON.stringify({
            answers,
            currentStep,
            savedAt: Date.now(),
          })
        );
        setHasDraft(true);
      } catch {}
    }
  }, [answers, currentStep, currentCase.id, tab]);

  // Timer interval
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && tab === "practice") {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, tab]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Best attempts map
  const bestAttempts = useMemo(() => {
    const map = new Map();
    attempts.forEach((att) => {
      const existing = map.get(att.caseId);
      if (!existing || att.score > existing.score) map.set(att.caseId, att);
    });
    return map;
  }, [attempts]);

  // Solved count
  const solvedCount = useMemo(() => {
    return new Set(attempts.filter((a) => a.passed).map((a) => a.caseId)).size;
  }, [attempts]);

  const bestScore = useMemo(() => {
    return attempts.reduce((max, a) => Math.max(max, a.score), 0);
  }, [attempts]);

  const topDimensions = useMemo(() => {
    const map = new Map();
    attempts.forEach((att) => {
      att.dimensions.forEach((d) => {
        const cur = map.get(d.name) ?? { score: 0, max: 0 };
        map.set(d.name, { score: cur.score + d.score, max: cur.max + d.max });
      });
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        percent: data.max > 0 ? Math.round((data.score / data.max) * 100) : 0,
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 8);
  }, [attempts]);

  // Weakest dimension
  const weakestDimension = useMemo(() => {
    if (topDimensions.length === 0) return null;
    return [...topDimensions].sort((a, b) => a.percent - b.percent)[0];
  }, [topDimensions]);

  // URL Hash sync
  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (["home", "catalog", "case", "practice", "result", "profile", "guide", "knowledge", "sources"].includes(hash)) {
        setTab(hash);
      } else if (!hash) {
        setTab("home");
      }
    };
    syncHash();
    window.addEventListener("popstate", syncHash);
    return () => window.removeEventListener("popstate", syncHash);
  }, []);

  const navigateTo = (newTab) => {
    setTab(newTab);
    try {
      const hash = newTab === "home" ? "" : `#${newTab}`;
      window.history.pushState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
    } catch {}
  };

  // Open a case briefing
  const openCase = (caseId) => {
    setCurrentCaseId(caseId);
    setEvaluation(null);
    try {
      setHasDraft(!!localStorage.getItem(`psy-trainer-draft-${caseId}`));
    } catch {
      setHasDraft(false);
    }
    navigateTo("case");
  };

  // Start practicing a case
  const startPractice = (resumeDraft = false) => {
    if (resumeDraft) {
      try {
        const draft = localStorage.getItem(`psy-trainer-draft-${currentCase.id}`);
        if (draft) {
          const parsed = JSON.parse(draft);
          if (Array.isArray(parsed.answers) && parsed.answers.length === currentCase.questions.length) {
            setAnswers(parsed.answers);
            setCurrentStep(
              Math.min(Math.max(parsed.currentStep ?? 0, 0), currentCase.questions.length - 1)
            );
            setEvaluation(null);
            navigateTo("practice");
            return;
          }
        }
      } catch {}
    }
    setAnswers(Array(currentCase.questions.length).fill(""));
    setCurrentStep(0);
    setEvaluation(null);
    navigateTo("practice");
  };

  // Dynamic categories list
  const categoriesForDirection = useMemo(() => {
    let pool = cases;
    if (selectedDirection === "org") {
      pool = cases.filter((c) => c.direction.includes("Организационн"));
    } else if (selectedDirection === "clin") {
      pool = cases.filter((c) => !c.direction.includes("Организационн"));
    }
    const cats = Array.from(new Set(pool.map((c) => c.category))).filter(Boolean);
    return ["Все", ...cats];
  }, [selectedDirection]);

  // Filtered cases for catalog
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Direction
      if (selectedDirection === "org" && !c.direction.includes("Организационн")) return false;
      if (selectedDirection === "clin" && c.direction.includes("Организационн")) return false;

      // Category
      if (selectedCategory !== "Все" && c.category !== selectedCategory) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = c.title.toLowerCase().includes(q);
        const inSummary = c.summary.toLowerCase().includes(q);
        const inIndex = c.index.includes(q);
        const inComp = c.competencies && c.competencies.some((comp) => comp.toLowerCase().includes(q));
        if (!inTitle && !inSummary && !inIndex && !inComp) return false;
      }

      return true;
    });
  }, [selectedDirection, selectedCategory, searchQuery]);

  // Answered questions count in practice
  const answeredCount = useMemo(() => {
    return answers.filter((a) => (a || "").trim().length >= 40).length;
  }, [answers]);

  // Evaluate answers
  const handleEvaluate = () => {
    const questionScores = currentCase.questions.map((q, idx) => {
      const ans = (answers[idx] || "").trim();
      const ansLower = ans.toLowerCase();
      let matched = 0;
      if (q.signals && q.signals.length > 0) {
        q.signals.forEach((sig) => {
          if (sig.test(ansLower)) matched++;
        });
      }
      const ratio =
        q.signals && q.signals.length > 0
          ? matched / q.signals.length
          : ans.length >= 100
          ? 1
          : 0.5;
      return {
        dimension: q.dimension || q.short || `Вопрос ${idx + 1}`,
        score: ans ? Math.round(ratio * q.max) : 0,
        max: q.max,
        note: q.note,
        gap: q.gap,
      };
    });

    const criticalFlags = (currentCase.criticalRules || [])
      .filter((r) => {
        const ans = (answers[r.answer] || "").toLowerCase();
        return !r.requirements.every((req) => req.test(ans));
      })
      .map((r) => r.message);

    const totalScore = questionScores.reduce((sum, q) => sum + q.score, 0);
    const passed = totalScore >= 65 && criticalFlags.length === 0;

    const dimensions = questionScores.map((q) => ({
      name: q.dimension,
      score: q.score,
      max: q.max,
      percent: q.max > 0 ? Math.round((q.score / q.max) * 100) : 0,
    }));

    const strengthNotes = questionScores
      .filter((q) => q.score / q.max >= 0.65 && q.note)
      .map((q) => q.note);

    const gapNotes = questionScores
      .filter((q) => q.score / q.max < 0.65 && q.gap)
      .map((q) => q.gap);

    const resultObj = {
      id: Date.now(),
      caseId: currentCase.id,
      caseTitle: currentCase.title,
      score: totalScore,
      passed,
      date: new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date()),
      dimensions,
      criticalFlags,
      questionScores,
      strengths: strengthNotes.length
        ? strengthNotes
        : ["Вы начали структурировать ответ и обозначили собственную профессиональную позицию."],
      gaps: gapNotes.length
        ? gapNotes
        : ["Сделайте итоговый ответ компактнее: оформите его как алгоритм для передачи коллеге или супервизору."],
      answers: [...answers],
    };

    setEvaluation(resultObj);
    setAttempts((prev) => {
      const next = [resultObj, ...prev];
      try {
        localStorage.setItem("psy-trainer-attempts-v2", JSON.stringify(next));
      } catch {}
      return next;
    });

    navigateTo("result");
    showToast(`Оценка сформирована: ${totalScore}/100 баллов`);
  };

  // Export solution to clipboard
  const copySolution = () => {
    let text = `РЕШЕНИЕ КЕЙСА: ${currentCase.index} — ${currentCase.title}\n`;
    text += `Направление: ${currentCase.direction} | Категория: ${currentCase.category}\n\n`;
    currentCase.questions.forEach((q, i) => {
      text += `--- Вопрос ${i + 1}: ${q.title} ---\n`;
      text += `${answers[i] || "(Ответ не заполнен)"}\n\n`;
    });
    navigator.clipboard.writeText(text).then(() => {
      showToast("Решение скопировано в буфер обмена ✓");
    }).catch(() => {
      showToast("Не удалось скопировать");
    });
  };

  // Download solution as Markdown
  const downloadSolution = () => {
    let md = `# Решение кейса ${currentCase.index}: ${currentCase.title}\n\n`;
    md += `**Направление**: ${currentCase.direction}  \n`;
    md += `**Категория**: ${currentCase.category} | **Уровень**: ${currentCase.level} | **Время**: ${currentCase.time}  \n\n`;
    md += `## Краткое описание ситуации\n${currentCase.summary}\n\n`;
    md += `## Ответы на задания\n\n`;
    currentCase.questions.forEach((q, i) => {
      md += `### ${i + 1}. ${q.prompt}\n\n`;
      md += `${answers[i] ? answers[i].trim() : "_Ответ не предоставлен_"}\n\n`;
    });
    md += `---\n_Тренажёр для психологов — Практикум решения кейсов_\n`;

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `case-${currentCase.index}-solution.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Файл решения скачан (.md) ✓");
  };

  // Filtered sources
  const filteredSources = useMemo(() => {
    return sources.filter((s) => {
      if (sourceLang === "ru" && s.language !== "RU") return false;
      if (sourceLang === "en" && s.language !== "EN") return false;
      return true;
    });
  }, [sourceLang]);

  return (
    <main>
      {/* Toast */}
      {toast && (
        <div className="toast-notice" role="alert">
          <span>{toast}</span>
        </div>
      )}

      {/* Global Header */}
      <header className={`site-header ${tab !== "home" ? "inner-header" : ""}`}>
        <button
          type="button"
          className="brand-button"
          onClick={() => navigateTo("home")}
          aria-label="На главную"
        >
          <BrandMark />
        </button>

        <nav aria-label="Основная навигация">
          <button
            type="button"
            className={["catalog", "case", "practice", "result"].includes(tab) ? "active" : ""}
            onClick={() => navigateTo("catalog")}
          >
            Кейсы ({cases.length})
          </button>
          <button
            type="button"
            className={tab === "guide" ? "active" : ""}
            onClick={() => navigateTo("guide")}
          >
            Как работать
          </button>
          <button
            type="button"
            className={tab === "knowledge" ? "active" : ""}
            onClick={() => navigateTo("knowledge")}
          >
            База знаний
          </button>
          <button
            type="button"
            className={tab === "sources" ? "active" : ""}
            onClick={() => navigateTo("sources")}
          >
            Источники ({sources.length})
          </button>
          <button
            type="button"
            className={tab === "profile" ? "active" : ""}
            onClick={() => navigateTo("profile")}
          >
            Профиль {solvedCount > 0 ? `(${solvedCount})` : ""}
          </button>
        </nav>

        {tab === "practice" ? (
          <button
            type="button"
            className="header-cta quiet"
            onClick={() => navigateTo("case")}
          >
            Выйти из кейса
          </button>
        ) : tab === "home" ? (
          <button
            type="button"
            className="header-cta"
            onClick={() => navigateTo("catalog")}
          >
            Начать практику
          </button>
        ) : (
          <button
            type="button"
            className="header-cta quiet"
            onClick={() => navigateTo("catalog")}
          >
            Все кейсы
          </button>
        )}
      </header>

      {/* VIEW: HOME */}
      {tab === "home" && (
        <>
          <section className="hero" id="top">
            <div className="bauhaus-grid" aria-hidden="true"></div>
            <div className="hero-shape hero-ring" aria-hidden="true"></div>
            <div className="hero-shape hero-quarter" aria-hidden="true"></div>
            <div className="hero-dots" aria-hidden="true">
              <i></i><i></i><i></i>
            </div>
            <div className="hero-frame">
              <div className="hero-copy">
                <div className="eyebrow">ПРАКТИКУМ · ПСИХОЛОГИЯ</div>
                <h1>
                  Тренажёр для <em>психологов</em>
                </h1>
                <p>
                  Разбирайте реальные учебные и организационные ситуации, показывайте ход рассуждения
                  и получайте понятную обратную связь по профессиональной рубрике.
                </p>
                <div className="hero-actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => navigateTo("catalog")}
                  >
                    Перейти к кейсам <ArrowIcon />
                  </button>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => navigateTo("guide")}
                  >
                    Сначала изучить правила <span>→</span>
                  </button>
                </div>
              </div>

              <div className="hero-psi" aria-hidden="true">Ψ</div>

              <div className="hero-index" aria-hidden="true">
                <span>БАЗА</span>
                <b>{cases.length}</b>
                <small>КЕЙСОВ</small>
              </div>
            </div>
          </section>

          <section className="principles-strip" aria-label="Принципы тренажёра">
            <div>
              <b>01</b>
              <span>Факты и проверяемые данные вместо домыслов</span>
            </div>
            <div>
              <b>02</b>
              <span>Источники NICE, ВОЗ, РПО, APA и ISO 45003</span>
            </div>
            <div>
              <b>03</b>
              <span>Критические профессиональные ошибки блокируют зачёт</span>
            </div>
            <div>
              <b>04</b>
              <span>История попыток и профиль компетенций специалиста</span>
            </div>
          </section>

          <section className="home-sections" aria-labelledby="home-sections-title">
            <div className="home-sections-heading">
              <div>
                <p className="kicker">Структура платформы</p>
                <h2 id="home-sections-title">Всё на своих местах</h2>
              </div>
              <p>
                Выберите нужный блок. Клинические ситуации, оргдиагностика, методика и личные результаты четко разделены.
              </p>
            </div>

            <div className="section-hub">
              <button
                type="button"
                onClick={() => {
                  setSelectedDirection("org");
                  navigateTo("catalog");
                }}
              >
                <span>01</span>
                <div>
                  <b>Организационная психология</b>
                  <p>27 кейсов: управление изменениями, выгорание, кранчи, оргкультура и ассессмент лидеров.</p>
                  <small>{orgCount} кейсов · оргдиагностика</small>
                </div>
                <i>→</i>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedDirection("clin");
                  navigateTo("catalog");
                }}
              >
                <span>02</span>
                <div>
                  <b>Клиническое консультирование</b>
                  <p>10 кейсов: кризисная помощь, оценка рисков, ОКР, подростковое самоповреждение и аддикции.</p>
                  <small>{clinCount} кейсов · клиническая практика</small>
                </div>
                <i>→</i>
              </button>

              <button type="button" onClick={() => navigateTo("guide")}>
                <span>03</span>
                <div>
                  <b>Как работать с кейсом</b>
                  <p>Метод КАРТА, правила сильного ответа и разбор типичных ошибок.</p>
                  <small>5 шагов · чек-лист</small>
                </div>
                <i>→</i>
              </button>

              <button type="button" onClick={() => navigateTo("sources")}>
                <span>04</span>
                <div>
                  <b>Источники и стандарты</b>
                  <p>33 официальных руководства ВОЗ, NICE, РПО, APA, ISO и CIPD.</p>
                  <small>{sources.length} документа · открытые ссылки</small>
                </div>
                <i>→</i>
              </button>
            </div>
          </section>

          <section className="home-start">
            <div>
              <p className="kicker light">Быстрый старт</p>
              <h2>Готовы проверить себя на первом кейсе?</h2>
              <p>Начните с учебной ситуации и пройдите все задания.</p>
            </div>
            <div>
              <button
                type="button"
                className="primary-button"
                onClick={() => navigateTo("catalog")}
              >
                Выбрать кейс <ArrowIcon />
              </button>
            </div>
          </section>
        </>
      )}

      {/* VIEW: CATALOG */}
      {tab === "catalog" && (
        <section className="catalog-page">
          <div className="page-hero page-hero-compact">
            <div>
              <p className="kicker">Практикум · 2026</p>
              <h1>Каталог кейсов</h1>
              <p>
                Выберите ситуацию, изучите вводные данные и последовательно ответьте на профессиональные вопросы. Черновик сохранится на этом устройстве.
              </p>
            </div>
            <div className="page-hero-stats">
              <span>
                <b>{cases.length}</b> кейсов
              </span>
              <span>
                <b>{categoriesForDirection.length - 1}</b> тем
              </span>
              <span>
                <b>100</b> баллов
              </span>
            </div>
          </div>

          <div className="catalog-content">
            <div className="catalog-toolbar">
              {/* Direction Tabs */}
              <div className="catalog-direction-bar">
                <button
                  type="button"
                  className={`direction-pill ${selectedDirection === "all" ? "active-all" : ""}`}
                  onClick={() => {
                    setSelectedDirection("all");
                    setSelectedCategory("Все");
                  }}
                >
                  Все кейсы ({cases.length})
                </button>
                <button
                  type="button"
                  className={`direction-pill ${selectedDirection === "org" ? "active-org" : ""}`}
                  onClick={() => {
                    setSelectedDirection("org");
                    setSelectedCategory("Все");
                  }}
                >
                  Организационная психология ({orgCount})
                </button>
                <button
                  type="button"
                  className={`direction-pill ${selectedDirection === "clin" ? "active-clin" : ""}`}
                  onClick={() => {
                    setSelectedDirection("clin");
                    setSelectedCategory("Все");
                  }}
                >
                  Клиническое консультирование ({clinCount})
                </button>
              </div>

              {/* Search Box */}
              <div className="catalog-search-wrap">
                <input
                  type="text"
                  className="catalog-search-input"
                  placeholder="Поиск по названию ситуации, компании или компетенциям…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="catalog-search-clear"
                    onClick={() => setSearchQuery("")}
                    title="Очистить поиск"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter Heading */}
              <div className="catalog-filter-header">
                <b>Фильтр по теме</b>
                <span>Показано: {filteredCases.length} из {cases.length}</span>
              </div>

              {/* Category Pills */}
              <div className="filter-row" aria-label="Фильтры каталога">
                {categoriesForDirection.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={selectedCategory === cat ? "selected" : ""}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="case-grid">
              {filteredCases.map((e) => (
                <article
                  key={e.id}
                  className="case-card"
                  style={{ "--case-accent": e.accent }}
                >
                  <div className="case-topline">
                    <span>КЕЙС {e.index}</span>
                    <span className={`case-status ${bestAttempts.get(e.id)?.passed ? "completed" : ""}`}>
                      {bestAttempts.has(e.id) ? `${bestAttempts.get(e.id)?.score}/100` : "ДОСТУПЕН"}
                    </span>
                  </div>
                  <div className="case-sigil" aria-hidden="true">
                    <span>{e.index}</span>
                  </div>
                  <p className="case-direction">{e.direction}</p>
                  <h3>{e.title}</h3>
                  <p className="case-summary">{e.summary}</p>
                  <div className="case-meta">
                    <span>{e.level}</span>
                    <i></i>
                    <span>{e.time}</span>
                    <i></i>
                    <span>{e.questions.length} заданий</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCase(e.id)}
                    aria-label={`Открыть кейс: ${e.title}`}
                  >
                    Открыть кейс <span>→</span>
                  </button>
                </article>
              ))}
            </div>

            <div className="catalog-support">
              <div>
                <p className="kicker">Нужна опора?</p>
                <h2>Перед первым кейсом изучите метод КАРТА</h2>
                <p>
                  Он помогает отделить факты от гипотез, не пропустить риск и выстроить план действий в правильном порядке.
                </p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => navigateTo("guide")}
              >
                Открыть руководство <span>→</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* VIEW: CASE INTRO */}
      {tab === "case" && (
        <section className="case-intro-page" style={{ "--case-accent": currentCase.accent }}>
          <div className="case-intro-head">
            <button
              type="button"
              className="back-link"
              onClick={() => navigateTo("catalog")}
            >
              ← Каталог кейсов
            </button>
            <div className="case-index-big">
              {currentCase.index} <span>/ {String(cases.length).padStart(3, "0")}</span>
            </div>
          </div>

          <div className="case-intro-grid">
            <div className="case-intro-main">
              <p className="case-direction">{currentCase.direction}</p>
              <h1>{currentCase.title}</h1>
              <div className="case-tags">
                <span>{currentCase.level}</span>
                <span>{currentCase.time}</span>
                <span>{currentCase.questions.length} заданий</span>
              </div>

              <div className="brief-block">
                <div className="brief-label">Вводные данные</div>
                <p>{currentCase.facts[0]}</p>
                {currentCase.quote && <blockquote>«{currentCase.quote}»</blockquote>}
                {currentCase.facts.slice(1).map((f, i) => (
                  <p key={i}>{f}</p>
                ))}
              </div>

              {currentCase.warning && (
                <div className="case-warning">
                  <b>Важно</b>
                  <span>{currentCase.warning}</span>
                </div>
              )}

              {currentBenchmark && (
                <section className="topic-guide" aria-labelledby="topic-guide-title">
                  <div className="topic-guide-head">
                    <div>
                      <p className="kicker">Кратко о теме</p>
                      <h2 id="topic-guide-title">Перед началом разбора</h2>
                    </div>
                    <span>Методические ориентиры</span>
                  </div>

                  <div className="topic-guide-grid">
                    <article>
                      <b>Что важно заметить</b>
                      <p>{currentBenchmark.focus}</p>
                    </article>
                    <article>
                      <b>Логика рассуждения</b>
                      <p>{currentBenchmark.logic}</p>
                    </article>
                    <article>
                      <b>Чего избегать</b>
                      <p>{currentBenchmark.avoid}</p>
                    </article>
                  </div>

                  <div className="topic-terms">
                    <b>Ключевые понятия:</b>
                    {currentBenchmark.terms.map((term, i) => (
                      <span key={i}>{term}</span>
                    ))}
                  </div>
                </section>
              )}

              {currentCase.sourceIds && currentCase.sourceIds.length > 0 && (
                <div className="case-provenance">
                  <p className="kicker">Научно-методическая основа кейса</p>
                  <p>
                    Сценарий составлен специально для обучения. Критерии оценки и ориентиры ответа разработаны на основе документов:
                  </p>
                  <div>
                    {getCaseSources(currentCase).map((s) => (
                      <a
                        key={s.id}
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {s.org} · {s.year} {s.language === "RU" ? "· на русском" : ""} <span>↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside className="case-intro-aside">
              <p className="kicker">Матрица оценки</p>
              <h2>Что будет проверяться</h2>

              <div className="rubric-list">
                {currentCase.questions.map((q, i) => (
                  <div key={i}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <b>{q.dimension || q.short}</b>
                    <em>{q.max} баллов</em>
                  </div>
                ))}
              </div>

              <div className="competency-chips">
                {currentCase.competencies.map((comp, i) => (
                  <span key={i}>{comp}</span>
                ))}
              </div>

              {hasDraft && (
                <button
                  type="button"
                  className="primary-button full"
                  onClick={() => startPractice(true)}
                >
                  Продолжить черновик <ArrowIcon />
                </button>
              )}

              <button
                type="button"
                className={hasDraft ? "secondary-button full" : "primary-button full"}
                onClick={() => startPractice(false)}
              >
                {hasDraft ? "Начать заново" : "Начать разбор"} <ArrowIcon />
              </button>

              <small>
                Ответы и результаты сохраняются только в браузере на этом устройстве.
              </small>
            </aside>
          </div>
        </section>
      )}

      {/* VIEW: PRACTICE */}
      {tab === "practice" && (
        <section className="practice-page" style={{ "--case-accent": currentCase.accent }}>
          <aside className="practice-sidebar">
            <div>
              <p className="case-direction">Кейс {currentCase.index}</p>
              <h2>{currentCase.title}</h2>
            </div>

            <ol>
              {currentCase.questions.map((q, i) => {
                const isCurrent = i === currentStep;
                const isDone = (answers[i] || "").trim().length >= 40;
                return (
                  <li key={i} className={`${isCurrent ? "current" : ""} ${isDone ? "done" : ""}`}>
                    <button type="button" onClick={() => setCurrentStep(i)}>
                      <span>{i + 1}</span>
                      <b>{q.short || `Вопрос ${i + 1}`}</b>
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="practice-toolbox">
              <div
                className={`timer-pill ${timerSeconds < 300 ? "urgent" : ""}`}
              >
                <span>⏱ {formatTimer(timerSeconds)}</span>
                <button
                  type="button"
                  className="timer-btn"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                >
                  {isTimerRunning ? "Пауза" : "Старт"}
                </button>
                <button
                  type="button"
                  className="timer-btn"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSeconds(1500);
                  }}
                  title="Сброс на 25 мин"
                >
                  ↺
                </button>
              </div>

              <button
                type="button"
                className="toolbox-btn"
                onClick={() => setIsContextDrawerOpen(!isContextDrawerOpen)}
              >
                📖 {isContextDrawerOpen ? "Скрыть факты" : "Показать факты"}
              </button>

              <div style={{ display: "flex", gap: "6px", width: "100%" }}>
                <button
                  type="button"
                  className="toolbox-btn"
                  style={{ flex: 1 }}
                  onClick={copySolution}
                  title="Скопировать всё решение"
                >
                  📋 Копия
                </button>
                <button
                  type="button"
                  className="toolbox-btn"
                  style={{ flex: 1 }}
                  onClick={downloadSolution}
                  title="Скачать решение как Markdown"
                >
                  📥 .md
                </button>
              </div>
            </div>

            <div className="progress-summary">
              <span>Заполнено</span>
              <b>{answeredCount} / {currentCase.questions.length}</b>
              <div>
                <i style={{ width: `${(answeredCount / currentCase.questions.length) * 100}%` }}></i>
              </div>
            </div>
          </aside>

          <div className="question-workspace">
            {isContextDrawerOpen && (
              <div className="context-panel">
                <div
                  className="context-panel-header"
                  onClick={() => setIsContextDrawerOpen(false)}
                >
                  <span className="context-panel-title">📋 Факты ситуации (свернуть)</span>
                  <span>✕</span>
                </div>
                <div className="facts-list compact">
                  {currentCase.facts.map((fact, i) => (
                    <p key={i}><b>{i + 1}.</b> {fact}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="question-count">
              Задание {String(currentStep + 1).padStart(2, "0")}{" "}
              <span>/ {String(currentCase.questions.length).padStart(2, "0")}</span>
            </div>

            <h1>{currentCase.questions[currentStep].title}</h1>
            <p className="question-prompt">{currentCase.questions[currentStep].prompt}</p>

            <label htmlFor={`answer-${currentStep}`}>Ваш профессиональный ответ</label>

            <div className="textarea-wrap">
              <textarea
                id={`answer-${currentStep}`}
                rows={10}
                placeholder={currentCase.questions[currentStep].placeholder}
                value={answers[currentStep] || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setAnswers((prev) => {
                    const next = [...prev];
                    next[currentStep] = val;
                    return next;
                  });
                }}
              ></textarea>
              <span>
                {(answers[currentStep] || "").length < 40
                  ? `${(answers[currentStep] || "").length} симв. (мин. 40)`
                  : `${(answers[currentStep] || "").length} симв.`}
              </span>
            </div>

            <div className="question-hint">
              <b>Методический фокус</b>
              <p>{currentCase.questions[currentStep].hint}</p>
            </div>

            <div className="question-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={currentStep === 0}
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              >
                ← Предыдущее
              </button>

              {currentStep < currentCase.questions.length - 1 ? (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setCurrentStep((prev) => prev + 1)}
                >
                  Следующее задание →
                </button>
              ) : (
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleEvaluate}
                >
                  Завершить и проверить кейс →
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* VIEW: RESULT */}
      {tab === "result" && evaluation && (
        <section className="result-page" style={{ "--case-accent": currentCase.accent }}>
          <div className="result-hero">
            <div>
              <p className="kicker light">Результат · кейс {currentCase.index}</p>
              <h1>{evaluation.passed ? "Кейс пройден" : "Нужна доработка"}</h1>
              <p>
                {evaluation.passed
                  ? "Критические риски учтены, а профессиональная логика выдержана."
                  : "В ответе есть рабочая основа, но неполная логика или пропуски пока не позволяют засчитать кейс."}
              </p>
            </div>

            <div
              className={`score-orbit ${evaluation.passed ? "pass" : "revise"}`}
              style={{ "--score": `${3.6 * evaluation.score}deg` }}
            >
              <div>
                <b>{evaluation.score}</b>
                <span>/ 100</span>
              </div>
            </div>
          </div>

          <div className="result-body">
            <div className="result-main">
              {evaluation.criticalFlags && evaluation.criticalFlags.length > 0 && (
                <div className="critical-panel">
                  <div className="panel-title">
                    <span>!</span>
                    <div>
                      <b>Критические пропуски</b>
                      <small>Высокий общий балл не компенсирует угрозу безопасности или нарушение рамки</small>
                    </div>
                  </div>
                  <ul>
                    {evaluation.criticalFlags.map((flag, i) => (
                      <li key={i}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="result-card">
                <p className="kicker">Оценка по измерениям</p>
                <div className="dimension-list">
                  {evaluation.dimensions.map((dim, i) => (
                    <div key={i}>
                      <div>
                        <b>{dim.name}</b>
                        <span>{dim.score} / {dim.max} ({dim.percent}%)</span>
                      </div>
                      <div className="dimension-bar">
                        <i style={{ width: `${dim.percent}%` }}></i>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="feedback-grid">
                <div className="result-card strengths">
                  <p className="kicker">Сильные стороны</p>
                  <ul>
                    {evaluation.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="result-card gaps">
                  <p className="kicker">Зоны роста</p>
                  <ul>
                    {evaluation.gaps.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {currentBenchmark && (
                <details className="model-answer" open>
                  <summary>
                    <span>
                      <p className="kicker">Эталонный разбор</p>
                      <b>Ориентир решения от эксперта</b>
                      <small>Нажмите, чтобы развернуть или скрыть</small>
                    </span>
                    <i>+</i>
                  </summary>
                  <div>
                    <section>
                      <h3>🎯 Ключевой фокус</h3>
                      <p>{currentBenchmark.focus}</p>
                    </section>
                    <section>
                      <h3>🧭 Логика рассуждения</h3>
                      <p>{currentBenchmark.logic}</p>
                    </section>
                    <section>
                      <h3 style={{ color: "var(--terracotta)" }}>⚠️ Типичные ошибки и ловушки</h3>
                      <div className="benchmark-avoid-box">
                        {currentBenchmark.avoid}
                      </div>
                    </section>
                    <section>
                      <h3>📚 Ключевые понятия</h3>
                      <div className="topic-terms">
                        {currentBenchmark.terms.map((t, i) => (
                          <span key={i}>{t}</span>
                        ))}
                      </div>
                    </section>
                  </div>
                </details>
              )}

              {currentCase.sourceIds && currentCase.sourceIds.length > 0 && (
                <div className="result-sources">
                  <p className="kicker">Источники для углубления</p>
                  <div>
                    {getCaseSources(currentCase).map((s) => (
                      <a
                        key={s.id}
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <b>{s.org} ({s.year})</b>
                        <span>{s.title}</span>
                        <i>↗</i>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside className="result-aside">
              <div className="aside-card">
                <p className="kicker">Вердикт</p>
                <b className={evaluation.passed ? "pass-text" : "revise-text"}>
                  {evaluation.passed ? "Пройден" : "Повторить"}
                </b>
                <p>
                  {evaluation.passed
                    ? "Набрано не менее 65 баллов; все критические условия выполнены."
                    : "Для зачёта нужны 65 баллов и отсутствие критических пропусков."}
                </p>
              </div>

              <button
                type="button"
                className="primary-button full"
                onClick={() => navigateTo("practice")}
              >
                Доработать решение ↻
              </button>

              <button
                type="button"
                className="secondary-button full"
                onClick={() => {
                  const curIdx = cases.findIndex((c) => c.id === currentCase.id);
                  if (curIdx < cases.length - 1) {
                    openCase(cases[curIdx + 1].id);
                  } else {
                    navigateTo("catalog");
                  }
                }}
              >
                Следующий кейс →
              </button>

              <button
                type="button"
                className="secondary-button full"
                onClick={downloadSolution}
              >
                Скачать отчёт (.md)
              </button>

              <button
                type="button"
                className="secondary-button full"
                onClick={() => navigateTo("profile")}
              >
                Открыть профиль
              </button>

              <button
                type="button"
                className="text-button"
                onClick={() => navigateTo("catalog")}
              >
                ← Вернуться в каталог
              </button>
            </aside>
          </div>
        </section>
      )}

      {/* VIEW: PROFILE */}
      {tab === "profile" && (
        <section className="profile-page">
          <div className="profile-heading">
            <div>
              <p className="kicker">Личный прогресс</p>
              <h1>Профиль компетенций</h1>
            </div>
            <p>
              История хранится локально на этом устройстве. Оценивайте не только балл: полезнее смотреть, какие блоки систематически проседают между разными кейсами.
            </p>
          </div>

          <div className="profile-stats">
            <div>
              <span>Попыток</span>
              <b>{attempts.length}</b>
            </div>
            <div>
              <span>Лучший результат</span>
              <b>{bestScore}<small>/100</small></b>
            </div>
            <div>
              <span>Кейсов пройдено</span>
              <b>{solvedCount}<small>/{cases.length}</small></b>
            </div>
          </div>

          <div className="profile-grid">
            <div className="history-card">
              <div className="card-heading">
                <h2>История попыток</h2>
                <div className="card-heading-actions">
                  <span>ПОКАЗАНО: {Math.min(attempts.length, 30)}</span>
                  {attempts.length > 0 && (
                    <button
                      type="button"
                      className="clear-history-btn"
                      onClick={() => {
                        if (window.confirm("Очистить всю историю попыток?")) {
                          localStorage.removeItem("psy-trainer-attempts-v2");
                          localStorage.removeItem("psy-trainer-attempts");
                          setAttempts([]);
                          showToast("История очищена");
                        }
                      }}
                      title="Очистить сохранённую историю попыток"
                    >
                      Очистить
                    </button>
                  )}
                </div>
              </div>

              {attempts.length > 0 ? (
                attempts.slice(0, 30).map((att) => (
                  <div key={att.id} className="attempt-row">
                    <span>{att.date}</span>
                    <b>{att.caseTitle}</b>
                    <em>{att.score} / 100</em>
                    <i className={att.passed ? "passed" : "failed"}>
                      {att.passed ? "Пройден" : "Доработать"}
                    </i>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <b>Здесь пока тихо</b>
                  <p>Пройдите любой кейс — результат и динамика появятся в профиле.</p>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => navigateTo("catalog")}
                  >
                    Выбрать кейс →
                  </button>
                </div>
              )}
            </div>

            <aside className="competency-card">
              <p className="kicker light">Сводный профиль</p>
              <h2>{topDimensions.length > 0 ? "Средние результаты" : "Сначала нужна попытка"}</h2>
              {topDimensions.length > 0 ? (
                <div className="competency-bars">
                  {topDimensions.map((d) => (
                    <div key={d.name}>
                      <span>
                        {d.name} <b>{d.percent}%</b>
                      </span>
                      <i>
                        <em style={{ width: `${d.percent}%` }}></em>
                      </i>
                    </div>
                  ))}
                </div>
              ) : (
                <p>После первой попытки здесь появится карта сильных и слабых зон.</p>
              )}
              <button
                type="button"
                onClick={() => navigateTo("catalog")}
              >
                Выбрать следующий кейс <span>↗</span>
              </button>
            </aside>
          </div>

          <div className="training-plan">
            <div>
              <p className="kicker">Персональная траектория</p>
              <h2>
                {weakestDimension
                  ? `Зона роста: ${weakestDimension.name}`
                  : "Пройдите первый кейс"}
              </h2>
              <p>
                {weakestDimension
                  ? `Текущий средний уровень — ${weakestDimension.percent}%. Следующий кейс выбирайте не по любимой теме, а по компетенции, которая требует практики.`
                  : "После первой попытки тренажёр покажет наиболее полезное направление следующей тренировки."}
              </p>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={() => navigateTo("catalog")}
            >
              Перейти к практике <span>→</span>
            </button>
          </div>
        </section>
      )}

      {/* VIEW: GUIDE */}
      {tab === "guide" && (
        <section className="guide-page">
          <div className="guide-hero">
            <p className="kicker">Методика и правила</p>
            <h1>Как работать с кейсом</h1>
            <p>
              Не ищите одну «правильную» фразу. Покажите порядок мышления, границы имеющихся данных и условия, при которых решение потребуется пересмотреть.
            </p>
          </div>

          <section className="method-section method-section-page" aria-labelledby="assessment-title">
            <div className="method-title">
              <p className="kicker light">Как устроена проверка</p>
              <h2 id="assessment-title">Оценивается логика, а не совпадение с образцом</h2>
            </div>
            <div className="method-content">
              <p>
                Система отмечает смысловые элементы ответа: факты, рабочие гипотезы, конкретные вопросы оценки, этические границы, безопасность и последовательность помощи.
              </p>
              <div className="method-steps">
                <div>
                  <span>01</span>
                  <b>{platformStats.questionsPerCase} заданий в кейсе</b>
                  <p>Каждое задание проверяет отдельную профессиональную компетенцию.</p>
                </div>
                <div>
                  <span>02</span>
                  <b>100‑балльная рубрика</b>
                  <p>Баллы отражают полноту ответа, а не «истину в последней инстанции».</p>
                </div>
                <div>
                  <span>03</span>
                  <b>Критические условия</b>
                  <p>Пропуск риска или этической границы нельзя компенсировать красивым текстом.</p>
                </div>
                <div>
                  <span>04</span>
                  <b>Подробный разбор</b>
                  <p>После попытки открываются сильные стороны, пробелы, ориентир решения и источники.</p>
                </div>
              </div>
              <div className="demo-notice">
                <b>Важно понимать</b>
                <span>
                  Автоматизированная рубрика предназначена для тренировки. Она не заменяет преподавателя, супервизию, очную оценку клиента или клиническое решение.
                </span>
              </div>
            </div>
          </section>

          <div className="karta-board">
            <div className="karta-title">
              <span>01</span>
              <div>
                <p className="kicker">Базовая схема</p>
                <h2>Метод КАРТА</h2>
              </div>
            </div>
            <div className="karta-grid">
              {kartaSteps.map((e, i) => (
                <article key={`${e.letter}-${i}`}>
                  <b>{e.letter}</b>
                  <h3>{e.title}</h3>
                  <p>{e.text}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="guide-columns">
            <section className="guide-card">
              <p className="kicker">Перед отправкой</p>
              <h2>Чек-лист сильного ответа</h2>
              <ol>
                <li>
                  <span>01</span>
                  <p>
                    <b>Факты отделены от гипотез.</b> Видно, кто именно сообщил каждый значимый факт.
                  </p>
                </li>
                <li>
                  <span>02</span>
                  <p>
                    <b>Есть альтернативы.</b> Вы не влюбились в первую диагностическую идею.
                  </p>
                </li>
                <li>
                  <span>03</span>
                  <p>
                    <b>Риски названы конкретно.</b> Указаны прямые вопросы и срочные развилки.
                  </p>
                </li>
                <li>
                  <span>04</span>
                  <p>
                    <b>Рамка понятна.</b> Определены клиент, запрос, согласие, конфиденциальность и компетентность.
                  </p>
                </li>
                <li>
                  <span>05</span>
                  <p>
                    <b>План имеет порядок.</b> Первый шаг не перепутан с десятой техникой.
                  </p>
                </li>
              </ol>
            </section>

            <section className="guide-card mistakes">
              <p className="kicker">Частые ошибки</p>
              <h2>Что режет баллы</h2>
              <ul>
                <li>
                  <b>Диагноз по трём строчкам</b>
                  <span>Категоричный вывод без очной оценки и дифференциальных гипотез.</span>
                </li>
                <li>
                  <b>«Оценить риск» без вопросов</b>
                  <span>Красиво, но непроверяемо. Нужны мысли, намерение, план, средства, история и защита.</span>
                </li>
                <li>
                  <b>Техника раньше контакта</b>
                  <span>Домашнее задание и экспозиция не заменяют рамку, согласие и понимание запроса.</span>
                </li>
                <li>
                  <b>Спор с клиентом</b>
                  <span>Давление, морализация и попытка победить сопротивление обычно ухудшают рабочий контакт.</span>
                </li>
                <li>
                  <b>Перенаправление «на всякий случай»</b>
                  <span>Называйте причину, срочность, роль другого специалиста и что вы продолжаете делать сами.</span>
                </li>
              </ul>
            </section>
          </div>

          <section className="tips-section">
            <div className="tips-heading">
              <p className="kicker">Практические приёмы</p>
              <h2>Детали, по которым виден профессионал</h2>
            </div>
            <div className="tips-grid">
              {guideTips.map((tip, i) => (
                <article key={i}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <p>{tip}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="answer-comparison">
            <div>
              <p className="kicker">Короткий пример</p>
              <h2>Слабый и профессиональный варианты</h2>
            </div>
            <article className="weak-answer">
              <span>Слабая формулировка</span>
              <p>«У клиента депрессия. Нужно направить к психиатру и начать КПТ».</p>
            </article>
            <article className="strong-answer">
              <span>Профессиональная формулировка</span>
              <p>
                «Данные позволяют предположить депрессивную симптоматику, но сначала нужно прямо оценить суицидальный риск, уточнить длительность, прошлые периоды повышенной активности, вещества и медицинские причины. Маршрут помощи зависит от результатов этой оценки».
              </p>
            </article>
          </section>

          <div className="guide-cta">
            <div>
              <p className="kicker">Теперь в практику</p>
              <h2>Выберите кейс и примените КАРТУ</h2>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={() => navigateTo("catalog")}
            >
              Открыть каталог <span>→</span>
            </button>
          </div>
        </section>
      )}

      {/* VIEW: KNOWLEDGE */}
      {tab === "knowledge" && (
        <section className="knowledge-page">
          <div className="page-hero knowledge-hero">
            <div>
              <p className="kicker">Учебные ориентиры</p>
              <h1>База знаний</h1>
              <p>
                Краткие вводные по темам тренажёра: на что обратить внимание, как выстроить рассуждение и каких решений следует избегать.
              </p>
            </div>
            <div className="knowledge-note">
              <b>Как пользоваться разделом</b>
              <p>
                Сначала прочитайте карточку темы, затем откройте связанный кейс. Здесь нет готовых ответов — только профессиональная оптика.
              </p>
            </div>
          </div>

          <div className="knowledge-grid">
            {cases.map((c) => {
              const bm = benchmarks[c.id];
              if (!bm) return null;
              return (
                <article
                  key={c.id}
                  className="knowledge-card"
                  style={{ "--case-accent": c.accent }}
                >
                  <div className="knowledge-card-head">
                    <span>ТЕМА {c.index}</span>
                    <em>{c.category}</em>
                  </div>
                  <p className="case-direction">{c.direction}</p>
                  <h2>{c.title}</h2>

                  <div className="knowledge-block">
                    <b>Что важно заметить</b>
                    <p>{bm.focus}</p>
                  </div>

                  <div className="knowledge-block">
                    <b>Логика разбора</b>
                    <p>{bm.logic}</p>
                  </div>

                  <details>
                    <summary>
                      Чего следует избегать <span>+</span>
                    </summary>
                    <p>{bm.avoid}</p>
                  </details>

                  <div className="topic-terms">
                    {bm.terms.map((t, idx) => (
                      <span key={idx}>{t}</span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => openCase(c.id)}
                  >
                    Перейти к кейсу <span>→</span>
                  </button>
                </article>
              );
            })}
          </div>

          <div className="knowledge-footer">
            <div>
              <p className="kicker">Нужна научная основа?</p>
              <h2>Все документы собраны в отдельном реестре</h2>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => navigateTo("sources")}
            >
              Открыть источники <span>→</span>
            </button>
          </div>
        </section>
      )}

      {/* VIEW: SOURCES */}
      {tab === "sources" && (
        <section className="sources-page">
          <div className="sources-hero">
            <p className="kicker">Открытая методология</p>
            <h1>Реестр источников</h1>
            <p>
              Здесь собраны документы, на которых построены вводные, рубрики и ориентиры ответов. Русскоязычные материалы отмечены отдельно, а ссылки ведут на официальные страницы организаций.
            </p>
          </div>

          <div className="editorial-policy">
            <div>
              <span>01</span>
              <b>Не копируем клиентов</b>
              <p>
                Все истории составлены специально для обучения и не содержат реальных персональных данных.
              </p>
            </div>
            <div>
              <span>02</span>
              <b>Отделяем руководство от закона</b>
              <p>
                Международные рекомендации не заменяют местное законодательство и внутренние регламенты.
              </p>
            </div>
            <div>
              <span>03</span>
              <b>Показываем происхождение</b>
              <p>
                У каждого кейса есть конкретный список документов и дата публикации.
              </p>
            </div>
          </div>

          <div className="source-filter" aria-label="Фильтр источников по языку">
            <button
              type="button"
              className={sourceLang === "all" ? "selected" : ""}
              onClick={() => setSourceLang("all")}
            >
              Все источники · {sources.length}
            </button>
            <button
              type="button"
              className={sourceLang === "ru" ? "selected" : ""}
              onClick={() => setSourceLang("ru")}
            >
              На русском · {sources.filter((s) => s.language === "RU").length}
            </button>
            <button
              type="button"
              className={sourceLang === "en" ? "selected" : ""}
              onClick={() => setSourceLang("en")}
            >
              На английском · {sources.filter((s) => s.language === "EN").length}
            </button>
          </div>

          <div className="source-list">
            {filteredSources.map((s, idx) => (
              <a
                key={s.id || idx}
                href={s.url}
                target="_blank"
                rel="noreferrer"
              >
                <span className="source-number">{String(idx + 1).padStart(2, "0")}</span>
                <div>
                  <small>
                    {s.org} · {s.year} {s.language === "RU" ? "· на русском" : ""}
                  </small>
                  <h2>{s.title}</h2>
                  <p>{s.focus}</p>
                </div>
                <i>↗</i>
              </a>
            ))}
          </div>

          <div className="source-disclaimer">
            <span>Примечание</span>
            <p>
              Ссылки ведут на сайты ВОЗ, NICE, РПО, APA, ISO, CIPD и других профессиональных ассоциаций. Доступность внешних материалов зависит от их правообладателей.
            </p>
          </div>
        </section>
      )}

      {/* Global Footer */}
      <footer className="site-footer">
        <div className="footer-content">
          <div className="footer-left">
            <b>Тренажёр для психологов</b>
            <p>
              Практикум решения психологических и организационных кейсов.
            </p>
          </div>
          <div className="footer-right">
            <span>Всего кейсов: {cases.length} · Источников: {sources.length}</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
