/**
 * Mahani Builder AI — دالة سحابية آمنة
 * تستقبل وصف الفكرة من المتصفح، تتحقق من هوية المستخدم عبر Firebase Auth،
 * ثم تستدعي Anthropic API من الخادم (وليس من المتصفح) — بذلك يبقى مفتاح
 * API سريًا تمامًا ولا يظهر أبدًا في كود العميل أو أدوات المطور بالمتصفح.
 *
 * الإعداد المطلوب قبل النشر:
 *   firebase functions:secrets:set ANTHROPIC_API_KEY
 * (سيطلب منك لصق المفتاح، ويُخزَّن مشفّرًا في Google Secret Manager)
 */

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();

const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");

const AI_SYSTEM_PROMPT = `أنت مولّد مشاريع ويب. يصف المستخدم فكرة تطبيق بالعربية.
أعد رد JSON صِرف فقط (بدون أي نص خارج JSON، بدون Markdown fences) بهذا الشكل بالضبط:
{"index.html": "...", "style.css": "...", "app.js": "..."}
- index.html صفحة كاملة تتضمن شاشة تسجيل دخول بسيطة ثم واجهة رئيسية تعكس الفكرة، بالعربية RTL، تربط style.css عبر <link> وapp.js عبر <script src>.
- style.css تصميم عصري ومتجاوب.
- app.js يفعّل التفاعل الأساسي دون أي طلبات شبكة خارجية.
لا تكتب أي شرح، فقط كائن JSON صالح.`;

function setCors(res){
  // بدّل "*" بنطاق موقعك الفعلي بعد النشر لتقييد الوصول (مثال: https://your-domain.web.app)
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

exports.generateProject = onRequest(
  { secrets: [ANTHROPIC_API_KEY], cors: true, region: "us-central1" },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS"){ res.status(204).send(""); return; }
    if (req.method !== "POST"){ res.status(405).json({ error: "Method not allowed" }); return; }

    // التحقق من هوية المستخدم — يمنع أي شخص غير مسجّل دخول من استهلاك رصيد الـ API الخاص بك
    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken){
      res.status(401).json({ error: "يجب تسجيل الدخول أولًا" });
      return;
    }
    try{
      await admin.auth().verifyIdToken(idToken);
    } catch (e){
      res.status(401).json({ error: "جلسة الدخول غير صالحة" });
      return;
    }

    const idea = (req.body && req.body.idea || "").trim();
    if (!idea){
      res.status(400).json({ error: "الفكرة فارغة" });
      return;
    }

    try{
      const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY.value(),
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 4096,
          system: AI_SYSTEM_PROMPT,
          messages: [{ role: "user", content: idea }],
        }),
      });

      if (!aiRes.ok){
        const errBody = await aiRes.json().catch(() => ({}));
        res.status(502).json({ error: (errBody.error && errBody.error.message) || "فشل الاتصال بنموذج الذكاء الاصطناعي" });
        return;
      }

      const data = await aiRes.json();
      const text = (data.content || []).map((b) => b.text || "").join("");
      res.status(200).json({ raw: text });
    } catch (err){
      res.status(500).json({ error: err.message || "خطأ داخلي" });
    }
  }
);
