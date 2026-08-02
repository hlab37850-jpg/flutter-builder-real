/* =======================================================================
   Mahani Builder — Workspace engine
   يحلل وصف الفكرة (بحث عن كلمات مفتاحية)، يولّد ملفات مشروع حقيقية
   (index.html / style.css / app.js)، يتيح تحريرها حيًّا، ويعاينها فورًا،
   ويصدّرها كملف ZIP حقيقي عبر JSZip.
   ======================================================================= */

const MODULES = {
  customers:    { keywords: ["عملاء", "زبائن", "زبون", "عميل"], label: "العملاء" },
  inventory:    { keywords: ["مخزون", "مخازن", "منتجات", "بضاعة"], label: "المخزون" },
  invoices:     { keywords: ["فواتير", "فاتورة"], label: "الفواتير" },
  debts:        { keywords: ["ديون", "دين", "مديونية"], label: "الديون" },
  payments:     { keywords: ["دفعات", "دفع", "مدفوعات", "تسديد"], label: "الدفعات" },
  reports:      { keywords: ["تقارير", "تقرير", "إحصائيات"], label: "التقارير" },
  suppliers:    { keywords: ["موردين", "مورد", "موردون"], label: "الموردين" },
  employees:    { keywords: ["موظفين", "موظف", "العمال", "موظفون"], label: "الموظفين" },
  sales:        { keywords: ["مبيعات", "بيع", "مبيع"], label: "المبيعات" },
  expenses:     { keywords: ["مصروفات", "مصاريف", "مصروف"], label: "المصروفات" },
  orders:       { keywords: ["طلبات", "طلب", "الطلبيات"], label: "الطلبات" },
  appointments: { keywords: ["مواعيد", "موعد", "حجوزات", "حجز"], label: "المواعيد" },
};

const GEN_STEPS = [
  "تحليل الفكرة…",
  "اقتراح هيكل التطبيق…",
  "إنشاء الصفحات…",
  "تصميم الواجهة…",
  "كتابة أكواد الويب…",
  "تجهيز نسخة PWA…",
  "كتابة مشروع Flutter/Dart…",
  "تجهيز الملفات النهائية…",
];

/* ---- state ---- */
let files = {};          // { filename: content }
let activeFile = null;
let debounceTimer = null;

/* ---- dom refs ---- */
const ideaInput   = document.getElementById("idea-input");
const genBtn      = document.getElementById("generate-btn");
const genLog      = document.getElementById("gen-log");
const fileTabs    = document.getElementById("file-tabs");
const editor      = document.getElementById("code-editor");
const gutter      = document.getElementById("editor-gutter");
const previewFrame= document.getElementById("preview-frame");
const exportBtn   = document.getElementById("export-btn");
const refreshBtn  = document.getElementById("refresh-btn");
const newFileBtn  = document.getElementById("new-file-btn");
const githubBtn      = document.getElementById("github-btn");
const githubPanel     = document.getElementById("github-panel");
const githubClose     = document.getElementById("github-close");
const githubUploadBtn = document.getElementById("github-upload-btn");
const githubLog       = document.getElementById("github-log");
const ghTokenInput    = document.getElementById("gh-token");
const ghOwnerInput    = document.getElementById("gh-owner");
const ghRepoInput     = document.getElementById("gh-repo");
const ghPrivateInput  = document.getElementById("gh-private");
const diagList     = document.getElementById("diagnostics-list");
const diagCount    = document.getElementById("diag-count");
const fixAllBtn    = document.getElementById("fix-all-btn");
const aiToggle      = document.getElementById("ai-toggle");
const aiRealPanel   = document.getElementById("ai-real-panel");
const aiKeyInput    = document.getElementById("ai-key");
const aiModelInput  = document.getElementById("ai-model");
const aiGenerateBtn = document.getElementById("ai-generate-btn");
const toastStack     = document.getElementById("toast-stack");
const fileSearch      = document.getElementById("file-search");
const editorSkeleton  = document.getElementById("editor-skeleton");
const previewSkeleton = document.getElementById("preview-skeleton");

/* ---- toast notifications ---- */
function showToast(message, type){
  const toast = document.createElement("div");
  toast.className = `toast${type ? ` toast-${type}` : ""}`;
  toast.textContent = message;
  toastStack.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("leaving");
    setTimeout(() => toast.remove(), 220);
  }, 3200);
}

/* ---- skeleton loading toggles ---- */
function setEditorLoading(isLoading){
  editorSkeleton.hidden = !isLoading;
  editor.hidden = isLoading;
  gutter.hidden = isLoading;
}
function setPreviewLoading(isLoading){
  previewSkeleton.hidden = !isLoading;
  previewFrame.hidden = isLoading;
}

/* ---- example chips ---- */
document.getElementById("example-chips").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  ideaInput.value = chip.dataset.idea;
  ideaInput.focus();
});

/* ---- detect modules from free text ---- */
function detectModules(text){
  const found = [];
  for (const [key, mod] of Object.entries(MODULES)){
    if (mod.keywords.some(k => text.includes(k))) found.push(key);
  }
  return found;
}

