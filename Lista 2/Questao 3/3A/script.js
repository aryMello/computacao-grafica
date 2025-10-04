// Configuração do canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const resetBtn = document.getElementById('resetBtn');
const anguloAtualSpan = document.getElementById('anguloAtual');

// Tamanho do canvas
canvas.width = 800;
canvas.height = 800;

// Centro do canvas
const centroX = canvas.width / 2;
const centroY = canvas.height / 2;

// Configurações dos círculos
const raioExterno = 100;
const raioInterno = 25;
const escala = 3; // pixels por unidade

// Raio da órbita do centro do círculo interno
const raioOrbita = raioExterno - raioInterno; // 75 unidades

// Controle de animação
const duracaoVolta = 4000; // 4 segundos em milissegundos
let tempoInicio = null;
let animando = false;

// Ângulo de posição do círculo interno (movimento orbital)
let anguloOrbital = 0;

// Ângulo de rotação do círculo interno (rolamento)
let anguloRotacao = 0;

// Trajetória do ponto marcado
let trajetoria = [];

// Função para desenhar o círculo externo (fixo)
function desenharCirculoExterno() {
    ctx.beginPath();
    ctx.arc(centroX, centroY, raioExterno * escala, 0, Math.PI * 2);
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Preenchimento semi-transparente
    ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
    ctx.fill();
}

// Função para desenhar os eixos
function desenharEixos() {
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    // Eixo X
    ctx.beginPath();
    ctx.moveTo(0, centroY);
    ctx.lineTo(canvas.width, centroY);
    ctx.stroke();
    
    // Eixo Y
    ctx.beginPath();
    ctx.moveTo(centroX, 0);
    ctx.lineTo(centroX, canvas.height);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Labels
    ctx.fillStyle = '#7f8c8d';
    ctx.font = '12px Arial';
    ctx.fillText('X', canvas.width - 25, centroY - 10);
    ctx.fillText('Y', centroX + 10, 20);
}

// Função para desenhar o círculo interno (rolando)
function desenharCirculoInterno() {
    // Calcular posição do centro do círculo interno
    const centroInternoX = centroX + raioOrbita * escala * Math.cos(anguloOrbital);
    const centroInternoY = centroY + raioOrbita * escala * Math.sin(anguloOrbital);
    
    // Desenhar o círculo interno
    ctx.beginPath();
    ctx.arc(centroInternoX, centroInternoY, raioInterno * escala, 0, Math.PI * 2);
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(231, 76, 60, 0.2)';
    ctx.fill();
    
    // Desenhar o centro do círculo interno
    ctx.beginPath();
    ctx.arc(centroInternoX, centroInternoY, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#c0392b';
    ctx.fill();
    
    // Calcular posição do ponto marcado (demonstra o rolamento)
    // O ponto começa na parte "direita" do círculo interno (posição inicial)
    const pontoX = centroInternoX + raioInterno * escala * Math.cos(anguloRotacao);
    const pontoY = centroInternoY + raioInterno * escala * Math.sin(anguloRotacao);
    
    // Desenhar linha do centro ao ponto marcado
    ctx.beginPath();
    ctx.moveTo(centroInternoX, centroInternoY);
    ctx.lineTo(pontoX, pontoY);
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Desenhar o ponto marcado
    ctx.beginPath();
    ctx.arc(pontoX, pontoY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#f39c12';
    ctx.fill();
    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Adicionar à trajetória
    trajetoria.push({ x: pontoX, y: pontoY });
    
    // Limitar tamanho da trajetória
    if (trajetoria.length > 500) {
        trajetoria.shift();
    }
    
    return { pontoX, pontoY };
}

// Função de animação
function animar(timestamp) {
    if (!tempoInicio) {
        tempoInicio = timestamp;
    }
    
    const tempoDecorrido = timestamp - tempoInicio;
    const progresso = (tempoDecorrido % duracaoVolta) / duracaoVolta;
    
    // Atualizar ângulo orbital (movimento anti-horário)
    // Anti-horário = ângulo aumenta no sentido matemático padrão
    anguloOrbital = progresso * 2 * Math.PI;
    
    // Calcular ângulo de rotação do círculo
    // Quando o círculo rola sem deslizar:
    // Distância percorrida = raioOrbita * anguloOrbital
    // Ângulo de rotação = distância / raioInterno
    // Como o círculo rola na PAREDE INTERNA, ele gira no sentido OPOSTO ao movimento orbital
    const circunferenciaOrbita = 2 * Math.PI * raioOrbita;
    const distanciaPercorrida = progresso * circunferenciaOrbita;
    anguloRotacao = -(distanciaPercorrida / raioInterno); // Negativo porque gira ao contrário
    
    // Limpar canvas
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar elementos
    desenharEixos();
    desenharCirculoExterno();
    desenharCirculoInterno();
    
    // Atualizar UI
    const graus = ((anguloOrbital * 180 / Math.PI) % 360).toFixed(1);
    anguloAtualSpan.textContent = graus + '°';
    
    // Continuar animação
    requestAnimationFrame(animar);
}

// Função para reiniciar
function reiniciar() {
    tempoInicio = null;
    anguloOrbital = 0;
    anguloRotacao = 0;
    trajetoria = [];
    
    if (!animando) {
        animando = true;
        requestAnimationFrame(animar);
    }
}

// Event listener do botão
resetBtn.addEventListener('click', reiniciar);

// Desenhar estado inicial
ctx.fillStyle = '#f8f9fa';
ctx.fillRect(0, 0, canvas.width, canvas.height);
desenharEixos();
desenharCirculoExterno();
desenharCirculoInterno();

// Iniciar animação após 1 segundo
setTimeout(() => {
    reiniciar();
}, 1000);