document.addEventListener('DOMContentLoaded', () => {

    // --- PART 1: PRELOADER ---
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            preloader.style.opacity = '0';
            preloader.style.pointerEvents = 'none';
        }, 2200); // Match animation time
    });

    // --- PART 2: CUSTOM CURSOR ---
    const cursor = document.querySelector('.cursor');
    window.addEventListener('mousemove', e => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });

    document.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.style.width = '40px';
            cursor.style.height = '40px';
        });
        el.addEventListener('mouseleave', () => {
            cursor.style.width = '25px';
            cursor.style.height = '25px';
        });
    });

    // --- PART 3: ADVANCED SCROLL-TRIGGERED ANIMATIONS (GSAP) ---
    gsap.registerPlugin(ScrollTrigger);

    // Animate sections into view
    const scrollElements = document.querySelectorAll('[data-scroll]');
    scrollElements.forEach(el => {
        ScrollTrigger.create({
            trigger: el,
            start: "top 85%",
            onEnter: () => el.classList.add('is-inview'),
        });
    });

    // Hero title kinetic animation
    gsap.from('.hero-title', {
        duration: 1.5,
        x: -100,
        opacity: 0,
        stagger: 0.2,
        ease: 'power4.out',
        delay: 2.5 // After preloader
    });
    gsap.from('.hero-subtitle p', {
        duration: 1,
        y: 20,
        opacity: 0,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 3
    });

    // --- PART 4: SCHEDULE TABS ---
    window.openDay = function (evt, dayName) {
        let i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName("tab-content");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
            tabcontent[i].classList.remove("active");
        }
        tablinks = document.getElementsByClassName("tab-link");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        document.getElementById(dayName).style.display = "block";
        document.getElementById(dayName).classList.add("active");
        evt.currentTarget.className += " active";
    }

    // --- PART 5: INTERACTIVE 3D WEBGL BACKGROUND (THREE.JS) ---
    let scene, camera, renderer, particles, material;
    let mouseX = 0, mouseY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    function init3D() {
        // Scene
        scene = new THREE.Scene();

        // Camera
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = 1000;

        // Particles
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const numParticles = 20000;

        for (let i = 0; i < numParticles; i++) {
            const x = Math.random() * 2000 - 1000;
            const y = Math.random() * 2000 - 1000;
            const z = Math.random() * 2000 - 1000;
            vertices.push(x, y, z);
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        material = new THREE.PointsMaterial({
            // UPDATED: Changed color to new Marigold Orange accent
            color: 0xFFAA4C,
            size: 1.5,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });

        particles = new THREE.Points(geometry, material);
        scene.add(particles);

        // Renderer
        const canvas = document.getElementById('webgl-canvas');
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }



    function animate3D() {
        requestAnimationFrame(animate3D);
        render3D();
    }

    function render3D() {
        const time = Date.now() * 0.00005;

        // Animate camera position based on mouse
        camera.position.x += (mouseX - camera.position.x) * 0.05;
        camera.position.y += (-mouseY - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        // Animate particles rotation
        particles.rotation.x = Math.sin(time * 5) * 0.1;
        particles.rotation.y = Math.cos(time * 5) * 0.1;

        // UPDATED: Change color based on scroll, now shifts from Marigold to Rose
        const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight));
        const color = new THREE.Color();
        // Starts at Hue 0.09 (Marigold) and moves towards Hue 0 (Rose/Red) as you scroll
        color.setHSL(0.09 - scrollPercent * 0.09, 1.0, 0.65);
        material.color = color;

        renderer.render(scene, camera);
    }

    // --- Event Listeners for 3D Scene ---
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onDocumentMouseMove(event) {
        mouseX = (event.clientX - windowHalfX) / 2;
        mouseY = (event.clientY - windowHalfY) / 2;
    }

    // --- Initialize Everything ---
    init3D();
    animate3D();
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousemove', onDocumentMouseMove, false);

});