/* ---- build project files from detected modules ---- */
function buildProject(ideaText, modules){
  const navItems = [{ id: "dashboard", label: "لوحة التحكم" }];
  modules.forEach(m => navItems.push({ id: m, label: MODULES[m].label }));

  const sections = [sectionDashboard(modules)];
  modules.forEach(m => sections.push(SECTION_BUILDERS[m]()));

  const nav = navItems.map((n, i) =>
    `        <button class="nav-btn${i===0 ? " active" : ""}" data-target="${n.id}">${n.label}</button>`
  ).join("\n");

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>تطبيقي — تم إنشاؤه بواسطة Mahani Builder</title>
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#2E6BA6">
<link rel="stylesheet" href="style.css">
</head>
<body>

  <div class="login-screen" id="login-screen">
    <form class="login-card" id="login-form">
      <h1>تسجيل الدخول</h1>
      <label>اسم المستخدم</label>
      <input type="text" value="admin" required>
      <label>كلمة المرور</label>
      <input type="password" value="••••••" required>
      <button type="submit">دخول</button>
    </form>
  </div>

  <div class="app-shell" id="app-shell" hidden>
    <header class="app-header">
      <span class="app-title">لوحتي</span>
      <button id="logout-btn" class="logout-btn">تسجيل الخروج</button>
    </header>
    <nav class="app-nav">
${nav}
    </nav>
    <main class="app-main">
${sections.join("\n\n")}
    </main>
  </div>

<script src="app.js"></script>
</body>
</html>
`;

  const css = baseCSS();
  const js = baseJS(navItems);
  const manifest = buildManifest();
  const sw = buildServiceWorker();
  const readme = buildReadme(ideaText, modules);
  const flutter = buildFlutterProject(modules, navItems);

  return {
    "index.html": html,
    "style.css": css,
    "app.js": js,
    "manifest.json": manifest,
    "sw.js": sw,
    "README.md": readme,
    ...flutter,
  };
}

/* ---- PWA manifest ---- */
function buildManifest(){
  return `{
  "name": "تطبيقي — Mahani Builder",
  "short_name": "تطبيقي",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#F6F8FA",
  "theme_color": "#2E6BA6",
  "lang": "ar",
  "dir": "rtl",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
`;
}

/* ---- minimal service worker (works once served over http/https) ---- */
function buildServiceWorker(){
  return `const CACHE_NAME = "mahani-app-v1";
const FILES_TO_CACHE = ["./index.html", "./style.css", "./app.js"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((res) => res || fetch(event.request))
  );
});
`;
}

/* ---- README describing the generated project ---- */
function buildReadme(ideaText, modules){
  const moduleList = modules.length
    ? modules.map(m => `- ${MODULES[m].label}`).join("\n")
    : "- لا توجد وحدات إضافية (تطبيق أساسي فقط)";

  return `# تطبيقي — مُولَّد بواسطة Mahani Builder AI

## الفكرة الأصلية
${ideaText}

## الوحدات المكتشفة
${moduleList}

## هيكل المشروع
- \`index.html\` / \`style.css\` / \`app.js\` — نسخة الويب (تعمل مباشرة بفتح index.html)
- \`manifest.json\` / \`sw.js\` / \`icon-192.png\` / \`icon-512.png\` — دعم PWA (قابل للتثبيت كأيقونة فعلية عند رفعه على استضافة حقيقية بـ HTTPS)
- \`flutter/\` — مشروع Flutter/Dart كامل بنفس هيكل الشاشات

## كيف تحصل على ملف APK حقيقي وجاهز للتثبيت
لا توجد طريقة تُنشئ APK فعليًا من داخل المتصفح — البناء يحتاج Android SDK وGradle. أسهل طريقة مجانية بدون تثبيت أي شيء:

1. أنشئ مستودعًا جديدًا في GitHub.
2. ارفع **محتويات مجلد \`flutter/\`** (وليس مجلد flutter نفسه) إلى جذر المستودع — تأكد أن \`pubspec.yaml\` يظهر في المسار الرئيسي.
3. بمجرد الرفع، يعمل الملف \`.github/workflows/build-apk.yml\` تلقائيًا ويبني APK حقيقيًا على خوادم GitHub (يستغرق دقائق قليلة).
4. اذهب إلى تبويب **Actions** في المستودع، افتح آخر تشغيل ناجح، وحمّل الملف من قسم **Artifacts** باسم \`app-release-apk\` — هذا ملف APK حقيقي جاهز للتثبيت على أي جهاز أندرويد (فعّل "السماح بمصادر غير معروفة" عند التثبيت).

بدائل أخرى: تثبيت Flutter SDK على حاسوب وتشغيل \`flutter build apk --release\` داخل مجلد flutter/، أو استخدام خدمة بناء سحابية مثل Codemagic.

`;
}

/* ---- Flutter/Dart skeleton mirroring the same modules ---- */
function buildFlutterProject(modules, navItems){
  const pubspec = `name: mahani_app
description: تطبيق أُنشئ تلقائيًا بواسطة Mahani Builder AI
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

flutter:
  uses-material-design: true
`;

  const tabDestinations = navItems.map(n =>
    `          NavigationDestination(icon: const Icon(Icons.circle_outlined), label: '${n.label}'),`
  ).join("\n");

  const tabViews = navItems.map(n =>
    `      _PlaceholderView(title: '${n.label}'),`
  ).join("\n");

  const dart = `import 'package:flutter/material.dart';

// تطبيق أساسي أُنشئ تلقائيًا بواسطة Mahani Builder AI
// يحتاج Flutter SDK لتشغيله: flutter run  (أو flutter build apk)

void main() => runApp(const MahaniApp());

class MahaniApp extends StatelessWidget {
  const MahaniApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'تطبيقي',
      locale: const Locale('ar'),
      theme: ThemeData(
        colorSchemeSeed: const Color(0xFF2E6BA6),
        useMaterial3: true,
      ),
      home: const HomeShell(),
    );
  }
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});
  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  final List<Widget> _views = const [
${tabViews}
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('لوحتي')),
      body: _views[_index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: [
${tabDestinations}
        ],
      ),
    );
  }
}

class _PlaceholderView extends StatelessWidget {
  final String title;
  const _PlaceholderView({required this.title});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text('$title — أضف بياناتك هنا', style: Theme.of(context).textTheme.titleMedium),
    );
  }
}
`;

  return {
    "flutter/pubspec.yaml": pubspec,
    "flutter/lib/main.dart": dart,
    "flutter/.github/workflows/build-apk.yml": buildApkWorkflow(),
  };
}

/* ---- GitHub Actions workflow: builds a real, installable APK for free ---- */
function buildApkWorkflow(){
  return `name: Build APK

# يبني APK حقيقي وجاهز للتثبيت تلقائيًا على خوادم GitHub (مجانًا).
# الخطوات: ١) أنشئ مستودع GitHub جديد وارفع محتويات مجلد flutter/ إلى جذر المستودع
#          ٢) اذهب إلى تبويب Actions بعد الرفع وانتظر اكتمال البناء
#          ٣) حمّل الملف الناتج من قسم Artifacts باسم app-release-apk

on:
  push:
    branches: [ main, master ]
  workflow_dispatch: {}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: subosito/flutter-action@v2
        with:
          flutter-version: 'stable'
          channel: 'stable'

      - name: توليد هيكلية Android متوافقة مع نسخة Flutter الحالية
        # نولّد مجلد android/ (وبقية منصّات المنصّة) من جديد بنفس نسخة الـ SDK وقت البناء
        # بدل الاعتماد على ملفات Gradle ثابتة قد تصبح غير متوافقة مع تحديثات Flutter.
        run: flutter create --platforms=android .

      - name: تثبيت الحزم
        run: flutter pub get

      - name: بناء APK
        run: flutter build apk --release

      - name: رفع APK كملف قابل للتحميل
        uses: actions/upload-artifact@v4
        with:
          name: app-release-apk
          path: build/app/outputs/flutter-apk/app-release.apk
`;
}

