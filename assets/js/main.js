/* ==========================================================================
   TOBIAS — PORTFOLIO — main.js
   ========================================================================== */
(function(){
  "use strict";

  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE_POINTER = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  gsap.registerPlugin(ScrollTrigger);

  /* ------------------------------------------------------------------ */
  /* Lenis smooth scroll                                                 */
  /* ------------------------------------------------------------------ */
  var lenis = null;
  if(!REDUCE && window.Lenis){
    lenis = new Lenis({ duration: 1.1, smoothWheel: true, touchMultiplier: 1.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function(time){ lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ------------------------------------------------------------------ */
  /* Smooth anchor scrolling (nav / footer)                              */
  /* ------------------------------------------------------------------ */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var id = a.getAttribute('href');
      if(id.length < 2) return;
      var target = document.querySelector(id);
      if(!target) return;
      e.preventDefault();
      if(lenis){ lenis.scrollTo(target, { offset: -10 }); }
      else { target.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth' }); }
    });
  });

  /* ------------------------------------------------------------------ */
  /* Custom cursor — simple dot that follows the mouse, no hover states  */
  /* ------------------------------------------------------------------ */
  var cursor = document.getElementById('cursor');
  if(FINE_POINTER && cursor){
    var qx = gsap.quickTo(cursor, 'x', { duration:.35, ease:'power3' });
    var qy = gsap.quickTo(cursor, 'y', { duration:.35, ease:'power3' });
    window.addEventListener('mousemove', function(e){
      qx(e.clientX); qy(e.clientY);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Accordions — proyectos & flagships                                  */
  /* ------------------------------------------------------------------ */
  function wireAccordion(selector, groupSelector){
    document.querySelectorAll(selector).forEach(function(item){
      var row = item.querySelector('.project__row, .flagship__row');
      if(!row) return;
      row.setAttribute('aria-expanded','false');
      row.addEventListener('click', function(){
        var isOpen = item.classList.contains('is-open');
        document.querySelectorAll(groupSelector + ' .is-open').forEach(function(el){
          if(el !== item){
            el.classList.remove('is-open');
            var r = el.querySelector('.project__row, .flagship__row');
            if(r) r.setAttribute('aria-expanded','false');
          }
        });
        item.classList.toggle('is-open', !isOpen);
        row.setAttribute('aria-expanded', String(!isOpen));
        setTimeout(function(){ ScrollTrigger.refresh(); }, 700);
      });
    });
  }
  wireAccordion('#projectList .project', '#projectList');
  wireAccordion('#flagshipList .flagship', '#flagshipList');

  /* ------------------------------------------------------------------ */
  /* Selected clients — authoritative list from the PDF                  */
  /* Used both by the "Marcas que confiaron en mi mirada" marquee and    */
  /* by the Selected Clients editorial list in Sobre mí.                 */
  /* ------------------------------------------------------------------ */
  var CLIENTS = [
    'RAMA NEGRA','BERRY GOOD VIBES','VICENTICA','LA VOLPINA','CERCANO OESTE','PEAK BURGERS',
    'LA BARRACA MALL','GRUPO CIOFFI','MERCADO MORENO','FLORES EN FUEGO','CASA OLIVA','MANIJITA',
    'JEBBS','PAUZEN','DUX FUEGOS','ALCAZAR DE LA CRUZ','GARRA BURGERS','PINA GLUTEN FREE'
  ];

  var track = document.getElementById('marqueeTrack');
  if(track){
    var groupHTML = CLIENTS.map(function(c){ return '<b>' + c + '</b><em>&mdash;</em>'; }).join('');
    track.innerHTML = '<span>' + groupHTML + '</span><span>' + groupHTML + '</span>';
  }

  var clientsList = document.getElementById('clientsList');
  if(clientsList){
    var perCol = 6;
    var colsHTML = '';
    for(var c = 0; c < CLIENTS.length; c += perCol){
      var colClients = CLIENTS.slice(c, c + perCol);
      colsHTML += colClients.map(function(name){ return '<a href="#" data-reveal>' + name + '</a>'; }).join('');
    }
    clientsList.innerHTML = colsHTML;
  }

  /* ------------------------------------------------------------------ */
  /* Lightbox                                                             */
  /* ------------------------------------------------------------------ */
  var lightbox = document.getElementById('lightbox');
  var lightboxStage = document.getElementById('lightboxStage');
  var lightboxClose = document.getElementById('lightboxClose');
  var lightboxPrev = document.getElementById('lightboxPrev');
  var lightboxNext = document.getElementById('lightboxNext');
  var currentSet = [];
  var currentIdx = 0;

  function renderLightbox(){
    var el = currentSet[currentIdx];
    lightboxStage.innerHTML = '';
    if(!el) return;
    var img = document.createElement('img');
    img.src = el.getAttribute('src');
    img.alt = el.getAttribute('alt') || '';
    lightboxStage.appendChild(img);
    var showNav = currentSet.length > 1;
    lightboxPrev.style.display = showNav ? 'flex' : 'none';
    lightboxNext.style.display = showNav ? 'flex' : 'none';
  }
  function openLightbox(set, idx){
    currentSet = set; currentIdx = idx;
    renderLightbox();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden','false');
  }
  function closeLightbox(){
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden','true');
  }
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function(e){ if(e.target === lightbox) closeLightbox(); });
  lightboxPrev.addEventListener('click', function(){ currentIdx = (currentIdx - 1 + currentSet.length) % currentSet.length; renderLightbox(); });
  lightboxNext.addEventListener('click', function(){ currentIdx = (currentIdx + 1) % currentSet.length; renderLightbox(); });
  window.addEventListener('keydown', function(e){
    if(!lightbox.classList.contains('is-open')) return;
    if(e.key === 'Escape') closeLightbox();
    if(e.key === 'ArrowLeft') lightboxPrev.click();
    if(e.key === 'ArrowRight') lightboxNext.click();
  });

  // any image marked data-lightbox opens the lightbox, grouped by its value
  document.querySelectorAll('[data-lightbox]').forEach(function(img){
    img.addEventListener('click', function(){
      var group = img.getAttribute('data-lightbox');
      var set = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox="' + group + '"]'));
      openLightbox(set, set.indexOf(img));
    });
  });

  /* ------------------------------------------------------------------ */
  /* Nav — scrolled state (meta-bar fade) + active link tracking         */
  /* ------------------------------------------------------------------ */
  var header = document.getElementById('siteHeader');

  window.addEventListener('scroll', function(){
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  }, { passive:true });

  var navLinks = document.querySelectorAll('[data-nav]');
  var navSections = ['inicio','trabajos','fotografia','sobre-mi','contacto'].map(function(id){ return document.getElementById(id); });
  navSections.forEach(function(sec, i){
    if(!sec) return;
    ScrollTrigger.create({
      trigger: sec, start:'top 50%', end:'bottom 50%',
      onToggle: function(self){
        if(self.isActive){
          navLinks.forEach(function(l){ l.classList.remove('is-active'); });
          navLinks[i].classList.add('is-active');
        }
      }
    });
  });

  /* ------------------------------------------------------------------ */
  /* Reveal-on-scroll — IntersectionObserver (robust to layout shift,    */
  /* unlike a one-shot pixel-position scroll trigger that can miss a     */
  /* section if the page height changes after fonts/images load).       */
  /* ------------------------------------------------------------------ */
  if(REDUCE || !('IntersectionObserver' in window)){
    document.querySelectorAll('[data-reveal]').forEach(function(el){ el.classList.add('is-in'); });
    document.querySelectorAll('.reveal-mask').forEach(function(el){ el.classList.add('is-in'); });
  } else {
    var revealObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold:0.12, rootMargin:'0px 0px -8% 0px' });

    function observeReveals(root){
      root.querySelectorAll('[data-reveal]:not(.is-in)').forEach(function(el){ revealObserver.observe(el); });
      root.querySelectorAll('.reveal-mask:not(.is-in)').forEach(function(el){ revealObserver.observe(el); });
    }
    observeReveals(document);
  }

  /* ------------------------------------------------------------------ */
  /* Hero intro timeline                                                  */
  /* ------------------------------------------------------------------ */
  var heroTl = gsap.timeline({ delay:.15 });
  if(REDUCE){
    gsap.set(['.hero__title .mask__in','.hero__sub .mask__in'], { y:0 });
    gsap.set(['.hero__roles','.hero__scroll'], { opacity:1, y:0 });
  } else {
    heroTl
      .to('.hero__title .mask__in', { y:0, duration:1.1, ease:'power4.out' })
      .to('.hero__sub .mask__in', { y:0, duration:.9, ease:'power4.out' }, '-=0.7')
      .to('.hero__roles', { opacity:1, y:0, duration:.8, ease:'power3.out' }, '-=0.4')
      .to('.hero__scroll', { opacity:1, y:0, duration:.8, ease:'power3.out' }, '-=0.5');
  }

  /* refresh ScrollTrigger positions once fonts/images settle, so the    */
  /* active-link tracking stays accurate after any layout shift          */
  window.addEventListener('load', function(){ ScrollTrigger.refresh(); });
  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(function(){ ScrollTrigger.refresh(); });
  }

})();
