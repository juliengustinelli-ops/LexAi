const backendUrl = "https://api.lexaib2b.com";

const authToken = localStorage.getItem("lexai_token");
let dt = null;
let includeVariants = false;

(function ensureLexSession(){
  const KEY = 'lex_session';
  const has = document.cookie.split('; ').some(c => c.startsWith(KEY+'='));
  if (!has) {
    const sid = (crypto.randomUUID?.() || ('s_'+Math.random().toString(36).slice(2)+Date.now()));
    document.cookie = `${KEY}=${sid}; Path=/; Max-Age=${60*60*24*180}; SameSite=Lax`;
  }
})();

async function ensureAuthOrRedirect() {
  const token = localStorage.getItem("lexai_token");
  if (!token) { location.href = "login.html"; return false; }
  try {
    const r = await fetch(`${backendUrl}/me`, { headers:{Authorization:`Bearer ${token}`} });
    if (r.status === 401 || r.status === 403) {
      localStorage.removeItem("lexai_token");
      localStorage.removeItem("lexai_uid");
      location.href = "login.html";
      return false;
    }
    return true;
  } catch {
    // Network hiccup: do nothing special; page UI will show offline banner
    return true;
  }
}

function apiFetch(url, options = {}) {
  const heads = { ...(options.headers||{}) };
  const token = localStorage.getItem("lexai_token");
  if (token) heads["Authorization"] = `Bearer ${token}`;
  const sid = document.cookie.split('; ').find(r => r.startsWith('lex_session='))?.split('=')[1];
  if (sid) heads["X-Lex-Session"] = sid;
  return fetch(url, { ...options, headers: heads });
}

function clearVariantsUI() {
  const ul = document.getElementById("variantList");
  if (ul) ul.innerHTML = "";
  const head = document.getElementById("altHead");
  if (head) head.style.display = "none";
}

async function refreshQuota(){
  try{
    const r = await apiFetch(`${backendUrl}/quota`, { cache: "no-store" });
    if(!r.ok) throw 0;
    const {limit, used, day} = await r.json();

    if (window._quotaDay !== day) {
      window._quotaWarned = false;
      window._quotaLocked = false;
      window._quotaDay    = day;
    }

    const HARD_CAP  = 25_000;
    const WARN_LEFT = 300;

    const safeLimit = (limit ?? HARD_CAP);
    const max  = Math.min(safeLimit, HARD_CAP);
    const usedVal = (used ?? 0);
    const left = Math.max(0, max - usedVal);
    const pct  = max > 0 ? Math.min(100, Math.round(usedVal / max * 100)) : 0;

    window._quotaLeft = left;

    const bar  = document.getElementById("quotaBar");
    const wrap = document.getElementById("quotaWrap");
    if (bar && wrap){
      bar.style.width = pct + "%";
      wrap.title = `Daily quota: ${usedVal.toLocaleString()} / ${max.toLocaleString()} chars – ${day} (ET)`;
    }

    document.querySelectorAll("button.primary-btn").forEach(b=>{ b.disabled = left === 0; });

    if (left === 0) {
      if (!window._quotaLocked) {
        (window.lexAlert ?? alert)("Daily quota reached — back tomorrow!");
        window._quotaLocked = true;
      }
    } else if (left <= WARN_LEFT && !window._quotaWarned) {
      (window.lexAlert ?? alert)(`⚠️  Only ${left.toLocaleString()} characters left today`);
      window._quotaWarned = true;
    }
  } catch {
    // Network or 401: show a neutral bar and DON'T block requests
    window._quotaLeft = Infinity;             // “unknown” => do not block
    const bar = document.getElementById("quotaBar");
    if (bar) bar.style.width = "0%";
    document.querySelectorAll("button.primary-btn").forEach(b=>{ b.disabled = false; });
  }
}
refreshQuota();             

(() => {
  const hasToken = !!localStorage.getItem("lexai_token");
})();