/* ---- section builders per module ---- */
function sectionDashboard(modules){
  const cards = modules.map(m => `        <div class="stat-card">
          <span class="stat-label">${MODULES[m].label}</span>
          <span class="stat-value" data-stat="${m}">0</span>
        </div>`).join("\n");
  return `      <section class="view active" id="view-dashboard">
        <h2>لوحة التحكم</h2>
        <div class="stat-grid">
${cards || '        <p class="muted">لا توجد وحدات إضافية بعد.</p>'}
        </div>
      </section>`;
}

const SECTION_BUILDERS = {
  customers: () => `      <section class="view" id="view-customers">
        <div class="view-head">
          <h2>العملاء</h2>
          <button class="btn-add" data-add="customers">+ إضافة عميل</button>
        </div>
        <table class="data-table" id="table-customers">
          <thead><tr><th>الاسم</th><th>الهاتف</th><th>ملاحظات</th></tr></thead>
          <tbody></tbody>
        </table>
      </section>`,

  inventory: () => `      <section class="view" id="view-inventory">
        <div class="view-head">
          <h2>المخزون</h2>
          <button class="btn-add" data-add="inventory">+ إضافة صنف</button>
        </div>
        <table class="data-table" id="table-inventory">
          <thead><tr><th>الصنف</th><th>الكمية</th><th>السعر</th></tr></thead>
          <tbody></tbody>
        </table>
      </section>`,

  invoices: () => `      <section class="view" id="view-invoices">
        <div class="view-head">
          <h2>الفواتير</h2>
          <button class="btn-add" data-add="invoices">+ فاتورة جديدة</button>
        </div>
        <table class="data-table" id="table-invoices">
          <thead><tr><th>رقم الفاتورة</th><th>العميل</th><th>المبلغ</th></tr></thead>
          <tbody></tbody>
        </table>
      </section>`,

  debts: () => `      <section class="view" id="view-debts">
        <div class="view-head">
          <h2>الديون</h2>
          <button class="btn-add" data-add="debts">+ تسجيل دين</button>
        </div>
        <table class="data-table" id="table-debts">
          <thead><tr><th>العميل</th><th>المبلغ</th><th>المتبقي</th></tr></thead>
          <tbody></tbody>
        </table>
      </section>`,

  payments: () => `      <section class="view" id="view-payments">
        <div class="view-head">
          <h2>الدفعات</h2>
          <button class="btn-add" data-add="payments">+ تسجيل دفعة</button>
        </div>
        <table class="data-table" id="table-payments">
          <thead><tr><th>العميل</th><th>المبلغ المدفوع</th><th>التاريخ</th></tr></thead>
          <tbody></tbody>
        </table>
      </section>`,

  reports: () => `      <section class="view" id="view-reports">
        <h2>التقارير</h2>
        <p class="muted">ملخص شهري تلقائي يُبنى من بيانات الوحدات الأخرى.</p>
        <div class="report-box" id="report-box">لا توجد بيانات كافية بعد.</div>
      </section>`,

  suppliers: () => `      <section class="view" id="view-suppliers">
        <div class="view-head">
          <h2>الموردين</h2>
          <button class="btn-add" data-add="suppliers">+ إضافة مورد</button>
        </div>
        <table class="data-table" id="table-suppliers">
          <thead><tr><th>اسم المورد</th><th>الهاتف</th><th>آخر توريد</th></tr></thead>
          <tbody></tbody>
        </table>
      </section>`,

  employees: () => `      <section class="view" id="view-employees">
        <div class="view-head">
          <h2>الموظفين</h2>
          <button class="btn-add" data-add="employees">+ إضافة موظف</button>
        </div>
        <table class="data-table" id="table-employees">
          <thead><tr><th>الاسم</th><th>الوظيفة</th><th>الراتب</th></tr></thead>
          <tbody></tbody>
        </table>
      </section>`,

  sales: () => `      <section class="view" id="view-sales">
        <div class="view-head">
          <h2>المبيعات</h2>
          <button class="btn-add" data-add="sales">+ عملية بيع</button>
        </div>
        <table class="data-table" id="table-sales">
          <thead><tr><th>الصنف</th><th>الكمية</th><th>الإجمالي</th></tr></thead>
          <tbody></tbody>
        </table>
      </section>`,

  expenses: () => `      <section class="view" id="view-expenses">
        <div class="view-head">
          <h2>المصروفات</h2>
          <button class="btn-add" data-add="expenses">+ إضافة مصروف</button>
        </div>
        <table class="data-table" id="table-expenses">
          <thead><tr><th>البند</th><th>المبلغ</th><th>التاريخ</th></tr></thead>
          <tbody></tbody>
        </table>
      </section>`,

  orders: () => `      <section class="view" id="view-orders">
        <div class="view-head">
          <h2>الطلبات</h2>
          <button class="btn-add" data-add="orders">+ طلب جديد</button>
        </div>
        <table class="data-table" id="table-orders">
          <thead><tr><th>رقم الطلب</th><th>العميل</th><th>الحالة</th></tr></thead>
          <tbody></tbody>
        </table>
      </section>`,

  appointments: () => `      <section class="view" id="view-appointments">
        <div class="view-head">
          <h2>المواعيد</h2>
          <button class="btn-add" data-add="appointments">+ حجز موعد</button>
        </div>
        <table class="data-table" id="table-appointments">
          <thead><tr><th>العميل</th><th>الموعد</th><th>ملاحظات</th></tr></thead>
          <tbody></tbody>
        </table>
      </section>`,
};

