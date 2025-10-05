// Configuração do canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Tamanho do canvas
canvas.width = 800;
canvas.height = 600;

// Propriedades da bola
const raio = 30;
let x = raio; // Começa no canto inferior esquerdo
let y = canvas.height - raio;
let vx = 0; // Velocidade horizontal inicial
let vy = -10; // Velocidade vertical inicial (negativa = pra cima)
const gravidade = 0.5;

// Calcular velocidade horizontal para período de 4 segundos
const distanciaHorizontal = canvas.width - 2 * raio;
const tempoTotal = 240; // frames (4 segundos a 60fps)
vx = (distanciaHorizontal * 2) / tempoTotal; // multiplicado por 2 para ida e volta

// Função para desenhar a bola
function desenharBola() {
    ctx.beginPath();
    ctx.arc(x, y, raio, 0, Math.PI * 2);
    
    // Gradiente para a bola
    const gradient = ctx.createRadialGradient(x - 10, y - 10, 5, x, y, raio);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(1, '#ee5a6f');
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Brilho na bola
    ctx.beginPath();
    ctx.arc(x - 8, y - 8, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
}

// Função para atualizar a posição da bola
function atualizar() {
    // Aplicar gravidade
    vy += gravidade;
    
    // Atualizar posição
    x += vx;
    y += vy;
    
    // Colisão com o chão
    if (y + raio > canvas.height) {
        y = canvas.height - raio;
        vy = -vy; // Inverte velocidade vertical (colisão elástica)
    }
    
    // Colisão com o teto
    if (y - raio < 0) {
        y = raio;
        vy = -vy;
    }
    
    // Colisão com a parede direita
    if (x + raio > canvas.width) {
        x = canvas.width - raio;
        vx = -vx; // Inverte velocidade horizontal (colisão elástica)
    }
    
    // Colisão com a parede esquerda
    if (x - raio < 0) {
        x = raio;
        vx = -vx;
    }
}

// Função de animação
function animar() {
    // Limpar canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar grade de fundo
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
    
    // Atualizar e desenhar bola
    atualizar();
    desenharBola();
    
    // Continuar animação
    requestAnimationFrame(animar);
}

// Iniciar animação
animar();