/* =======================================================================
   Mahani Builder — تكامل Firebase (اختياري)
   يعمل فقط بعد ربط مشروع Firebase حقيقي — راجع firebase/README.md.
   قبل الربط، لا يفعل هذا الملف شيئًا سوى إخفاء ميزات الحساب بأمان.
   ======================================================================= */

// ⚠️ عدّل هذين السطرين بعد اتباع خطوات firebase/README.md
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
const CLOUD_FUNCTION_URL = "https://us-central1-YOUR_PROJECT.cloudfunctions.net/generateProject";

const isFirebaseConfigured = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("YOUR_");

/* ---- DOM refs ---- */
const accountBtn = document.getElementById("account-btn");
const accountPanel = document.getElementById("account-panel");
const accountClose = document.getElementById("account-close");
const accountNotConfigured = document.getElementById("account-not-configured");
const accountConfigured = document.getElementById("account-configured");
const authSignedOut = document.getElementById("auth-signed-out");
const authSignedIn = document.getElementById("auth-signed-in");
const authEmailInput = document.getElementById("auth-email");
const authPasswordInput = document.getElementById("auth-password");
const authSignInBtn = document.getElementById("auth-signin-btn");
const authSignUpBtn = document.getElementById("auth-signup-btn");
const authSignOutBtn = document.getElementById("auth-signout-btn");
const authUserEmail = document.getElementById("auth-user-email");
const authLog = document.getElementById("auth-log");
const saveProjectBtn = document.getElementById("save-project-btn");
const projectHistoryList = document.getElementById("project-history-list");
const cloudAiBlock = document.getElementById("cloud-ai-block");
const cloudAiGenerateBtn = document.getElementById("cloud-ai-generate-btn");

accountBtn.addEventListener("click", () => { accountPanel.hidden = !accountPanel.hidden; });
accountClose.addEventListener("click", () => { accountPanel.hidden = true; });

if (!isFirebaseConfigured){
  // لا مشروع Firebase مربوط بعد — الأداة تعمل بكامل ميزاتها الأخرى بدون هذا الجزء
  accountNotConfigured.hidden = false;
  accountConfigured.hidden = true;
} else {
  accountNotConfigured.hidden = true;
  accountConfigured.hidden = false;

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  let currentUser = null;

  function authLogMsg(msg, isError){
    const item = document.createElement("div");
    item.className = "gen-log-item";
    item.innerHTML = `<span class="mark" style="${isError ? "color:#E0654F" : ""}">${isError ? "✕" : "✓"}</span><span>${msg}</span>`;
    authLog.appendChild(item);
  }

  authSignInBtn.addEventListener("click", async () => {
    authLog.innerHTML = "";
    try{
      await auth.signInWithEmailAndPassword(authEmailInput.value.trim(), authPasswordInput.value);
    } catch (err){
      authLogMsg(err.message || "فشل تسجيل الدخول", true);
    }
  });

  authSignUpBtn.addEventListener("click", async () => {
    authLog.innerHTML = "";
    try{
      await auth.createUserWithEmailAndPassword(authEmailInput.value.trim(), authPasswordInput.value);
    } catch (err){
      authLogMsg(err.message || "فشل إنشاء الحساب", true);
    }
  });

  authSignOutBtn.addEventListener("click", () => auth.signOut());

  auth.onAuthStateChanged((user) => {
    currentUser = user;
    if (user){
      authSignedOut.hidden = true;
      authSignedIn.hidden = false;
      authUserEmail.textContent = user.email;
      saveProjectBtn.disabled = !Object.keys(files).length;
      cloudAiBlock.hidden = false;
      loadProjectHistory();
      showToast(`مرحبًا ${user.email}`, "success");
    } else {
      authSignedOut.hidden = false;
      authSignedIn.hidden = true;
      cloudAiBlock.hidden = true;
    }
  });

  /* ---- save / load project history ---- */
  saveProjectBtn.addEventListener("click", async () => {
    if (!currentUser || !Object.keys(files).length) return;
    saveProjectBtn.disabled = true;
    try{
      await db.collection("users").doc(currentUser.uid).collection("projects").add({
        idea: ideaInput.value.trim(),
        files,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      showToast("تم حفظ المشروع في سجلك ✔", "success");
      loadProjectHistory();
    } catch (err){
      showToast(err.message || "فشل الحفظ", "error");
    } finally {
      saveProjectBtn.disabled = false;
    }
  });

  async function loadProjectHistory(){
    if (!currentUser) return;
    projectHistoryList.innerHTML = "";
    try{
      const snap = await db.collection("users").doc(currentUser.uid).collection("projects")
        .orderBy("createdAt", "desc").limit(20).get();

      if (snap.empty){
        const li = document.createElement("li");
        li.className = "diag-empty";
        li.textContent = "لا توجد مشاريع محفوظة بعد.";
        projectHistoryList.appendChild(li);
        return;
      }

      snap.forEach((doc) => {
        const data = doc.data();
        const li = document.createElement("li");
        li.className = "diag-item severity-warning";
        li.innerHTML = `<span class="diag-icon">📁</span><div class="diag-body"><div class="diag-message">${(data.idea || "بدون وصف").slice(0, 60)}</div></div>`;
        li.addEventListener("click", () => {
          files = data.files || {};
          activeFile = Object.keys(files)[0] || null;
          ideaInput.value = data.idea || "";
          renderFileTabs();
          if (activeFile) loadFileIntoEditor(activeFile);
          updatePreview();
          runDiagnostics();
          exportBtn.disabled = false;
          githubBtn.disabled = false;
          editor.disabled = false;
          fileSearch.disabled = false;
          accountPanel.hidden = true;
          showToast("تم تحميل المشروع من السجل", "success");
        });
        projectHistoryList.appendChild(li);
      });
    } catch (err){
      showToast(err.message || "فشل تحميل السجل", "error");
    }
  }

  /* ---- secure cloud AI generation (key never touches the browser) ---- */
  cloudAiGenerateBtn.addEventListener("click", async () => {
    const idea = ideaInput.value.trim();
    if (!idea){ ideaInput.focus(); return; }
    if (!currentUser){ showToast("سجّل الدخول أولًا", "error"); return; }

    cloudAiGenerateBtn.disabled = true;
    setEditorLoading(true);
    setPreviewLoading(true);
    try{
      const idToken = await currentUser.getIdToken();
      const res = await fetch(CLOUD_FUNCTION_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({ idea }),
      });
      if (!res.ok){
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `فشل الطلب (${res.status})`);
      }
      const data = await res.json();
      const parsed = JSON.parse(extractJSON(data.raw));

      const modules = detectModules(idea);
      const scaffold = buildProject(idea, modules);
      files = { ...scaffold, ...parsed };
      activeFile = "index.html";
      renderFileTabs();
      loadFileIntoEditor(activeFile);
      updatePreview();
      runDiagnostics();

      exportBtn.disabled = false;
      githubBtn.disabled = false;
      editor.disabled = false;
      saveProjectBtn.disabled = false;
      showToast("تم التوليد الآمن عبر السحابة ✔", "success");
    } catch (err){
      showToast(err.message || "فشل التوليد السحابي", "error");
    } finally {
      cloudAiGenerateBtn.disabled = false;
      setEditorLoading(false);
      setPreviewLoading(false);
    }
  });
}
