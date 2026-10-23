"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { sources } from "./data/sources";
import { cases } from "./data/cases";
import { benchmarks } from "./data/benchmarks";

export default function Page() {
  // Navigation & Core Selection
  const [tab, setTab] = useState("home");
  const [currentCaseId, setCurrentCaseId] = useState(cases[0].id);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState(Array(cases[0].questions.length).fill(""));
  const [evaluation, setEvaluation] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [favorites, setFavorites] = useState([]);

  // Catalog Filters & Search
  const [selectedDirection, setSelectedDirection] = useState("all"); // 'all' | 'org' | 'clin'
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("index");

  // Practice Mode Controls
  const [viewMode, setViewMode] = useState("stepper"); // 'stepper' | 'all'
  const [isContextDrawerOpen, setIsContextDrawerOpen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(1500); // 25 mins
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [selfCheck, setSelfCheck] = useState({
    facts: false,
    system: false,
    ethics: false,
    solution: false
  });

  // Sources Filters
  const [sourceLang, setSourceLang] = useState("all");
  const [sourceSearch, setSourceSearch] = useState("");

  // Toast feedback
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Current active case & benchmark
  const currentCase = useMemo(() => {
    return cases.find((c) => c.id === currentCaseId) ?? cases[0];
  }, [currentCaseId]);

  const currentBenchmark = benchmarks[currentCase.id];

  // Load persistence (Attempts & Favorites)
  useEffect(() => {
    try {
      const storedAttempts = localStorage.getItem("psy-trainer-attempts-v2") || localStorage.getItem("psy-trainer-attempts");
      if (storedAttempts) {
        const parsed = JSON.parse(storedAttempts);
        if (Array.isArray(parsed)) {
          setAttempts(
            parsed.filter((e) => typeof e.score === "number").map((e) => ({
              id: e.id ?? Date.now(),
              caseId: e.caseId ?? cases[0].id,
              caseTitle: e.caseTitle ?? cases[0].title,
              score: e.score ?? 0,
              passed: !!e.passed,
              date: e.date ?? "Ранее",
              dimensions: e.dimensions ?? [],
              answers: e.answers ?? []
            }))
          );
        }
      }

      const storedFavs = localStorage.getItem("psy-trainer-favorites");
      if (storedFavs) {
        const parsedFavs = JSON.parse(storedFavs);
        if (Array.isArray(parsedFavs)) setFavorites(parsedFavs);
      }
    } catch (err) {
      console.warn("Storage load error:", err);
    }
  }, []);

  // Sync draft answers when switching cases or starting practice
  useEffect(() => {
    try {
      const draft = localStorage.getItem(`psy-trainer-draft-${currentCase.id}`);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (Array.isArray(parsed.answers) && parsed.answers.length === currentCase.questions.length) {
          setAnswers(parsed.answers);
          if (typeof parsed.currentStep === "number") setCurrentStep(parsed.currentStep);
          if (parsed.savedAt) setLastSavedTime(new Date(parsed.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
          return;
        }
      }
    } catch {}
    setAnswers(Array(currentCase.questions.length).fill(""));
    setCurrentStep(0);
  }, [currentCase.id]);

  // Auto-save draft on answers change in practice mode
  useEffect(() => {
    if (tab === "practice" && answers.some((a) => a && a.trim().length > 0)) {
      try {
        const now = Date.now();
        localStorage.setItem(
          `psy-trainer-draft-${currentCase.id}`,
          JSON.stringify({
            answers,
            currentStep,
            savedAt: now
          })
        );
        setLastSavedTime(new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
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

  // Scroll to top on tab or case change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [tab, currentStep, currentCaseId]);

  // URL hash navigation support
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (["home", "catalog", "case", "practice", "result", "profile", "guide", "knowledge", "sources"].includes(hash)) {
        setTab(hash);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const navigateTo = (newTab) => {
    setTab(newTab);
    try {
      const s = newTab === "home" ? "" : `#${newTab}`;
      window.history.pushState(null, "", `${window.location.pathname}${window.location.search}${s}`);
    } catch {}
  };

  // Toggle favorite
  const toggleFavorite = (caseId, e) => {
    if (e) e.stopPropagation();
    setFavorites((prev) => {
      const updated = prev.includes(caseId) ? prev.filter((id) => id !== caseId) : [...prev, caseId];
      try {
        localStorage.setItem("psy-trainer-favorites", JSON.stringify(updated));
      } catch {}
      showToast(updated.includes(caseId) ? "Кейс добавлен в избранное ★" : "Кейс удалён из избранного");
      return updated;
    });
  };

  // Format timer
  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Clear current draft
  const clearDraft = () => {
    if (window.confirm("Очистить все введённые ответы по этому кейсу?")) {
      try {
        localStorage.removeItem(`psy-trainer-draft-${currentCase.id}`);
      } catch {}
      setAnswers(Array(currentCase.questions.length).fill(""));
      setCurrentStep(0);
      setLastSavedTime(null);
      showToast("Черновик очищен");
    }
  };

  // Export solution to clipboard
  const copySolution = () => {
    let text = `РЕШЕНИЕ КЕЙСА: ${currentCase.index} — ${currentCase.title}\n`;
    text += `Направление: ${currentCase.direction}\nКатегория: ${currentCase.category}\n\n`;
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
    md += `## Краткое описание\n${currentCase.summary}\n\n`;
    md += `## Ответы на вопросы\n\n`;
    currentCase.questions.forEach((q, i) => {
      md += `### ${i + 1}. ${q.prompt}\n\n`;
      md += `${answers[i] ? answers[i].trim() : "_Ответ не предоставлен_"}\n\n`;
    });
    md += `---\n_Тренажёр психолога и оргконсультанта — Научный сектор психологии ТФ МГУ_\n`;

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `case-${currentCase.index}-solution.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Файл решения скачан (.md) ✓");
  };

  // Dynamic categories list based on selected direction
  const availableCategories = useMemo(() => {
    let pool = cases;
    if (selectedDirection === "org") {
      pool = cases.filter((c) => c.direction.includes("Организационн"));
    } else if (selectedDirection === "clin") {
      pool = cases.filter((c) => !c.direction.includes("Организационн"));
    }
    const cats = Array.from(new Set(pool.map((c) => c.category))).filter(Boolean);
    return ["Все", ...cats];
  }, [selectedDirection]);

  // Filtered & Sorted Cases
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Direction
      if (selectedDirection === "org" && !c.direction.includes("Организационн")) return false;
      if (selectedDirection === "clin" && c.direction.includes("Организационн")) return false;

      // Category
      if (selectedCategory !== "Все" && c.category !== selectedCategory) return false;

      // Level
      if (selectedLevel !== "all" && c.level !== selectedLevel) return false;

      // Status
      if (selectedStatus === "fav" && !favorites.includes(c.id)) return false;
      if (selectedStatus === "solved") {
        const hasPassed = attempts.some((att) => att.caseId === c.id && att.passed);
        if (!hasPassed) return false;
      }
      if (selectedStatus === "draft") {
        try {
          const draft = localStorage.getItem(`psy-trainer-draft-${c.id}`);
          if (!draft) return false;
        } catch {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchSummary = c.summary.toLowerCase().includes(q);
        const matchIndex = c.index.includes(q);
        const matchComp = c.competencies && c.competencies.some((comp) => comp.toLowerCase().includes(q));
        const matchFacts = c.facts && c.facts.some((fact) => fact.toLowerCase().includes(q));
        if (!matchTitle && !matchSummary && !matchIndex && !matchComp && !matchFacts) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "index") return a.index.localeCompare(b.index);
      if (sortBy === "level") {
        const map = { Базовый: 1, Продвинутый: 2, Экспертный: 3 };
        return (map[b.level] || 0) - (map[a.level] || 0);
      }
      if (sortBy === "time") return a.time.localeCompare(b.time);
      return 0;
    });
  }, [selectedDirection, selectedCategory, selectedLevel, selectedStatus, searchQuery, sortBy, favorites, attempts]);

  // Best attempts map
  const bestAttempts = useMemo(() => {
    const map = new Map();
    attempts.forEach((att) => {
      const existing = map.get(att.caseId);
      if (!existing || att.score > existing.score) map.set(att.caseId, att);
    });
    return map;
  }, [attempts]);

  // Evaluation engine
  const handleEvaluate = () => {
    const questions = currentCase.questions;
    let totalScore = 0;
    const dimensionsMap = new Map();
    const feedbacks = [];

    questions.forEach((q, idx) => {
      const ans = (answers[idx] || "").trim();
      const ansLower = ans.toLowerCase();
      let matchedCount = 0;

      if (q.signals && q.signals.length > 0) {
        q.signals.forEach((sig) => {
          if (sig.test(ansLower)) matchedCount++;
        });
      }

      const ratio = q.signals && q.signals.length > 0 ? matchedCount / q.signals.length : (ans.length >= 100 ? 1 : 0.5);
      const qScore = Math.round(ratio * q.max);
      totalScore += qScore;

      // Dimension aggregate
      const dimName = q.dimension || "Анализ";
      const curDim = dimensionsMap.get(dimName) || { score: 0, max: 0 };
      dimensionsMap.set(dimName, {
        score: curDim.score + qScore,
        max: curDim.max + q.max
      });

      feedbacks.push({
        short: q.short,
        title: q.title,
        prompt: q.prompt,
        userAnswer: ans,
        score: qScore,
        max: q.max,
        note: q.note,
        gap: q.gap,
        matchedRatio: Math.round(ratio * 100)
      });
    });

    const passed = totalScore >= 60;
    const dimensions = Array.from(dimensionsMap.entries()).map(([name, data]) => ({
      name,
      score: data.score,
      max: data.max,
      percent: data.max > 0 ? Math.round((data.score / data.max) * 100) : 0
    }));

    const resultObj = {
      id: Date.now(),
      caseId: currentCase.id,
      caseTitle: currentCase.title,
      score: totalScore,
      passed,
      date: new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
      dimensions,
      feedbacks,
      answers: [...answers]
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

  // Solved counts
  const solvedCount = useMemo(() => {
    return new Set(attempts.filter((a) => a.passed).map((a) => a.caseId)).size;
  }, [attempts]);

  const solvedOrgCount = useMemo(() => {
    const orgIds = new Set(cases.filter((c) => c.direction.includes("Организационн")).map((c) => c.id));
    return new Set(attempts.filter((a) => a.passed && orgIds.has(a.caseId)).map((a) => a.caseId)).size;
  }, [attempts]);

  const solvedClinCount = useMemo(() => {
    const clinIds = new Set(cases.filter((c) => !c.direction.includes("Организационн")).map((c) => c.id));
    return new Set(attempts.filter((a) => a.passed && clinIds.has(a.caseId)).map((a) => a.caseId)).size;
  }, [attempts]);

  const averageScore = useMemo(() => {
    if (attempts.length === 0) return 0;
    return Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length);
  }, [attempts]);

  const bestScore = useMemo(() => {
    if (attempts.length === 0) return 0;
    return attempts.reduce((max, a) => Math.max(max, a.score), 0);
  }, [attempts]);

  // Sources filtering
  const filteredSources = useMemo(() => {
    return sources.filter((s) => {
      if (sourceLang === "ru" && s.language !== "RU") return false;
      if (sourceLang === "en" && s.language !== "EN") return false;
      if (sourceSearch.trim()) {
        const q = sourceSearch.toLowerCase();
        const matchTitle = s.title.toLowerCase().includes(q);
        const matchOrg = s.org.toLowerCase().includes(q);
        const matchFocus = s.focus && s.focus.toLowerCase().includes(q);
        if (!matchTitle && !matchOrg && !matchFocus) return false;
      }
      return true;
    });
  }, [sourceLang, sourceSearch]);

  return (
    <div className="site-wrapper">
      {/* Toast Notification */}
      {toast && (
        <div className="toast-notice" role="alert">
          <span>{toast}</span>
        </div>
      )}

      {/* Global Header */}
      <header className="site-header">
        <button
          type="button"
          className="brand-button"
          onClick={() => navigateTo("home")}
          aria-label="На главную"
        >
          <span className="brand">
            <span className="brand-mark">Ψ</span>
            <span>
              <b>Тренажёр психолога</b>
              <small>Научный сектор психологии ТФ МГУ</small>
            </span>
          </span>
        </button>

        <nav aria-label="Основная навигация">
          <button
            type="button"
            className={tab === "home" ? "active" : ""}
            onClick={() => navigateTo("home")}
          >
            Главная
          </button>
          <button
            type="button"
            className={tab === "catalog" ? "active" : ""}
            onClick={() => navigateTo("catalog")}
          >
            Кейсы ({cases.length})
          </button>
          <button
            type="button"
            className={tab === "profile" ? "active" : ""}
            onClick={() => navigateTo("profile")}
          >
            Профиль {solvedCount > 0 ? `(${solvedCount})` : ""}
          </button>
          <button
            type="button"
            className={tab === "guide" ? "active" : ""}
            onClick={() => navigateTo("guide")}
          >
            Методика
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
        </nav>

        <button
          type="button"
          className="header-cta"
          onClick={() => {
            setCurrentCaseId(cases[0].id);
            navigateTo("practice");
          }}
        >
          Решать кейс
        </button>
      </header>

      {/* VIEW: HOME */}
      {tab === "home" && (
        <main className="home-view">
          <section className="hero">
            <div className="bauhaus-grid">
              <span className="hero-shape hero-ring"></span>
              <span className="hero-shape hero-quarter"></span>
              <span className="hero-dots"></span>
            </div>
            <div className="hero-frame">
              <div className="hero-copy">
                <span className="eyebrow">Интерактивный практикум для психологов и консультантов</span>
                <h1>
                  Тренажёр диагностического мышления и <em>оргконсалтинга</em>
                </h1>
                <p>
                  Практикуйтесь в решении сложных кейсов из клинической и организационной психологии:
                  от кризисных состояний и оценки суицидального риска до фасилитации сопротивления
                  изменениям, аудита психологической безопасности и урегулирования статусных конфликтов.
                </p>
                <div className="hero-actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => navigateTo("catalog")}
                  >
                    <span>Открыть каталог (37 кейсов)</span>
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => navigateTo("guide")}
                  >
                    <span>Методический гид</span>
                  </button>
                </div>
              </div>

              <div className="hero-index">
                <div className="hero-stat-card">
                  <b>37</b>
                  <span>Кейсов в базе практики</span>
                </div>
                <div className="hero-stat-card">
                  <b>2</b>
                  <span>Направления (Клиническое + Орг)</span>
                </div>
                <div className="hero-stat-card">
                  <b>33</b>
                  <span>Стандарта (NICE, WHO, APA, ISO)</span>
                </div>
                <div className="hero-stat-card">
                  <b>100%</b>
                  <span>Объективная рубрика и эталоны</span>
                </div>
              </div>
            </div>
          </section>

          {/* Principles Strip */}
          <section className="principles-strip">
            <div className="principles-track">
              <div className="principle-item">
                <b>01 / ФАКТЫ</b>
                <p>Отделение объективных данных от субъективных домыслов и поспешных диагнозов.</p>
              </div>
              <div className="principle-item">
                <b>02 / СИСТЕМНОСТЬ</b>
                <p>Учёт организационной структуры, групповой динамики и психологического контекста.</p>
              </div>
              <div className="principle-item">
                <b>03 / ЭТИКА</b>
                <p>Соблюдение границ роли консультанта, правил конфиденциальности и информированного согласия.</p>
              </div>
              <div className="principle-item">
                <b>04 / ИЗМЕРИМОСТЬ</b>
                <p>Разработка конкретных критериев эффективности и реалистичных дорожных карт.</p>
              </div>
            </div>
          </section>

          {/* Direction Highlights */}
          <section className="home-sections">
            <div className="home-sections-heading">
              <span className="kicker">Два направления профессионального развития</span>
              <h2>Выберите блок для отработки компетенций</h2>
            </div>

            <div className="section-hub-grid">
              <div className="hub-card org-hub">
                <span className="hub-tag" style={{ background: "#2d5a7b" }}>27 кейсов</span>
                <h3>Организационная психология и HR-консалтинг</h3>
                <p>
                  Управление изменениями, преодоление сопротивления цифровизации, профилактика
                  выгорания при кранчах, синдром выживших после сокращений, психологическая
                  безопасность по Эдмондсон, ассессмент лидеров и межкультурные коммуникации.
                </p>
                <div className="hub-meta">
                  <span>Темы: Лидерство • Выгорание • Культура • Переходы</span>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  style={{ background: "#2d5a7b", borderColor: "#2d5a7b" }}
                  onClick={() => {
                    setSelectedDirection("org");
                    navigateTo("catalog");
                  }}
                >
                  <span>Организационные кейсы →</span>
                </button>
              </div>

              <div className="hub-card clin-hub">
                <span className="hub-tag" style={{ background: "#c74b35" }}>10 кейсов</span>
                <h3>Клиническая и консультативная психология</h3>
                <p>
                  Кризисная интервенция, оценка суицидального риска, дифференциальная диагностика,
                  работа с паническими атаками, ОКР, подростковым самоповреждением, травмой,
                  аддиктивным поведением и нейроразнообразием по протоколам NICE и ВОЗ.
                </p>
                <div className="hub-meta">
                  <span>Темы: Кризис • Травма • ОКР • Депрессия • Этический кодекс</span>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  style={{ background: "#c74b35", borderColor: "#c74b35" }}
                  onClick={() => {
                    setSelectedDirection("clin");
                    navigateTo("catalog");
                  }}
                >
                  <span>Клинические кейсы →</span>
                </button>
              </div>
            </div>
          </section>

          {/* Featured Cases */}
          <section className="featured-cases-section">
            <div className="home-sections-heading">
              <span className="kicker">Рекомендуемые сценарии</span>
              <h2>Актуальные кейсы для тренировки</h2>
            </div>

            <div className="cases-grid">
              {cases.slice(10, 13).map((c) => (
                <div key={c.id} className="case-card">
                  <div className="case-card-header">
                    <span className="case-index" style={{ background: c.accent }}>
                      {c.index}
                    </span>
                    <button
                      type="button"
                      className={`fav-btn ${favorites.includes(c.id) ? "active" : ""}`}
                      onClick={(e) => toggleFavorite(c.id, e)}
                      title="В избранное"
                    >
                      ★
                    </button>
                  </div>
                  <span className="case-category-pill">{c.category}</span>
                  <h3>{c.title}</h3>
                  <p>{c.summary}</p>
                  <div className="case-card-footer">
                    <span className="case-level">{c.level}</span>
                    <span className="case-time">{c.time}</span>
                    <button
                      type="button"
                      className="card-action-btn"
                      onClick={() => {
                        setCurrentCaseId(c.id);
                        navigateTo("case");
                      }}
                    >
                      К кейсу →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

      {/* VIEW: CATALOG */}
      {tab === "catalog" && (
        <main className="catalog-view">
          <div className="catalog-header">
            <div className="catalog-title-group">
              <span className="kicker">Банк учебных и практических ситуаций</span>
              <h1>Каталог психологических кейсов</h1>
              <p>
                В базе представлено 37 структурированных кейсов с методическими вопросами,
                автоматической оценкой ответов и экспертными эталонами.
              </p>
            </div>
          </div>

          {/* Direction Filter Tabs */}
          <div className="direction-tabs-container">
            <button
              type="button"
              className={`direction-tab-btn ${selectedDirection === "all" ? "active" : ""}`}
              onClick={() => {
                setSelectedDirection("all");
                setSelectedCategory("Все");
              }}
            >
              <span>Все направления</span>
              <span className="direction-tab-badge">{cases.length}</span>
            </button>
            <button
              type="button"
              className={`direction-tab-btn ${selectedDirection === "org" ? "active" : ""}`}
              onClick={() => {
                setSelectedDirection("org");
                setSelectedCategory("Все");
              }}
            >
              <span>Организационная психология</span>
              <span className="direction-tab-badge">27</span>
            </button>
            <button
              type="button"
              className={`direction-tab-btn ${selectedDirection === "clin" ? "active" : ""}`}
              onClick={() => {
                setSelectedDirection("clin");
                setSelectedCategory("Все");
              }}
            >
              <span>Клиническое консультирование</span>
              <span className="direction-tab-badge">10</span>
            </button>
          </div>

          {/* Search & Select Controls */}
          <div className="catalog-controls">
            <div className="catalog-search-wrap">
              <input
                type="text"
                className="catalog-search-input"
                placeholder="Поиск по названию, компании, дилемме или компетенциям…"
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

            <select
              className="catalog-select"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              aria-label="Фильтр по сложности"
            >
              <option value="all">Все уровни сложности</option>
              <option value="Базовый">Базовый</option>
              <option value="Продвинутый">Продвинутый</option>
              <option value="Экспертный">Экспертный</option>
            </select>

            <select
              className="catalog-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Фильтр по статусу"
            >
              <option value="all">Все статусы</option>
              <option value="solved">Только решённые</option>
              <option value="draft">В черновике</option>
              <option value="fav">Только избранные ★</option>
            </select>

            <select
              className="catalog-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Сортировка"
            >
              <option value="index">По номеру (по порядку)</option>
              <option value="level">По уровню сложности</option>
              <option value="time">По времени решения</option>
            </select>
          </div>

          {/* Category Filter Pills */}
          <div className="category-pills-bar">
            {availableCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-pill ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Case Cards Grid */}
          <div className="catalog-results-info">
            <span>Найдено кейсов: <b>{filteredCases.length}</b> из {cases.length}</span>
          </div>

          <div className="cases-grid">
            {filteredCases.map((c) => {
              const best = bestAttempts.get(c.id);
              const isFav = favorites.includes(c.id);

              return (
                <div key={c.id} className="case-card">
                  <div className="case-card-header">
                    <span className="case-index" style={{ background: c.accent }}>
                      {c.index}
                    </span>
                    <div className="case-header-right">
                      {best && (
                        <span className={`status-badge-inline ${best.passed ? "passed" : "retry"}`}>
                          {best.score}/100
                        </span>
                      )}
                      <button
                        type="button"
                        className={`fav-btn ${isFav ? "active" : ""}`}
                        onClick={(e) => toggleFavorite(c.id, e)}
                        title={isFav ? "Удалить из избранного" : "Добавить в избранное"}
                      >
                        ★
                      </button>
                    </div>
                  </div>

                  <div className="case-card-meta">
                    <span className="direction-label">{c.direction}</span>
                    <span className="case-category-pill">{c.category}</span>
                  </div>

                  <h3>{c.title}</h3>
                  <p>{c.summary}</p>

                  <div className="competencies-chips">
                    {c.competencies &&
                      c.competencies.slice(0, 3).map((comp, i) => (
                        <span key={i} className="comp-chip">
                          {comp}
                        </span>
                      ))}
                  </div>

                  <div className="case-card-footer">
                    <div className="meta-specs">
                      <span className="case-level">{c.level}</span>
                      <span className="case-time">{c.time}</span>
                    </div>

                    <button
                      type="button"
                      className="primary-button card-btn"
                      onClick={() => {
                        setCurrentCaseId(c.id);
                        navigateTo("case");
                      }}
                    >
                      <span>Решать</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCases.length === 0 && (
            <div className="empty-state">
              <h3>По заданным параметрам кейсы не найдены</h3>
              <p>Попробуйте сбросить поисковый запрос или выбрать категорию «Все».</p>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setSelectedCategory("Все");
                  setSelectedLevel("all");
                  setSelectedStatus("all");
                  setSearchQuery("");
                }}
              >
                <span>Сбросить фильтры</span>
              </button>
            </div>
          )}
        </main>
      )}

      {/* VIEW: CASE DETAIL */}
      {tab === "case" && (
        <main className="case-detail-view">
          <div className="case-detail-container">
            <button
              type="button"
              className="back-link"
              onClick={() => navigateTo("catalog")}
            >
              ← Вернуться в каталог
            </button>

            <div className="case-detail-header">
              <div className="case-title-row">
                <span className="case-index-hero" style={{ background: currentCase.accent }}>
                  {currentCase.index}
                </span>
                <div>
                  <span className="direction-label">{currentCase.direction}</span>
                  <h1>{currentCase.title}</h1>
                </div>
                <button
                  type="button"
                  className={`fav-btn-hero ${favorites.includes(currentCase.id) ? "active" : ""}`}
                  onClick={(e) => toggleFavorite(currentCase.id, e)}
                  title="В избранное"
                >
                  ★
                </button>
              </div>

              <div className="case-meta-row">
                <span className="case-badge">{currentCase.category}</span>
                <span className="case-badge">{currentCase.level}</span>
                <span className="case-badge">{currentCase.time}</span>
                {bestAttempts.get(currentCase.id) && (
                  <span className="case-badge success">
                    Лучший результат: {bestAttempts.get(currentCase.id).score}/100
                  </span>
                )}
              </div>
            </div>

            {currentCase.warning && (
              <div className="warning-banner" role="alert">
                <b>Внимание:</b> {currentCase.warning}
              </div>
            )}

            {currentCase.quote && (
              <blockquote className="case-quote">
                «{currentCase.quote}»
              </blockquote>
            )}

            <section className="case-facts-section">
              <h2>Факты и контекст ситуации</h2>
              <div className="facts-list">
                {currentCase.facts.map((fact, i) => (
                  <div key={i} className="fact-item">
                    <span className="fact-num">{String(i + 1).padStart(2, "0")}</span>
                    <p>{fact}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="case-competencies-section">
              <h3>Оцениваемые профессиональные компетенции</h3>
              <div className="competencies-chips large">
                {currentCase.competencies &&
                  currentCase.competencies.map((comp, i) => (
                    <span key={i} className="comp-chip">
                      {comp}
                    </span>
                  ))}
              </div>
            </section>

            <div className="case-start-actions">
              <button
                type="button"
                className="primary-button large-btn"
                onClick={() => navigateTo("practice")}
              >
                <span>Начать решение кейса →</span>
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={clearDraft}
              >
                <span>Сбросить черновик</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* VIEW: PRACTICE */}
      {tab === "practice" && (
        <main className="practice-view">
          {/* Top Sticky Bar: Timer, Auto-Save, View Mode & Export */}
          <div className="practice-top-bar">
            <div className="top-bar-left">
              <button
                type="button"
                className="back-btn-sm"
                onClick={() => navigateTo("case")}
              >
                ← К описанию
              </button>
              <span className="case-bar-title">
                <b>Кейс {currentCase.index}:</b> {currentCase.title}
              </span>
            </div>

            <div className="top-bar-middle">
              {/* Timer */}
              <div className={`timer-pill ${timerSeconds < 300 ? "urgent" : ""}`}>
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

              {lastSavedTime && (
                <span className="save-status-pill">
                  💾 Сохранено {lastSavedTime}
                </span>
              )}
            </div>

            <div className="top-bar-right">
              <div className="view-mode-toggle">
                <button
                  type="button"
                  className={`toggle-sm-btn ${viewMode === "stepper" ? "active" : ""}`}
                  onClick={() => setViewMode("stepper")}
                >
                  По шагам
                </button>
                <button
                  type="button"
                  className={`toggle-sm-btn ${viewMode === "all" ? "active" : ""}`}
                  onClick={() => setViewMode("all")}
                >
                  Все вопросы
                </button>
              </div>

              <button
                type="button"
                className="icon-action-btn"
                onClick={copySolution}
                title="Скопировать всё решение в буфер обмена"
              >
                📋 Копировать
              </button>
              <button
                type="button"
                className="icon-action-btn"
                onClick={downloadSolution}
                title="Скачать решение как Markdown"
              >
                📥 Скачать .md
              </button>
            </div>
          </div>

          <div className="practice-layout">
            {/* Left Stepper Sidebar */}
            <aside className="practice-sidebar" style={{ "--case-accent": currentCase.accent }}>
              <span className="case-direction">{currentCase.direction}</span>
              <h2>{currentCase.title}</h2>

              <ol>
                {currentCase.questions.map((q, idx) => {
                  const isDone = (answers[idx] || "").trim().length >= 40;
                  const isCurrent = currentStep === idx && viewMode === "stepper";

                  return (
                    <li
                      key={idx}
                      className={`${isCurrent ? "current" : ""} ${isDone ? "done" : ""}`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentStep(idx);
                          if (viewMode !== "stepper") setViewMode("stepper");
                        }}
                      >
                        <span>{idx + 1}</span>
                        <b>{q.short || `Вопрос ${idx + 1}`}</b>
                      </button>
                    </li>
                  );
                })}
              </ol>

              <div className="progress-summary">
                <span>Заполнено вопросов</span>
                <b>
                  {answers.filter((a) => (a || "").trim().length >= 40).length} из{" "}
                  {currentCase.questions.length}
                </b>
                <div>
                  <i
                    style={{
                      width: `${(answers.filter((a) => (a || "").trim().length >= 40).length / currentCase.questions.length) * 100}%`
                    }}
                  ></i>
                </div>
              </div>

              <div className="sidebar-toolbox">
                <button
                  type="button"
                  className="sidebar-tool-btn"
                  onClick={() => setIsContextDrawerOpen(!isContextDrawerOpen)}
                >
                  📖 {isContextDrawerOpen ? "Скрыть факты кейса" : "Показать факты кейса"}
                </button>
                <button
                  type="button"
                  className="sidebar-tool-btn danger"
                  onClick={clearDraft}
                >
                  🗑 Очистить черновик
                </button>
              </div>
            </aside>

            {/* Workspace Area */}
            <section className="question-workspace">
              {/* Collapsible Context Panel (Accessible on demand) */}
              {isContextDrawerOpen && (
                <div className="context-panel">
                  <div
                    className="context-panel-header"
                    onClick={() => setIsContextDrawerOpen(false)}
                  >
                    <span className="context-panel-title">
                      📋 Исходные факты ситуации (свернуть)
                    </span>
                    <span>✕</span>
                  </div>
                  <div className="facts-list compact">
                    {currentCase.facts.map((fact, i) => (
                      <p key={i}>
                        <b>{i + 1}.</b> {fact}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* STEPPER MODE */}
              {viewMode === "stepper" && (
                <div className="stepper-content">
                  {(() => {
                    const q = currentCase.questions[currentStep];
                    const currentAnswer = answers[currentStep] || "";
                    const charCount = currentAnswer.length;
                    const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0;

                    return (
                      <div className="single-question-box">
                        <div className="question-count">
                          Вопрос {currentStep + 1} из {currentCase.questions.length} • Максимум {q.max} баллов
                        </div>
                        <h1>{q.title}</h1>
                        <p className="question-prompt">{q.prompt}</p>

                        <div className="question-hint">
                          <b>Методический фокус:</b> {q.hint}
                        </div>

                        <div className="textarea-header">
                          <label htmlFor={`answer-${currentStep}`}>
                            Ваш профессиональный ответ:
                          </label>
                          <span
                            className={`word-badge ${charCount < 40 ? "short" : charCount < 150 ? "good" : "deep"}`}
                          >
                            {charCount < 40
                              ? "Кратко (<40 симв.)"
                              : charCount < 150
                              ? "Базовый ответ"
                              : "Развернутый ответ"} ({wordCount} слов, {charCount} симв.)
                          </span>
                        </div>

                        <div className="textarea-wrap">
                          <textarea
                            id={`answer-${currentStep}`}
                            rows={10}
                            placeholder={q.placeholder}
                            value={currentAnswer}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAnswers((prev) => {
                                const next = [...prev];
                                next[currentStep] = val;
                                return next;
                              });
                            }}
                          ></textarea>
                        </div>

                        <div className="question-stepper-nav">
                          <button
                            type="button"
                            className="secondary-button"
                            disabled={currentStep === 0}
                            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                          >
                            ← Предыдущий вопрос
                          </button>

                          {currentStep < currentCase.questions.length - 1 ? (
                            <button
                              type="button"
                              className="primary-button"
                              onClick={() => setCurrentStep((prev) => prev + 1)}
                            >
                              <span>Следующий вопрос →</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="primary-button highlight"
                              onClick={handleEvaluate}
                            >
                              <span>Завершить и оценить решение ✓</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ALL QUESTIONS MODE */}
              {viewMode === "all" && (
                <div className="all-questions-content">
                  {currentCase.questions.map((q, idx) => {
                    const currentAnswer = answers[idx] || "";
                    const charCount = currentAnswer.length;
                    const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0;

                    return (
                      <div key={idx} className="question-block-card">
                        <div className="question-count">
                          Вопрос {idx + 1} из {currentCase.questions.length} • {q.max} баллов
                        </div>
                        <h2>{q.title}</h2>
                        <p className="question-prompt">{q.prompt}</p>
                        <div className="question-hint">
                          <b>Совет:</b> {q.hint}
                        </div>

                        <div className="textarea-header">
                          <label htmlFor={`all-ans-${idx}`}>Ответ:</label>
                          <span
                            className={`word-badge ${charCount < 40 ? "short" : charCount < 150 ? "good" : "deep"}`}
                          >
                            {charCount < 40 ? "Кратко" : charCount < 150 ? "Базовый" : "Развернутый"} ({wordCount} сл., {charCount} зн.)
                          </span>
                        </div>

                        <div className="textarea-wrap">
                          <textarea
                            id={`all-ans-${idx}`}
                            rows={7}
                            placeholder={q.placeholder}
                            value={currentAnswer}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAnswers((prev) => {
                                const next = [...prev];
                                next[idx] = val;
                                return next;
                              });
                            }}
                          ></textarea>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Self-Check Checklist */}
              <div className="self-check-card">
                <h4>Чеклист самопроверки перед отправкой:</h4>
                <label className="self-check-item">
                  <input
                    type="checkbox"
                    checked={selfCheck.facts}
                    onChange={(e) => setSelfCheck({ ...selfCheck, facts: e.target.checked })}
                  />
                  <span>Отделил объективные факты от гипотез, домыслов и субъективных оценок</span>
                </label>
                <label className="self-check-item">
                  <input
                    type="checkbox"
                    checked={selfCheck.system}
                    onChange={(e) => setSelfCheck({ ...selfCheck, system: e.target.checked })}
                  />
                  <span>Учёл организационный / семейный контекст и системные взаимосвязи</span>
                </label>
                <label className="self-check-item">
                  <input
                    type="checkbox"
                    checked={selfCheck.ethics}
                    onChange={(e) => setSelfCheck({ ...selfCheck, ethics: e.target.checked })}
                  />
                  <span>Проверил границы роли консультанта, этику и конфиденциальность</span>
                </label>
                <label className="self-check-item">
                  <input
                    type="checkbox"
                    checked={selfCheck.solution}
                    onChange={(e) => setSelfCheck({ ...selfCheck, solution: e.target.checked })}
                  />
                  <span>Сформулировал измеримые критерии успеха и реалистичные шаги решения</span>
                </label>
              </div>

              {/* Final Submit Bar */}
              <div className="submit-bar">
                <button
                  type="button"
                  className="primary-button large-btn full"
                  onClick={handleEvaluate}
                >
                  <span>Проверить решение и открыть эталонный разбор →</span>
                </button>
              </div>
            </section>
          </div>
        </main>
      )}

      {/* VIEW: RESULT */}
      {tab === "result" && evaluation && (
        <main className="result-view">
          <div className="result-container">
            <button
              type="button"
              className="back-link"
              onClick={() => navigateTo("catalog")}
            >
              ← Вернуться в каталог
            </button>

            {/* Score Hero Card */}
            <div className={`score-hero-card ${evaluation.passed ? "passed" : "retry"}`}>
              <div className="score-hero-badge">
                <b>{evaluation.score}</b>
                <span>из 100 баллов</span>
              </div>
              <div className="score-hero-info">
                <span className="kicker">Результаты автоматической экспертизы</span>
                <h2>
                  {evaluation.score >= 80
                    ? "Отличный уровень решения!"
                    : evaluation.score >= 60
                    ? "Уверенное владение компетенциями"
                    : "Базовый уровень — требуется доработка"}
                </h2>
                <p>
                  Кейс <b>{currentCase.index}</b>: «{currentCase.title}». Дата проверки: {evaluation.date}.
                </p>
                <div className="score-actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => navigateTo("practice")}
                  >
                    <span>Доработать решение</span>
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      const curIdx = cases.findIndex((c) => c.id === currentCase.id);
                      if (curIdx < cases.length - 1) {
                        setCurrentCaseId(cases[curIdx + 1].id);
                        navigateTo("case");
                      } else {
                        navigateTo("catalog");
                      }
                    }}
                  >
                    <span>Следующий кейс →</span>
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={downloadSolution}
                  >
                    <span>Скачать отчёт (.md)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Dimensions Progress Bars */}
            <section className="dimensions-section">
              <h3>Оценка по ключевым измерениям</h3>
              <div className="dimensions-grid">
                {evaluation.dimensions.map((dim, i) => (
                  <div key={i} className="dimension-bar-item">
                    <div className="dim-bar-header">
                      <b>{dim.name}</b>
                      <span>{dim.percent}% ({dim.score}/{dim.max})</span>
                    </div>
                    <div className="dim-track">
                      <div className="dim-fill" style={{ width: `${dim.percent}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Question by Question Feedback */}
            <section className="feedbacks-section">
              <h3>Детальный анализ ответов</h3>
              <div className="feedbacks-list">
                {evaluation.feedbacks.map((fb, i) => (
                  <div key={i} className="feedback-card">
                    <div className="fb-header">
                      <span className="fb-q-num">Вопрос {i + 1}</span>
                      <h4>{fb.title}</h4>
                      <span className="fb-score">
                        {fb.score} / {fb.max} баллов
                      </span>
                    </div>

                    <div className="fb-user-answer">
                      <b>Ваш ответ:</b>
                      <p>{fb.userAnswer || "(Ответ не был заполнен)"}</p>
                    </div>

                    <div className="fb-notes">
                      <div className="fb-note-item success">
                        <b>Учтено:</b> {fb.note}
                      </div>
                      {fb.score < fb.max && (
                        <div className="fb-note-item warning">
                          <b>Рекомендация по углублению:</b> {fb.gap}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Full Reference Benchmark */}
            {currentBenchmark && (
              <section className="benchmark-card-box">
                <div className="benchmark-header">
                  <span className="kicker">Академический стандарт</span>
                  <h2>Эталонный разбор кейса экспертом</h2>
                </div>

                <div className="benchmark-section">
                  <div className="benchmark-label">🎯 Ключевой методологический фокус</div>
                  <div className="benchmark-body">{currentBenchmark.focus}</div>
                </div>

                <div className="benchmark-section">
                  <div className="benchmark-label">🧭 Пошаговая логика рассуждения</div>
                  <div className="benchmark-body">{currentBenchmark.logic}</div>
                </div>

                <div className="benchmark-section">
                  <div className="benchmark-label">⚠️ Типичные ошибки и когнитивные ловушки</div>
                  <div className="benchmark-avoid-box">{currentBenchmark.avoid}</div>
                </div>

                <div className="benchmark-section">
                  <div className="benchmark-label">📚 Ключевые профессиональные термины</div>
                  <div className="benchmark-terms-list">
                    {currentBenchmark.terms.map((term, i) => (
                      <span key={i} className="benchmark-term-chip">
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>
      )}

      {/* VIEW: PROFILE */}
      {tab === "profile" && (
        <main className="profile-view">
          <div className="profile-container">
            <div className="profile-header">
              <span className="kicker">Личный прогресс и статистика</span>
              <h1>Кабинет практикующего специалиста</h1>
              <p>Отслеживайте освоение профессиональных кейсов и историю решений.</p>
            </div>

            {/* Stats Metrics */}
            <div className="profile-stats-grid">
              <div className="stat-box">
                <b>{cases.length}</b>
                <span>Всего кейсов в базе</span>
              </div>
              <div className="stat-box">
                <b>{solvedCount}</b>
                <span>Решено успешно ({Math.round((solvedCount / cases.length) * 100)}%)</span>
              </div>
              <div className="stat-box">
                <b>{averageScore}</b>
                <span>Средний балл решений</span>
              </div>
              <div className="stat-box">
                <b>{bestScore}</b>
                <span>Лучший результат</span>
              </div>
            </div>

            {/* Direction Progress */}
            <div className="direction-progress-row">
              <div className="dir-progress-card">
                <h4>Организационная психология</h4>
                <div className="dir-progress-bar">
                  <div
                    className="dir-progress-fill"
                    style={{
                      width: `${(solvedOrgCount / 27) * 100}%`,
                      background: "#2d5a7b"
                    }}
                  ></div>
                </div>
                <span>{solvedOrgCount} из 27 кейсов освоено</span>
              </div>

              <div className="dir-progress-card">
                <h4>Клиническое консультирование</h4>
                <div className="dir-progress-bar">
                  <div
                    className="dir-progress-fill"
                    style={{
                      width: `${(solvedClinCount / 10) * 100}%`,
                      background: "#c74b35"
                    }}
                  ></div>
                </div>
                <span>{solvedClinCount} из 10 кейсов освоено</span>
              </div>
            </div>

            {/* Favorite Cases Section */}
            {favorites.length > 0 && (
              <section className="profile-section">
                <h3>Избранные кейсы ({favorites.length})</h3>
                <div className="cases-grid compact">
                  {cases
                    .filter((c) => favorites.includes(c.id))
                    .map((c) => (
                      <div key={c.id} className="case-card">
                        <div className="case-card-header">
                          <span className="case-index" style={{ background: c.accent }}>
                            {c.index}
                          </span>
                          <button
                            type="button"
                            className="fav-btn active"
                            onClick={(e) => toggleFavorite(c.id, e)}
                          >
                            ★
                          </button>
                        </div>
                        <h4>{c.title}</h4>
                        <span className="case-category-pill">{c.category}</span>
                        <button
                          type="button"
                          className="card-action-btn"
                          onClick={() => {
                            setCurrentCaseId(c.id);
                            navigateTo("case");
                          }}
                        >
                          Решать →
                        </button>
                      </div>
                    ))}
                </div>
              </section>
            )}

            {/* Attempts History */}
            <section className="profile-section">
              <div className="section-header-flex">
                <h3>История решений ({attempts.length})</h3>
                {attempts.length > 0 && (
                  <button
                    type="button"
                    className="text-button danger"
                    onClick={() => {
                      if (window.confirm("Очистить всю историю решений?")) {
                        localStorage.removeItem("psy-trainer-attempts-v2");
                        localStorage.removeItem("psy-trainer-attempts");
                        setAttempts([]);
                        showToast("История очищена");
                      }
                    }}
                  >
                    Очистить историю
                  </button>
                )}
              </div>

              {attempts.length > 0 ? (
                <div className="attempts-table-wrap">
                  <table className="attempts-table">
                    <thead>
                      <tr>
                        <th>Кейс</th>
                        <th>Дата</th>
                        <th>Балл</th>
                        <th>Статус</th>
                        <th>Действие</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attempts.map((att) => (
                        <tr key={att.id}>
                          <td><b>{att.caseTitle}</b></td>
                          <td>{att.date}</td>
                          <td><b>{att.score}</b> / 100</td>
                          <td>
                            <span className={`status-pill ${att.passed ? "passed" : "retry"}`}>
                              {att.passed ? "Сдан" : "Требует доработки"}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="text-link"
                              onClick={() => {
                                setCurrentCaseId(att.caseId);
                                if (att.answers && att.answers.length > 0) {
                                  setAnswers(att.answers);
                                }
                                navigateTo("case");
                              }}
                            >
                              Открыть →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-hint">Вы ещё не завершили ни одного кейса. Перейдите в каталог для начала практики!</p>
              )}
            </section>
          </div>
        </main>
      )}

      {/* VIEW: GUIDE */}
      {tab === "guide" && (
        <main className="guide-view">
          <div className="guide-container">
            <span className="kicker">Методологические основы</span>
            <h1>Гид по решению кейсов и клинико-организационному анализу</h1>
            <p>
              Решение практического кейса в психологии — это демонстрация логики рассуждения,
              способности опираться на доказанные факты и проектировать этичные, безопасные интервенции.
            </p>

            <div className="guide-grid">
              <div className="guide-card">
                <h3>1. Разделение данных и допущений</h3>
                <p>
                  Никогда не начинайте с постановки диагноза или навешивания ярлыков («манипуляция»,
                  «сопротивление», «токсичность»). Сначала зафиксируйте строго проверяемые факты:
                  поведение, события, конкретные фразы, объективные метрики. Все интерпретации оформляйте
                  как проверяемые рабочие гипотезы.
                </p>
              </div>

              <div className="guide-card">
                <h3>2. Анализ системного контекста</h3>
                <p>
                  Симптом или конфликт никогда не существуют в вакууме. В семейном консультировании
                  учитывайте структуру взаимоотношений и явные/скрытые запросы участников. В организационном
                  консалтинге — структуру власти, систему KPI, неформальные коалиции и психологическую
                  безопасность среды.
                </p>
              </div>

              <div className="guide-card">
                <h3>3. Профессиональная этика и границы</h3>
                <p>
                  Чётко разграничивайте роли: оргконсультант не имеет права проводить психотерапию сотрудников;
                  психолог подростка обязан соблюдать конфиденциальность и не может быть шпионом для родителей;
                  руководитель не должен вторгаться в приватную жизнь подчинённых без их запроса.
                </p>
              </div>

              <div className="guide-card">
                <h3>4. Проектирование поддерживающей интервенции</h3>
                <p>
                  Решение должно быть поэтапным: от стабилизации безопасности и эмоционального контакта
                  до постепенной трансформации ролей, регламентов и навыков. Всегда формулируйте
                  критерии того, как вы поймёте, что интервенция сработала.
                </p>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* VIEW: KNOWLEDGE */}
      {tab === "knowledge" && (
        <main className="knowledge-view">
          <div className="knowledge-container">
            <span className="kicker">Теоретический фундамент</span>
            <h1>База знаний: модели и концепции</h1>
            <p>Ключевые теоретические конструкты, лежащие в основе анализа учебных кейсов тренажёра.</p>

            <div className="knowledge-list">
              <div className="knowledge-item">
                <h3>Психологическая безопасность (Amy Edmondson)</h3>
                <p>
                  Уверенность членов команды в том, что группа безопасна для межличностного риска:
                  сообщения об ошибках, предложения непопулярных идей или критики процессов не повлекут
                  наказания, насмешек или остракизма. Является ключевым фактором предотвращения производственного
                  брака и аварий.
                </p>
              </div>

              <div className="knowledge-item">
                <h3>Модель переходов Уильяма Бриджеса (Bridges Transition Model)</h3>
                <p>
                  Изменение — это внешнее событие (смена ПО, сокращение, ребрендинг). Переход — это внутренний
                  психологический процесс, проходящий через 3 стадии: Завершение (проживание утраты прежнего статуса),
                  Нейтральная зона (тревога, хаос и эксперименты) и Новое начало (интеграция новой идентичности).
                </p>
              </div>

              <div className="knowledge-item">
                <h3>Синдром выживших (Survivor Syndrome)</h3>
                <p>
                  Комплекс стрессовых реакций у сотрудников, оставшихся в компании после массовых сокращений:
                  чувство вины перед уволенными коллегами, страх следующей волны, резкое падение доверия к топ-менеджменту
                  и уход в защитное «тихое увольнение».
                </p>
              </div>

              <div className="knowledge-item">
                <h3>Оценка суицидального риска и самоповреждения (NICE & WHO)</h3>
                <p>
                  Прямое, спокойное и безоценочное прояснение суицидальных мыслей, намерений, плана и доступа к средствам.
                  Составление плана безопасности (Safety Plan), определение контактов экстренной помощи и недопустимость
                  сокрытия непосредственной угрозы жизни ради ложно понятой конфиденциальности.
                </p>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* VIEW: SOURCES */}
      {tab === "sources" && (
        <main className="sources-view">
          <div className="sources-container">
            <span className="kicker">Научно-методическая база</span>
            <h1>Источники, стандарты и клинические руководства</h1>
            <p>
              База регламентов и доказательных источников, на которые опираются кейсы и рубрики оценки:
              ВОЗ, NICE, РПО, APA, ISO, Harvard Business Review.
            </p>

            <div className="sources-filter-row">
              <div className="sources-search-wrap">
                <input
                  type="text"
                  className="catalog-search-input"
                  placeholder="Поиск по организации, названию или фокусу источника…"
                  value={sourceSearch}
                  onChange={(e) => setSourceSearch(e.target.value)}
                />
              </div>

              <div className="sources-lang-toggle">
                <button
                  type="button"
                  className={`toggle-sm-btn ${sourceLang === "all" ? "active" : ""}`}
                  onClick={() => setSourceLang("all")}
                >
                  Все ({sources.length})
                </button>
                <button
                  type="button"
                  className={`toggle-sm-btn ${sourceLang === "ru" ? "active" : ""}`}
                  onClick={() => setSourceLang("ru")}
                >
                  На русском
                </button>
                <button
                  type="button"
                  className={`toggle-sm-btn ${sourceLang === "en" ? "active" : ""}`}
                  onClick={() => setSourceLang("en")}
                >
                  На английском
                </button>
              </div>
            </div>

            <div className="sources-list">
              {filteredSources.map((s, i) => (
                <div key={s.id || i} className="source-card">
                  <div className="source-card-top">
                    <span className="source-org-badge">{s.org}</span>
                    <span className="source-year">{s.year}</span>
                    <span className="source-lang-pill">{s.language}</span>
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.focus}</p>
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="source-ext-link"
                    >
                      Официальный первоисточник ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* Global Footer */}
      <footer className="site-footer">
        <div className="footer-content">
          <div className="footer-left">
            <b>Тренажёр диагностического и клинического мышления</b>
            <p>
              Научный сектор психологии ТФ МГУ • Комплексная подготовка психологов-консультантов и
              организационных психологов.
            </p>
          </div>
          <div className="footer-right">
            <span>Всего кейсов: 37 • Источников: 33</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