/* ---- shared CSS for generated app ---- */
function baseCSS(){
  return `:root{
  --ink: #16232E;
  --paper: #F6F8FA;
  --card: #FFFFFF;
  --line: #E1E7EC;
  --brand: #2E6BA6;
  --accent: #F2A93B;
  --muted: #6C7B87;
}
*{ box-sizing: border-box; margin:0; padding:0; }
body{ font-family: Tahoma, "Segoe UI", sans-serif; background: var(--paper); color: var(--ink); }

/* login */
.login-screen{ min-height: 100vh; display: grid; place-items: center; background: var(--brand); }
.login-card{ background: var(--card); padding: 32px 28px; border-radius: 12px; width: 300px; display: flex; flex-direction: column; gap: 10px; }
.login-card h1{ font-size: 1.2rem; margin-bottom: 10px; text-align: center; }
.login-card label{ font-size: 0.8rem; color: var(--muted); }
.login-card input{ padding: 9px 10px; border: 1px solid var(--line); border-radius: 6px; font-size: 0.9rem; }
.login-card button{ margin-top: 10px; padding: 10px; border: none; border-radius: 6px; background: var(--brand); color: #fff; font-weight: bold; cursor: pointer; }

/* app shell */
.app-header{ display:flex; align-items:center; justify-content:space-between; padding: 14px 20px; background: var(--brand); color: #fff; }
.app-title{ font-weight: bold; }
.logout-btn{ background: rgba(255,255,255,0.15); border: none; color: #fff; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; }

.app-nav{ display: flex; gap: 6px; padding: 10px 20px; background: var(--card); border-bottom: 1px solid var(--line); flex-wrap: wrap; }
.nav-btn{ border: none; background: transparent; padding: 8px 14px; border-radius: 6px; color: var(--muted); font-size: 0.85rem; cursor: pointer; }
.nav-btn.active{ background: var(--brand); color: #fff; }

.app-main{ padding: 22px 20px; }
.view{ display: none; }
.view.active{ display: block; }
.view h2{ margin-bottom: 16px; font-size: 1.15rem; }

.stat-grid{ display: grid; grid-template-columns: repeat(auto-fit, minmax(140px,1fr)); gap: 12px; }
.stat-card{ background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 6px; }
.stat-label{ font-size: 0.78rem; color: var(--muted); }
.stat-value{ font-size: 1.6rem; font-weight: bold; color: var(--brand); }

.view-head{ display:flex; align-items:center; justify-content: space-between; margin-bottom: 14px; }
.btn-add{ border: none; background: var(--accent); color: #1A1204; padding: 8px 14px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.82rem; }

.data-table{ width: 100%; border-collapse: collapse; background: var(--card); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
.data-table th, .data-table td{ padding: 10px 12px; text-align: right; border-bottom: 1px solid var(--line); font-size: 0.86rem; }
.data-table th{ background: #EEF2F5; color: var(--muted); font-weight: 600; }
.data-table tbody:empty::after{ content: "لا توجد بيانات بعد"; }

.muted{ color: var(--muted); font-size: 0.88rem; }
.report-box{ margin-top: 12px; background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 16px; font-size: 0.9rem; }
`;
}

/* ---- shared JS for generated app ---- */
function baseJS(navItems){
  return `// تطبيق تجريبي أُنشئ تلقائيًا — بيانات محلية فقط (بدون خادم)
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const loginScreen = document.getElementById("login-screen");
  const appShell = document.getElementById("app-shell");
  const logoutBtn = document.getElementById("logout-btn");

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    loginScreen.hidden = true;
    appShell.hidden = false;
  });

  logoutBtn.addEventListener("click", () => {
    appShell.hidden = true;
    loginScreen.hidden = false;
  });

  // التنقل بين الشاشات
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("view-" + btn.dataset.target).classList.add("active");
    });
  });

  // إضافة صف تجريبي عند الضغط على أزرار "+ إضافة"
  document.querySelectorAll(".btn-add").forEach(btn => {
    btn.addEventListener("click", () => {
      const table = document.querySelector("#table-" + btn.dataset.add + " tbody");
      if (!table) return;
      const cols = table.parentElement.querySelectorAll("thead th").length;
      const row = document.createElement("tr");
      for (let i = 0; i < cols; i++){
        const td = document.createElement("td");
        td.textContent = "—";
        row.appendChild(td);
      }
      table.appendChild(row);
      const stat = document.querySelector('[data-stat="' + btn.dataset.add + '"]');
      if (stat) stat.textContent = table.children.length;
    });
  });
});

// تسجيل service worker لدعم PWA — يعمل فقط عند تشغيل الموقع عبر خادم حقيقي (http/https)
if ("serviceWorker" in navigator && (location.protocol === "http:" || location.protocol === "https:")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
`;
}

/* =======================================================================
   Generation sequence (simulated pipeline + real file build)
   ======================================================================= */
function runGeneration(){
  const idea = ideaInput.value.trim();
  if (!idea){ ideaInput.focus(); showToast("اكتب وصف الفكرة أولًا", "error"); return; }

  genBtn.disabled = true;
  exportBtn.disabled = true;
  githubBtn.disabled = true;
  genLog.innerHTML = "";
  setEditorLoading(true);
  setPreviewLoading(true);
  fileSearch.disabled = true;

  const modules = detectModules(idea);

  GEN_STEPS.forEach((step, i) => {
    setTimeout(() => {
      const item = document.createElement("div");
      item.className = "gen-log-item";
      item.innerHTML = `<span class="mark">✓</span><span>${step}</span>`;
      genLog.appendChild(item);

      if (i === GEN_STEPS.length - 1){
        files = buildProject(idea, modules);
        activeFile = "index.html";
        renderFileTabs();
        loadFileIntoEditor(activeFile);
        updatePreview();
        runDiagnostics();
        setEditorLoading(false);
        setPreviewLoading(false);
        fileSearch.disabled = false;
        genBtn.disabled = false;
        exportBtn.disabled = false;
        githubBtn.disabled = false;
        editor.disabled = false;
        showToast("تم إنشاء المشروع بنجاح ✔", "success");
      }
    }, i * 420);
  });
}

/* =======================================================================
   File explorer / tabs
   ======================================================================= */
function renderFileTabs(){
  fileTabs.innerHTML = "";
  Object.keys(files).forEach(name => {
    const tab = document.createElement("div");
    tab.className = "file-tab" + (name === activeFile ? " active" : "");

    const nameBtn = document.createElement("button");
    nameBtn.className = "tab-name";
    nameBtn.textContent = name;
    nameBtn.title = "اضغط للفتح — اضغط مرتين لإعادة التسمية";
    nameBtn.addEventListener("click", () => {
      saveEditorToActiveFile();
      activeFile = name;
      renderFileTabs();
      loadFileIntoEditor(name);
    });
    nameBtn.addEventListener("dblclick", () => {
      const newName = prompt("إعادة تسمية الملف:", name);
      if (!newName || newName === name || files[newName]) return;
      files[newName] = files[name];
      delete files[name];
      if (activeFile === name) activeFile = newName;
      renderFileTabs();
      loadFileIntoEditor(activeFile);
      updatePreview();
      runDiagnostics();
    });
    tab.appendChild(nameBtn);

    const closeBtn = document.createElement("button");
    closeBtn.className = "tab-close";
    closeBtn.textContent = "×";
    closeBtn.title = "حذف الملف";
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (Object.keys(files).length <= 1) return;
      delete files[name];
      if (activeFile === name){
        activeFile = Object.keys(files)[0];
        loadFileIntoEditor(activeFile);
      }
      renderFileTabs();
      updatePreview();
      runDiagnostics();
    });
    tab.appendChild(closeBtn);

    fileTabs.appendChild(tab);
  });
}