/* ========== BEGIN LexAi modal helpers (alert / confirm / prompt) ========== */
(function () {

  let pendingResolve = null;          // resolver for confirm/prompt
  let promptMode     = false;         // true when expecting input

  function openModal(msg, kind){     // kind: "alert" | "confirm" | "prompt"
    const modal      = document.getElementById("lexModal");
    const msgBox     = document.getElementById("lexModalMsg");
    const inBox      = document.getElementById("lexModalInput");
    const cancelBtn  = document.getElementById("lexModalCancel");

    promptMode = (kind === "prompt");
    msgBox.textContent     = msg;
    inBox.value            = "";
    inBox.classList.toggle("hidden", !promptMode);
    cancelBtn.style.display = kind === "alert" ? "none" : "";

    modal.classList.remove("hidden");
    if (promptMode) inBox.focus();
  }

  function closeModal(answer){
    document.getElementById("lexModal").classList.add("hidden");
    if (typeof pendingResolve === "function"){
      pendingResolve(answer);
      pendingResolve = null;
    }
  }

  /* ------------- public wrappers ---------------- */
  window.alert = function(msg){
    openModal(msg, "alert");
    return new Promise(ok=> { pendingResolve = ok; });
  };

  window.confirm = function(msg){
    openModal(msg, "confirm");
    return new Promise(ok=> { pendingResolve = ok; });
  };

   window.lexConfirm = window.confirm;

  window.lexPrompt = function(msg){
    openModal(msg, "prompt");
    return new Promise(ok=> { pendingResolve = ok; });
  };

  /* wire buttons once DOM ready */
  document.addEventListener("DOMContentLoaded", ()=>{
    const okBtn     = document.getElementById("lexModalOk");
    const cancelBtn = document.getElementById("lexModalCancel");
    const inBox     = document.getElementById("lexModalInput");
    if(!okBtn || !cancelBtn) return;

    okBtn.addEventListener("click",()=>{
      const val = promptMode ? inBox.value.trim() : true;
      closeModal(val);
    });
    cancelBtn.addEventListener("click",()=>closeModal(false));
  });

}());

/* ---------- toast helper (green bar) --------------------- */
function toast(msg) {
  const old = document.getElementById("lexToast");
  if (old) old.remove();

  const t = document.createElement("div");
  t.id = "lexToast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

/* ---------- helpers ---------- */
function getUserId() {
  let id = localStorage.getItem("lexai_uid");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("lexai_uid", id);
  }
  return id;
}

function applyFeedbackFilter() {
  if (!dt) return;
  const wanted = document.getElementById("filterSelect").value;
  dt.column(4)                             // Feedback column
    .search(wanted === "all" ? "" : `^${wanted}`, true, false)
    .draw(false);
}

/* -------- spinners -------- */
function spinnerOn(msg = "Please wait…") {
  let s = document.getElementById("lexaiSpinner");
  if (!s) {
    s = document.createElement("div");
    s.id = "lexaiSpinner";
    Object.assign(s.style, {
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(255,255,255,0.7)", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: "Segoe UI, sans-serif", fontSize: "1.1rem"
    });
    document.body.appendChild(s);
  }
  s.textContent = msg;
  s.style.display = "flex";
}
function spinnerOff() {
  const s = document.getElementById("lexaiSpinner");
  if (s) s.style.display = "none";
}
function showSpin(on = true) {
  document.getElementById("spinner_1").classList[on ? "remove" : "add"]("hidden");
  document.querySelectorAll("button,select,textarea,input")
    .forEach(el => el.disabled = on);
}

/* ---------- tiny helper ---------- */
async function pingBackend() {
  try {
    const r = await apiFetch(`${backendUrl}/ping`, { cache: "no-store" });
    return r.ok;
  } catch { return false; }
}

/* -------------------------------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  
  if (typeof $ === "undefined") {
    console.error("jQuery missing – LexAI UI can’t initialise.");
    return;
  }

  /* show/hide connectivity banner */
  const offlineBanner = document.getElementById("offlineBanner");
  const backendUp = await pingBackend();
  offlineBanner.style.display = backendUp ? "none" : "block";

  /* only try to load feedbacks if ping succeeded */
  if (backendUp) {
    await loadFeedbacks();
    await refreshQuota();
    if (!window._filterBound) {
      document.getElementById("filterSelect").onchange = () => {
        const wanted = document.getElementById("filterSelect").value;
        $('#feedbackTable')
          .DataTable()
          .column(4)
          .search(wanted === "all" ? "" : wanted, true, false)
          .draw();
      };
      window._filterBound = true;
    }
  } else {
    console.warn("Backend offline – table will remain empty");
  }

 /* === FEEDBACK TABLE ===================================== */
