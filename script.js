     const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const header = document.querySelector('#siteHeader');
    const progressBar = document.querySelector('#scrollProgressBar');
    const navToggle = document.querySelector('#navToggle');
    const navLinks = document.querySelector('#navLinks');
    const navItems = document.querySelectorAll('.nav-link');

    let scrollUITicking = false;

    const updateScrollUI = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      progressBar.style.transform = `scaleX(${Math.max(0, Math.min(1, progress))})`;
      header.classList.toggle('is-scrolled', window.scrollY > 12);
      scrollUITicking = false;
    };

    updateScrollUI();
    window.addEventListener('scroll', () => {
      if (scrollUITicking) return;
      scrollUITicking = true;
      window.requestAnimationFrame(updateScrollUI);
    }, { passive: true });

    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('is-open');
      navToggle.classList.toggle('is-open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });

    navItems.forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        navToggle.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open menu');
      });
    });

    const revealElements = document.querySelectorAll('.reveal-3d');
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });

    revealElements.forEach((element, index) => {
      element.style.transitionDelay = prefersReducedMotion ? '0ms' : `${Math.min(index % 6, 5) * 70}ms`;
      revealObserver.observe(element);
    });

    const skills = document.querySelectorAll('.skill');
    const skillObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const skill = entry.target;
        const bar = skill.querySelector('.skill__bar');
        bar.style.width = `${skill.dataset.skill}%`;
        skillObserver.unobserve(skill);
      });
    }, { threshold: 0.5 });

    skills.forEach((skill) => skillObserver.observe(skill));

    const parallaxItems = document.querySelectorAll('[data-parallax]');
    let ticking = false;

    const applyParallax = () => {
      if (prefersReducedMotion) return;
      const offset = window.scrollY;
      parallaxItems.forEach((item) => {
        const speed = Number(item.dataset.parallax) || 0;
        item.style.transform = `translate3d(0, ${offset * speed}px, 0)`;
      });
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(applyParallax);
        ticking = true;
      }
    }, { passive: true });

    const backgroundVideo = document.querySelector('#backgroundVideo');

    if (backgroundVideo) {
      const VIDEO_FPS = 24;
      const FRAME_DURATION = 1 / VIDEO_FPS;
      const SEEK_INTERVAL = 1000 / VIDEO_FPS;
      const MAX_SEEK_STEP = 0.25;
      let scrollRange = 0;
      let targetVideoTime = 0;
      let scrollTicking = false;
      let videoAnimationFrame = 0;
      let lastSeekAt = 0;

      const updateScrollRange = () => {
        const documentHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        scrollRange = Math.max(0, documentHeight - window.innerHeight);
      };

      const queueVideoUpdate = () => {
        if (!videoAnimationFrame) {
          videoAnimationFrame = window.requestAnimationFrame(updateVideoTime);
        }
      };

      const updateVideoTime = (timestamp) => {
        videoAnimationFrame = 0;
        if (!backgroundVideo.duration || backgroundVideo.seeking) return;

        const clampedTarget = Math.min(
          Math.max(0, backgroundVideo.duration - FRAME_DURATION),
          targetVideoTime
        );
        const difference = clampedTarget - backgroundVideo.currentTime;

        if (Math.abs(difference) < FRAME_DURATION) {
          backgroundVideo.currentTime = clampedTarget;
          return;
        }

        if (timestamp - lastSeekAt < SEEK_INTERVAL) {
          queueVideoUpdate();
          return;
        }

        const easedStep = difference * 0.28;
        const step = Math.sign(difference) * Math.min(
          Math.abs(difference),
          Math.max(FRAME_DURATION, Math.min(MAX_SEEK_STEP, Math.abs(easedStep)))
        );

        lastSeekAt = timestamp;
        backgroundVideo.currentTime += step;
      };

      const syncVideoToScroll = () => {
        scrollTicking = false;
        if (!backgroundVideo.duration || prefersReducedMotion) return;
        const scrollRatio = scrollRange > 0 ? window.scrollY / scrollRange : 0;
        const exactTime = Math.max(0, Math.min(1, scrollRatio)) * backgroundVideo.duration;
        targetVideoTime = Math.round(exactTime * VIDEO_FPS) / VIDEO_FPS;
        queueVideoUpdate();
      };

      backgroundVideo.muted = true;
      backgroundVideo.pause();

      const onScroll = () => {
        if (prefersReducedMotion || scrollTicking) return;
        scrollTicking = true;
        window.requestAnimationFrame(syncVideoToScroll);
      };

      backgroundVideo.addEventListener('loadedmetadata', () => {
        updateScrollRange();
        syncVideoToScroll();
      });

      backgroundVideo.addEventListener('seeked', () => {
        if (Math.abs(backgroundVideo.currentTime - targetVideoTime) >= FRAME_DURATION) {
          queueVideoUpdate();
        }
      });

      if (backgroundVideo.readyState >= 1) {
        updateScrollRange();
        syncVideoToScroll();
      }

      backgroundVideo.addEventListener('error', () => {
        backgroundVideo.style.opacity = '0';
      });

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', () => {
        updateScrollRange();
        onScroll();
      }, { passive: true });
    }

    const tiltCards = document.querySelectorAll('[data-tilt]');

    tiltCards.forEach((card) => {
      card.addEventListener('mousemove', (event) => {
        if (prefersReducedMotion) return;
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((centerY - y) / centerY) * 9;
        const rotateY = ((x - centerX) / centerX) * 9;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(18px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
      });
    });

    const track = document.querySelector('#testimonialTrack');
    const slides = Array.from(track.children);
    const prevButton = document.querySelector('#prevTestimonial');
    const nextButton = document.querySelector('#nextTestimonial');
    const dotsContainer = document.querySelector('#testimonialDots');
    let activeSlide = 0;
    let carouselTimer;

    const renderDots = () => {
      dotsContainer.innerHTML = '';
      slides.forEach((_, index) => {
        const button = document.createElement('button');
        button.className = 'dot';
        button.type = 'button';
        button.setAttribute('aria-label', `Show testimonial ${index + 1}`);
        button.addEventListener('click', () => setSlide(index));
        dotsContainer.append(button);
      });
    };

    const setSlide = (index) => {
      activeSlide = (index + slides.length) % slides.length;
      track.style.transform = `translateX(-${activeSlide * 100}%)`;
      dotsContainer.querySelectorAll('.dot').forEach((dot, dotIndex) => {
        dot.classList.toggle('is-active', dotIndex === activeSlide);
      });
      restartCarousel();
    };

    const restartCarousel = () => {
      if (prefersReducedMotion) return;
      clearInterval(carouselTimer);
      carouselTimer = setInterval(() => setSlide(activeSlide + 1), 6500);
    };

    renderDots();
    setSlide(0);
    prevButton.addEventListener('click', () => setSlide(activeSlide - 1));
    nextButton.addEventListener('click', () => setSlide(activeSlide + 1));

    const contactForm = document.querySelector('#contactForm');
    const formStatus = document.querySelector('#formStatus');
    const validators = {
      name(value) {
        if (value.trim().length < 2) return 'Please enter at least 2 characters.';
        return '';
      },
      email(value) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value.trim())) return 'Please enter a valid email address.';
        return '';
      },
      budget() {
        return '';
      },
      message(value) {
        if (value.trim().length < 20) return 'Please describe your project in at least 20 characters.';
        return '';
      }
    };

    const setFieldError = (field, message) => {
      const errorElement = contactForm.querySelector(`[data-error-for="${field.name}"]`);
      field.classList.toggle('is-invalid', Boolean(message));
      field.setAttribute('aria-invalid', String(Boolean(message)));
      if (errorElement) errorElement.textContent = message;
    };

    const validateField = (field) => {
      const validator = validators[field.name];
      if (!validator) return true;
      const message = validator(field.value);
      setFieldError(field, message);
      return !message;
    };

    contactForm.querySelectorAll('input, textarea').forEach((field) => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.classList.contains('is-invalid')) validateField(field);
      });
    });

    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();
      formStatus.textContent = '';
      const fields = Array.from(contactForm.querySelectorAll('input, textarea'));
      const isValid = fields.every(validateField);

      if (!isValid) {
        formStatus.style.color = 'var(--danger)';
        formStatus.textContent = 'Please fix the highlighted fields before sending.';
        return;
      }

      formStatus.style.color = 'var(--success)';
      formStatus.textContent = 'Thanks! Your inquiry is ready to be sent. Connect this form to your email or CRM endpoint.';
      contactForm.reset();
    });

    document.querySelector('#currentYear').textContent = new Date().getFullYear();
