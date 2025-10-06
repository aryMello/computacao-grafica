// VARIÁVEIS GLOBAIS
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        const t = 8; // tempo total em segundos
        let currentTime = 0;
        let isAnimating = false;
        let animationId = null;
        let lastFrameTime = 0;
        
        // Eixos
        const ponto_r = [1, 2, 0];
        const direcao_r = [1, -1, 0];
        const ponto_s = [2, 1, 0];
        const direcao_s = [0, 0, 1];
        
        // FUNÇÕES DE MATEMÁTICA
        function normalize(vec) {
            const len = Math.sqrt(vec[0]*vec[0] + vec[1]*vec[1] + vec[2]*vec[2]);
            return [vec[0]/len, vec[1]/len, vec[2]/len];
        }
        
        function matrixMultiply(A, B) {
            const result = Array(4).fill(0).map(() => Array(4).fill(0));
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) {
                    for (let k = 0; k < 4; k++) {
                        result[i][j] += A[i][k] * B[k][j];
                    }
                }
            }
            return result;
        }
        
        function rotacaoEixo(eixo, angulo) {
            const axis = normalize(eixo);
            const [x, y, z] = axis;
            const c = Math.cos(angulo);
            const s = Math.sin(angulo);
            
            return [
                [c + x*x*(1-c), x*y*(1-c) - z*s, x*z*(1-c) + y*s, 0],
                [y*x*(1-c) + z*s, c + y*y*(1-c), y*z*(1-c) - x*s, 0],
                [z*x*(1-c) - y*s, z*y*(1-c) + x*s, c + z*z*(1-c), 0],
                [0, 0, 0, 1]
            ];
        }
        
        function operadorAfim(R, trans) {
            const M = Array(4).fill(0).map(() => Array(4).fill(0));
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    M[i][j] = R[i][j];
                }
                M[i][3] = trans[i];
            }
            M[3][3] = 1;
            return M;
        }
        
        function calcularT1(tempo) {
            const angulo = 4 * 2 * Math.PI * tempo / t;
            const R = rotacaoEixo(direcao_r, angulo);
            
            // Translação para rotação em torno de ponto_r
            const rotPoint = [
                R[0][0]*ponto_r[0] + R[0][1]*ponto_r[1] + R[0][2]*ponto_r[2],
                R[1][0]*ponto_r[0] + R[1][1]*ponto_r[1] + R[1][2]*ponto_r[2],
                R[2][0]*ponto_r[0] + R[2][1]*ponto_r[1] + R[2][2]*ponto_r[2]
            ];
            const trans = [
                ponto_r[0] - rotPoint[0],
                ponto_r[1] - rotPoint[1],
                ponto_r[2] - rotPoint[2]
            ];
            
            return operadorAfim(R, trans);
        }
        
        function calcularT2(tempo) {
            const angulo = 2 * Math.PI * tempo / t;
            const R = rotacaoEixo(direcao_s, angulo);
            
            const rotPoint = [
                R[0][0]*ponto_s[0] + R[0][1]*ponto_s[1] + R[0][2]*ponto_s[2],
                R[1][0]*ponto_s[0] + R[1][1]*ponto_s[1] + R[1][2]*ponto_s[2],
                R[2][0]*ponto_s[0] + R[2][1]*ponto_s[1] + R[2][2]*ponto_s[2]
            ];
            const trans = [
                ponto_s[0] - rotPoint[0],
                ponto_s[1] - rotPoint[1],
                ponto_s[2] - rotPoint[2]
            ];
            
            return operadorAfim(R, trans);
        }
        
        function aplicarMatriz(M, ponto) {
            const p = [ponto[0], ponto[1], ponto[2], 1];
            return [
                M[0][0]*p[0] + M[0][1]*p[1] + M[0][2]*p[2] + M[0][3]*p[3],
                M[1][0]*p[0] + M[1][1]*p[1] + M[1][2]*p[2] + M[1][3]*p[3],
                M[2][0]*p[0] + M[2][1]*p[1] + M[2][2]*p[2] + M[2][3]*p[3]
            ];
        }
        
        // CRIAR PIÃO
        function criarPiao() {
            const pontos = [[0, 0, 0]]; // bico
            const raio = 0.3;
            const altura = 0.5;
            
            for (let i = 0; i < 20; i++) {
                const ang = 2 * Math.PI * i / 20;
                pontos.push([
                    raio * Math.cos(ang),
                    raio * Math.sin(ang),
                    altura
                ]);
            }
            
            pontos.push([raio, 0, altura]); // marcador vermelho
            return pontos;
        }
        
        const piaoBase = criarPiao();
        
        // Transladar pião para posição inicial (bico em 1,2,0)
        const piaoInicial = piaoBase.map(p => [p[0] + 1, p[1] + 2, p[2]]);
        
        // PROJEÇÃO 3D
        function project3D(point) {
            const scale = 60;
            const distance = 6;
            
            // Centralizar em torno do ponto médio entre os eixos
            const offsetX = -1.5; // offset para centralizar melhor
            const offsetY = -1.5;
            
            const factor = distance / (distance + point[2]);
            const x2d = canvas.width / 2 + (point[0] + offsetX) * scale * factor;
            const y2d = canvas.height / 2 - (point[1] + offsetY) * scale * factor;
            return [x2d, y2d, factor];
        }
        
        // DESENHAR
        function desenharEixos(T2) {
            ctx.strokeStyle = '#95a5a6';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            
            // Eixo r (rotacionado por T2)
            const eixoR = [];
            for (let q = -2; q <= 4; q += 0.5) {
                const p = [1 + q, 2 - q, 0];
                eixoR.push(aplicarMatriz(T2, p));
            }
            ctx.strokeStyle = '#2ecc71';
            ctx.beginPath();
            const p0 = project3D(eixoR[0]);
            ctx.moveTo(p0[0], p0[1]);
            for (let i = 1; i < eixoR.length; i++) {
                const p = project3D(eixoR[i]);
                ctx.lineTo(p[0], p[1]);
            }
            ctx.stroke();
            
            // Eixo s (fixo)
            ctx.strokeStyle = '#e74c3c';
            ctx.beginPath();
            const s1 = project3D([2, 1, -2]);
            const s2 = project3D([2, 1, 3]);
            ctx.moveTo(s1[0], s1[1]);
            ctx.lineTo(s2[0], s2[1]);
            ctx.stroke();
            
            ctx.setLineDash([]);
        }
        
        function desenharPiao(pontos) {
            const proj = pontos.map(p => project3D(p));
            
            // Linhas do bico para base
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 2;
            for (let i = 1; i <= 20; i++) {
                ctx.beginPath();
                ctx.moveTo(proj[0][0], proj[0][1]);
                ctx.lineTo(proj[i][0], proj[i][1]);
                ctx.stroke();
            }
            
            // Base circular
            ctx.strokeStyle = '#2980b9';
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let i = 1; i <= 20; i++) {
                const j = i === 20 ? 1 : i + 1;
                ctx.moveTo(proj[i][0], proj[i][1]);
                ctx.lineTo(proj[j][0], proj[j][1]);
            }
            ctx.stroke();
            
            // Bico (verde)
            ctx.fillStyle = '#27ae60';
            ctx.beginPath();
            ctx.arc(proj[0][0], proj[0][1], 6, 0, 2*Math.PI);
            ctx.fill();
            
            // Marcador vermelho
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(proj[21][0], proj[21][1], 8, 0, 2*Math.PI);
            ctx.fill();
        }
        
        function desenharFrame() {
            const T1 = calcularT1(currentTime);
            const T2 = calcularT2(currentTime);
            const M = matrixMultiply(T2, T1);
            
            const piaoTransformado = piaoInicial.map(p => aplicarMatriz(M, p));
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            desenharEixos(T2);
            desenharPiao(piaoTransformado);
            
            // Atualizar coordenadas
            const bico = piaoTransformado[0];
            const marker = piaoTransformado[21];
            document.getElementById('pointBico').textContent = 
                `(${bico[0].toFixed(2)}, ${bico[1].toFixed(2)}, ${bico[2].toFixed(2)})`;
            document.getElementById('pointMarker').textContent = 
                `(${marker[0].toFixed(2)}, ${marker[1].toFixed(2)}, ${marker[2].toFixed(2)})`;
            
            // Atualizar status
            document.getElementById('status').textContent = 
                `Tempo: ${currentTime.toFixed(2)}s / ${t.toFixed(2)}s | ${isAnimating ? 'Animando...' : 'Pausado'}`;
            
            // Atualizar matrizes se visível
            if (document.getElementById('matrixDisplay').classList.contains('show')) {
                atualizarMatrizes(T1, T2, M);
            }
        }
        
        function atualizarMatrizes(T1, T2, M) {
            let html = '<strong>T1 (rotação em r - 4 voltas):</strong>\n';
            html += formatMatrix(T1);
            html += '\n<strong>T2 (rotação em s - 1 volta):</strong>\n';
            html += formatMatrix(T2);
            html += '\n<strong>M = T2 × T1 (matriz final):</strong>\n';
            html += formatMatrix(M);
            document.getElementById('matrixContent').innerHTML = html;
        }
        
        function formatMatrix(M) {
            let str = '';
            for (let i = 0; i < 4; i++) {
                str += '[ ';
                for (let j = 0; j < 4; j++) {
                    str += M[i][j].toFixed(4).padStart(8) + ' ';
                }
                str += ']\n';
            }
            return str;
        }
        
        // ANIMAÇÃO
        function animate(timestamp) {
            if (!isAnimating) return;
            
            if (lastFrameTime === 0) {
                lastFrameTime = timestamp;
            }
            
            const deltaTime = (timestamp - lastFrameTime) / 1000;
            lastFrameTime = timestamp;
            
            currentTime += deltaTime;
            
            if (currentTime >= t) {
                currentTime = t;
                isAnimating = false;
                document.getElementById('btnPlay').disabled = false;
                document.getElementById('btnPause').disabled = true;
            }
            
            desenharFrame();
            
            if (isAnimating) {
                animationId = requestAnimationFrame(animate);
            }
        }
        
        // CONTROLES
        function startAnimation() {
            if (!isAnimating) {
                isAnimating = true;
                lastFrameTime = 0;
                document.getElementById('btnPlay').disabled = true;
                document.getElementById('btnPause').disabled = false;
                animationId = requestAnimationFrame(animate);
            }
        }
        
        function pauseAnimation() {
            isAnimating = false;
            lastFrameTime = 0;
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            document.getElementById('btnPlay').disabled = false;
            document.getElementById('btnPause').disabled = true;
        }
        
        function resetAnimation() {
            pauseAnimation();
            currentTime = 0;
            desenharFrame();
        }
        
        function toggleMatrix() {
            const display = document.getElementById('matrixDisplay');
            display.classList.toggle('show');
            if (display.classList.contains('show')) {
                const T1 = calcularT1(currentTime);
                const T2 = calcularT2(currentTime);
                const M = matrixMultiply(T2, T1);
                atualizarMatrizes(T1, T2, M);
            }
        }
        
        // INICIALIZAÇÃO
        desenharFrame();