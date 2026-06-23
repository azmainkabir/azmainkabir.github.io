(function() {
  "use strict";

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim()
    if (all) {
      return [...document.querySelectorAll(el)]
    } else {
      return document.querySelector(el)
    }
  }

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    let selectEl = select(el, all)
    if (selectEl) {
      if (all) {
        selectEl.forEach(e => e.addEventListener(type, listener))
      } else {
        selectEl.addEventListener(type, listener)
      }
    }
  }

  /**
   * Easy on scroll event listener 
   */
  const onscroll = (el, listener) => {
    el.addEventListener('scroll', listener)
  }

  /**
   * Navbar links active state on scroll
   */
  let navbarlinks = select('#navbar .scrollto', true)
  const navbarlinksActive = () => {
    let position = window.scrollY + 200
    navbarlinks.forEach(navbarlink => {
      if (!navbarlink.hash) return
      let section = select(navbarlink.hash)
      if (!section) return
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        navbarlink.classList.add('active')
      } else {
        navbarlink.classList.remove('active')
      }
    })
  }
  window.addEventListener('load', navbarlinksActive)
  onscroll(document, navbarlinksActive)

  /**
   * Scrolls to an element with header offset
   */
  const scrollto = (el) => {
    let elementPos = select(el).offsetTop
    window.scrollTo({
      top: elementPos,
      behavior: 'smooth'
    })
  }

  /**
   * Back to top button
   */
  let backtotop = select('.back-to-top')
  if (backtotop) {
    const toggleBacktotop = () => {
      if (window.scrollY > 100) {
        backtotop.classList.add('active')
      } else {
        backtotop.classList.remove('active')
      }
    }
    window.addEventListener('load', toggleBacktotop)
    onscroll(document, toggleBacktotop)
  }

  /**
   * Mobile nav toggle
   */
  on('click', '.mobile-nav-toggle', function(e) {
    select('body').classList.toggle('mobile-nav-active')
    this.classList.toggle('bi-list')
    this.classList.toggle('bi-x')
  })

  /**
   * Scrool with ofset on links with a class name .scrollto
   */
  on('click', '.scrollto', function(e) {
    if (select(this.hash)) {
      e.preventDefault()

      let body = select('body')
      if (body.classList.contains('mobile-nav-active')) {
        body.classList.remove('mobile-nav-active')
        let navbarToggle = select('.mobile-nav-toggle')
        navbarToggle.classList.toggle('bi-list')
        navbarToggle.classList.toggle('bi-x')
      }
      scrollto(this.hash)
    }
  }, true)

  /**
   * Scroll with ofset on page load with hash links in the url
   */
  window.addEventListener('load', () => {
    if (window.location.hash) {
      if (select(window.location.hash)) {
        scrollto(window.location.hash)
      }
    }
  });

  /**
   * Preloader
   */
  let preloader = select('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove()
    });
  }

  /**
   * Resume zipper reveal
   */
  const resumeContent = select('#resume-content');
  const resumeToggle = select('#resume-toggle');
  if (resumeContent && resumeToggle) {
    const resumeToggleText = resumeToggle.querySelector('.resume-toggle-text');
    const zipperTrack = resumeToggle.querySelector('.zipper-track');
    const resumeZipperWrap = select('.resume-zipper-wrap');
    const resumeAction = select('#resume-action');
    const resumeActionText = resumeAction ? resumeAction.querySelector('.resume-action-text') : null;
    const resumeSection = select('#resume');
    let resumeProgress = 0;
    let isDraggingResume = false;
    let didDragResume = false;
    let resumeStartY = 0;

    const clampResumeProgress = (value) => Math.min(Math.max(value, 0), 1);

    const resumeCollapsedHeight = () => {
      const collapsedHeight = getComputedStyle(resumeContent).getPropertyValue('--resume-collapsed-height');
      return parseFloat(collapsedHeight) || 780;
    }

    const resumeExpandedHeight = () => resumeContent.scrollHeight;

    const refreshResumeAos = () => {
      if (typeof AOS !== 'undefined') {
        requestAnimationFrame(() => AOS.refresh());
      }
    }

    const canShowSideZipper = () => true;

    const scrollResumeWithProgress = (expandedHeight) => {
      if (!resumeSection || !isDraggingResume || !didDragResume) return;

      const resumeTop = resumeSection.offsetTop;
      const maxResumeScroll = Math.max(expandedHeight - (window.innerHeight * 0.72), 0);
      const maxPageScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
      const targetScroll = Math.min(resumeTop + (maxResumeScroll * resumeProgress), maxPageScroll);

      window.scrollTo({
        top: Math.max(resumeTop, targetScroll),
        behavior: 'auto'
      });
    }

    const applyResumeProgress = (progress, shouldRefresh = false, shouldScrollWithDrag = false) => {
      resumeProgress = clampResumeProgress(progress);

      const collapsedHeight = resumeCollapsedHeight();
      const expandedHeight = resumeExpandedHeight();
      const currentHeight = collapsedHeight + ((expandedHeight - collapsedHeight) * resumeProgress);
      const trackTravel = zipperTrack ? Math.max(zipperTrack.clientHeight - 33, 0) : 0;
      const trackFill = zipperTrack ? Math.max(zipperTrack.clientHeight - 16, 0) : 0;

      resumeContent.style.setProperty('--resume-expanded-height', `${expandedHeight}px`);
      resumeContent.style.setProperty('--resume-current-height', `${currentHeight}px`);
      resumeContent.style.setProperty('--resume-fade-opacity', resumeProgress >= 0.999 ? '0' : '1');
      resumeToggle.style.setProperty('--zipper-progress', resumeProgress);
      resumeToggle.style.setProperty('--zipper-progress-fill', `${trackFill * resumeProgress}px`);
      resumeToggle.style.setProperty('--zipper-pull-offset', `${trackTravel * resumeProgress}px`);
      resumeToggle.style.setProperty('--zipper-pull-rotation', `${resumeProgress * 180}deg`);

      resumeContent.classList.toggle('resume-collapsed', resumeProgress <= 0.001);
      resumeContent.classList.toggle('resume-expanded', resumeProgress >= 0.999);
      resumeToggle.setAttribute('aria-expanded', resumeProgress > 0.001 ? 'true' : 'false');
      resumeToggle.setAttribute('aria-valuenow', Math.round(resumeProgress * 100));
      resumeToggle.setAttribute('aria-valuetext', resumeProgress >= 0.999 ? 'Full resume visible' : `${Math.round(resumeProgress * 100)} percent of resume visible`);

      if (resumeAction) {
        resumeAction.setAttribute('aria-expanded', resumeProgress >= 0.999 ? 'true' : 'false');
      }

      if (resumeToggleText) {
        resumeToggleText.textContent = isDraggingResume ? `${Math.round(resumeProgress * 100)}%` : 'Reveal';
      }

      if (resumeActionText) {
        resumeActionText.textContent = resumeProgress >= 0.999 ? 'Show resume preview' : 'See full resume';
      }

      if (shouldRefresh) {
        refreshResumeAos();
      }

      if (shouldScrollWithDrag) {
        scrollResumeWithProgress(expandedHeight);
      }
    }

    const progressFromPointer = (event) => {
      if (!zipperTrack) return resumeProgress;

      const trackRect = zipperTrack.getBoundingClientRect();
      return clampResumeProgress((event.clientY - trackRect.top) / trackRect.height);
    }

    const collapseResumeWithScroll = () => {
      applyResumeProgress(0, true);

      if (resumeSection && window.scrollY > resumeSection.offsetTop) {
        scrollto('#resume');
      }
    }

    const setResumeZipperVisibility = (isVisible) => {
      if (!resumeZipperWrap) return;
      const shouldShow = isVisible && canShowSideZipper();
      resumeZipperWrap.classList.toggle('is-visible', shouldShow);
      resumeToggle.tabIndex = shouldShow ? 0 : -1;
      resumeToggle.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
    }

    const updateResumeZipperVisibility = () => {
      if (!resumeSection) return;

      if (isDraggingResume) {
        setResumeZipperVisibility(true);
        return;
      }

      const sectionRect = resumeSection.getBoundingClientRect();
      setResumeZipperVisibility(sectionRect.bottom > window.innerHeight * 0.16 && sectionRect.top < window.innerHeight * 0.84);
    }

    resumeToggle.addEventListener('pointerdown', (event) => {
      if (!zipperTrack) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      isDraggingResume = true;
      didDragResume = false;
      resumeStartY = event.clientY;
      resumeToggle.setPointerCapture(event.pointerId);
      resumeToggle.classList.add('is-dragging');
      resumeContent.classList.add('resume-dragging');
      setResumeZipperVisibility(true);
    });

    resumeToggle.addEventListener('pointermove', (event) => {
      if (!isDraggingResume) return;

      if (Math.abs(event.clientY - resumeStartY) > 4) {
        didDragResume = true;
      }

      if (didDragResume) {
        applyResumeProgress(progressFromPointer(event), false, true);
      }
    });

    const finishResumeDrag = (event) => {
      if (!isDraggingResume) return;

      isDraggingResume = false;
      resumeToggle.classList.remove('is-dragging');
      resumeContent.classList.remove('resume-dragging');
      if (resumeToggleText) {
        resumeToggleText.textContent = 'Reveal';
      }
      updateResumeZipperVisibility();
      refreshResumeAos();

      if (resumeToggle.hasPointerCapture(event.pointerId)) {
        resumeToggle.releasePointerCapture(event.pointerId);
      }

    }

    resumeToggle.addEventListener('pointerup', finishResumeDrag);
    resumeToggle.addEventListener('pointercancel', finishResumeDrag);

    if (resumeAction) {
      resumeAction.addEventListener('click', () => {
        if (resumeProgress >= 0.999) {
          collapseResumeWithScroll();
        } else {
          applyResumeProgress(1, true);
        }
      });
    }

    resumeToggle.addEventListener('keydown', (event) => {
      const step = 0.1;

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        applyResumeProgress(resumeProgress + step, true);
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        applyResumeProgress(resumeProgress - step, true);
      }

      if (event.key === 'Home') {
        event.preventDefault();
        collapseResumeWithScroll();
      }

      if (event.key === 'End') {
        event.preventDefault();
        applyResumeProgress(1, true);
      }
    });

    window.addEventListener('resize', () => {
      applyResumeProgress(resumeProgress);
      updateResumeZipperVisibility();
    });

    if (resumeSection) {
      window.addEventListener('load', updateResumeZipperVisibility);
      window.addEventListener('scroll', updateResumeZipperVisibility);
      updateResumeZipperVisibility();
    }

    applyResumeProgress(0);
  }

  /**
   * Hero type effect
   */
  const typed = select('.typed')
  if (typed) {
    let typed_strings = typed.getAttribute('data-typed-items')
    typed_strings = typed_strings.split(',')
    new Typed('.typed', {
      strings: typed_strings,
      loop: true,
      typeSpeed: 100,
      backSpeed: 50,
      backDelay: 2000
    });
  }

  /**
   * Skills animation
   */
  let skilsContent = select('.skills-content');
  if (skilsContent) {
    new Waypoint({
      element: skilsContent,
      offset: '80%',
      handler: function(direction) {
        let progress = select('.progress .progress-bar', true);
        progress.forEach((el) => {
          el.style.width = el.getAttribute('aria-valuenow') + '%'
        });
      }
    })
  }

  /**
   * Porfolio isotope and filter
   */
  window.addEventListener('load', () => {
    let portfolioContainer = select('.portfolio-container');
    if (portfolioContainer) {
      let portfolioIsotope = new Isotope(portfolioContainer, {
        itemSelector: '.portfolio-item'
      });

      let portfolioFilters = select('#portfolio-flters li', true);
      let portfolioItems = select('.portfolio-item', true);
      let portfolioMoreButton = select('#portfolio-more');
      let portfolioMoreText = select('.portfolio-more-text');
      const portfolioPreviewLimit = 3;
      let portfolioExpanded = false;
      let activePortfolioFilter = '*';

      const matchesPortfolioFilter = (item, filter) => {
        return filter === '*' || item.matches(filter);
      }

      const matchingPortfolioItems = () => {
        return portfolioItems.filter((item) => matchesPortfolioFilter(item, activePortfolioFilter));
      }

      const updatePortfolioMoreButton = () => {
        if (!portfolioMoreButton || !portfolioMoreText) return;

        const hiddenCount = Math.max(matchingPortfolioItems().length - portfolioPreviewLimit, 0);
        const hasMoreItems = hiddenCount > 0;

        portfolioMoreButton.classList.toggle('d-none', !hasMoreItems);
        portfolioMoreButton.setAttribute('aria-expanded', portfolioExpanded ? 'true' : 'false');
        portfolioMoreText.textContent = portfolioExpanded ? 'Show fewer projects' : `See ${hiddenCount} more project${hiddenCount === 1 ? '' : 's'}`;

        let icon = portfolioMoreButton.querySelector('i');
        if (icon) {
          icon.classList.toggle('bi-chevron-down', !portfolioExpanded);
          icon.classList.toggle('bi-chevron-up', portfolioExpanded);
        }
      }

      const arrangePortfolio = () => {
        let visibleCount = 0;
        portfolioIsotope.arrange({
          filter: function(itemElem) {
            const item = itemElem || this;
            if (!matchesPortfolioFilter(item, activePortfolioFilter)) return false;

            visibleCount += 1;
            return portfolioExpanded || visibleCount <= portfolioPreviewLimit;
          }
        });

        updatePortfolioMoreButton();
      }

      portfolioIsotope.on('arrangeComplete', function() {
        AOS.refresh()
      });

      on('click', '#portfolio-flters li', function(e) {
        e.preventDefault();
        portfolioFilters.forEach(function(el) {
          el.classList.remove('filter-active');
        });
        this.classList.add('filter-active');

        activePortfolioFilter = this.getAttribute('data-filter');
        portfolioExpanded = false;
        arrangePortfolio();
      }, true);

      if (portfolioMoreButton) {
        portfolioMoreButton.addEventListener('click', function() {
          portfolioExpanded = !portfolioExpanded;
          arrangePortfolio();
        });
      }

      arrangePortfolio();
    }

  });

  /**
   * Initiate portfolio lightbox 
   */
  const portfolioLightbox = GLightbox({
    selector: '.portfolio-lightbox'
  });

  /**
   * Initiate portfolio details lightbox 
   */
  const portfolioDetailsLightbox = GLightbox({
    selector: '.portfolio-details-lightbox',
    width: '90%',
    height: '90vh'
  });

  /**
   * Portfolio details slider
   */
  new Swiper('.portfolio-details-slider', {
    speed: 400,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
      clickable: true
    }
  });

  /**
   * Testimonials slider
   */
  new Swiper('.testimonials-slider', {
    speed: 600,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    slidesPerView: 'auto',
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
      clickable: true
    }
  });

  /**
   * Animation on scroll
   */
  window.addEventListener('load', () => {
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    })
  });

})()