function loadFileIntoEditor(name){
  editor.value = files[name] || "";
  updateGutter();
}

function saveEditorToActiveFile(){
  if (activeFile) files[activeFile] = editor.value;
}

function updateGutter(){
  const lines = editor.value.split("\n").length;
  let out = "";
  for (let i = 1; i <= lines; i++) out += i + "\n";
  gutter.textContent = out;
}

newFileBtn.addEventListener("click", () => {
  if (!Object.keys(files).length){ ideaInput.focus(); return; }
  const name = prompt("اسم الملف الجديد (مثال: data.js):");
  if (!name) return;
  if (files[name]) { showToast("هذا الملف موجود بالفعل.", "error"); return; }
  files[name] = "";
  activeFile = name;
  renderFileTabs();
  loadFileIntoEditor(name);
  runDiagnostics();
  fileSearch.disabled = false;
});

/* ---- file search / filter ---- */
fileSearch.addEventListener("input", () => {
  const q = fileSearch.value.trim().toLowerCase();
  document.querySelectorAll(".file-tab").forEach((tab) => {
    const name = tab.querySelector(".tab-name").textContent.toLowerCase();
    tab.classList.toggle("hidden-by-search", q.length > 0 && !name.includes(q));
  });
});

/* ---- keyboard shortcuts ---- */
ideaInput.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter"){
    e.preventDefault();
    runGeneration();
  }
});
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k"){
    if (!fileSearch.disabled){
      e.preventDefault();
      fileSearch.focus();
    }
  }
});

/* =======================================================================
   Editor <-> live preview
   ======================================================================= */
editor.addEventListener("input", () => {
  updateGutter();
  saveEditorToActiveFile();
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    updatePreview();
    runDiagnostics();
  }, 350);
});
editor.addEventListener("scroll", () => {
  gutter.scrollTop = editor.scrollTop;
});

function updatePreview(){
  if (!files["index.html"]) return;
  let html = files["index.html"];

  // دمج ملفات الربط (style.css / app.js) داخل نسخة المعاينة فقط —
  // الملفات المُصدَّرة تبقى مرتبطة عبر <link>/<script> حقيقية.
  html = html.replace(
    '<link rel="stylesheet" href="style.css">',
    `<style>${files["style.css"] || ""}</style>`
  );
  html = html.replace(
    '<script src="app.js"></script>',
    `<script>${files["app.js"] || ""}<\/script>`
  );

  previewFrame.srcdoc = html;
}

refreshBtn.addEventListener("click", updatePreview);

/* =======================================================================
   Export as real .zip via JSZip (includes generated PWA icons as real PNGs)
   ======================================================================= */
let cachedIcons = null;

function generateIconBlob(size){
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#2E6BA6";
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = "#F2A93B";
    ctx.font = `bold ${Math.floor(size * 0.5)}px Tahoma, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("م", size / 2, size / 2 + size * 0.04);

    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

async function getIcons(){
  if (cachedIcons) return cachedIcons;
  const [icon192, icon512] = await Promise.all([
    generateIconBlob(192),
    generateIconBlob(512),
  ]);
  cachedIcons = { "icon-192.png": icon192, "icon-512.png": icon512 };
  return cachedIcons;
}

exportBtn.addEventListener("click", async () => {
  saveEditorToActiveFile();
  runDiagnostics();
  const errorCount = diagnostics.filter(d => d.severity === "error").length;
  if (errorCount && !confirm(`توجد ${errorCount} أخطاء غير محلولة في الكود. تصدير رغم ذلك؟`)){
    return;
  }

  const zip = new JSZip();

  Object.entries(files).forEach(([name, content]) => zip.file(name, content));

  const icons = await getIcons();
  Object.entries(icons).forEach(([name, blob]) => zip.file(name, blob));

  const blob = await zip.generateAsync({ type: "blob" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "mahani-project.zip";
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast("تم تنزيل المشروع كملف ZIP ✔", "success");
});

/* =======================================================================
   Direct GitHub upload — calls the GitHub REST API straight from the
   browser using a Personal Access Token. Nothing passes through any
   server other than GitHub's own API.
   ======================================================================= */
githubBtn.addEventListener("click", () => {
  githubPanel.hidden = !githubPanel.hidden;
});
githubClose.addEventListener("click", () => { githubPanel.hidden = true; });

function ghLog(message, isError){
  const item = document.createElement("div");
  item.className = "gen-log-item";
  item.innerHTML = `<span class="mark" style="${isError ? 'color:#E0654F' : ''}">${isError ? "✕" : "✓"}</span><span>${message}</span>`;
  githubLog.appendChild(item);
  githubLog.scrollTop = githubLog.scrollHeight;
}

function textToBase64(str){
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function blobToBase64(blob){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function encodePath(path){
  return path.split("/").map(encodeURIComponent).join("/");
}

async function ghRequest(url, token, options = {}){
  const res = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
  return res;
}

async function ensureRepo(owner, repo, token, isPrivate){
  let res = await ghRequest(`https://api.github.com/repos/${owner}/${repo}`, token);
  if (res.status === 200) return (await res.json()).default_branch;

  if (res.status === 404){
    ghLog("المستودع غير موجود — يتم إنشاؤه…");
    const createRes = await ghRequest(`https://api.github.com/user/repos`, token, {
      method: "POST",
      body: JSON.stringify({
        name: repo,
        private: isPrivate,
        auto_init: true,
        description: "مشروع أُنشئ بواسطة Mahani Builder AI",
      }),
    });
    if (!createRes.ok){
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err.message || `تعذر إنشاء المستودع (${createRes.status})`);
    }
    await new Promise(r => setTimeout(r, 1500));
    const created = await createRes.json();
    return created.default_branch || "main";
  }

  if (res.status === 401) throw new Error("الرمز (Token) غير صالح أو منتهي.");
  if (res.status === 403) throw new Error("الرمز لا يملك صلاحية كافية (يحتاج repo + workflow).");
  throw new Error(`تعذر الوصول إلى GitHub (${res.status})`);
}

