// ---- Typewriter: rotates through example Arabic app prompts ----
const prompts = [
  "أريد تطبيق إدارة محل لبيع مواد البناء مع العملاء والمخزون والفواتير",
  "أنشئ تطبيق متابعة ديون العملاء للمحلات",
  "أريد موقع لعرض منتجاتي مع صفحة طلب مباشر عبر واتساب",
  "أضف صفحة تقارير شهرية للمبيعات"
];

const typedEl = document.getElementById("typed-text");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let promptIndex = 0;

function typeLoop(){
  if (reduceMotion){
    typedEl.textContent = prompts[0];
    revealBlueprint();
    return;
  }

  const text = prompts[promptIndex];
  let charIndex = 0;
  typedEl.textContent = "";
  resetBlueprint();

  const typeInterval = setInterval(() => {
    typedEl.textContent = text.slice(0, charIndex + 1);
    charIndex++;
    if (charIndex === text.length){
      clearInterval(typeInterval);
      revealBlueprint();
      setTimeout(() => {
        eraseText(text, () => {
          promptIndex = (promptIndex + 1) % prompts.length;
          setTimeout(typeLoop, 400);
        });
      }, 2600);
    }
  }, 42);
}

function eraseText(text, done){
  let charIndex = text.length;
  const eraseInterval = setInterval(() => {
    typedEl.textContent = text.slice(0, charIndex - 1);
    charIndex--;
    if (charIndex <= 0){
      clearInterval(eraseInterval);
      done();
    }
  }, 20);
}

// ---- Blueprint reveal: staggers "on" class by data-order ----
function resetBlueprint(){
  document.querySelectorAll("#bp-svg [data-order]").forEach(el => {
    el.classList.remove("on");
  });
  document.querySelectorAll(".bp-scale").forEach(el => el.classList.remove("on"));
}

function revealBlueprint(){
  const groups = { 1: [], 2: [], 3: [] };
  document.querySelectorAll("#bp-svg [data-order]").forEach(el => {
    const order = el.dataset.order;
    if (groups[order]) groups[order].push(el);
  });

  Object.keys(groups).forEach((key, i) => {
    setTimeout(() => {
      groups[key].forEach(el => el.classList.add("on"));
    }, i * 260);
  });

  setTimeout(() => {
    document.querySelectorAll(".bp-scale").forEach(el => el.classList.add("on"));
  }, 900);
}

typeLoop();

// ---- Mobile menu toggle ----
const menuToggle = document.getElementById("menu-toggle");
const mobileNav = document.getElementById("mobile-nav");

if (menuToggle && mobileNav){
  menuToggle.addEventListener("click", () => {
    const isOpen = mobileNav.classList.toggle("open");
    mobileNav.hidden = !isOpen;
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mobileNav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      mobileNav.classList.remove("open");
      mobileNav.hidden = true;
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}
