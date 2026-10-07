document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];

  // Primary navigation safety: in-page links scroll to their real target.
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener("click", e => {
      const target = $(link.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // Mobile navigation
  const hamburger = $(".hamb");
  const nav = $(".header nav");
  if (hamburger && nav) {
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      hamburger.setAttribute("aria-expanded", String(open));
      hamburger.textContent = open ? "×" : "☰";
    });
    $$(".header nav a").forEach(link => link.addEventListener("click", () => {
      nav.classList.remove("open");
      hamburger.setAttribute("aria-expanded", "false");
      hamburger.textContent = "☰";
    }));
  }

  // Toast feedback
  function toast(message) {
    let el = $(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  // Product filtering
  $$(".filters button").forEach(btn => {
    btn.addEventListener("click", () => {
      $$(".filters button").forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");

      const value = btn.textContent.trim();
      $$(".product").forEach(product => {
        const visible = value === "New In" || product.dataset.cat === value;
        product.classList.toggle("hiddenProduct", !visible);
      });
    });
    btn.setAttribute("aria-pressed", btn.classList.contains("active") ? "true" : "false");
  });

  // Wishlist
  $$(".heart").forEach(button => {
    button.setAttribute("aria-label", "Add to wishlist");
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", e => {
      e.stopPropagation();
      const liked = button.classList.toggle("liked");
      button.textContent = liked ? "♥" : "♡";
      button.setAttribute("aria-pressed", String(liked));
      button.setAttribute("aria-label", liked ? "Remove from wishlist" : "Add to wishlist");
      toast(liked ? "Added to your wishlist" : "Removed from your wishlist");
    });
  });

  // Cart drawer
  const cartDrawer = $("#cartDrawer");
  const cartBody = $("#cartBody");
  const cartCount = $("#cartCount");
  const cartTotal = $("#cartTotal");
  const cartItems = [];
  let count = Number(cartCount?.textContent || 0);

  function updateCart() {
    if (cartCount) cartCount.textContent = count;
    if (!cartBody || !cartTotal) return;
    if (!cartItems.length) {
      cartBody.innerHTML = '<p class="cartEmpty">Your bag is ready for its next run.</p>';
      cartTotal.textContent = "£0";
      return;
    }
    cartBody.innerHTML = cartItems.map((item, i) => `
      <div class="cartItem">
        <div><strong>${item.name}</strong><small>${item.brand} · ${item.price}</small></div>
        <button class="removeItem" data-index="${i}" aria-label="Remove ${item.name}">×</button>
      </div>
    `).join("");
    const total = cartItems.reduce((sum, item) => sum + item.value, 0);
    cartTotal.textContent = "£" + total;
    $$(".removeItem", cartBody).forEach(btn => btn.addEventListener("click", () => {
      cartItems.splice(Number(btn.dataset.index), 1);
      count = Math.max(0, count - 1);
      updateCart();
    }));
  }

  function openCart() {
    if (!cartDrawer) return;
    cartDrawer.classList.add("open");
    cartDrawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("noScroll");
  }
  function closeCart() {
    if (!cartDrawer) return;
    cartDrawer.classList.remove("open");
    cartDrawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("noScroll");
  }

  $("#cartBtn")?.addEventListener("click", openCart);
  $$("[data-close-cart]").forEach(el => el.addEventListener("click", closeCart));
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeCart(); });

  $$(".addBtn").forEach(button => {
    button.addEventListener("click", e => {
      e.stopPropagation();
      const card = button.closest(".product");
      const name = $("h3", card)?.textContent || "Running gear";
      const brand = $("small", card)?.textContent || "Paceline";
      const priceText = $("b", card)?.textContent || "£0";
      const value = Number(priceText.replace(/[^\d]/g, "")) || 0;
      cartItems.push({name, brand, price: priceText, value});
      count++;
      updateCart();
      toast("Added to your bag");
    });
  });

  $("#checkoutBtn")?.addEventListener("click", () => toast("Demo checkout — your bag is ready!"));
  $("#searchBtn")?.addEventListener("click", () => toast("Search is coming soon — browse New Arrivals for now."));
  $("#accountBtn")?.addEventListener("click", () => toast("Account sign-in is coming soon."));
  $("#gaitBtn")?.addEventListener("click", e => { e.preventDefault(); toast("Gait analysis booking opens soon."); });

  // Newsletter
  $$("#newsletter").forEach(form => form.addEventListener("submit", e => {
    e.preventDefault();
    const input = $("input[type=email]", form);
    if (!input?.value) return;
    form.innerHTML = '<strong class="successMessage">✓ You’re on the list. Welcome to Paceline.</strong>';
  }));

  // Reveal sections as they enter the viewport
  const revealTargets = $$(".section, .story, .explore, .visit, .founders, .cta");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    revealTargets.forEach(el => {
      el.classList.add("reveal");
      observer.observe(el);
    });
  }

  updateCart();
});


  // Paceline Run Finder
  const finder = document.querySelector("#runFinder");
  if (finder) {
    const start = document.querySelector("#startFinder");
    const card = document.querySelector("#finderCard");
    const questions = [...document.querySelectorAll(".finderQuestion")];
    const result = document.querySelector(".finderResult");
    const stepLabel = document.querySelector("#finderStep");
    const progress = document.querySelector("#finderProgress");
    const answers = [];
    let currentStep = 0;

    const recommendations = [
      { name:"Cloudmonster 3 — Hyper Lily", text:"A cushioned road-day choice built for comfortable miles and longer efforts.", tags:["road","distance","comfort","cushioned"] },
      { name:"VaporFly 4 — Volt Ice", text:"A lightweight, race-ready pick for runners chasing speed and a quick turnover.", tags:["road","track","speed","race","light"] },
      { name:"Tecton X 4 — Frost / Tangerine", text:"A trail-focused option for confident miles across rough and mixed terrain.", tags:["trail","distance","stable","cushioned"] },
      { name:"Megablast — White / Orange Glow", text:"A lively everyday option for easy miles, comfort and daily training.", tags:["everyday","comfort","cushioned","stable"] }
    ];

    function showStep(n) {
      questions.forEach((q,i)=>q.hidden=i!==n);
      result.hidden=true;
      stepLabel.textContent=`0${n+1} / 03`;
      progress.style.width=((n+1)/3*100)+"%";
      card.classList.remove("finderPulse");
      void card.offsetWidth;
      card.classList.add("finderPulse");
    }

    function pick(key) {
      answers[currentStep]=key;
      if(currentStep<2) {
        currentStep++;
        showStep(currentStep);
      } else {
        const scores=recommendations.map((item,i)=>({
          item,
          score:item.tags.reduce((s,t)=>s+(answers.includes(t)?2:0),0)+((i+answers.length)%3===0?1:0)
        })).sort((a,b)=>b.score-a.score);
        const match=scores[0].item;
        document.querySelector("#resultName").textContent=match.name;
        document.querySelector("#resultText").textContent=match.text;
        questions.forEach(q=>q.hidden=true);
        result.hidden=false;
        stepLabel.textContent="03 / 03";
        progress.style.width="100%";
        card.classList.add("finderPulse");
      }
    }

    start?.addEventListener("click",()=>{
      currentStep=0; answers.length=0; showStep(0);
      finder.scrollIntoView({behavior:"smooth",block:"center"});
    });
    document.querySelectorAll(".finderOptions button").forEach(btn=>{
      btn.addEventListener("click",()=>pick(btn.dataset.key));
    });
    document.querySelector("#finderReset")?.addEventListener("click",()=>{
      currentStep=0; answers.length=0; showStep(0);
    });
  }