async function uploadFile(owner, repo, path, base64Content, token, branch){
  const getRes = await ghRequest(
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(branch)}`,
    token
  );
  const sha = getRes.status === 200 ? (await getRes.json()).sha : undefined;

  const putRes = await ghRequest(
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodePath(path)}`,
    token,
    {
      method: "PUT",
      body: JSON.stringify({
        message: `Mahani Builder: تحديث ${path}`,
        content: base64Content,
        branch,
        ...(sha ? { sha } : {}),
      }),
    }
  );
  if (!putRes.ok){
    const err = await putRes.json().catch(() => ({}));
    throw new Error(`فشل رفع ${path}: ${err.message || putRes.status}`);
  }
  const putData = await putRes.json();
  return putData.commit && putData.commit.sha;
}

/* ---- Real build tracking: polls the Actions run triggered by our push ---- */
async function findRunForCommit(owner, repo, token, commitSha, attempts = 10){
  for (let i = 0; i < attempts; i++){
    const res = await ghRequest(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=10`,
      token
    );
    if (res.ok){
      const data = await res.json();
      const match = (data.workflow_runs || []).find(r => r.head_sha === commitSha);
      if (match) return match;
    }
    await new Promise(r => setTimeout(r, 2500));
  }
  return null;
}

async function pollRunStatus(owner, repo, token, runId, onUpdate, maxAttempts = 90){
  for (let i = 0; i < maxAttempts; i++){
    const res = await ghRequest(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`,
      token
    );
    if (res.ok){
      const run = await res.json();
      onUpdate(run);
      if (run.status === "completed") return run;
    }
    await new Promise(r => setTimeout(r, 4000));
  }
  return null;
}

async function trackRealBuild(owner, repo, token, commitSha){
  ghLog("⏳ في انتظار بدء تشغيل GitHub Actions…");
  const run = await findRunForCommit(owner, repo, token, commitSha);
  if (!run){
    ghLog("لم يُعثر على تشغيل مطابق تلقائيًا — تحقق من تبويب Actions يدويًا.", true);
    return;
  }

  let lastStatus = "";
  const finalRun = await pollRunStatus(owner, repo, token, run.id, (r) => {
    if (r.status !== lastStatus){
      lastStatus = r.status;
      const label = { queued: "⏳ البناء في قائمة الانتظار…", in_progress: "⚙️ البناء قيد التشغيل الآن…" }[r.status] || r.status;
      ghLog(label);
    }
  });

  if (!finalRun){
    ghLog("انتهت مهلة المتابعة — تابع الحالة يدويًا من الرابط أدناه.", true);
  } else if (finalRun.conclusion === "success"){
    ghLog("✅ اكتمل البناء بنجاح — APK حقيقي جاهز.");
  } else {
    ghLog(`✕ فشل البناء (${finalRun.conclusion}) — افتح السجل لمعرفة السبب.`, true);
  }

  const runUrl = `https://github.com/${owner}/${repo}/actions/runs/${run.id}`;
  const item = document.createElement("div");
  item.className = "gen-log-item";
  item.innerHTML = `<span class="mark">↗</span><span><a href="${runUrl}" target="_blank" rel="noopener" style="color:var(--accent-2)">افتح صفحة التشغيل وحمّل APK من قسم Artifacts</a></span>`;
  githubLog.appendChild(item);
}

githubUploadBtn.addEventListener("click", async () => {
  saveEditorToActiveFile();
  const token = ghTokenInput.value.trim();
  const owner = ghOwnerInput.value.trim();
  const repo = ghRepoInput.value.trim();
  const isPrivate = ghPrivateInput.checked;

  githubLog.innerHTML = "";

  if (!token || !owner || !repo){
    ghLog("املأ الرمز واسم المستخدم واسم المستودع أولًا.", true);
    return;
  }
  if (!Object.keys(files).length){
    ghLog("أنشئ المشروع أولًا من القسم الأول.", true);
    return;
  }

  githubUploadBtn.disabled = true;
  try{
    ghLog("التحقق من المستودع…");
    const branch = await ensureRepo(owner, repo, token, isPrivate);

    // web + flutter files (strip "flutter/" prefix so pubspec.yaml sits at repo root)
    const uploadList = Object.entries(files).map(([name, content]) => ({
      path: name.startsWith("flutter/") ? name.slice("flutter/".length) : name,
      content,
    }));

    const icons = await getIcons();
    const iconEntries = await Promise.all(
      Object.entries(icons).map(async ([name, blob]) => ({
        path: name,
        base64: await blobToBase64(blob),
      }))
    );

    let lastCommitSha = null;
    for (const { path, content } of uploadList){
      ghLog(`رفع ${path}…`);
      lastCommitSha = (await uploadFile(owner, repo, path, textToBase64(content), token, branch)) || lastCommitSha;
    }
    for (const { path, base64 } of iconEntries){
      ghLog(`رفع ${path}…`);
      lastCommitSha = (await uploadFile(owner, repo, path, base64, token, branch)) || lastCommitSha;
    }

    ghLog("اكتمل الرفع بنجاح ✔");
    showToast("تم الرفع إلى GitHub بنجاح ✔", "success");

    if (lastCommitSha){
      await trackRealBuild(owner, repo, token, lastCommitSha);
    } else {
      const repoUrl = `https://github.com/${owner}/${repo}`;
      const item = document.createElement("div");
      item.className = "gen-log-item";
      item.innerHTML = `<span class="mark">↗</span><span><a href="${repoUrl}/actions" target="_blank" rel="noopener" style="color:var(--accent-2)">تابع بناء الـ APK في تبويب Actions</a></span>`;
      githubLog.appendChild(item);
    }
  } catch (err){
    ghLog(err.message || "حدث خطأ غير متوقع.", true);
    showToast(err.message || "فشل الرفع إلى GitHub", "error");
  } finally {
    githubUploadBtn.disabled = false;
  }
});

/* =======================================================================
   Diagnostics ("Problems" panel) — real checks + one-click fixes
   ======================================================================= */
