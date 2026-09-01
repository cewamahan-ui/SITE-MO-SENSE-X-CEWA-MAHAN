document.addEventListener('DOMContentLoaded', () => {
    // 1. Copyright Year Update
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // 2. Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.toggle('is-open');
            mobileMenuBtn.classList.toggle('is-open', isOpen);
            mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
        });
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('is-open');
                mobileMenuBtn.classList.remove('is-open');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // 3. Smooth Scrolling for Navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId.length > 1) {
                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // 4. Custom Cursor (fine-pointer devices only)
    const cursor = document.getElementById('custom-cursor');
    const supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (cursor && supportsFinePointer) {
        document.documentElement.classList.add('has-custom-cursor');
        document.addEventListener('mousemove', (e) => {
            cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        });
        const interactiveSelector = 'a, button, input, textarea, #portrait-trigger, .work-card, .service-card';
        document.querySelectorAll(interactiveSelector).forEach((el) => {
            el.addEventListener('mouseenter', () => cursor.classList.add('is-active'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));
        });
        document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
        document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; });
    }

    // 5. Scroll Reveal
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && revealEls.length) {
        revealEls.forEach((el) => {
            const delay = el.getAttribute('data-reveal-delay');
            if (delay) el.style.setProperty('--reveal-delay', `${delay}ms`);
        });
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
        revealEls.forEach((el) => revealObserver.observe(el));
    } else {
        revealEls.forEach((el) => el.classList.add('in-view'));
    }

    // 6. Portrait Click: Reveal Socials
    const portraitTrigger = document.getElementById('portrait-trigger');
    const portraitCaption = document.getElementById('portrait-caption');
    if (portraitTrigger && portraitCaption) {
        const togglePortrait = () => {
            const isActive = portraitTrigger.classList.toggle('is-active');
            portraitTrigger.setAttribute('aria-expanded', String(isActive));
            portraitCaption.textContent = isActive ? 'Click photo to close' : 'Click photo for socials';
        };
        const closePortrait = () => {
            portraitTrigger.classList.remove('is-active');
            portraitTrigger.setAttribute('aria-expanded', 'false');
            portraitCaption.textContent = 'Click photo for socials';
        };
        portraitTrigger.addEventListener('click', (e) => {
            if (e.target.closest('a')) return;
            togglePortrait();
        });
        portraitTrigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                togglePortrait();
            }
        });
        document.addEventListener('click', (e) => {
            if (!portraitTrigger.contains(e.target) && portraitTrigger.classList.contains('is-active')) {
                closePortrait();
            }
        });
    }
});
