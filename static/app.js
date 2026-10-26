// TechFusion Brand Governance Frontend Engine

let currentRole = 'reviewer';
let currentRoleUser = 'Aditya Sharma (Reviewer)';
let lastAuditResult = null;
let currentDrafts = [];
let selectedDraftId = 'DRAFT-2026-001';
let recurringChartInstance = null;

// Presets for instant Judge Testing
const PRESETS = {
  risky: {
    title: "Spring 2026 Enterprise Release Announcement",
    content: `Hey you guys! TechFusion is thrilled to drop our game-changing miracle update today! Our new platform is 100% bug-free and will completely crush the competition. We currently serve over 100,000 customers worldwide with zero downtime ever recorded. Best of all, our pricing is cheap and our setup is totally foolproof! Before deployment, our engineers do a quick sanity check and update the server blacklist.`
  },
  compliant: {
    title: "Cloud Security Whitepaper Executive Summary",
    content: `TechFusion provides enterprise organizations with zero-trust encryption and continuous compliance. We hold annual SOC2 Type II, ISO 27001, and HIPAA certifications. Our cloud architecture maintains a 99.99% multi-region availability SLA backed by contractual guarantees. Over 42,000 active enterprise organizations trust TechFusion to govern their digital brand presence.`
  },
  fintech: {
    title: "FinTech Compliance & Transaction Infrastructure Update",
    content: `Our engineers spent over 500 man-hours building a cheap payment gateway that guarantees 100% uptime with zero latency. Remember to consult the IP whitelist before integrating with #EF4444 legacy buttons.`
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Load default preset into studio
  loadPreset('risky');
  loadDrafts();
  loadGuidelines();
  loadFacts();
  loadInsights();
});

// Navigation Tab Switcher
function setTab(tabName) {
  const tabs = ['studio', 'workflow', 'guidelines', 'facts', 'insights', 'report'];
  tabs.forEach(t => {
    const pane = document.getElementById(`pane-${t}`);
    const tabBtn = document.getElementById(`tab-${t}`);
    if (pane && tabBtn) {
      if (t === tabName) {
        pane.classList.remove('hidden');
        tabBtn.classList.add('bg-indigo-800', 'text-white');
        tabBtn.classList.remove('text-indigo-200');
      } else {
        pane.classList.add('hidden');
        tabBtn.classList.remove('bg-indigo-800', 'text-white');
        tabBtn.classList.add('text-indigo-200');
      }
    }
  });

  if (tabName === 'insights') {
    renderInsightsChart();
  }
}

// Role Switching
function switchRole(roleKey) {
  currentRole = roleKey;
  if (roleKey === 'creator') {
    currentRoleUser = 'Yash Singla (Creator)';
  } else if (roleKey === 'reviewer') {
    currentRoleUser = 'Aditya Sharma (Reviewer)';
  } else {
    currentRoleUser = 'Ramandeep Singh (Manager)';
  }
  const label = document.getElementById('wf-active-role-label');
  if (label) label.innerText = currentRoleUser;
}

// Preset Loader
function loadPreset(key) {
  const preset = PRESETS[key];
  if (!preset) return;
  document.getElementById('draft-title').value = preset.title;
  document.getElementById('draft-content').value = preset.content;
  updateWordCount();
  runAudit();
}

function clearEditor() {
  document.getElementById('draft-title').value = '';
  document.getElementById('draft-content').value = '';
  updateWordCount();
  resetScore();
}

function updateWordCount() {
  const text = document.getElementById('draft-content').value;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  document.getElementById('char-word-count').innerText = `${words} words · ${chars} chars`;
}

function resetScore() {
  document.getElementById('score-val').innerText = '--';
  document.getElementById('badge-compliance-status').innerText = 'Pending';
  document.getElementById('findings-list').innerHTML = `<div class="p-6 text-center text-slate-400 text-xs">Run an audit to discover tone drift, unverified claims, or vocabulary suggestions.</div>`;
  document.getElementById('diff-output-box').innerText = 'Click "Run Brand Audit" to see purpose-aware suggested corrections...';
}