let diagnostics = [];

function lineOf(content, index){
  return content.slice(0, index).split("\n").length;
}

function checkHTML(filename, content, allFiles){
  const diags = [];

  if (!/^\s*<!DOCTYPE\s+html>/i.test(content)){
    diags.push({
      file: filename, line: 1, severity: "warning",
      message: "لا يبدأ الملف بـ <!DOCTYPE html>",
      fixable: true,
      fix: (c) => `<!DOCTYPE html>\n${c}`,
    });
  }

  const VOID_TAGS = new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*?(\/?)>/g;
  const stack = [];
  let m;
  while ((m = tagRe.exec(content))){
    const tagName = m[1].toLowerCase();
    const isClosing = m[0][1] === "/";
    const isSelfClosing = m[2] === "/" || VOID_TAGS.has(tagName);
    if (isClosing){
      if (stack.length && stack[stack.length - 1].name === tagName){
        stack.pop();
      } else {
        diags.push({
          file: filename, line: lineOf(content, m.index), severity: "error",
          message: `وسم إغلاق غير متطابق: </${tagName}>`,
          fixable: false,
        });
      }
    } else if (!isSelfClosing){
      stack.push({ name: tagName, index: m.index });
    }
  }
  if (stack.length){
    const names = stack.map(s => s.name);
    diags.push({
      file: filename, line: lineOf(content, stack[0].index), severity: "error",
      message: `وسوم غير مغلقة: ${names.join(", ")}`,
      fixable: true,
      fix: (c) => c + "\n" + names.slice().reverse().map(n => `</${n}>`).join("\n") + "\n",
    });
  }

  const refRe = /<(?:script[^>]+src|link[^>]+href)=["']([^"':]+)["']/g;
  let rm;
  while ((rm = refRe.exec(content))){
    const ref = rm[1];
    if (ref.startsWith("http") || ref.startsWith("//")) continue;
    if (!(ref in allFiles)){
      diags.push({
        file: filename, line: lineOf(content, rm.index), severity: "error",
        message: `الملف المرتبط غير موجود: ${ref}`,
        fixable: true,
        fixType: "create-file",
        fixData: ref,
      });
    }
  }

  const idRe = /\bid=["']([^"']+)["']/g;
  const seen = new Map();
  let im;
  while ((im = idRe.exec(content))){
    const id = im[1];
    if (seen.has(id)){
      diags.push({
        file: filename, line: lineOf(content, im.index), severity: "warning",
        message: `معرّف id مكرر: "${id}"`,
        fixable: true,
        fix: (c) => {
          let n = 0;
          return c.replace(new RegExp(`id=["']${id}["']`, "g"), () => {
            n++;
            return n === 1 ? `id="${id}"` : `id="${id}-${n}"`;
          });
        },
      });
      seen.set(id, seen.get(id) + 1);
    } else {
      seen.set(id, 1);
    }
  }

  return diags;
}

function checkCSS(filename, content){
  const diags = [];
  const open = (content.match(/{/g) || []).length;
  const close = (content.match(/}/g) || []).length;
  if (open > close){
    diags.push({
      file: filename, line: content.split("\n").length, severity: "error",
      message: `أقواس غير مغلقة {} — ناقص ${open - close}`,
      fixable: true,
      fix: (c) => c + "\n" + "}".repeat(open - close) + "\n",
    });
  } else if (close > open){
    diags.push({
      file: filename, line: content.split("\n").length, severity: "error",
      message: `أقواس زائدة } — زائد ${close - open}`,
      fixable: false,
    });
  }
  return diags;
}

function checkJS(filename, content){
  const diags = [];
  try{
    if (window.acorn){
      window.acorn.parse(content, { ecmaVersion: "latest", sourceType: "script" });
    }
  } catch (err){
    const line = (err.loc && err.loc.line) || 1;
    const counts = { "{": 0, "}": 0, "(": 0, ")": 0, "[": 0, "]": 0 };
    for (const ch of content) if (ch in counts) counts[ch]++;
    let missing = "";
    if (counts["("] > counts[")"]) missing += ")".repeat(counts["("] - counts[")"]);
    if (counts["["] > counts["]"]) missing += "]".repeat(counts["["] - counts["]"]);
    if (counts["{"] > counts["}"]) missing += "}".repeat(counts["{"] - counts["}"]);
    diags.push({
      file: filename, line, severity: "error",
      message: `خطأ في الصياغة: ${(err.message || "").replace(/\(\d+:\d+\)/, "").trim()}`,
      fixable: missing.length > 0,
      fix: missing.length ? (c) => c + "\n" + missing + "\n" : undefined,
    });
  }
  return diags;
}

function checkJSON(filename, content){
  const diags = [];
  try{ JSON.parse(content); }
  catch (err){
    diags.push({
      file: filename, line: 1, severity: "error",
      message: `JSON غير صالح: ${err.message}`,
      fixable: false,
    });
  }
  return diags;
}

function runDiagnostics(){
  diagnostics = [];
  Object.entries(files).forEach(([name, content]) => {
    if (name.endsWith(".html")) diagnostics.push(...checkHTML(name, content, files));
    else if (name.endsWith(".css")) diagnostics.push(...checkCSS(name, content));
    else if (name.endsWith(".js")) diagnostics.push(...checkJS(name, content));
    else if (name.endsWith(".json")) diagnostics.push(...checkJSON(name, content));
  });
  renderDiagnostics();
}

function renderDiagnostics(){
  diagList.innerHTML = "";
  diagCount.textContent = diagnostics.length;
  diagCount.classList.toggle("has-errors", diagnostics.some(d => d.severity === "error"));
  diagCount.classList.toggle("warnings-only", diagnostics.length > 0 && !diagnostics.some(d => d.severity === "error"));
  fixAllBtn.disabled = !diagnostics.some(d => d.fixable);

  if (!diagnostics.length){
    const li = document.createElement("li");
    li.className = "diag-empty";
    li.textContent = Object.keys(files).length
      ? "لا توجد مشاكل — الكود سليم ✔"
      : "لا توجد مشاكل — أنشئ مشروعًا أولًا أو عدّل الكود ليبدأ الفحص التلقائي.";
    diagList.appendChild(li);
    return;
  }

  diagnostics.forEach((diag) => {
    const li = document.createElement("li");
    li.className = `diag-item severity-${diag.severity}`;

    const icon = document.createElement("span");
    icon.className = "diag-icon";
    icon.textContent = diag.severity === "error" ? "✕" : "⚠";
    li.appendChild(icon);

    const body = document.createElement("div");
    body.className = "diag-body";
    const msg = document.createElement("div");
    msg.className = "diag-message";
    msg.textContent = diag.message;
    const loc = document.createElement("div");
    loc.className = "diag-location";
    loc.textContent = `${diag.file} — سطر ${diag.line}`;
    body.appendChild(msg);
    body.appendChild(loc);
    li.appendChild(body);
    body.addEventListener("click", () => gotoDiagnostic(diag));

    if (diag.fixable){
      const fixBtn = document.createElement("button");
      fixBtn.className = "diag-fix-btn";
      fixBtn.textContent = "🔧 إصلاح";
      fixBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        applyFix(diag);
        runDiagnostics();
        updatePreview();
      });
      li.appendChild(fixBtn);
    }

    diagList.appendChild(li);
  });
}

