const shapeColors = [
    '#FF5252', '#FF4081', '#E040FB', '#7C4DFF', 
    '#536DFE', '#448AFF', '#40C4FF', '#18FFFF',
    '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41',
    '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'
];

const continuousContainer = document.getElementById('continuousContainer');
const textSections = document.querySelectorAll('.fixed-text-section');
const craneContainers = document.querySelectorAll('.crane-container');
const scrollPercentage = document.getElementById('scrollPercentage');
const scrollIndicator = document.getElementById('scrollIndicator');
const progressBar = document.getElementById('progressBar');
const shapesContainer = document.getElementById('shapesContainer');

let isScrolling = false;
let scrollTimeout;
let totalHeight = continuousContainer.offsetHeight;
let viewportHeight = window.innerHeight;
let maxScroll = totalHeight - viewportHeight;

let cranes = [];
let craneScenes = [];
let craneRenderers = [];
let craneCameras = [];

function initCranes() {
    const craneCanvases = [
        document.getElementById('craneCanvas1'),
        document.getElementById('craneCanvas2'),
        document.getElementById('craneCanvas3'),
        document.getElementById('craneCanvas4'),
        document.getElementById('craneCanvas5')
    ];
    
    craneCanvases.forEach((canvas, index) => {
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true
        });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        craneRenderers.push(renderer);
        
        const scene = new THREE.Scene();
        craneScenes.push(scene);
        
        const camera = new THREE.PerspectiveCamera(
            45,
            canvas.clientWidth / canvas.clientHeight,
            0.1,
            1000
        );
        camera.position.z = 6;
        camera.position.y = 3;
        craneCameras.push(camera);
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        scene.add(directionalLight);
        
        const pointLight = new THREE.PointLight(0x448AFF, 1, 100);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);
        
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
        rimLight.position.set(-5, 5, -5);
        scene.add(rimLight);
        
        const loader = new THREE.OBJLoader();
        
        loader.load(
            'assets/crane.obj',
            function(object) {
                object.scale.set(0.25, 0.25, 0.25);
                object.position.y = 2;
                
                const colors = [
                    0xFF5252, 0xFF4081, 0xE040FB, 
                    0x7C4DFF, 0x448AFF
                ];
                
                object.traverse(function(child) {
                    if (child.isMesh) {
                        child.material = new THREE.MeshStandardMaterial({
                            color: colors[index],
                            metalness: 0.8,
                            roughness: 0.1,
                            emissive: new THREE.Color(colors[index]).multiplyScalar(0.3)
                        });
                    }
                });
                
                scene.add(object);
                cranes[index] = object;
            },
            function(xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded for crane ' + (index + 1));
            },
            function(error) {
                console.error('Error loading crane model for crane ' + (index + 1), error);
                createFallbackCrane(scene, index);
            }
        );
    });
}

function createFallbackCrane(scene, index) {
    const colors = [
        0xFF5252, 0xFF4081, 0xE040FB, 
        0x7C4DFF, 0x448AFF
    ];
    
    const towerGeometry = new THREE.BoxGeometry(0.4, 5, 0.4);
    const towerMaterial = new THREE.MeshStandardMaterial({
        color: colors[index],
        metalness: 0.8,
        roughness: 0.1,
        emissive: new THREE.Color(colors[index]).multiplyScalar(0.3)
    });
    const tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.y = 2;
    scene.add(tower);
    
    const armGeometry = new THREE.BoxGeometry(4, 0.25, 0.25);
    const armMaterial = new THREE.MeshStandardMaterial({
        color: colors[index],
        metalness: 0.8,
        roughness: 0.1,
        emissive: new THREE.Color(colors[index]).multiplyScalar(0.3)
    });
    const arm = new THREE.Mesh(armGeometry, armMaterial);
    arm.position.set(2, 4.5, 0);
    scene.add(arm);
    
    const counterweightGeometry = new THREE.BoxGeometry(1, 1, 1);
    const counterweight = new THREE.Mesh(counterweightGeometry, armMaterial);
    counterweight.position.set(-0.5, 4.5, 0);
    scene.add(counterweight);
    
    const hookGeometry = new THREE.ConeGeometry(0.15, 0.4, 8);
    const hookMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFF00,
        metalness: 0.9,
        roughness: 0.1,
        emissive: new THREE.Color(0xFFFF00).multiplyScalar(0.3)
    });
    const hook = new THREE.Mesh(hookGeometry, hookMaterial);
    hook.position.set(4, 3.5, 0);
    hook.rotation.x = Math.PI;
    scene.add(hook);
    
    const ropeGeometry = new THREE.CylinderGeometry(0.03, 0.03, 2);
    const ropeMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        metalness: 0.5,
        roughness: 0.5
    });
    const rope = new THREE.Mesh(ropeGeometry, ropeMaterial);
    rope.position.set(4, 4, 0);
    scene.add(rope);
    
    cranes[index] = {
        tower: tower,
        arm: arm,
        hook: hook,
        rope: rope,
        counterweight: counterweight
    };
}