// Core Audit Engine Invocation
async function runAudit() {
  const title = document.getElementById('draft-title').value;
  const content = document.getElementById('draft-content').value;

  if (!content.trim()) {
    alert("Please write or paste content to review.");
    return;
  }

  const btn = document.getElementById('btn-run-audit');
  btn.disabled = true;
  btn.innerHTML = `<i class="ph-bold ph-spinner animate-spin"></i><span>Auditing...</span>`;

  try {
    const res = await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });
    const data = await res.json();
    lastAuditResult = data;
    renderAuditResults(data);
  } catch (err) {
    console.error("Audit error:", err);
    alert("Error running audit: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="ph-bold ph-shield-check text-base"></i><span>Run Brand Audit</span>`;
  }
}

// Render Scores and Findings
function renderAuditResults(data) {
  const scoreVal = document.getElementById('score-val');
  scoreVal.innerText = data.overall_score;

  const scoreCircle = document.getElementById('score-circle');
  const badgeStatus = document.getElementById('badge-compliance-status');

  // Score color styling
  if (data.overall_score >= 85) {
    scoreCircle.className = "w-24 h-24 rounded-full border-8 border-emerald-500 bg-emerald-50/50 flex items-center justify-center text-emerald-700";
    badgeStatus.className = "text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800";
    badgeStatus.innerText = "Compliant & Verified";
  } else if (data.overall_score >= 65) {
    scoreCircle.className = "w-24 h-24 rounded-full border-8 border-amber-500 bg-amber-50/50 flex items-center justify-center text-amber-700";
    badgeStatus.className = "text-xs px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-800";
    badgeStatus.innerText = "Revisions Recommended";
  } else {
    scoreCircle.className = "w-24 h-24 rounded-full border-8 border-rose-500 bg-rose-50/50 flex items-center justify-center text-rose-700";
    badgeStatus.className = "text-xs px-2.5 py-1 rounded-full font-bold bg-rose-100 text-rose-800";
    badgeStatus.innerText = "Critical Policy Drift";
  }

  // Category bars
  const cats = data.category_scores || {};
  setBar('term', cats.terminology || 100);
  setBar('claim', cats.claims || 100);
  setBar('tone', cats.tone || 100);
  setBar('a11y', cats.accessibility || 100);

  // Readability
  if (data.readability) {
    document.getElementById('stat-flesch').innerText = `${data.readability.flesch_score}/100`;
    document.getElementById('stat-grade').innerText = data.readability.grade_level;
    document.getElementById('stat-asl').innerText = `${data.readability.avg_sentence_length} words`;
  }

  // Render Diff Box
  const diffBox = document.getElementById('diff-output-box');
  diffBox.innerText = data.corrected_text;

  // Render Findings Cards
  const listEl = document.getElementById('findings-list');
  const countBadge = document.getElementById('findings-count-badge');
  countBadge.innerText = `${data.findings_count} Issues Detected`;

  if (!data.findings || data.findings.length === 0) {
    listEl.innerHTML = `
      <div class="p-6 text-center bg-emerald-50 border border-emerald-200 rounded-xl">
        <i class="ph-bold ph-seal-check text-3xl text-emerald-600 mb-1"></i>
        <h4 class="text-xs font-bold text-emerald-900">Zero Governance Violations</h4>
        <p class="text-[11px] text-emerald-700 mt-0.5">Content rigorously complies with tone standards, terminology dictionaries, and verified claims.</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = data.findings.map((f, idx) => {
    const isCrit = f.severity === 'critical';
    const borderCol = isCrit ? 'border-l-4 border-rose-500' : 'border-l-4 border-amber-500';
    const bgBadge = isCrit ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800';

    return `
      <div class="p-3.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl ${borderCol} shadow-xs space-y-2 transition">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-1.5">
            <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded ${bgBadge}">
              ${f.severity}
            </span>
            <span class="text-xs font-bold text-slate-800">${f.rule_name}</span>
          </div>
          <span class="text-[10px] font-mono text-slate-400">Rule: ${f.rule_id}</span>
        </div>

        <div class="text-xs">
          <span class="text-slate-500">Flagged text:</span>
          <span class="font-mono font-semibold text-rose-700 bg-rose-50 px-1 rounded">"${f.flagged_text}"</span>
        </div>

        <p class="text-xs text-slate-600 leading-relaxed">${f.reason}</p>

        <div class="flex items-center justify-between pt-2 border-t border-slate-200/60">
          <div class="text-xs">
            <span class="text-[11px] text-slate-400 block">Suggested Correction:</span>
            <span class="font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              ${f.suggestion}
            </span>
          </div>
          <button onclick="applyIndividualCorrection(${idx})" class="text-xs font-bold px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 transition flex items-center space-x-1">
            <i class="ph-bold ph-check"></i>
            <span>Apply</span>
          </button>
        </div>

        <div class="text-[10px] text-slate-400 pt-0.5">
          <i class="ph ph-link-simple mr-0.5"></i> Source: <span class="text-slate-500 font-medium">${f.approved_source}</span>
        </div>
      </div>
    `;
  }).join('');
}

function setBar(id, val) {
  const bar = document.getElementById(`bar-${id}`);
  const text = document.getElementById(`score-${id}`);
  if (bar && text) {
    text.innerText = `${val}%`;
    bar.style.width = `${val}%`;
    if (val >= 85) {
      bar.className = 'bg-emerald-500 h-1.5 rounded-full transition-all duration-500';
    } else if (val >= 60) {
      bar.className = 'bg-amber-500 h-1.5 rounded-full transition-all duration-500';
    } else {
      bar.className = 'bg-rose-500 h-1.5 rounded-full transition-all duration-500';
    }
  }
}

// 1-Click Apply All Corrections
function applyAllCorrections() {
  if (!lastAuditResult || !lastAuditResult.corrected_text) {
    alert("Please run an audit first to generate suggested corrections.");
    return;
  }
  document.getElementById('draft-content').value = lastAuditResult.corrected_text;
  updateWordCount();
  runAudit();
}

// Apply Individual Correction
function applyIndividualCorrection(idx) {
  if (!lastAuditResult || !lastAuditResult.findings || !lastAuditResult.findings[idx]) return;
  const f = lastAuditResult.findings[idx];
  const editor = document.getElementById('draft-content');
  const currentText = editor.value;

  // Case insensitive word replacement
  const regex = new RegExp(escapeRegex(f.flagged_text), 'i');
  if (regex.test(currentText)) {
    editor.value = currentText.replace(regex, f.suggestion);
    updateWordCount();
    runAudit();
  } else {
    alert("Flagged text already adjusted.");
  }
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Save Current Document into Editorial Workflow
async function saveToWorkflow() {
  const title = document.getElementById('draft-title').value;
  const content = document.getElementById('draft-content').value;
  if (!content.trim()) return alert("Content cannot be empty.");

  try {
    const res = await fetch('/api/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        content,
        author: currentRoleUser
      })
    });
    const data = await res.json();
    alert(`Draft saved successfully as ${data.draft.id}!`);
    await loadDrafts();
    setTab('workflow');
    selectDraft(data.draft.id);
  } catch (err) {
    alert("Save failed: " + err.message);
  }
}

// Load Drafts for Editorial Workflow
async function loadDrafts() {
  try {
    const res = await fetch('/api/drafts');
    currentDrafts = await res.json();
    renderWorkflowDrafts();
    if (currentDrafts.length > 0) {
      selectDraft(selectedDraftId || currentDrafts[0].id);
    }
  } catch (err) {
    console.error("Load drafts error:", err);
  }
}

function renderWorkflowDrafts() {
  const list = document.getElementById('workflow-drafts-list');
  if (!list) return;

  list.innerHTML = currentDrafts.map(d => {
    const isSelected = d.id === selectedDraftId;
    const border = isSelected ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600' : 'border-slate-200 hover:border-slate-300 bg-white';
    const statusBg = d.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : (d.status === 'CHANGES_REQUESTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800');

    return `
      <div onclick="selectDraft('${d.id}')" class="p-3 border rounded-xl cursor-pointer transition ${border} space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono text-indigo-700 font-bold">${d.id}</span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBg}">${d.status}</span>
        </div>
        <h4 class="text-xs font-bold text-slate-800 line-clamp-1">${d.title}</h4>
        <div class="flex items-center justify-between text-[11px] text-slate-400">
          <span>${d.author}</span>
          <span class="font-bold text-slate-600">Score: ${d.score || '--'}/100</span>
        </div>
      </div>
    `;
  }).join('');
}

function selectDraft(id) {
  selectedDraftId = id;
  renderWorkflowDrafts();
  const d = currentDrafts.find(item => item.id === id);
  if (!d) return;

  document.getElementById('wf-detail-id').innerText = d.id;
  document.getElementById('wf-detail-title').innerText = d.title;
  document.getElementById('wf-detail-meta').innerText = `Author: ${d.author} · Created: ${d.created_at}`;
  document.getElementById('wf-detail-content').innerText = d.content;

  const statusEl = document.getElementById('wf-detail-status');
  statusEl.innerText = d.status;
  statusEl.className = d.status === 'APPROVED' ? 'text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800' : 'text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800';

  // Render Comments
  const comList = document.getElementById('wf-comments-list');
  if (d.comments && d.comments.length > 0) {
    comList.innerHTML = d.comments.map(c => `
      <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
        <div class="flex justify-between items-center text-[10px] text-slate-400">
          <span class="font-bold text-slate-700">${c.author} (${c.role})</span>
          <span>${c.timestamp}</span>
        </div>
        <p class="text-slate-700">${c.text}</p>
      </div>
    `).join('');
  } else {
    comList.innerHTML = `<div class="text-xs text-slate-400 italic">No comments yet. Add the first review comment.</div>`;
  }

  // Render History
  const histList = document.getElementById('wf-history-list');
  if (d.history && d.history.length > 0) {
    histList.innerHTML = d.history.map(h => `
      <div class="flex items-start space-x-2">
        <span class="text-indigo-500 font-bold">•</span>
        <div>
          <span class="text-slate-400">[${h.timestamp}]</span>
          <span class="font-semibold text-slate-700">${h.user}:</span>
          <span>${h.action}</span>
        </div>
      </div>
    `).join('');
  }
}

// Approval Actions
async function approveDraft() {
  if (!selectedDraftId) return;
  try {
    const res = await fetch(`/api/drafts/${selectedDraftId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'APPROVE',
        role: currentRole,
        user_name: currentRoleUser,
        note: "Verified full compliance against brand standards and approved facts."
      })
    });
    await loadDrafts();
    alert("Content successfully approved for publication!");
  } catch (err) {
    alert("Error: " + err.message);
  }
}