function applyFix(diag){
  if (diag.fixType === "create-file"){
    if (!(diag.fixData in files)){
      files[diag.fixData] = "/* ملف تم إنشاؤه تلقائيًا لإصلاح رابط مفقود */\n";
      renderFileTabs();
    }
    return;
  }
  if (diag.fix){
    files[diag.file] = diag.fix(files[diag.file]);
    if (activeFile === diag.file) loadFileIntoEditor(diag.file);
  }
}

function fixAllDiagnostics(){
  let guard = 0;
  while (guard < 30){
    const target = diagnostics.find(d => d.fixable);
    if (!target) break;
    applyFix(target);
    runDiagnostics();
    guard++;
  }
  updatePreview();
}

function gotoDiagnostic(diag){
  if (activeFile !== diag.file && files[diag.file] !== undefined){
    saveEditorToActiveFile();
    activeFile = diag.file;
    renderFileTabs();
    loadFileIntoEditor(diag.file);
  }
  const lines = editor.value.split("\n");
  let idx = 0;
  for (let i = 0; i < diag.line - 1 && i < lines.length; i++) idx += lines[i].length + 1;
  editor.focus();
  editor.setSelectionRange(idx, idx);
  const lineHeightPx = 21;
  editor.scrollTop = Math.max(0, (diag.line - 1) * lineHeightPx - 80);
  gutter.scrollTop = editor.scrollTop;
}

fixAllBtn.addEventListener("click", fixAllDiagnostics);

/* ---- wire generate button ---- */
genBtn.addEventListener("click", runGeneration);

/* =======================================================================
   Real AI generation — calls the actual Anthropic API from the browser
   using the user's own key. Genuinely understands free-form Arabic text,
   unlike the keyword-based engine above.
   ======================================================================= */
aiToggle.addEventListener("click", () => {
  const isOpen = aiRealPanel.hidden;
  aiRealPanel.hidden = !isOpen;
  aiToggle.setAttribute("aria-expanded", String(isOpen));
});

function extractJSON(text){
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("لم يُرجع النموذج JSON صالحًا");
  return raw.slice(start, end + 1);
}

const AI_SYSTEM_PROMPT = `أنت مولّد مشاريع ويب. يصف المستخدم فكرة تطبيق بالعربية.
أعد رد JSON صِرف فقط (بدون أي نص خارج JSON، بدون Markdown fences) بهذا الشكل بالضبط:
{"index.html": "...", "style.css": "...", "app.js": "..."}
- index.html صفحة كاملة تتضمن شاشة تسجيل دخول بسيطة ثم واجهة رئيسية تعكس الفكرة، بالعربية RTL، تربط style.css عبر <link> وapp.js عبر <script src>.
- style.css تصميم عصري ومتجاوب.
- app.js يفعّل التفاعل الأساسي (تنقل، إضافة عناصر تجريبية، إلخ) دون أي طلبات شبكة خارجية.
لا تكتب أي شرح، فقط كائن JSON صالح.`;

aiGenerateBtn.addEventListener("click", async () => {
  const idea = ideaInput.value.trim();
  const key = aiKeyInput.value.trim();
  const model = aiModelInput.value.trim() || "claude-sonnet-4-5";

  if (!idea){ ideaInput.focus(); return; }
  if (!key){ aiKeyInput.focus(); return; }

  aiGenerateBtn.disabled = true;
  genBtn.disabled = true;
  genLog.innerHTML = "";
  setEditorLoading(true);
  setPreviewLoading(true);
  fileSearch.disabled = true;
  const logItem = (msg) => {
    const item = document.createElement("div");
    item.className = "gen-log-item";
    item.innerHTML = `<span class="mark">✓</span><span>${msg}</span>`;
    genLog.appendChild(item);
  };

  try{
    logItem("🧠 الاتصال بنموذج الذكاء الاصطناعي الحقيقي…");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: AI_SYSTEM_PROMPT,
        messages: [{ role: "user", content: idea }],
      }),
    });

    if (!res.ok){
      const err = await res.json().catch(() => ({}));
      throw new Error((err.error && err.error.message) || `فشل الطلب (${res.status})`);
    }

    const data = await res.json();
    const text = (data.content || []).map(b => b.text || "").join("");
    logItem("📦 تحليل الاستجابة وبناء الملفات…");
    const parsed = JSON.parse(extractJSON(text));

    const modules = detectModules(idea);
    const scaffold = buildProject(idea, modules);
    files = { ...scaffold, ...parsed };
    activeFile = "index.html";
    renderFileTabs();
    loadFileIntoEditor(activeFile);
    updatePreview();
    runDiagnostics();

    logItem("✅ تم التوليد فعليًا بواسطة الذكاء الاصطناعي الحقيقي.");
    showToast("تم التوليد بالذكاء الاصطناعي الحقيقي ✔", "success");
    exportBtn.disabled = false;
    githubBtn.disabled = false;
    editor.disabled = false;
  } catch (err){
    const item = document.createElement("div");
    item.className = "gen-log-item";
    item.innerHTML = `<span class="mark" style="color:#E0654F">✕</span><span>${err.message || "حدث خطأ غير متوقع."}</span>`;
    genLog.appendChild(item);
    showToast(err.message || "فشل التوليد بالذكاء الاصطناعي", "error");
  } finally {
    setEditorLoading(false);
    setPreviewLoading(false);
    fileSearch.disabled = Object.keys(files).length === 0;
    aiGenerateBtn.disabled = false;
    genBtn.disabled = false;
  }
});
