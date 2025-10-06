const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        let isAnimating = false;
        let animationId = null;
        let angulo = 0; // ângulo da hélice
        let reflexoes = 0;
        let lastPlane = null; // para evitar reflexões repetidas
        
        // DEFINIÇÕES DOS PLANOS E EIXOS
        
        // Plano A: -2x + y - z = 1
        const planoA = {
            normal: [-2, 1, -1],
            d: 1,
            cor: '#3498db'
        };
        
        // Plano B: y + z = 1
        const planoB = {
            normal: [0, 1, 1],
            d: 1,
            cor: '#2ecc71'
        };
        
        // Plano C: reflexão
        // Ponto P0 = (0, 1, 0)
        // v1 = (-2, 4, -2), v2 = (-1, -1, 1)
        // Normal = v1 × v2 = (2, 4, 6) normalizado
        const planoC = {
            p0: [0, 1, 0],
            normal: normalize([2, 4, 6])
        };
        
        // Eixo D: (-t, 1-t, t) -> direção (-1, -1, 1)
        const eixoD = {
            ponto: [0, 1, 0],
            direcao: normalize([-1, -1, 1])
        };
        
        // FUNÇÕES MATEMÁTICAS
        
        function normalize(v) {
            const len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
            return [v[0]/len, v[1]/len, v[2]/len];
        }
        
        function dot(a, b) {
            return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
        }
        
        // MATRIZ DE ROTAÇÃO EM TORNO DE EIXO
        function matrizRotacao(eixo, ang) {
            const [x, y, z] = eixo;
            const c = Math.cos(ang);
            const s = Math.sin(ang);
            
            return [
                [c + x*x*(1-c), x*y*(1-c) - z*s, x*z*(1-c) + y*s, 0],
                [y*x*(1-c) + z*s, c + y*y*(1-c), y*z*(1-c) - x*s, 0],
                [z*x*(1-c) - y*s, z*y*(1-c) + x*s, c + z*z*(1-c), 0],
                [0, 0, 0, 1]
            ];
        }
        
        // OPERADOR HELICOIDAL
        function operadorHelicoidal(ang) {
            const R = matrizRotacao(eixoD.direcao, ang);
            
            // Translação helicoidal: h = (2/2π) * ang = ang/π
            const h = ang / Math.PI;
            const trans = [
                eixoD.ponto[0] + h * eixoD.direcao[0],
                eixoD.ponto[1] + h * eixoD.direcao[1],
                eixoD.ponto[2] + h * eixoD.direcao[2]
            ];
            
            // Ajustar translação para rotação em torno do ponto
            const rotPoint = [
                R[0][0]*eixoD.ponto[0] + R[0][1]*eixoD.ponto[1] + R[0][2]*eixoD.ponto[2],
                R[1][0]*eixoD.ponto[0] + R[1][1]*eixoD.ponto[1] + R[1][2]*eixoD.ponto[2],
                R[2][0]*eixoD.ponto[0] + R[2][1]*eixoD.ponto[1] + R[2][2]*eixoD.ponto[2]
            ];
            
            const finalTrans = [
                trans[0] - rotPoint[0] + eixoD.ponto[0],
                trans[1] - rotPoint[1] + eixoD.ponto[1],
                trans[2] - rotPoint[2] + eixoD.ponto[2]
            ];
            
            R[0][3] = finalTrans[0];
            R[1][3] = finalTrans[1];
            R[2][3] = finalTrans[2];
            
            return R;
        }
        
        // OPERADOR DE REFLEXÃO NO PLANO C
        function operadorReflexao() {
            const n = planoC.normal;
            const p0 = planoC.p0;
            
            // Matriz de reflexão: I - 2*n*n^T
            const R = [
                [1 - 2*n[0]*n[0], -2*n[0]*n[1], -2*n[0]*n[2], 0],
                [-2*n[1]*n[0], 1 - 2*n[1]*n[1], -2*n[1]*n[2], 0],
                [-2*n[2]*n[0], -2*n[2]*n[1], 1 - 2*n[2]*n[2], 0],
                [0, 0, 0, 1]
            ];
            
            // Ajustar translação para reflexão em torno do plano que passa por p0
            const d = 2 * dot(n, p0);
            R[0][3] = d * n[0];
            R[1][3] = d * n[1];
            R[2][3] = d * n[2];
            
            return R;
        }
        
        // MULTIPLICAÇÃO DE MATRIZES
        function multMatriz(A, B) {
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
        
        // APLICAR MATRIZ NO PONTO
        function aplicarMatriz(M, p) {
            return [
                M[0][0]*p[0] + M[0][1]*p[1] + M[0][2]*p[2] + M[0][3],
                M[1][0]*p[0] + M[1][1]*p[1] + M[1][2]*p[2] + M[1][3],
                M[2][0]*p[0] + M[2][1]*p[1] + M[2][2]*p[2] + M[2][3]
            ];
        }
        
        // VERIFICAR CRUZAMENTO COM PLANO
        function cruzaPlano(p1, p2, plano) {
            const val1 = dot(plano.normal, p1) - plano.d;
            const val2 = dot(plano.normal, p2) - plano.d;
            return (val1 * val2) < 0; // sinais opostos = cruzou
        }
        
        // CRIAR SERPENTE
        function criarSerpente() {
            const pontos = [];
            const numSegmentos = 30;
            const comprimento = 3;
            
            for (let i = 0; i < numSegmentos; i++) {
                const t = (i / numSegmentos) * comprimento;
                pontos.push([0, 1 + t, 0]);
            }
            return pontos;
        }
        
        let serpente = criarSerpente();
        let serpenteTransformada = [...serpente];
        let matrizAcumulada = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]; // identidade
        
        // PROJEÇÃO 3D
        function project3D(point) {
            const scale = 50;
            const distance = 8;
            const offsetX = 0;
            const offsetY = -1.5;
            
            const factor = distance / (distance + point[2]);
            const x2d = canvas.width / 2 + (point[0] + offsetX) * scale * factor;
            const y2d = canvas.height / 2 - (point[1] + offsetY) * scale * factor;
            return [x2d, y2d];
        }
        
        // DESENHAR PLANO (simplificado)
        function desenharPlano(plano, label) {
            ctx.strokeStyle = plano.cor;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.globalAlpha = 0.4;
            
            // Desenhar linha representando o plano
            const pontos = [];
            for (let x = -3; x <= 3; x += 0.5) {
                for (let y = -1; y <= 4; y += 0.5) {
                    // Resolver para z: plano.normal · (x,y,z) = plano.d
                    if (plano.normal[2] !== 0) {
                        const z = (plano.d - plano.normal[0]*x - plano.normal[1]*y) / plano.normal[2];
                        if (Math.abs(z) < 3) {
                            pontos.push([x, y, z]);
                        }
                    }
                }
            }
            
            if (pontos.length > 0) {
                ctx.beginPath();
                const p0 = project3D(pontos[0]);
                ctx.moveTo(p0[0], p0[1]);
                pontos.forEach(p => {
                    const proj = project3D(p);
                    ctx.lineTo(proj[0], proj[1]);
                });
                ctx.stroke();
            }
            
            ctx.globalAlpha = 1;
            ctx.setLineDash([]);
        }
        
        // DESENHAR EIXO D
        function desenharEixoD() {
            ctx.strokeStyle = '#9b59b6';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            
            const p1 = [3, -2, -3];
            const p2 = [-3, 4, 3];
            const proj1 = project3D(p1);
            const proj2 = project3D(p2);
            
            ctx.beginPath();
            ctx.moveTo(proj1[0], proj1[1]);
            ctx.lineTo(proj2[0], proj2[1]);
            ctx.stroke();
            
            ctx.setLineDash([]);
        }
        
        // DESENHAR SERPENTE
        function desenharSerpente(pontos) {
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 4;
            
            ctx.beginPath();
            const p0 = project3D(pontos[0]);
            ctx.moveTo(p0[0], p0[1]);
            
            for (let i = 1; i < pontos.length; i++) {
                const p = project3D(pontos[i]);
                ctx.lineTo(p[0], p[1]);
            }
            ctx.stroke();
            
            // Cabeça da serpente
            ctx.fillStyle = '#c0392b';
            ctx.beginPath();
            const head = project3D(pontos[0]);
            ctx.arc(head[0], head[1], 8, 0, 2*Math.PI);
            ctx.fill();
        }
        
        // DESENHAR FRAME
        function desenharFrame() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            desenharEixoD();
            desenharPlano(planoA, 'A');
            desenharPlano(planoB, 'B');
            desenharSerpente(serpenteTransformada);
            
            const voltas = angulo / (2 * Math.PI);
            document.getElementById('status').textContent = 
                `Voltas: ${voltas.toFixed(1)} | Reflexões: ${reflexoes} | ${isAnimating ? 'Animando...' : 'Pausado'}`;
        }
        
        // ATUALIZAR MATRIZES
        function atualizarMatrizes() {
            const Mh = operadorHelicoidal(angulo);
            const Mr = operadorReflexao();
            
            let html = '<strong>1. Matriz Helicoidal (M_H):</strong>\n';
            html += 'Rotação em D + translação h = θ/π\n';
            html += formatMatrix(Mh);
            
            html += '\n<strong>2. Matriz de Reflexão no Plano C (M_R):</strong>\n';
            html += 'Reflexão quando cruza planos A ou B\n';
            html += formatMatrix(Mr);
            
            html += '\n<strong>3. Matriz Acumulada (M_total):</strong>\n';
            html += 'M_total = M_H × M_R × M_R × ... (sequencial)\n';
            html += formatMatrix(matrizAcumulada);
            
            html += '\n<strong>Ordem de aplicação:</strong>\n';
            html += '1. Aplicar movimento helicoidal contínuo\n';
            html += '2. Detectar cruzamento com plano A ou B\n';
            html += '3. Se cruzar, multiplicar por M_R\n';
            html += '4. Continuar movimento helicoidal';
            
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
        function animate() {
            if (!isAnimating) return;
            
            const deltaAngulo = 0.05; // velocidade
            const anguloAnterior = angulo;
            angulo += deltaAngulo;
            
            // Calcular nova transformação helicoidal
            const Mh = operadorHelicoidal(angulo);
            
            // Aplicar na serpente
            const novaSerpente = serpente.map(p => aplicarMatriz(Mh, p));
            
            // Verificar cruzamento com planos
            for (let i = 0; i < novaSerpente.length - 1; i++) {
                const cruzouA = cruzaPlano(serpenteTransformada[i], novaSerpente[i], planoA);
                const cruzouB = cruzaPlano(serpenteTransformada[i], novaSerpente[i], planoB);
                
                if ((cruzouA && lastPlane !== 'A') || (cruzouB && lastPlane !== 'B')) {
                    // Aplicar reflexão
                    const Mr = operadorReflexao();
                    matrizAcumulada = multMatriz(Mh, Mr);
                    
                    // Refletir toda a serpente
                    serpenteTransformada = serpenteTransformada.map(p => aplicarMatriz(Mr, p));
                    reflexoes++;
                    lastPlane = cruzouA ? 'A' : 'B';
                    break;
                }
            }
            
            serpenteTransformada = novaSerpente;
            
            desenharFrame();
            
            if (document.getElementById('matrixDisplay').classList.contains('show')) {
                atualizarMatrizes();
            }
            
            animationId = requestAnimationFrame(animate);
        }
        
        // CONTROLES
        function startAnimation() {
            if (!isAnimating) {
                isAnimating = true;
                document.getElementById('btnPlay').disabled = true;
                document.getElementById('btnPause').disabled = false;
                animate();
            }
        }
        
        function pauseAnimation() {
            isAnimating = false;
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            document.getElementById('btnPlay').disabled = false;
            document.getElementById('btnPause').disabled = true;
        }
        
        function resetAnimation() {
            pauseAnimation();
            angulo = 0;
            reflexoes = 0;
            lastPlane = null;
            serpente = criarSerpente();
            serpenteTransformada = [...serpente];
            matrizAcumulada = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
            desenharFrame();
        }
        
        function toggleMatrix() {
            const display = document.getElementById('matrixDisplay');
            display.classList.toggle('show');
            if (display.classList.contains('show')) {
                atualizarMatrizes();
            }
        }
        
        // INICIALIZAÇÃO
        desenharFrame();