function animateCranes() {
    requestAnimationFrame(animateCranes);
    
    cranes.forEach((crane, index) => {
        if (crane) {
            if (crane.isObject3D) {
                crane.rotation.y += 0.008;
                crane.position.y = 2 + Math.sin(Date.now() * 0.001 + index) * 0.2;
                
                const scalePulse = 1 + Math.sin(Date.now() * 0.002 + index) * 0.05;
                crane.scale.setScalar(0.25 * scalePulse);
            } 
            else if (crane.arm) {
                crane.arm.rotation.y = Math.sin(Date.now() * 0.001 + index) * 0.3;
                crane.hook.position.y = 3.5 + Math.sin(Date.now() * 0.003 + index) * 0.4;
                crane.rope.scale.y = 1 - Math.sin(Date.now() * 0.003 + index) * 0.4;
                
                crane.tower.position.y = 2 + Math.sin(Date.now() * 0.001 + index) * 0.15;
                crane.arm.position.y = 4.5 + Math.sin(Date.now() * 0.001 + index) * 0.15;
                crane.counterweight.position.y = 4.5 + Math.sin(Date.now() * 0.001 + index) * 0.15;
            }
        }
        
        if (craneRenderers[index] && craneScenes[index] && craneCameras[index]) {
            craneRenderers[index].render(craneScenes[index], craneCameras[index]);
        }
    });
}

function handleCanvasResize() {
    craneRenderers.forEach((renderer, index) => {
        const canvas = renderer.domElement;
        const container = canvas.parentElement;
        
        if (container && container.clientWidth > 0 && container.clientHeight > 0) {
            const width = container.clientWidth;
            const height = container.clientHeight;
            
            renderer.setSize(width, height);
            
            if (craneCameras[index]) {
                craneCameras[index].aspect = width / height;
                craneCameras[index].updateProjectionMatrix();
            }
        }
    });
}

function generateShapes() {
    const totalShapes = 150;
    
    for (let i = 0; i < totalShapes; i++) {
        const shape = document.createElement('div');
        shape.classList.add('shape');
        
        const isSquare = Math.random() > 0.5;
        const size = 15 + Math.random() * 100;
        
        if (isSquare) {
            shape.style.width = `${size}px`;
            shape.style.height = `${size}px`;
        } else {
            const width = 25 + Math.random() * 120;
            const height = 15 + Math.random() * 80;
            shape.style.width = `${width}px`;
            shape.style.height = `${height}px`;
        }
        
        const leftPosition = Math.random() * 100;
        const topPosition = Math.random() * totalHeight;
        shape.style.left = `${leftPosition}%`;
        shape.style.top = `${topPosition}px`;
        
        shape.style.backgroundColor = shapeColors[Math.floor(Math.random() * shapeColors.length)];
        
        const initialRotation = Math.random() * 360;
        shape.style.transform = `rotate(${initialRotation}deg)`;
        shape.dataset.initialRotation = initialRotation;
        
        shape.style.opacity = 0.6 + Math.random() * 0.4;
        
        const depth = 0.5 + Math.random() * 2;
        shape.dataset.depth = depth;
        
        shape.dataset.originalTop = topPosition;
        
        shapesContainer.appendChild(shape);
    }
}

