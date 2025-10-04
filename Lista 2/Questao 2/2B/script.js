// Configuração do canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const resetBtn = document.getElementById('resetBtn');
const raioAtualSpan = document.getElementById('raioAtual');
const semicirculoAtualSpan = document.getElementById('semicirculoAtual');

// Tamanho do canvas
canvas.width = 900;
canvas.height = 700;

// Configurações da animação
const centroCanvasX = canvas.width / 2;
const centroCanvasY = canvas.height / 2;
const escala = 2; // pixels por unidade

// Configurações da espiral
let raioInicial = 20;
let raioAtual = raioInicial;
let centroX = 0; // Centro sempre no eixo OX
let angulo = Math.PI; // Começa em 180 graus (ponto -20, 0)
let semicirculoAtual = 1;
let direcao = 1; // 1 para cima (anti-horário), -1 para baixo

// Controle de tempo
const duracaoSemicirculo = 4000; // 4 segundos
let tempoInicio = null;
let animando = false;

// Array para armazenar o caminho percorrido
let caminho = [];

// Função para converter coordenadas do mundo para canvas
function mundoParaCanvas(x, y) {
    return {
        x: centroCanvasX + x * escala,
        y: centroCanvasY - y * escala // Inverte Y para convenção matemática
    };
}

// Função para desenhar os eixos
function desenharEixos() {
    ctx.strokeStyle = '#95a5a6';
    ctx.lineWidth = 2;
    
    // Eixo X
    ctx.beginPath();
    ctx.moveTo(0, centroCanvasY);
    ctx.lineTo(canvas.width, centroCanvasY);
    ctx.stroke();
    
    // Eixo Y
    ctx.beginPath();
    ctx.moveTo(centroCanvasX, 0);
    ctx.lineTo(centroCanvasX, canvas.height);
    ctx.stroke();
    
    // Labels dos eixos
    ctx.fillStyle = '#2c3e50';
    ctx.font = '14px Arial';
    ctx.fillText('X', canvas.width - 30, centroCanvasY - 10);
    ctx.fillText('Y', centroCanvasX + 10, 20);
    ctx.fillText('O', centroCanvasX + 10, centroCanvasY - 10);
}

// Função para desenhar o caminho percorrido
function desenharCaminho() {
    if (caminho.length < 2) return;
    
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const primeiroPonto = mundoParaCanvas(caminho[0].x, caminho[0].y);
    ctx.moveTo(primeiroPonto.x, primeiroPonto.y);
    
    for (let i = 1; i < caminho.length; i++) {
        const ponto = mundoParaCanvas(caminho[i].x, caminho[i].y);
        ctx.lineTo(ponto.x, ponto.y);
    }
    
    ctx.stroke();
}

// Função para desenhar a partícula
function desenharParticula(x, y) {
    const pos = mundoParaCanvas(x, y);
    
    // Partícula com glow
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#e74c3c';
    ctx.fill();
    
    // Glow effect
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(231, 76, 60, 0.3)';
    ctx.lineWidth = 4;
    ctx.stroke();
}

// Função para desenhar o semicírculo atual (guia)
function desenharSemicirculoGuia() {
    const centro = mundoParaCanvas(centroX, 0);
    
    ctx.strokeStyle = 'rgba(149, 165, 166, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    if (direcao === 1) {
        // Semicírculo superior
        ctx.arc(centro.x, centro.y, raioAtual * escala, Math.PI, 0, false);
    } else {
        // Semicírculo inferior
        ctx.arc(centro.x, centro.y, raioAtual * escala, 0, Math.PI, false);
    }
    ctx.stroke();
    
    ctx.setLineDash([]);
}

// Função para atualizar a posição da partícula
function atualizar(timestamp) {
    if (!tempoInicio) {
        tempoInicio = timestamp;
    }
    
    const tempoDecorrido = timestamp - tempoInicio;
    const progresso = Math.min(tempoDecorrido / duracaoSemicirculo, 1);
    
    // Calcular ângulo atual no semicírculo
    if (direcao === 1) {
        // Anti-horário (de π para 0)
        angulo = Math.PI - progresso * Math.PI;
    } else {
        // Horário (de 0 para -π)
        angulo = -progresso * Math.PI;
    }
    
    // Calcular posição da partícula
    const x = centroX + raioAtual * Math.cos(angulo);
    const y = raioAtual * Math.sin(angulo);
    
    // Adicionar ao caminho
    caminho.push({ x, y });
    
    // Limpar e redesenhar
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    desenharEixos();
    desenharSemicirculoGuia();
    desenharCaminho();
    desenharParticula(x, y);
    
    // Verificar se completou o semicírculo
    if (progresso >= 1) {
        // Passar para o próximo semicírculo
        semicirculoAtual++;
        direcao *= -1; // Inverter direção
        
        // Atualizar centro e dobrar o raio
        centroX = x; // Novo centro onde a partícula parou
        raioAtual *= 2; // Dobrar o raio
        
        // Resetar tempo
        tempoInicio = null;
        
        // Atualizar UI
        raioAtualSpan.textContent = raioAtual;
        semicirculoAtualSpan.textContent = semicirculoAtual;
        
        // Continuar animação se o raio ainda couber na tela
        if (raioAtual * escala < canvas.width / 2) {
            requestAnimationFrame(atualizar);
        } else {
            animando = false;
        }
    } else {
        requestAnimationFrame(atualizar);
    }
}

// Função para reiniciar a animação
function reiniciar() {
    raioAtual = raioInicial;
    centroX = 0;
    angulo = Math.PI;
    semicirculoAtual = 1;
    direcao = 1;
    tempoInicio = null;
    caminho = [];
    
    // Adicionar ponto inicial
    caminho.push({ x: -raioInicial, y: 0 });
    
    // Atualizar UI
    raioAtualSpan.textContent = raioAtual;
    semicirculoAtualSpan.textContent = semicirculoAtual;
    
    // Limpar canvas
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    desenharEixos();
    desenharSemicirculoGuia();
    desenharParticula(-raioInicial, 0);
    
    if (!animando) {
        animando = true;
        requestAnimationFrame(atualizar);
    }
}

// Event listener do botão
resetBtn.addEventListener('click', reiniciar);

// Desenhar estado inicial
desenharEixos();
desenharSemicirculoGuia();
desenharParticula(-raioInicial, 0);
caminho.push({ x: -raioInicial, y: 0 });

// Iniciar animação após 1 segundo
setTimeout(() => {
    reiniciar();
}, 1000);