async function requestChangesDraft() {
  const reason = prompt("Enter specific revision instructions for the author:", "Flagged unverified superlatives and non-approved terminology.");
  if (!reason) return;

  try {
    const res = await fetch(`/api/drafts/${selectedDraftId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'REQUEST_CHANGES',
        role: currentRole,
        user_name: currentRoleUser,
        note: reason
      })
    });
    await loadDrafts();
    alert("Revisions requested.");
  } catch (err) {
    alert("Error: " + err.message);
  }
}

function openOverrideModal() {
  document.getElementById('modal-override').classList.remove('hidden');
}

function closeOverrideModal() {
  document.getElementById('modal-override').classList.add('hidden');
}

async function submitOverride() {
  const reason = document.getElementById('override-reason-input').value.trim();
  if (!reason) {
    alert("A formal justification is mandatory for compliance override.");
    return;
  }

  try {
    const res = await fetch(`/api/drafts/${selectedDraftId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'OVERRIDE',
        role: currentRole,
        user_name: currentRoleUser,
        override_reason: reason
      })
    });
    closeOverrideModal();
    await loadDrafts();
    alert("Governance override successfully recorded in audit logs.");
  } catch (err) {
    alert("Override error: " + err.message);
  }
}

async function postComment() {
  const input = document.getElementById('new-comment-input');
  const text = input.value.trim();
  if (!text) return;

  try {
    await fetch(`/api/drafts/${selectedDraftId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        author: currentRoleUser,
        role: currentRole,
        text: text
      })
    });
    input.value = '';
    await loadDrafts();
  } catch (err) {
    alert("Comment failed: " + err.message);
  }
}

// Guideline Hub Loader
async function loadGuidelines() {
  try {
    const res = await fetch('/api/guidelines');
    const guidelines = await res.json();
    const cont = document.getElementById('guidelines-container');
    if (!cont) return;

    cont.innerHTML = guidelines.map(g => `
      <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-mono text-indigo-700 font-bold">${g.id}</span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">${g.version}</span>
        </div>
        <h4 class="text-xs font-bold text-slate-900">${g.name}</h4>
        <p class="text-xs text-slate-500 leading-relaxed">${g.description}</p>
        <div class="pt-2 border-t border-slate-100 space-y-1 text-xs">
          <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Rules Enforced:</span>
          <ul class="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
            ${g.rules.map(r => `<li>${r}</li>`).join('')}
          </ul>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error("Load guidelines error:", err);
  }
}

// Facts DB Loader
async function loadFacts() {
  try {
    const res = await fetch('/api/facts');
    const facts = await res.json();
    const tbody = document.getElementById('facts-table-body');
    if (!tbody) return;

    tbody.innerHTML = facts.map(f => `
      <tr class="hover:bg-slate-50/80 transition">
        <td class="p-3 font-mono font-bold text-indigo-700">${f.id}</td>
        <td class="p-3 font-bold text-slate-900">${f.topic}</td>
        <td class="p-3 text-slate-700 font-medium">${f.verified_claim}</td>
        <td class="p-3 text-slate-500">${f.approved_by}</td>
        <td class="p-3 font-mono text-indigo-600 underline">${f.evidence_doc}</td>
        <td class="p-3 text-slate-400">${f.last_verified}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error("Load facts error:", err);
  }
}

// Governance Insights & Chart
async function loadInsights() {
  // Chart is rendered in renderInsightsChart()
}

function renderInsightsChart() {
  const ctx = document.getElementById('recurringChart');
  if (!ctx) return;

  if (recurringChartInstance) {
    recurringChartInstance.destroy();
  }

  recurringChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [
        'Unsupported Claims',
        'Non-Approved Terms',
        'Aggressive Tone',
        'WCAG Readability'
      ],
      datasets: [{
        label: '% of Drift Violations',
        data: [38.0, 27.5, 19.7, 14.8],
        backgroundColor: [
          '#ef4444',
          '#f59e0b',
          '#6366f1',
          '#06b6d4'
        ],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: v => v + '%' }
        }
      }
    }
  });
}

// Modal Handlers
function openAddGuidelineModal() { document.getElementById('modal-add-guideline').classList.remove('hidden'); }
function closeAddGuidelineModal() { document.getElementById('modal-add-guideline').classList.add('hidden'); }

async function submitNewGuideline() {
  const id = document.getElementById('gl-new-id').value.trim() || `GL-${Date.now()}`;
  const category = document.getElementById('gl-new-cat').value;
  const name = document.getElementById('gl-new-name').value.trim();
  const description = document.getElementById('gl-new-desc').value.trim();
  const rawRules = document.getElementById('gl-new-rules').value.trim();
  const rules = rawRules.split('\n').filter(r => r.trim());

  if (!name || !description) return alert("Please fill title and description.");

  await fetch('/api/guidelines', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, category, name, description, rules, severity: 'warning', version: 'v1.0', status: 'active' })
  });

  closeAddGuidelineModal();
  loadGuidelines();
  alert("New brand guideline saved!");
}

function openAddFactModal() { document.getElementById('modal-add-fact').classList.remove('hidden'); }
function closeAddFactModal() { document.getElementById('modal-add-fact').classList.add('hidden'); }

async function submitNewFact() {
  const id = `FACT-${Date.now().toString().slice(-4)}`;
  const topic = document.getElementById('fact-new-topic').value.trim();
  const verified_claim = document.getElementById('fact-new-claim').value.trim();
  const approved_by = document.getElementById('fact-new-approver').value.trim() || 'Compliance Lead';
  const evidence_doc = document.getElementById('fact-new-doc').value.trim() || 'Internal-Audit.pdf';

  if (!topic || !verified_claim) return alert("Please fill in topic and audited claim.");

  await fetch('/api/facts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id, topic, verified_claim, keywords: [topic.toLowerCase()], approved_by, last_verified: new Date().toISOString().split('T')[0], evidence_doc
    })
  });

  closeAddFactModal();
  loadFacts();
  alert("Audited fact committed to database!");
}

// Download dynamic Audit Certificate PDF
async function downloadCertificate() {
  const title = document.getElementById('draft-title').value;
  const content = document.getElementById('draft-content').value;
  if (!content.trim()) return alert("Please enter content to generate certificate.");

  try {
    const res = await fetch('/api/download/certificate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        draft: { id: selectedDraftId || 'DOC-DEMO', title, content, author: currentRoleUser },
        audit: lastAuditResult
      })
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TechFusion_Audit_Certificate_${selectedDraftId || 'DOC'}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    alert("Export certificate failed: " + err.message);
  }
}
