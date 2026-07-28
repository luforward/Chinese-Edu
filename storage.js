/* Local-only progress storage. No account or network is required. */
const AssimilStore = (() => {
  const KEY = "assimil-english-v1-progress";
  const defaults = { completedLessonIds: [], completedDates: [], reviewAttempts: 0, reviewCorrect: 0, lessonStates: {} };
  const read = () => { try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY)) }; } catch { return { ...defaults }; } };
  const write = (data) => localStorage.setItem(KEY, JSON.stringify(data));
  const dateKey = () => new Date().toISOString().slice(0, 10);
  function streak(dates) {
    const unique = new Set(dates); let total = 0; const cursor = new Date();
    while (unique.has(cursor.toISOString().slice(0, 10))) { total++; cursor.setDate(cursor.getDate() - 1); }
    return total;
  }
  return {
    get: read,
    saveLessonState(id, state) { const data = read(); data.lessonStates[id] = { ...data.lessonStates[id], ...state }; write(data); },
    getLessonState(id) { return read().lessonStates[id] || {}; },
    completeLesson(id) { const data = read(); if (!data.completedLessonIds.includes(id)) data.completedLessonIds.push(id); const today = dateKey(); if (!data.completedDates.includes(today)) data.completedDates.push(today); write(data); },
    recordReview(correct) { const data = read(); data.reviewAttempts++; if (correct) data.reviewCorrect++; write(data); },
    summary() { const data = read(); return { ...data, streak: streak(data.completedDates), accuracy: data.reviewAttempts ? Math.round(data.reviewCorrect / data.reviewAttempts * 100) : null }; },
    clear() { localStorage.removeItem(KEY); }
  };
})();
