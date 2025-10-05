// Variáveis da cena Three.js
let scene, camera, renderer;
let circuloMaior, circuloMenor, pontoMarcado;
let quadrado;
let anguloOrbital = 0;
let anguloRotacao = 0;
let animando = true;
let tempoInicio = Date.now();

// Configurações
const raioMaior = 100;
const raioMenor = 25;
const inclinacaoGraus = 60;
const inclinacaoRad = (inclinacaoGraus * Math.PI) / 180;
const duracaoVolta = 8000; // 8 segundos para uma volta completa

// Referências UI
const anguloAtualSpan = document.getElementById('anguloAtual');
const resetBtn = document.getElementById('resetBtn');
const pauseBtn = document.getElementById('pauseBtn');

// Inicializar cena
function init() {
    // Criar cena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    
    // Criar câmera
    const container = document.getElementById('canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    camera.position.set(250, 200, 250);
    camera.lookAt(0, 0, 0);
    
    // Criar renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    
    // Adicionar luzes
    const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(luzAmbiente);
    
    const luzDirecional = new THREE.DirectionalLight(0xffffff, 0.8);
    luzDirecional.position.set(100, 200, 100);
    scene.add(luzDirecional);
    
    // Criar eixos de referência
    const axesHelper = new THREE.AxesHelper(150);
    scene.add(axesHelper);
    
    // Criar grade no chão
    const gridHelper = new THREE.GridHelper(400, 20, 0x444444, 0x222222);
    scene.add(gridHelper);
    
    // Criar círculo maior (inclinado 60° no eixo X)
    criarCirculoMaior();
    
    // Criar quadrado circunscrito
    criarQuadradoCircunscrito();
    
    // Criar círculo menor
    criarCirculoMenor();
    
    // Criar ponto marcado
    criarPontoMarcado();
    
    // Event listeners
    resetBtn.addEventListener('click', reiniciar);
    pauseBtn.addEventListener('click', togglePausa);
    
    // Ajustar ao redimensionar
    window.addEventListener('resize', onWindowResize);
}

// Criar círculo maior inclinado
function criarCirculoMaior() {
    const geometria = new THREE.RingGeometry(raioMaior - 2, raioMaior + 2, 64);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0x3498db, 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
    });
    circuloMaior = new THREE.Mesh(geometria, material);
    
    // Rotacionar 60° no eixo X
    circuloMaior.rotation.x = inclinacaoRad;
    
    scene.add(circuloMaior);
    
    // Adicionar plano semi-transparente para visualizar melhor
    const geometriaPlano = new THREE.CircleGeometry(raioMaior, 64);
    const materialPlano = new THREE.MeshBasicMaterial({ 
        color: 0x3498db, 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.2
    });
    const plano = new THREE.Mesh(geometriaPlano, materialPlano);
    plano.rotation.x = inclinacaoRad;
    scene.add(plano);
}

// Criar quadrado circunscrito
function criarQuadradoCircunscrito() {
    const tamanhoQuadrado = raioMaior * 2;
    const geometria = new THREE.EdgesGeometry(
        new THREE.PlaneGeometry(tamanhoQuadrado, tamanhoQuadrado)
    );
    const material = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
    quadrado = new THREE.LineSegments(geometria, material);
    
    // Rotacionar junto com o círculo maior
    quadrado.rotation.x = inclinacaoRad;
    
    scene.add(quadrado);
}

// Criar círculo menor
function criarCirculoMenor() {
    const geometria = new THREE.TorusGeometry(raioMenor, 2, 16, 64);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0xe74c3c,
        metalness: 0.3,
        roughness: 0.4
    });
    circuloMenor = new THREE.Mesh(geometria, material);
    
    scene.add(circuloMenor);
}

// Criar ponto marcado
function criarPontoMarcado() {
    const geometria = new THREE.SphereGeometry(5, 16, 16);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0xf39c12,
        emissive: 0xf39c12,
        emissiveIntensity: 0.5
    });
    pontoMarcado = new THREE.Mesh(geometria, material);
    
    scene.add(pontoMarcado);
}

// Atualizar posições
function atualizar() {
    if (!animando) return;
    
    const tempoAtual = Date.now();
    const tempoDecorrido = tempoAtual - tempoInicio;
    const progresso = (tempoDecorrido % duracaoVolta) / duracaoVolta;
    
    // Ângulo orbital (movimento ao redor do círculo maior)
    anguloOrbital = progresso * 2 * Math.PI;
    
    // Calcular ângulo de rotação (rolamento sem deslizar)
    const circunferenciaMaior = 2 * Math.PI * raioMaior;
    const distanciaPercorrida = progresso * circunferenciaMaior;
    anguloRotacao = distanciaPercorrida / raioMenor;
    
    // Posição do centro do círculo menor no plano inclinado
    const x = raioMaior * Math.cos(anguloOrbital);
    const y = raioMaior * Math.sin(anguloOrbital) * Math.cos(inclinacaoRad);
    const z = raioMaior * Math.sin(anguloOrbital) * Math.sin(inclinacaoRad);
    
    circuloMenor.position.set(x, y, z);
    
    // Orientar o círculo menor perpendicular ao plano inclinado
    circuloMenor.rotation.y = anguloOrbital + Math.PI / 2;
    circuloMenor.rotation.x = inclinacaoRad;
    
    // Aplicar rotação de rolamento
    circuloMenor.rotation.z = -anguloRotacao;
    
    // Posição do ponto marcado (no "topo" do círculo menor inicialmente)
    const pontoLocalX = 0;
    const pontoLocalY = raioMenor * Math.cos(anguloRotacao);
    const pontoLocalZ = raioMenor * Math.sin(anguloRotacao);
    
    // Transformar para coordenadas globais
    const pontoLocal = new THREE.Vector3(pontoLocalX, pontoLocalY, pontoLocalZ);
    pontoLocal.applyEuler(new THREE.Euler(inclinacaoRad, anguloOrbital + Math.PI / 2, -anguloRotacao, 'XYZ'));
    pontoLocal.add(new THREE.Vector3(x, y, z));
    
    pontoMarcado.position.copy(pontoLocal);
    
    // Atualizar UI
    const graus = ((anguloOrbital * 180 / Math.PI) % 360).toFixed(1);
    anguloAtualSpan.textContent = graus + '°';
    
    // Rotação suave da câmera
    const tempoCamera = tempoAtual * 0.0001;
    camera.position.x = 250 * Math.cos(tempoCamera);
    camera.position.z = 250 * Math.sin(tempoCamera);
    camera.lookAt(0, 0, 0);
}

// Função de animação
function animate() {
    requestAnimationFrame(animate);
    atualizar();
    renderer.render(scene, camera);
}

// Reiniciar animação
function reiniciar() {
    tempoInicio = Date.now();
    anguloOrbital = 0;
    anguloRotacao = 0;
    animando = true;
    pauseBtn.textContent = 'Pausar';
}

// Pausar/Continuar
function togglePausa() {
    animando = !animando;
    if (animando) {
        tempoInicio = Date.now() - (anguloOrbital / (2 * Math.PI)) * duracaoVolta;
        pauseBtn.textContent = 'Pausar';
    } else {
        pauseBtn.textContent = 'Continuar';
    }
}

// Redimensionar
function onWindowResize() {
    const container = document.getElementById('canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// Iniciar
init();
animate();