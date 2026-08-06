document.addEventListener('DOMContentLoaded', () => {
    // 0. Initialize Lenis Smooth Scroll
    let lenis;
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smooth: true,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);
    }

    // 1. Initial Page Load Animation
    setTimeout(() => {
        document.body.classList.add('loaded');
        const header = document.querySelector('.site-header');
        if (header) {
            header.classList.add('visible');
        }
    }, 100);

    // 2. Generate Top Artwork (SVG U-shapes)
    const topArtworkContainer = document.getElementById('top-artwork');
    if (topArtworkContainer) {
        const topSVG = createFingerprintPattern(500, 500, {
            lines: 16,
            cx: 250,
            cy: 280,
            baseRadius: 20,
            spacing: 12,
            startY: -50,
            direction: 'up', // U-shape opening upwards (descends, curves, goes up)
            variation: true
        });
        topArtworkContainer.innerHTML = topSVG;
    }

    // 3. Generate Bottom Artwork (Larger, Cropped SVG U-shapes)
    const bottomArtworkContainer = document.getElementById('bottom-artwork');
    if (bottomArtworkContainer) {
        const bottomSVG = createFingerprintPattern(700, 600, {
            lines: 22,
            cx: 400,
            cy: 200,
            baseRadius: 40,
            spacing: 15,
            startY: -100,
            direction: 'up',
            variation: true
        });
        bottomArtworkContainer.innerHTML = bottomSVG;
    }

    // 4. Scroll-entry Animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    const problemSections = document.querySelectorAll('.problems-section');
    problemSections.forEach(section => {
        observer.observe(section);
    });

    const pricingSection = document.querySelector('.pricing-section');
    if (pricingSection) observer.observe(pricingSection);
    
    const faqSection = document.querySelector('.faq-section');
    if (faqSection) observer.observe(faqSection);

    // 4b. FAQ Accordion Logic
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const btn = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        btn.addEventListener('click', () => {
            const isOpen = item.classList.contains('is-open');
            
            // Close all other items
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('is-open');
                otherItem.querySelector('.faq-answer').style.height = '0px';
            });
            
            if (!isOpen) {
                item.classList.add('is-open');
                const inner = answer.querySelector('.faq-answer-inner');
                answer.style.height = inner.offsetHeight + 'px';
            }
        });
    });

    const footerSection = document.querySelector('.footer-section');
    if (footerSection) observer.observe(footerSection);

    // 4c. Mobile Menu Toggle
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav a');
    
    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.contains('is-open');
            if (isOpen) {
                mobileMenu.classList.remove('is-open');
                mobileToggle.classList.remove('is-open');
                mobileToggle.setAttribute('aria-expanded', 'false');
            } else {
                mobileMenu.classList.add('is-open');
                mobileToggle.classList.add('is-open');
                mobileToggle.setAttribute('aria-expanded', 'true');
            }
        });

        // Close menu on link click
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('is-open');
                mobileToggle.classList.remove('is-open');
                mobileToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // 4d. Scrollspy (Active Navigation State)
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.main-nav a, .mobile-nav a, .toc-list a');

    const scrollSpyOptions = {
        root: null,
        rootMargin: '-50% 0px -50% 0px', // Trigger when section passes middle of screen
        threshold: 0
    };

    const scrollSpyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentId = entry.target.getAttribute('id');
                
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${currentId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, scrollSpyOptions);

    sections.forEach(sec => {
        if (sec.getAttribute('id')) {
            scrollSpyObserver.observe(sec);
        }
    });

    // Handle smooth scrolling for anchor links with Lenis
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                if (lenis) {
                    lenis.scrollTo(targetElement, { offset: -100 });
                } else {
                    window.scrollTo({
                        top: targetElement.offsetTop - 100,
                        behavior: 'smooth'
                    });
                }
                
                // If it's a mobile link, close menu
                if (mobileMenu && mobileToggle && mobileMenu.classList.contains('is-open')) {
                    mobileMenu.classList.remove('is-open');
                    mobileToggle.classList.remove('is-open');
                    mobileToggle.setAttribute('aria-expanded', 'false');
                }
            }
        });
    });

    // 5. Workflow Section Path & Animation
    function updateWorkflowPath() {
        const container = document.querySelector('.workflow-right');
        const wrapper = document.querySelector('.workflow-path-wrapper');
        const svgBg = document.getElementById('workflow-path-bg-path');
        const svgActive = document.getElementById('workflow-path-active-path');
        
        if (!container || !wrapper || !svgBg || !svgActive) return;

        const markers = container.querySelectorAll('.step-marker');
        const containerRect = container.getBoundingClientRect();
        const cx = wrapper.offsetWidth / 2;
        
        let pathD = `M ${cx} 0 `;
        let prevY = 0;
        let offset = cx * 0.6; // Curve amount based on width

        markers.forEach((marker) => {
            const markerRect = marker.getBoundingClientRect();
            // Center Y of marker relative to container
            const y = markerRect.top - containerRect.top + (markerRect.height / 2);
            
            const cp1y = prevY + (y - prevY) * 0.33;
            const cp2y = prevY + (y - prevY) * 0.66;
            
            pathD += `C ${cx + offset} ${cp1y}, ${cx + offset} ${cp2y}, ${cx} ${y} `;
            
            prevY = y;
            offset = -offset; // Alternate curve direction for each step
        });
        
        // Continue to bottom
        const bottomY = containerRect.height;
        const cp1y = prevY + (bottomY - prevY) * 0.33;
        const cp2y = prevY + (bottomY - prevY) * 0.66;
        pathD += `C ${cx + offset} ${cp1y}, ${cx + offset} ${cp2y}, ${cx} ${bottomY}`;
        
        svgBg.setAttribute('d', pathD);
        svgActive.setAttribute('d', pathD);
        
        // Set strokeDasharray for scroll animation
        const pathLength = svgActive.getTotalLength();
        svgActive.style.strokeDasharray = pathLength;
        svgActive.style.strokeDashoffset = pathLength;
        
        handleWorkflowScroll();
    }

    function handleWorkflowScroll() {
        const section = document.querySelector('.workflow-section');
        const svgActive = document.getElementById('workflow-path-active-path');
        if (!section || !svgActive) return;
        
        const rect = section.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Start animation when section top passes mid-screen
        const startTrigger = windowHeight * 0.65;
        const totalScroll = rect.height;
        const currentScroll = startTrigger - rect.top;
        
        let progress = currentScroll / totalScroll;
        progress = Math.max(0, Math.min(1, progress));
        
        const pathLength = svgActive.getTotalLength();
        svgActive.style.strokeDashoffset = pathLength - (progress * pathLength);
        
        // Highlight steps
        const markers = document.querySelectorAll('.step-marker');
        markers.forEach((marker) => {
            const markerRect = marker.getBoundingClientRect();
            const markerY = markerRect.top + (markerRect.height / 2);
            
            // If the marker moves past the start trigger line, activate it
            if (markerY < windowHeight * 0.7) {
                marker.parentElement.classList.add('step-active');
            } else {
                marker.parentElement.classList.remove('step-active');
            }
        });
    }

    // Initialize workflow path
    setTimeout(updateWorkflowPath, 100);
    window.addEventListener('resize', updateWorkflowPath);
    window.addEventListener('scroll', handleWorkflowScroll);
});

