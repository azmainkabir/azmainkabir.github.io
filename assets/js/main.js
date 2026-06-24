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
  const mobileNavToggle = select('.mobile-nav-toggle');
  const header = select('#header');
  const closeMobileNav = () => {
    let body = select('body');
    if (!body || !body.classList.contains('mobile-nav-active')) return;

    body.classList.remove('mobile-nav-active');

    if (mobileNavToggle) {
      mobileNavToggle.setAttribute('aria-expanded', 'false');
      mobileNavToggle.setAttribute('aria-label', 'Open navigation');
    }
  }

  on('click', '.mobile-nav-toggle', function(e) {
    e.stopPropagation();
    const body = select('body');
    const isOpen = body.classList.toggle('mobile-nav-active');

    this.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    this.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  })

  document.addEventListener('click', (event) => {
    const body = select('body');
    if (!body || !body.classList.contains('mobile-nav-active')) return;
    if (header && header.contains(event.target)) return;
    if (mobileNavToggle && mobileNavToggle.contains(event.target)) return;

    closeMobileNav();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMobileNav();
    }
  });

  /**
   * Scrool with ofset on links with a class name .scrollto
   */
  on('click', '.scrollto', function(e) {
    if (select(this.hash)) {
      e.preventDefault()

      let body = select('body')
      if (body.classList.contains('mobile-nav-active')) {
        closeMobileNav()
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
   * Hero interactive console
   */
  const heroTerminal = select('#hero-terminal');
  if (heroTerminal) {
    const heroTerminalInput = select('#hero-terminal-input');
    const heroTerminalOutput = select('#hero-terminal-output');
    const heroTerminalPrompt = select('.hero-console-prompt');
    const terminalCommands = ['cat', 'cd', 'clear', 'date', 'echo', 'find', 'grep', 'help', 'history', 'ls', 'man', 'open', 'pwd', 'sudo', 'tree', 'uname', 'whoami'];
    const terminalHistory = [];
    let terminalHistoryIndex = 0;
    let currentTerminalPath = '~';

    const tokenizeTerminalCommand = (value) => value.match(/"[^"]*"|'[^']*'|\S+/g)?.map((part) => part.replace(/^["']|["']$/g, '')) || [];

    const cleanTerminalText = (value) => value.replace(/\s+/g, ' ').trim();

    const slugTerminalName = (value) => cleanTerminalText(value)
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const getTerminalText = (selector, fallback = '', root = document) => {
      const element = root.querySelector(selector);
      return element ? cleanTerminalText(element.textContent) : fallback;
    }

    const getTerminalTexts = (selector, root = document) => [...root.querySelectorAll(selector)]
      .map((element) => cleanTerminalText(element.textContent))
      .filter(Boolean);

    const getSkillLabel = (skillElement) => {
      const valueElement = skillElement.querySelector('.val');
      const value = valueElement ? cleanTerminalText(valueElement.textContent) : '';
      const name = cleanTerminalText(skillElement.textContent.replace(value, ''));
      return value ? `${name}: ${value}` : name;
    }

    const getResumeGroups = () => {
      const groups = {};

      const addResumeItem = (groupName, element) => {
        const name = getTerminalText('.name', '', element) || getTerminalText('.name-place', '', element);
        const place = getTerminalText('.place', '', element);
        const dates = getTerminalTexts('.date', element);
        const titles = getTerminalTexts('.title', element);
        const bullets = getTerminalTexts('li', element).slice(0, 2);
        const heading = [
          name,
          place ? `(${place})` : '',
          titles.length ? `- ${titles.join(' / ')}` : '',
          dates.length ? `[${dates.join(' / ')}]` : ''
        ].filter(Boolean).join(' ');

        groups[groupName] = groups[groupName] || [];
        groups[groupName].push([heading, ...bullets.map((bullet) => `  - ${bullet}`)].filter(Boolean).join('\n'));
      }

      const sectionGroups = select('.resume-section-group', true);

      if (sectionGroups.length) {
        sectionGroups.forEach((group) => {
          const title = getTerminalText('.resume-title', '', group);
          if (!title) return;

          select('.resume-item', true).filter((item) => group.contains(item)).forEach((item) => {
            addResumeItem(title, item);
          });
        });

        return groups;
      }

      let currentGroup = '';

      select('.resume-list > *', true).forEach((element) => {
        if (element.classList.contains('resume-title')) {
          currentGroup = cleanTerminalText(element.textContent);
          groups[currentGroup] = groups[currentGroup] || [];
          return;
        }

        if (currentGroup && element.classList.contains('resume-item')) {
          addResumeItem(currentGroup, element);
        }
      });

      return groups;
    }

    const getContactLines = () => {
      const contactItems = select('#contact .info > div', true).map((item) => {
        const label = getTerminalText('h4', '', item).replace(/:$/, '');
        const value = getTerminalText('p', '', item);
        return label && value ? `${label}: ${value}` : value;
      }).filter(Boolean);
      const socials = select('#hero .social-links a', true).map((link) => link.getAttribute('aria-label')).filter(Boolean);

      return [
        ...contactItems,
        socials.length ? `Profiles: ${socials.join(', ')}` : '',
        'Use cd contact to jump to the contact form.'
      ].filter(Boolean);
    }

    const getPortfolioLines = () => {
      const projects = select('#portfolio .portfolio-item', true).map((item) => {
        const title = getTerminalText('h4', '', item);
        const category = getTerminalText('.portfolio-info p', '', item);
        const summary = getTerminalText('.portfolio-summary', '', item);
        return [title, category ? `(${category})` : '', summary ? `- ${summary}` : ''].filter(Boolean).join(' ');
      }).filter(Boolean);

      return projects.length ? [...projects, 'Use cd portfolio to jump to the project section.'] : ['No portfolio items found.'];
    }

    const getTestimonialsLines = () => {
      const testimonials = select('#testimonials .testimonial-item', true).map((item) => {
        const name = getTerminalText('h3', '', item);
        const role = getTerminalText('h5', '', item) || getTerminalText('h4', '', item);
        const quote = getTerminalText('p', '', item);
        return [name, role ? `(${role})` : '', quote ? `- ${quote}` : ''].filter(Boolean).join(' ');
      }).filter(Boolean);

      return testimonials.length ? testimonials : ['No testimonials found.'];
    }

    const getGenericSectionLines = (section) => {
      const title = getTerminalText('.section-title h2', section.id, section);
      const intro = getTerminalText('.section-title p', '', section);
      return [title, intro].filter(Boolean);
    }

    const getSectionReader = (section) => {
      const sectionReaders = {
        about: () => [
          getTerminalText('#hero h1', 'Azmain Kabir'),
          getTerminalText('#hero .hero-summary'),
          getTerminalText('#about .section-title p'),
          getTerminalText('#about .content h3')
        ].filter(Boolean),
        skills: () => [
          `Focus: ${getTerminalTexts('#hero .tech-chip').join(', ')}`,
          ...select('#skills .skill', true).map(getSkillLabel)
        ].filter((line) => line !== 'Focus: '),
        resume: () => {
          const groups = getResumeGroups();
          const lines = Object.entries(groups).map(([title, items]) => `${title}: ${items.length} ${items.length === 1 ? 'entry' : 'entries'}`);
          return [...lines, 'Use cd resume to jump to the full resume section.'];
        },
        portfolio: getPortfolioLines,
        testimonials: getTestimonialsLines,
        contact: getContactLines
      };

      return sectionReaders[section.id] || (() => getGenericSectionLines(section));
    }

    const getTerminalFiles = () => {
      const files = {};

      const addFile = (name, reader, route, hidden = false) => {
        const fileName = slugTerminalName(name);
        if (!fileName || files[fileName]) return;
        files[fileName] = { reader, route, hidden };
      }

      select('main > section[id]', true).forEach((section) => {
        addFile(section.id, getSectionReader(section), `#${section.id}`);
        if (section.id === 'portfolio') {
          addFile('projects', getPortfolioLines, '#portfolio');
        }
      });

      const resumeGroups = getResumeGroups();
      const groupedResumeAliases = {};

      Object.entries(resumeGroups).forEach(([title, items]) => {
        const slug = slugTerminalName(title);
        const firstWord = slug.split('-')[0];
        const reader = () => items;

        if (firstWord && firstWord !== slug) {
          addFile(slug, reader, '#resume', true);
          groupedResumeAliases[firstWord] = groupedResumeAliases[firstWord] || [];
          groupedResumeAliases[firstWord].push({ title, items });
        } else {
          addFile(slug, reader, '#resume');
        }
      });

      Object.entries(groupedResumeAliases).forEach(([alias, groups]) => {
        addFile(alias, () => groups.flatMap((group) => group.items), '#resume');
      });

      return files;
    }

    const getTerminalFileNames = (includeHidden = false) => Object.entries(getTerminalFiles())
      .filter(([, file]) => includeHidden || !file.hidden)
      .map(([fileName]) => fileName);

    const getTerminalRoutes = () => Object.entries(getTerminalFiles()).reduce((routes, [fileName, file]) => {
      routes[fileName] = file.route;
      return routes;
    }, {
      '~': '#hero',
      home: '#hero',
      '..': '#hero'
    });

    const getTerminalExternalLinks = () => select('#hero .social-links a', true).reduce((links, link) => {
      const label = slugTerminalName(link.getAttribute('aria-label') || link.className);
      if (label && link.href) {
        links[label] = link.href;
      }
      return links;
    }, {});

    const getDefaultTerminalLines = () => {
      const files = getTerminalFileNames();
      const catExample = files.includes('skills') ? 'skills' : files[0] || 'about';
      const grepExample = files.includes('work') ? 'work' : catExample;
      const navExample = files.includes('contact') ? 'cd contact' : 'ls';

      return [
        'Azmain website shell',
        `type help, ls, cat ${catExample}, grep python ${grepExample}, or ${navExample}`
      ];
    }

    const readTerminalFile = (fileName) => {
      const file = getTerminalFiles()[slugTerminalName(fileName)];
      if (!file) return null;
      const lines = file.reader().filter(Boolean);
      return lines.length ? lines : [`${fileName}: no page content found`];
    }

    const formatTerminalPrompt = (promptPath = currentTerminalPath) => `azmain@website:${promptPath}$`;

    const syncTerminalPrompt = () => {
      if (!heroTerminalPrompt) return;
      heroTerminalPrompt.textContent = formatTerminalPrompt();
    }

    const moveTerminalCaretToEnd = () => {
      if (!heroTerminalInput) return;
      const endPosition = heroTerminalInput.value.length;
      heroTerminalInput.setSelectionRange(endPosition, endPosition);
    }

    const renderTerminalLines = (lines) => {
      if (!heroTerminalOutput) return;
      heroTerminalOutput.innerHTML = '';
      lines.forEach((line) => {
        const terminalLine = document.createElement('span');
        terminalLine.textContent = line;
        heroTerminalOutput.appendChild(terminalLine);
      });
      heroTerminalOutput.scrollTop = 0;
    }

    const renderTerminalResult = (rawCommand, lines, promptPath = currentTerminalPath) => {
      renderTerminalLines([`${formatTerminalPrompt(promptPath)} ${rawCommand}`, ...lines]);
    }

    const scrollTerminalTo = (sectionId) => {
      setTimeout(() => scrollto(sectionId), 250);
    }

    const terminalHelp = () => [
      'Linux-style commands:',
      'ls, tree, pwd, whoami, uname, date, history, clear',
      'cat <file>, grep <term> <file>, echo <text>',
      'Navigation:',
      `cd ${getTerminalFileNames().join(' | ')} | ..`,
      `open ${Object.keys(getTerminalExternalLinks()).join(' | ')} | <file>`,
      `Files: ${getTerminalFileNames().join(', ')}`
    ];

    const runTerminalCommand = (rawCommand) => {
      const parts = tokenizeTerminalCommand(rawCommand);
      const command = (parts[0] || '').toLowerCase();
      const args = parts.slice(1);

      if (!command) return getDefaultTerminalLines();

      if (getTerminalFileNames(true).includes(command)) {
        return readTerminalFile(command);
      }

      switch (command) {
        case 'help':
        case 'man':
          return terminalHelp();

        case 'clear':
          return getDefaultTerminalLines();

        case 'ls':
          if (currentTerminalPath === '~/resume') {
            return Object.keys(getResumeGroups());
          }

          if (currentTerminalPath === '~/projects' || currentTerminalPath === '~/portfolio') {
            return select('#portfolio .portfolio-info h4', true).map((item) => cleanTerminalText(item.textContent));
          }

          if (currentTerminalPath === '~/contact') {
            return getContactLines().map((line) => line.split(':')[0]);
          }

          if (currentTerminalPath === '~/skills') {
            return getTerminalTexts('#hero .tech-chip');
          }

          return getTerminalFileNames();

        case 'tree':
        case 'find':
          return ['.', ...getTerminalFileNames().map((fileName) => `./${fileName}`)];

        case 'pwd':
          return [`/home/azmain/website${currentTerminalPath.replace('~', '')}`];

        case 'whoami':
          return ['azmain-kabir'];

        case 'uname':
          return ['Azmain website-shell'];

        case 'date':
          return [new Date().toLocaleString()];

        case 'history':
          return terminalHistory.length ? terminalHistory.map((item, index) => `${index + 1}  ${item}`) : ['history is empty'];

        case 'echo':
          return [args.join(' ')];

        case 'cat': {
          const file = (args[0] || '').toLowerCase();
          return readTerminalFile(file) || [`cat: ${args[0] || ''}: no such portfolio file`, `try: cat ${getTerminalFileNames().join(' | cat ')}`];
        }

        case 'grep': {
          const term = (args[0] || '').toLowerCase();
          const file = (args[1] || '').toLowerCase();
          const filesToSearch = readTerminalFile(file) ? [file] : getTerminalFileNames();
          const matches = [];

          if (!term) return ['usage: grep <term> [file]'];

          filesToSearch.forEach((fileName) => {
            readTerminalFile(fileName).forEach((line) => {
              if (line.toLowerCase().includes(term)) {
                matches.push(`${fileName}: ${line}`);
              }
            });
          });

          return matches.length ? matches : [`grep: no matches for "${term}"`];
        }

        case 'cd': {
          const target = (args[0] || '~').toLowerCase();
          const routes = getTerminalRoutes();

          if (!routes[target]) {
            return [`cd: ${args[0] || ''}: no such section`, `try: cd ${getTerminalFileNames().slice(0, 6).join(', cd ')}`];
          }

          currentTerminalPath = target === '~' || target === 'home' || target === '..' ? '~' : `~/${target}`;
          syncTerminalPrompt();
          scrollTerminalTo(routes[target]);
          return [`navigating to ${target === '~' || target === '..' ? 'home' : target}`];
        }

        case 'open': {
          const target = (args[0] || '').toLowerCase();
          const links = getTerminalExternalLinks();
          const routes = getTerminalRoutes();

          if (links[target]) {
            window.open(links[target], '_blank', 'noopener,noreferrer');
            return [`opening ${target}`];
          }

          if (routes[target]) {
            scrollTerminalTo(routes[target]);
            return [`opening ${target}`];
          }

          return [`usage: open ${Object.keys(links).join(' | ')} | ${getTerminalFileNames().slice(0, 6).join(' | ')}`];
        }

        case 'sudo':
          return ['permission denied: this portfolio does not need sudo'];

        default:
          return [
            `${command}: command not found`,
            getDefaultTerminalLines()[1].replace('type ', 'try ')
          ];
      }
    }

    const autocompleteTerminalCommand = () => {
      if (!heroTerminalInput) return;

      const value = heroTerminalInput.value;
      const parts = tokenizeTerminalCommand(value);
      const activeToken = parts[parts.length - 1] || '';
      const candidates = [...terminalCommands, ...getTerminalFileNames(true), ...Object.keys(getTerminalExternalLinks())];
      const matches = candidates.filter((candidate) => candidate.startsWith(activeToken.toLowerCase()));

      if (matches.length === 1) {
        heroTerminalInput.value = `${value.slice(0, value.length - activeToken.length)}${matches[0]}`;
        moveTerminalCaretToEnd();
      } else if (matches.length > 1) {
        renderTerminalResult(value || 'tab', matches);
      }
    }

    heroTerminal.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!heroTerminalInput) return;

      const rawCommand = heroTerminalInput.value.trim();

      if (!rawCommand) {
        renderTerminalLines(getDefaultTerminalLines());
        return;
      }

      const promptPath = currentTerminalPath;
      terminalHistory.push(rawCommand);
      terminalHistoryIndex = terminalHistory.length;

      if (rawCommand.toLowerCase() === 'clear') {
        renderTerminalLines(getDefaultTerminalLines());
        heroTerminalInput.value = '';
        return;
      }

      const result = runTerminalCommand(rawCommand);
      renderTerminalResult(rawCommand, result, promptPath);

      heroTerminalInput.value = '';
    });

    heroTerminalInput?.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        terminalHistoryIndex = Math.max(terminalHistoryIndex - 1, 0);
        heroTerminalInput.value = terminalHistory[terminalHistoryIndex] || '';
        moveTerminalCaretToEnd();
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        terminalHistoryIndex = Math.min(terminalHistoryIndex + 1, terminalHistory.length);
        heroTerminalInput.value = terminalHistory[terminalHistoryIndex] || '';
        moveTerminalCaretToEnd();
      }

      if (event.key === 'Tab') {
        event.preventDefault();
        autocompleteTerminalCommand();
      }
    });

    renderTerminalLines(getDefaultTerminalLines());
    syncTerminalPrompt();
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
    const resumeList = resumeContent.querySelector('.resume-list');
    let resumeBalanceColumns = [];
    let resumeSectionGroups = [];
    let resumeProgress = 0;
    let isDraggingResume = false;
    let didDragResume = false;
    let resumeStartY = 0;
    let resumeScrollFrame = null;
    let previousRootOverflowAnchor = '';
    let previousBodyOverflowAnchor = '';

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

    const buildResumeSectionGroups = () => {
      if (!resumeList || resumeSectionGroups.length) return;

      let currentGroup = null;

      Array.from(resumeList.childNodes).forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('resume-title')) {
          currentGroup = document.createElement('div');
          currentGroup.className = 'resume-section-group';
          resumeList.insertBefore(currentGroup, node);
          currentGroup.appendChild(node);
          resumeSectionGroups.push(currentGroup);
          return;
        }

        if (currentGroup) {
          currentGroup.appendChild(node);
        }
      });

      const finalGroup = resumeSectionGroups[resumeSectionGroups.length - 1];
      if (finalGroup) {
        finalGroup.classList.add('is-final-section');
      }
    }

    const restoreResumeListOrder = () => {
      if (!resumeList) return;

      resumeList.classList.remove('is-balanced');
      resumeSectionGroups.forEach((group) => resumeList.appendChild(group));
      resumeBalanceColumns.forEach((column) => column.remove());
      resumeBalanceColumns = [];
    }

    const resumeGroupHeight = (group) => {
      const style = getComputedStyle(group);
      return group.getBoundingClientRect().height + parseFloat(style.marginTop || 0) + parseFloat(style.marginBottom || 0);
    }

    const balanceResumeSections = () => {
      if (!resumeList || !resumeSectionGroups.length) return;

      restoreResumeListOrder();

      if (window.innerWidth < 992) return;

      const leftColumn = document.createElement('div');
      const rightColumn = document.createElement('div');
      leftColumn.className = 'resume-balance-column';
      rightColumn.className = 'resume-balance-column';
      resumeBalanceColumns = [leftColumn, rightColumn];

      resumeList.replaceChildren(leftColumn, rightColumn);
      resumeList.classList.add('is-balanced');
      resumeSectionGroups.forEach((group) => leftColumn.appendChild(group));

      const groupHeights = resumeSectionGroups.map((group) => resumeGroupHeight(group));
      const totalHeight = groupHeights.reduce((sum, height) => sum + height, 0);
      let bestSplitIndex = 1;
      let bestDifference = Number.POSITIVE_INFINITY;
      let leftHeight = 0;

      for (let index = 1; index < resumeSectionGroups.length; index += 1) {
        leftHeight += groupHeights[index - 1];
        const rightHeight = totalHeight - leftHeight;
        const difference = Math.abs(leftHeight - rightHeight);

        if (difference < bestDifference) {
          bestDifference = difference;
          bestSplitIndex = index;
        }
      }

      resumeSectionGroups.forEach((group, index) => {
        (index < bestSplitIndex ? leftColumn : rightColumn).appendChild(group);
      });
    }

    const clampPageScroll = (scrollTop) => {
      const maxPageScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
      return Math.min(Math.max(scrollTop, 0), maxPageScroll);
    }

    const setResumeDragScroll = (scrollTop) => {
      const targetScroll = clampPageScroll(scrollTop);

      window.scrollTo({
        top: targetScroll,
        behavior: 'auto'
      });
      updateResumeZipperVisibility();

      if (resumeScrollFrame) {
        cancelAnimationFrame(resumeScrollFrame);
      }

      resumeScrollFrame = requestAnimationFrame(() => {
        if (isDraggingResume) {
          window.scrollTo({
            top: clampPageScroll(targetScroll),
            behavior: 'auto'
          });
          updateResumeZipperVisibility();
        }

        resumeScrollFrame = null;
      });
    }

    const disableResumeScrollAnchoring = () => {
      previousRootOverflowAnchor = document.documentElement.style.overflowAnchor;
      previousBodyOverflowAnchor = document.body.style.overflowAnchor;
      document.documentElement.style.overflowAnchor = 'none';
      document.body.style.overflowAnchor = 'none';
    }

    const restoreResumeScrollAnchoring = () => {
      document.documentElement.style.overflowAnchor = previousRootOverflowAnchor;
      document.body.style.overflowAnchor = previousBodyOverflowAnchor;
    }

    const scrollResumeWithProgress = (expandedHeight) => {
      if (!resumeSection || !isDraggingResume || !didDragResume) return;

      const resumeTop = resumeSection.offsetTop;
      const maxResumeScroll = Math.max(expandedHeight - (window.innerHeight * 0.72), 0);
      const targetScroll = resumeTop + (maxResumeScroll * resumeProgress);

      setResumeDragScroll(Math.max(resumeTop, targetScroll));
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
      resumeContent.style.setProperty('--resume-drag-layout-height', `${expandedHeight}px`);
      resumeContent.style.setProperty('--resume-drag-clip-bottom', `${Math.max(expandedHeight - currentHeight, 0)}px`);
      resumeToggle.style.setProperty('--zipper-progress', resumeProgress);
      resumeToggle.style.setProperty('--zipper-progress-fill', `${trackFill * resumeProgress}px`);
      resumeToggle.style.setProperty('--zipper-pull-offset', `${trackTravel * resumeProgress}px`);
      resumeToggle.style.setProperty('--zipper-pull-rotation', `${resumeProgress * 180}deg`);
      resumeToggle.style.setProperty('--zipper-spread', `${5 + (resumeProgress * 8)}px`);
      resumeToggle.style.setProperty('--zipper-open-opacity', `${0.36 + (resumeProgress * 0.64)}`);
      resumeToggle.style.setProperty('--zipper-closed-opacity', `${0.98 - (resumeProgress * 0.08)}`);

      resumeContent.classList.toggle('resume-collapsed', resumeProgress <= 0.001);
      resumeContent.classList.toggle('resume-expanded', resumeProgress >= 0.999);
      resumeToggle.setAttribute('aria-expanded', resumeProgress > 0.001 ? 'true' : 'false');
      resumeToggle.setAttribute('aria-valuenow', Math.round(resumeProgress * 100));
      resumeToggle.setAttribute('aria-valuetext', resumeProgress >= 0.999 ? 'Full resume visible' : `${Math.round(resumeProgress * 100)} percent of resume visible`);

      if (resumeAction) {
        resumeAction.setAttribute('aria-expanded', resumeProgress >= 0.999 ? 'true' : 'false');
      }

      if (resumeToggleText) {
        resumeToggleText.textContent = isDraggingResume
          ? `${Math.round(resumeProgress * 100)}%`
          : resumeProgress >= 0.999 ? 'Open' : 'Reveal';
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

    const updateResumeZipperClip = (sectionRect) => {
      if (!resumeZipperWrap) return false;

      const zipperRect = resumeZipperWrap.getBoundingClientRect();
      const clipTop = Math.max(sectionRect.top - zipperRect.top, 0);
      const clipBottom = Math.max(zipperRect.bottom - sectionRect.bottom, 0);
      const isIntersectingResume = sectionRect.bottom > zipperRect.top && sectionRect.top < zipperRect.bottom;

      resumeZipperWrap.style.setProperty('--zipper-clip-top', `${clipTop}px`);
      resumeZipperWrap.style.setProperty('--zipper-clip-bottom', `${clipBottom}px`);

      return isIntersectingResume;
    }

    const updateResumeZipperVisibility = () => {
      if (!resumeSection) return;

      const sectionRect = resumeSection.getBoundingClientRect();
      const isIntersectingZipper = updateResumeZipperClip(sectionRect);

      if (isDraggingResume) {
        setResumeZipperVisibility(true);
        return;
      }

      setResumeZipperVisibility(isIntersectingZipper);
    }

    resumeToggle.addEventListener('pointerdown', (event) => {
      if (!zipperTrack) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      event.preventDefault();
      isDraggingResume = true;
      didDragResume = false;
      resumeStartY = event.clientY;
      resumeToggle.setPointerCapture(event.pointerId);
      resumeToggle.classList.add('is-dragging');
      resumeContent.classList.add('resume-dragging');
      document.body.classList.add('resume-zipper-dragging');
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
      disableResumeScrollAnchoring();
      setResumeZipperVisibility(true);
    });

    resumeToggle.addEventListener('pointermove', (event) => {
      if (!isDraggingResume) return;

      event.preventDefault();
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
      document.body.classList.remove('resume-zipper-dragging');
      restoreResumeScrollAnchoring();
      if (resumeScrollFrame) {
        cancelAnimationFrame(resumeScrollFrame);
        resumeScrollFrame = null;
      }
      if (resumeToggleText) {
        resumeToggleText.textContent = resumeProgress >= 0.999 ? 'Open' : 'Reveal';
      }
      updateResumeZipperVisibility();
      refreshResumeAos();

      if (resumeToggle.hasPointerCapture(event.pointerId)) {
        resumeToggle.releasePointerCapture(event.pointerId);
      }

    }

    resumeToggle.addEventListener('pointerup', finishResumeDrag);
    resumeToggle.addEventListener('pointercancel', finishResumeDrag);
    resumeToggle.addEventListener('dragstart', (event) => event.preventDefault());

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
      balanceResumeSections();
      applyResumeProgress(resumeProgress);
      updateResumeZipperVisibility();
    });

    if (resumeSection) {
      window.addEventListener('load', () => {
        balanceResumeSections();
        applyResumeProgress(resumeProgress);
        updateResumeZipperVisibility();
      });
      window.addEventListener('scroll', updateResumeZipperVisibility);
      updateResumeZipperVisibility();
    }

    buildResumeSectionGroups();
    balanceResumeSections();
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
