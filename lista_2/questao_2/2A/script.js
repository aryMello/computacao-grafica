// Configuração do canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const resetBtn = document.getElementById('resetBtn');

// Tamanho do canvas
canvas.width = 1200;
canvas.height = 900;

// Configurações do braço
const escala = 80; // Escala para visualização (80 pixels por unidade)
const comprimentoBraco = 2; // unidades
const comprimentoAntebraco = 3; // unidades
const duracaoMovimento = 2000; // 2 segundos em milissegundos

// Ponto de origem (ombro)
const origemX = canvas.width / 2;
const origemY = canvas.height / 2;

// Ângulos (em radianos)
let anguloBraco = -Math.PI / 2; // -90 graus (vertical para cima)
let anguloAntebraco = 0; // Relativo ao braço

// Ângulos finais
const anguloBracoFinal = Math.PI / 6; // 30 graus
const totalRotacaoBraco = anguloBracoFinal - (-Math.PI / 2); // π/6 + π/2 = 2π/3

// Velocidade angular do antebraço é o dobro
const anguloAntebracoFinal = -anguloBracoFinal; // Para que soma dê 0
const totalRotacaoAntebraco = anguloAntebracoFinal - 0; // -π/6

// Variáveis de controle da animação
let tempoInicio = null;
let animando = false;

// Função para desenhar o braço
function desenharBraco() {
    // Limpar canvas
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar grid
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    // Linhas verticais e horizontais
    ctx.beginPath();
    ctx.moveTo(origemX, 0);
    ctx.lineTo(origemX, canvas.height);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, origemY);
    ctx.lineTo(canvas.width, origemY);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Calcular posição do cotovelo
    const cotoveloX = origemX + Math.cos(anguloBraco) * comprimentoBraco * escala;
    const cotoveloY = origemY + Math.sin(anguloBraco) * comprimentoBraco * escala;
    
    // Calcular ângulo absoluto do antebraço
    const anguloAntebracoAbsoluto = anguloBraco + anguloAntebraco;
    
    // Calcular posição da mão
    const maoX = cotoveloX + Math.cos(anguloAntebracoAbsoluto) * comprimentoAntebraco * escala;
    const maoY = cotoveloY + Math.sin(anguloAntebracoAbsoluto) * comprimentoAntebraco * escala;
    
    // Desenhar braço (ombro até cotovelo)
    ctx.beginPath();
    ctx.moveTo(origemX, origemY);
    ctx.lineTo(cotoveloX, cotoveloY);
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // Desenhar antebraço (cotovelo até mão)
    ctx.beginPath();
    ctx.moveTo(cotoveloX, cotoveloY);
    ctx.lineTo(maoX, maoY);
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // Desenhar articulações
    // Ombro
    ctx.beginPath();
    ctx.arc(origemX, origemY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#2c3e50';
    ctx.fill();
    
    // Cotovelo
    ctx.beginPath();
    ctx.arc(cotoveloX, cotoveloY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#2c3e50';
    ctx.fill();
    
    // Mão
    ctx.beginPath();
    ctx.arc(maoX, maoY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#2c3e50';
    ctx.fill();
    
    // Desenhar labels
    ctx.fillStyle = '#2c3e50';
    ctx.font = '14px Arial';
    ctx.fillText('Ombro', origemX + 15, origemY - 10);
    ctx.fillText('Cotovelo', cotoveloX + 15, cotoveloY - 10);
    ctx.fillText('Mão', maoX + 15, maoY - 10);
    
    // Mostrar ângulos
    ctx.fillStyle = '#7f8c8d';
    ctx.font = '12px Arial';
    const anguloBracoGraus = (anguloBraco * 180 / Math.PI).toFixed(1);
    const anguloAntebracoGraus = (anguloAntebracoAbsoluto * 180 / Math.PI).toFixed(1);
    ctx.fillText(`Ângulo Braço: ${anguloBracoGraus}°`, 20, 30);
    ctx.fillText(`Ângulo Antebraço: ${anguloAntebracoGraus}°`, 20, 50);
}

// Função de animação
function animar(timestamp) {
    if (!tempoInicio) {
        tempoInicio = timestamp;
    }
    
    const tempoDecorrido = timestamp - tempoInicio;
    const progresso = Math.min(tempoDecorrido / duracaoMovimento, 1);
    
    if (progresso < 1) {
        // Interpolar ângulos
        anguloBraco = -Math.PI / 2 + totalRotacaoBraco * progresso;
        anguloAntebraco = 0 + totalRotacaoAntebraco * progresso;
        
        desenharBraco();
        requestAnimationFrame(animar);
    } else {
        // Movimento finalizado
        anguloBraco = anguloBracoFinal;
        anguloAntebraco = totalRotacaoAntebraco;
        desenharBraco();
        animando = false;
    }
}

// Função para reiniciar o movimento
function reiniciar() {
    anguloBraco = -Math.PI / 2;
    anguloAntebraco = 0;
    tempoInicio = null;
    
    if (!animando) {
        animando = true;
        requestAnimationFrame(animar);
    }
}

// Event listener do botão
resetBtn.addEventListener('click', reiniciar);

// Desenhar estado inicial e iniciar animação
desenharBraco();
setTimeout(() => {
    reiniciar();
}, 500);