function handleScroll() {
    const currentScroll = window.scrollY || document.documentElement.scrollTop;
    
    updateScrollPercentage(currentScroll);
    
    animateShapesOnScroll(currentScroll);
    
    updateActiveSections(currentScroll);
    
    showScrollIndicator();
}

function updateScrollPercentage(scrollPos) {
    const percentage = Math.round((scrollPos / maxScroll) * 100);
    scrollPercentage.textContent = `${percentage}%`;
    
    progressBar.style.width = `${percentage}%`;
    
    if (percentage > 10) {
        scrollIndicator.style.opacity = '0';
        scrollIndicator.style.transition = 'opacity 1s ease';
    }
}

function showScrollIndicator() {
    if (!isScrolling) {
        scrollIndicator.style.opacity = '1';
        scrollIndicator.style.transition = 'opacity 0.3s ease';
        
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            scrollIndicator.style.opacity = '0';
            scrollIndicator.style.transition = 'opacity 1s ease';
        }, 1500);
    }
}

function animateShapesOnScroll(scrollPos) {
    const normalizedScroll = scrollPos / maxScroll;
    const shapes = document.querySelectorAll('.shape');
    
    shapes.forEach((shape, shapeIndex) => {
        const depth = parseFloat(shape.dataset.depth);
        const initialRotation = parseFloat(shape.dataset.initialRotation);
        const originalTop = parseFloat(shape.dataset.originalTop);
        
        const shapeViewportPos = (originalTop - scrollPos) / viewportHeight;
        
        const xMove = Math.cos(normalizedScroll * Math.PI * 2 + shapeIndex * 0.1) * 50 * depth;
        const yMove = normalizedScroll * 200 * depth;
        const rotation = initialRotation + normalizedScroll * 360 * depth;
        const scale = 0.7 + Math.sin(normalizedScroll * Math.PI + shapeIndex * 0.05) * 0.3;
        
        shape.style.transform = `translate(${xMove}px, ${yMove}px) rotate(${rotation}deg) scale(${scale})`;
        
        let opacity = 0.6;
        if (shapeViewportPos >= 0 && shapeViewportPos <= 1) {
            opacity = 0.6 + Math.sin(shapeViewportPos * Math.PI) * 0.2;
        } else if (shapeViewportPos > -0.5 && shapeViewportPos < 0) {
            opacity = 0.6 * (shapeViewportPos + 0.5) * 2;
        } else if (shapeViewportPos > 1 && shapeViewportPos < 1.5) {
            opacity = 0.6 * (1.5 - shapeViewportPos) * 2;
        } else {
            opacity = 0.1;
        }
        
        shape.style.opacity = opacity;
    });
}

function updateActiveSections(scrollPos) {
    const currentSectionIndex = Math.floor(scrollPos / viewportHeight);
    
    const safeIndex = Math.min(currentSectionIndex, textSections.length - 1);
    
    textSections.forEach((section, index) => {
        if (index === safeIndex) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });
    
    craneContainers.forEach((container, index) => {
        if (index === safeIndex) {
            container.classList.add('active');
        } else {
            container.classList.remove('active');
        }
    });
}

function handleResize() {
    viewportHeight = window.innerHeight;
    totalHeight = continuousContainer.offsetHeight;
    maxScroll = totalHeight - viewportHeight;
    
    const currentScroll = window.scrollY || document.documentElement.scrollTop;
    updateScrollPercentage(currentScroll);
    updateActiveSections(currentScroll);
    
    handleCanvasResize();
}

function init() {
    window.scrollTo(0, 0);
    
    generateShapes();
    
    initCranes();
    
    animateCranes();
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    const initialScroll = window.scrollY || document.documentElement.scrollTop;
    animateShapesOnScroll(initialScroll);
    updateScrollPercentage(initialScroll);
    updateActiveSections(initialScroll);
    
    setTimeout(handleCanvasResize, 100);
    
    setTimeout(() => {
        scrollIndicator.style.opacity = '0';
        scrollIndicator.style.transition = 'opacity 1s ease';
    }, 5000);
}

init();