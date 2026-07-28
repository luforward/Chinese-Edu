let lessons = [], lesson, step = 0, listenCount = 0, shadowIndex = 0, selectedRecallIndex = 0;
const $ = (s) => document.querySelector(s);
const screens = { home: $("#homeScreen"), lesson: $("#lessonScreen"), complete: $("#completeScreen") };
const steps = [
  { title: "先听一听", instruction: "先不看文字。连续听两遍，只感受节奏、语气和你能抓到的几个词。" },
  { title: "看英文", instruction: "现在边听边看英文。试着把每一句当作一个整体来理解。" },
  { title: "确认意思", instruction: "对照中文确认你理解的内容。不要逐词分析，抓住对话的意思就够了。" },
  { title: "影子跟读", instruction: "播放一句，马上跟着模仿。重点是节奏、停顿和语气，而不是完美。" },
  { title: "合书回忆", instruction: "只看中文，试着说或写出英文。表达接近就很好；再看看更自然的说法。" },
  { title: "最后再听", instruction: "最后完整听一遍。你会发现，现在已经能自然地听懂更多了。" }
];
function escapeHtml(text) { return text.replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c])); }
function chooseLesson(excludeId = null) {
  const choices = lessons.filter(item => item.id !== excludeId);
  const pool = choices.length ? choices : lessons;
  return pool[Math.floor(Math.random() * pool.length)];
}
function startCurrentLesson() {
  step = 0;
  listenCount = 0;
  shadowIndex = 0;
  selectedRecallIndex = 0;
  show("lesson");
  renderStep();
}
function nextPractice() {
  lesson = chooseLesson(lesson?.id);
  refreshHome();
  startCurrentLesson();
}
function renderLessonList() {
  const list = $("#lessonList");
  if (!list) return;
  list.innerHTML = lessons.map((item, index) => `<button class="lesson-choice ${item.id === lesson?.id ? "current" : ""}" type="button" data-lesson-index="${index}"><span class="lesson-number">${String(index + 1).padStart(2, "0")}</span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.topic)}</small></span><b>→</b></button>`).join("");
  list.querySelectorAll("[data-lesson-index]").forEach(button => {
    button.onclick = () => {
      lesson = lessons[Number(button.dataset.lessonIndex)];
      refreshHome();
      startCurrentLesson();
    };
  });
}
function speak(text, onEnd) {
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  utterance.onend = onEnd || null;
  speechSynthesis.speak(utterance);
}
function speakAll(done) { let i = 0; const next = () => { if (i >= lesson.dialogue.length) return done?.(); speak(lesson.dialogue[i++].en, () => setTimeout(next, 280)); }; next(); }
function dialogue(showTranslation = false, withButtons = true) { return `<div class="dialogue">${lesson.dialogue.map((l,i) => `<div class="line"><span class="speaker">${l.speaker}</span><span class="english">${escapeHtml(l.en)}</span>${showTranslation ? `<span class="translation">${escapeHtml(l.zh)}</span>` : ""}${withButtons ? `<button class="speaker-button" type="button" data-speak="${i}" aria-label="播放这一句">🔊</button>` : ""}</div>`).join("")}</div>`; }
function attachSpeakers() { document.querySelectorAll("[data-speak]").forEach(b => b.onclick = () => speak(lesson.dialogue[Number(b.dataset.speak)].en)); }
function renderStep() {
  $("#stepKicker").textContent = `STEP ${step + 1} OF 6`;
  $("#stepTitle").textContent = steps[step].title;
  $("#stepInstruction").textContent = steps[step].instruction;
  $("#miniProgressFill").style.width = `${(step + 1) / 6 * 100}%`;
  $("#stepDots").innerHTML = steps.map((_, i) => `<span class="step-dot ${i < step ? "done" : i === step ? "active" : ""}"></span>`).join("");
  $("#previousButton").style.visibility = step ? "visible" : "hidden";
  $("#nextButton").innerHTML = step === 5 ? "完成今天的课程 <span>✓</span>" : "继续 <span>→</span>";
  const content = $("#lessonContent");
  if (step === 0 || step === 5) {
    content.innerHTML = `<div class="audio-panel"><button id="playAll" class="big-play" type="button" aria-label="播放整篇对话">▶</button><p class="listen-count">已完整听：<span id="listenCount">${listenCount}</span> 次</p><p class="listen-hint">${step === 0 ? "建议至少听 2 次后再继续。" : "不看文字，享受这次更轻松的聆听。"}</p></div>`;
    $("#playAll").onclick = () => { $("#playAll").textContent = "…"; speakAll(() => { listenCount++; $("#listenCount").textContent = listenCount; $("#playAll").textContent = "▶"; }); };
  } else if (step === 1) { content.innerHTML = dialogue(false); attachSpeakers(); }
  else if (step === 2) { content.innerHTML = `${dialogue(true)}<div class="expression-grid">${lesson.expressions.map(e => `<div class="expression"><strong>${escapeHtml(e.en)}</strong><span>${escapeHtml(e.zh)}</span></div>`).join("")}</div>`; attachSpeakers(); }
  else if (step === 3) renderShadow(content);
  else renderRecall(content);
}
function renderShadow(content) { const l = lesson.dialogue[shadowIndex]; content.innerHTML = `<div class="shadow-card"><p class="line-counter">第 ${shadowIndex + 1} / ${lesson.dialogue.length} 句</p><p class="shadow-line">${escapeHtml(l.en)}</p><div class="shadow-tools"><button id="shadowPlay" class="secondary-button" type="button">🔊 播放一句</button><button id="repeatButton" class="primary-button" type="button">🎙 我跟读了</button></div><p id="recordingNote" class="recording-note"></p><button id="nextShadow" class="quiet-button" type="button">${shadowIndex === lesson.dialogue.length - 1 ? "再从头练一次" : "下一句 →"}</button></div>`;
  $("#shadowPlay").onclick = () => speak(l.en); $("#repeatButton").onclick = () => { $("#recordingNote").textContent = "很好。再注意一下整句的节奏，然后继续。"; };
  $("#nextShadow").onclick = () => { shadowIndex = shadowIndex === lesson.dialogue.length - 1 ? 0 : shadowIndex + 1; renderShadow(content); };
}
function normalize(s) { return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim(); }
function renderRecall(content) { const l = lesson.dialogue[selectedRecallIndex]; content.innerHTML = `<div class="recall-card"><p class="line-counter">句子 ${selectedRecallIndex + 1} / ${lesson.dialogue.length}</p><p class="prompt-zh">${escapeHtml(l.zh)}</p><input id="recallInput" class="recall-input" placeholder="试着输入英文，或先在心里说出来" autocomplete="off"/><div id="feedback" class="feedback"></div><button id="checkRecall" class="primary-button" type="button">看看提示</button><button id="nextRecall" class="quiet-button" type="button">换一句 →</button></div>`;
  $("#checkRecall").onclick = () => { const answer = normalize($("#recallInput").value), target = normalize(l.en); const overlap = answer.split(" ").filter(w => target.includes(w)).length; const good = answer && overlap >= Math.max(2, target.split(" ").length * .45); AssimilStore.recordReview(good); const f = $("#feedback"); f.className = `feedback ${good ? "good" : "neutral"}`; f.innerHTML = good ? `很好！更自然的表达是：<strong>${escapeHtml(l.en)}</strong>` : `没关系，先吸收这个自然说法：<strong>${escapeHtml(l.en)}</strong>`; };
  $("#nextRecall").onclick = () => { selectedRecallIndex = (selectedRecallIndex + 1) % lesson.dialogue.length; renderRecall(content); };
}
function show(name) { Object.values(screens).forEach(s => s.classList.remove("active")); screens[name].classList.add("active"); window.scrollTo({ top: 0, behavior: "smooth" }); }
function refreshHome() { const s = AssimilStore.summary(); $("#dayLabel").textContent = `DAY ${s.completedLessonIds.length + 1}`; $("#lessonMeta").textContent = `${lesson.title} · ${lesson.topic} · ${lesson.level} · 约 30 分钟`; $("#streakValue").textContent = s.streak; $("#completedValue").textContent = s.completedLessonIds.length; $("#reviewValue").textContent = s.accuracy === null ? "—" : `${s.accuracy}%`; renderLessonList(); }
function complete() { AssimilStore.completeLesson(lesson.id); const s = AssimilStore.summary(); $("#completeStats").innerHTML = `<div><strong>${listenCount}</strong><span>完整聆听</span></div><div><strong>${s.streak}</strong><span>连续天数</span></div><div><strong>${s.accuracy === null ? "—" : s.accuracy + "%"}</strong><span>复习表现</span></div>`; show("complete"); }
const legacyLessons = [
  { id: "coffee-plan", title: "Making Plans", topic: "安排一次午餐", level: "B1", dialogue: [{ speaker: "Mia", en: "Are you free for lunch this Friday?", zh: "这周五你有空一起吃午饭吗？" }, { speaker: "Leo", en: "I think so. What did you have in mind?", zh: "我想可以。你有什么想法？" }, { speaker: "Mia", en: "There's a new little café near the station.", zh: "车站附近新开了一家小咖啡馆。" }, { speaker: "Leo", en: "Sounds good. Shall we meet there at twelve?", zh: "听起来不错。我们十二点在那里见面好吗？" }, { speaker: "Mia", en: "Perfect. I'll book us a table.", zh: "太好了。我来订位。" }], expressions: [{ en: "What did you have in mind?", zh: "你有什么想法？" }, { en: "Sounds good.", zh: "听起来不错。" }, { en: "Shall we …?", zh: "我们……好吗？" }] },
  { id: "lost-package", title: "A Delivery Problem", topic: "询问快递", level: "B1", dialogue: [{ speaker: "Nina", en: "Hi, I'm calling about a package that hasn't arrived.", zh: "你好，我打电话询问一个还没送到的包裹。" }, { speaker: "Agent", en: "Could I have your order number, please?", zh: "请问可以提供订单号码吗？" }, { speaker: "Nina", en: "Sure, it's 70418. It was supposed to arrive yesterday.", zh: "当然，是70418。它本来应该昨天送到。" }, { speaker: "Agent", en: "Let me look into that for you.", zh: "我帮你查一下。" }, { speaker: "Agent", en: "It looks like the driver will deliver it this afternoon.", zh: "看来快递员会在今天下午送达。" }], expressions: [{ en: "I'm calling about …", zh: "我打电话是想询问……" }, { en: "It was supposed to …", zh: "它本来应该……" }, { en: "Let me look into that.", zh: "我来查一下。" }] },
  { id: "weekend-hike", title: "Weekend Plans", topic: "聊周末计划", level: "B1", dialogue: [{ speaker: "Owen", en: "Do you have any plans for the weekend?", zh: "你周末有什么计划吗？" }, { speaker: "Sara", en: "Not yet. I was thinking of going for a hike.", zh: "还没有。我正考虑去徒步。" }, { speaker: "Owen", en: "I'd be up for that. Which trail were you thinking of?", zh: "我愿意去。你想去哪条路线？" }, { speaker: "Sara", en: "The one by the lake. It's not too difficult.", zh: "湖边那条。难度不太大。" }, { speaker: "Owen", en: "Great. Let's check the weather first.", zh: "好。我们先看看天气。" }], expressions: [{ en: "I'd be up for that.", zh: "我愿意去。" }, { en: "Which … were you thinking of?", zh: "你想要哪个……？" }, { en: "Let's check … first.", zh: "我们先看看……。" }] }
];
async function init() { try { const r = await fetch("lessons.json"); if (!r.ok) throw new Error("Local file loading is unavailable"); lessons = await r.json(); } catch { lessons = window.ASSIMIL_LESSONS || legacyLessons; } if (window.ASSIMIL_LESSONS?.length) lessons = window.ASSIMIL_LESSONS; lesson = chooseLesson(); refreshHome(); }
$("#startButton").onclick = startCurrentLesson;
$("#nextPracticeButton").onclick = nextPractice;
$("#resetTodayButton").onclick = () => { if (confirm("只重新开始今天的课程流程吗？已保存的总学习记录不会删除。")) { step = 0; listenCount = 0; show("lesson"); renderStep(); } };
$("#nextButton").onclick = () => { if (step === 0 && listenCount < 2 && !confirm("建议至少完整听两遍。仍要继续吗？")) return; if (step === 5) complete(); else { step++; renderStep(); } };
$("#previousButton").onclick = () => { if (step) { step--; renderStep(); } };
$("#backHomeButton").onclick = () => { speechSynthesis.cancel(); refreshHome(); show("home"); };
$("#homeFromCompleteButton").onclick = () => { refreshHome(); show("home"); };
$("#nextPracticeFromCompleteButton").onclick = nextPractice;
$("#statsButton").onclick = () => { const s = AssimilStore.summary(); $("#statsContent").innerHTML = `<div class="stat-grid"><div class="stat"><strong>${s.completedLessonIds.length}</strong><span>完成课程</span></div><div class="stat"><strong>${s.streak}</strong><span>连续学习天数</span></div><div class="stat"><strong>${s.reviewAttempts}</strong><span>回忆练习次数</span></div><div class="stat"><strong>${s.accuracy === null ? "—" : s.accuracy + "%"}</strong><span>复习表现</span></div></div><p class="muted">所有记录只保存于这台设备的浏览器中。</p>`; $("#statsDialog").showModal(); };
$("#closeStatsButton").onclick = () => $("#statsDialog").close();
$("#clearProgressButton").onclick = () => { if (confirm("确定要清除所有本地学习记录吗？此操作无法恢复。")) { AssimilStore.clear(); $("#statsDialog").close(); refreshHome(); } };
init();