/**
 * Generates an SVG string containing a set of parallel U-shaped paths.
 */
function createFingerprintPattern(width, height, config) {
    const { lines, cx, cy, baseRadius, spacing, startY, variation } = config;
    
    let svgContent = `<svg viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">`;
    
    for (let i = 0; i < lines; i++) {
        const r = baseRadius + (i * spacing);
        const rightX = cx + r;
        const leftX = cx - r;
        
        // Add some random variation to start and stop heights
        let currentStartY = startY;
        let currentStopY = startY;
        
        if (variation) {
            // Some lines start later or stop earlier
            if (i % 3 === 0) currentStartY += 40 + Math.random() * 60;
            if (i % 2 === 0) currentStopY += 60 + Math.random() * 100;
            if (i % 5 === 0) currentStopY += 200;
        }

        // Draw descending line, arc left, ascending line
        // A rx ry x-axis-rotation large-arc-flag sweep-flag x y
        const pathData = `
            M ${rightX} ${currentStartY}
            L ${rightX} ${cy}
            A ${r} ${r} 0 0 1 ${leftX} ${cy}
            L ${leftX} ${currentStopY}
        `;

        svgContent += `<path class="u-line" d="${pathData.trim()}" />`;
    }
    
    svgContent += `</svg>`;
    return svgContent;
}
