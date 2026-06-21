const slides = document.querySelectorAll('.slide');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const slideNumDisplay = document.getElementById('slide-num');
let currentSlideIndex = 0;

function updateDeck() {
    slides.forEach((slide, idx) => {
        if(idx === currentSlideIndex) {
            slide.classList.add('active');
        } else {
            slide.classList.remove('active');
        }
    });
    slideNumDisplay.textContent = `${currentSlideIndex + 1} / ${slides.length}`;
}

nextBtn.addEventListener('click', () => {
    if(currentSlideIndex < slides.length - 1) {
        currentSlideIndex++;
        updateDeck();
    }
});

prevBtn.addEventListener('click', () => {
    if(currentSlideIndex > 0) {
        currentSlideIndex--;
        updateDeck();
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
        if(currentSlideIndex < slides.length - 1) {
            currentSlideIndex++;
            updateDeck();
        }
    } else if (e.key === 'ArrowLeft') {
        if(currentSlideIndex > 0) {
            currentSlideIndex--;
            updateDeck();
        }
    }
});


/* Animated Coding Background Engine (Canvas) */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
});
const codeSnippets = ['<div>', '</div>', 'const data = []', '<html>', 'body { }', '💡', 'function init()', 'box-shadow', '#8a4fff', 'Day 1', 'color: purple;', 'display: flex;', 'Promise.resolve()'];
const particles = [];

for (let i = 0; i < 40; i++) {
    particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 5 + 4,
        type: Math.random() > 0.5 ? 'circle' : 'text',
        text: codeSnippets[Math.floor(Math.random() * codeSnippets.length)],
        fontSize: Math.floor(Math.random() * 6) + 14,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.35 + 0.25
    });
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    
    particles.forEach(p => {
        ctx.fillStyle = `rgba(138, 79, 255, ${p.opacity})`;
        
        if (p.type === 'circle') {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.font = `bold ${p.fontSize}px 'Courier New', monospace`;
            ctx.fillText(p.text, p.x, p.y);
        }

        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < -100) p.x = width + 100;
        if (p.x > width + 100) p.x = -100;
        if (p.y < -100) p.y = height + 100;
        if (p.y > height + 100) p.y = -100;
    });

    requestAnimationFrame(animate);
}

animate();