async function loadFeedbacks () {
  try {
    const incAlt = document.getElementById("variantsChk").checked ? 1 : 0;

    /* auth header added automatically by apiFetch */
    const res = await apiFetch(
      `${backendUrl}/feedbacks/?include_variants=${incAlt}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`backend ${res.status}`);

    const data = await res.json();

    /* --- local 1-based index instead of DB id ---------------- */
    const rows = data.map((fb, idx) => [
      idx + 1,                             // ← 1-based row number
      fb.original_prompt,
      fb.translated_text,
      fb.target_language,
      fb.feedback
    ]);

    if (!dt) {
      dt = $('#feedbackTable').DataTable({
        data: rows,
        columns: [
          { title: "ID" },                
          { title: "Original Prompt" },
          { title: "Translated Text" },
          { title: "Language" },
          { title: "Feedback" }
        ],
        pageLength: 5,
        order: [[0, 'desc']]
      });
      $('#feedbackTable').show();
    } else {
      dt.clear(); dt.rows.add(rows); dt.draw(false);
    }

    applyFeedbackFilter();
    $('#noRowsMsg').toggle(dt.rows({ filter: 'applied' }).count() === 0);
    console.log(`Feedbacks loaded: ${rows.length}`);

  } catch (e) {
    console.error("loadFeedbacks failed:", e);
    alert("Could not load feedbacks!");
  }
}

  /* --- one-time bindings ---------------------------------- */
  document.getElementById('refreshBtn').onclick = loadFeedbacks;
  document.getElementById('variantsChk').onchange = loadFeedbacks;
  document.getElementById('filterSelect').onchange = applyFeedbackFilter;

  function canTranslate(txt){
  if (typeof window._quotaLeft !== "number") return true; // backend will enforce
  const estimate = txt.length * 2;                        // EN→TL rough factor
  return estimate <= window._quotaLeft;
  }
  
  /* =========== GET TRANSLATION ============================ */
document.getElementById("translateBtn").onclick = async (e) => {
  e.preventDefault();
  // New request → forget any old ideas
  clearVariantsUI();
  // (optional) block Good/Bad on stale session while we process
  window.currentSession = null;

  const mode   = document.querySelector('input[name="mode"]:checked')?.value || "translate";
  const prompt = document.getElementById("prompt").value.trim();
  if (!prompt) return lexAlert?.("Enter tagline first!") ?? alert("Enter tagline first!");

  /* new early-out -------------------------------------------------- */
  if (mode === "translate" && !canTranslate(prompt)){
    (window.lexAlert ?? alert)(
      "That text is too long for today’s remaining quota. "
    + "Try a shorter prompt or come back tomorrow."
    );
    return;
  }
  
  /* ---------- decide destination language ---------------- */
  let target, targetName;

  if (mode === "rephrase") {               // EN → better EN
    target      = "EN";                    // hard-wire English
    targetName  = "English";
  } else {                                 // normal Translate
    const langEl = document.getElementById("language");
    const selOpt = langEl.selectedOptions[0];
    if (selOpt.disabled) return alert("Language coming soon!");
    target      = langEl.value;
    targetName  = selOpt.text;
  }

  /* ---------- model selection ---------------------------- */
  const modelSel = document.getElementById("modelSelect");
  const model = (modelSel?.value) || "gpt-4o-mini";
  try { localStorage.setItem("lexai_model", model); } catch {}
  
  /* ---------- call the SAME endpoint --------------------- */
 showSpin(true);
try {
  let data;

  if (mode === "rephrase") {
    const res = await apiFetch(`${backendUrl}/rephrase/`, {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ prompt, model })
    });
    if (!res.ok) throw Error("Backend");
    data = await res.json();

    document.getElementById("translatedText").textContent = data.rephrased;
  } else {
    const res = await apiFetch(`${backendUrl}/full-process/`, {
      method : "POST",
      headers: { "Content-Type": "application/json" },
      body   : JSON.stringify({ prompt, target_language: target, model })
    });
    if (!res.ok) throw Error("Backend");
    data = await res.json();

    document.getElementById("translatedText").textContent = data.translated_text;
  }

  document.getElementById("result").style.display = "block";
  document.getElementById("modelSelect")?.scrollIntoView({ behavior: "smooth" }); 
  const titleEl = document.getElementById("resultTitle"); 
    if (titleEl) { titleEl.textContent = (mode === "rephrase" ? "Rephrased Line" : "Translated Text"); titleEl.focus(); }

  document.getElementById("feedbackControls").style.display = "flex";

  window.currentSession = {
    original_prompt : prompt,
    translated_text : document.getElementById("translatedText").textContent,
    lang_code       : target,     // "EN" if rephrase
    lang_name       : targetName
  };

  // Only translations affect quota; rephrase no-op here.
  if (mode === "translate") await refreshQuota();
} catch {
  alert("Backend unreachable.");
} finally {
  showSpin(false);
}
};

  /* =========== GOOD / BAD buttons ========================= */
  async function sendFeedback(type) {
    if (!window.currentSession) {
      alert("Translate something first!");
      return;
    }

    const userId = getUserId();
    const payload = {
      user_id: userId,
      original_prompt: window.currentSession.original_prompt,
      translated_text: window.currentSession.translated_text,
      target_language: window.currentSession.lang_code,
      feedback: type,
      reason: null
    };

    const res = await apiFetch(`${backendUrl}/feedback/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      await loadFeedbacks();
      await refreshQuota();
    } else {
      const err = await res.json();
      console.error(err);
      alert("Feedback failed!");
    }
  }

  /* ---------- GOOD button workflow ---------- */
  document.getElementById("goodBtn").onclick = async () => {
    if (!window.currentSession) return alert("Translate something first!");

    await sendFeedback("Good");
    await loadFeedbacks();
    await refreshQuota();

    if (!await lexConfirm("Saved!  Would you like 5 alternative suggestions?")) return;

    spinnerOn("Generating ideas…");
    try {
      const modelSel = document.getElementById("modelSelect");
      const model = (modelSel?.value) || localStorage.getItem("lexai_model") || "gpt-4o-mini";
      const r = await apiFetch(`${backendUrl}/copy-variants/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: currentSession.original_prompt,
          target_language: currentSession.lang_code,
          count: 5,
          model
        })
      });
      const data = await r.json();
      showVariants(data.variants);
    } catch (e) {
      console.error(e);
      alert("Could not fetch variants.");
    } finally {
      spinnerOff();
    }
  };

  /* ---------- variant list renderer ---------- */
  function showVariants(list) {
  const ul = document.getElementById("variantList");
  ul.innerHTML = "";

  // show header only when we have items
  const head = document.getElementById("altHead");
  if (head) head.style.display = "block";

  list.forEach(txt => {
    ul.insertAdjacentHTML("beforeend",
      `<li>
         <span>${txt}</span>
         <div>
           <button class="vote" data-v="Good">👍</button>
           <button class="vote" data-v="Bad">👎</button>
         </div>
       </li>`);
  });

  ul.querySelectorAll(".vote").forEach(btn => {
    btn.onclick = async () => {
      const li = btn.closest("li");
      const variantText = li.querySelector("span").textContent;

      const res = await apiFetch(`${backendUrl}/variant-feedback/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: getUserId(),
          original_prompt: currentSession.original_prompt,
          target_language: currentSession.lang_code,
          variant_text: variantText,
          rating: btn.dataset.v
        })
      });

      if (res.ok) {
        li.style.opacity = .45;
        toast("Saved!");
        li.querySelectorAll(".vote").forEach(b => b.remove());
        loadFeedbacks();
        await refreshQuota();
      } else {
        toast("Save failed!");
      }
    };
  });

  alert("Rate these ideas: 👍 if you like it, 👎 otherwise.");
}

  document.getElementById("badBtn").onclick = () => sendFeedback("Bad");

  /* ---------------- Bad → regenerate ------------- */
  document.getElementById("badBtn").onclick = async () => {
    if (!window.currentSession) return alert("Translate first!");

   const reason = await lexPrompt("What’s wrong with this translation?");
   if (!reason) return;               

    document.getElementById("spinner").classList.remove("hidden");
    document.querySelectorAll("button,select,textarea,input")
      .forEach(el => el.disabled = true);

    try {
      const modelSel = document.getElementById("modelSelect");
      const model = (modelSel?.value) || localStorage.getItem("lexai_model") || "gpt-4o-mini";

      const payload = {
        user_id: getUserId(),
        original_prompt: window.currentSession.original_prompt,
        translated_text: window.currentSession.translated_text,
        target_language: window.currentSession.lang_code,
        reason: reason,
        model
      };

      const res = await apiFetch(`${backendUrl}/feedback/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw await res.json();

      const out = await res.json();
      document.getElementById("translatedText").textContent = out.new_translation;
      window.currentSession.translated_text = out.new_translation;
      window.currentSession.original_prompt = out.improved_prompt;

      clearVariantsUI();
      
      await loadFeedbacks();
      await refreshQuota();
      alert("Done! Translation regenerated.");
      clearVariantsUI();
    } catch (e) {
      console.error(e);
      alert("Regeneration failed!");
    } finally {
      document.getElementById("spinner").classList.add("hidden");
      document.querySelectorAll("button,select,textarea,input")
        .forEach(el => el.disabled = false);
    }
  };

  /* =========== COPY button ================================ */
  document.getElementById("copyBtn").onclick = () => {
    const txt = document.getElementById("translatedText").textContent;
    navigator.clipboard.writeText(txt).then(() => {
      alert("Translated text copied to clipboard!");
    });
  };

  /* =========== DOWNLOAD Excel ============================= */
 document.getElementById("downloadBtn").onclick = async () => {
  const filterSel  = document.getElementById("filterSelect").value;
  const includeAlt = document.getElementById("variantsChk").checked;

  /* build query-string */
  const qs = new URLSearchParams();
  if (filterSel !== "all") qs.append("type", filterSel);
  qs.append("include_variants", includeAlt);

  /* full URL (template literal!) */
  const url = `${backendUrl}/feedbacks/download?${qs.toString()}`;

   const hasToken = !!localStorage.getItem("lexai_token");
   const res = await apiFetch(url, { method: "GET" });
   if (!res.ok) return alert("No feedbacks match this selection.");

   if (hasToken) {
     // keep legacy redirect path for JWT users
     const token = localStorage.getItem("lexai_token") || "";
     window.location.href = `${url}&access_token=${encodeURIComponent(token)}`;
   } else {
     // anonymous: stream as blob (so we can include headers)
     const blob = await res.blob();
     const a = document.createElement("a");
     a.href = URL.createObjectURL(blob);
     a.download = "lexai_feedbacks.xlsx";
     document.body.appendChild(a);
     a.click();
     a.remove();
     setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
   }
};
  
  /* =========== CLEAR FEEDBACKS ============================ */
  document.getElementById('clearBtn').onclick = async () => {
    if (!await lexConfirm("Delete ALL feedback rows?")) return;
  
    try {
      /* backend expects DELETE /feedbacks/clear  (same base URL) */
      const res = await apiFetch(`${backendUrl}/feedbacks/clear`, {
        method: "DELETE"
      });
  
      if (res.ok) {
        await loadFeedbacks();
        await refreshQuota();     // refresh the table
        alert("All feedbacks cleared.");
      } else {
        const err = await res.json();
        console.error(err);
        alert("Could not clear feedbacks.");
      }
    } catch (e) {
      console.error(e);
      alert("Backend unreachable.");
    }
  };
  
/* =========== UPLOAD PDF / IMAGE ========================= */
  document.getElementById("uploadBtn").onclick = async () => { 
  const file = document.getElementById("fileInput").files[0]; 
  if (!file) return alert("Select a file first!"); 
  
  const form = new FormData(); 
  form.append("file", file); 
  
  const endpoint = file.name.toLowerCase().endsWith(".pdf") ? "/upload-pdf/" : "/upload-image/"; 
  
  try { 
  const r = await apiFetch(`${backendUrl}${endpoint}`, { 
  method: "POST", body: form 
  }); 
  const d = await r.json(); 
  if (d.extracted_text) { 
  document.getElementById("prompt").value = d.extracted_text; 
  alert("Text extracted — verify then click Get Translation."); 
  } else { 
  alert("No text found."); 
  } 
  } catch { 
  alert("Backend unreachable."); 
  } 
  };
});

/*---------- Restore model on load ----------------------- */
  const savedModel = localStorage.getItem("lexai_model");
  if (savedModel && document.getElementById("modelSelect")) {
    document.getElementById("modelSelect").value = savedModel;
  }

  /* ---------- Keyboard shortcuts -------------------------- */
  window.addEventListener("keydown", (ev) => {
    const metaOrCtrl = ev.metaKey || ev.ctrlKey;
    if (metaOrCtrl && ev.key === "Enter") {
      ev.preventDefault();
      document.getElementById("translateBtn")?.click();
    }
    /*if (ev.key.toLowerCase() === "r" && document.getElementById("result")?.style.display !== "none") {
      ev.preventDefault();
      document.getElementById("badBtn")?.click();
    }
    if (ev.key.toLowerCase() === "g" && document.getElementById("result")?.style.display !== "none") {
      ev.preventDefault();
      document.getElementById("goodBtn")?.click();
    }*/
  });

document.addEventListener("DOMContentLoaded", () => {
  const modeRadios = document.querySelectorAll('input[name="mode"]');
  const langSelect = document.getElementById("language");
  function toggleLang() {
    const isRephrase =
          document.querySelector('input[name="mode"]:checked').value === "rephrase";
    langSelect.disabled = isRephrase;
    langSelect.style.opacity = isRephrase ? 0.45 : 1;
  }
  modeRadios.forEach(r => r.addEventListener("change", toggleLang));
  toggleLang();
});
