const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        function resizeCanvas() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Variáveis globais
        let animationFrame = null;
        let currentSimulation = null;
        let cameraRotationX = -20;
        let cameraRotationY = 30;
        let isDragging = false;
        let lastMouseX = 0;
        let lastMouseY = 0;
        let animationSpeed = 50;

        // UI Elements
        const statusEl = document.getElementById('status');
        const stepEl = document.getElementById('step');
        const matrixDisplayEl = document.getElementById('matrixDisplay');
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');

        speedSlider.addEventListener('input', (e) => {
            animationSpeed = e.target.value;
            speedValue.textContent = e.target.value;
        });

        // Mouse controls
        canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        });

        canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - lastMouseX;
                const deltaY = e.clientY - lastMouseY;
                cameraRotationY += deltaX * 0.5;
                cameraRotationX += deltaY * 0.5;
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
            }
        });

        canvas.addEventListener('mouseup', () => isDragging = false);
        canvas.addEventListener('mouseleave', () => isDragging = false);

        // Classe Vector3
        class Vector3 {
            constructor(x, y, z) {
                this.x = x || 0;
                this.y = y || 0;
                this.z = z || 0;
            }

            subtract(v) {
                return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
            }

            add(v) {
                return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
            }

            normalize() {
                const len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
                if (len === 0) return new Vector3(0, 0, 0);
                return new Vector3(this.x / len, this.y / len, this.z / len);
            }

            cross(v) {
                return new Vector3(
                    this.y * v.z - this.z * v.y,
                    this.z * v.x - this.x * v.z,
                    this.x * v.y - this.y * v.x
                );
            }

            dot(v) {
                return this.x * v.x + this.y * v.y + this.z * v.z;
            }

            scale(s) {
                return new Vector3(this.x * s, this.y * s, this.z * s);
            }
        }

        // Funções de matrizes
        function createIdentity() {
            return [
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 1, 0],
                [0, 0, 0, 1]
            ];
        }

        function multiplyMatrices(a, b) {
            const result = createIdentity();
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) {
                    result[i][j] = 0;
                    for (let k = 0; k < 4; k++) {
                        result[i][j] += a[i][k] * b[k][j];
                    }
                }
            }
            return result;
        }

        function applyMatrix(matrix, point) {
            const x = point.x, y = point.y, z = point.z;
            return new Vector3(
                matrix[0][0] * x + matrix[0][1] * y + matrix[0][2] * z + matrix[0][3],
                matrix[1][0] * x + matrix[1][1] * y + matrix[1][2] * z + matrix[1][3],
                matrix[2][0] * x + matrix[2][1] * y + matrix[2][2] * z + matrix[2][3]
            );
        }

        function translationMatrix(tx, ty, tz) {
            return [
                [1, 0, 0, tx],
                [0, 1, 0, ty],
                [0, 0, 1, tz],
                [0, 0, 0, 1]
            ];
        }

        function scaleMatrix(sx, sy, sz) {
            return [
                [sx, 0, 0, 0],
                [0, sy, 0, 0],
                [0, 0, sz, 0],
                [0, 0, 0, 1]
            ];
        }

        function rotationMatrixAroundAxis(axis, angleDeg, point) {
            const rad = angleDeg * Math.PI / 180;
            const c = Math.cos(rad);
            const s = Math.sin(rad);
            const t = 1 - c;
            
            const u = axis.normalize();
            const ux = u.x, uy = u.y, uz = u.z;

            const rotMat = [
                [t*ux*ux + c,    t*ux*uy - s*uz, t*ux*uz + s*uy, 0],
                [t*ux*uy + s*uz, t*uy*uy + c,    t*uy*uz - s*ux, 0],
                [t*ux*uz - s*uy, t*uy*uz + s*ux, t*uz*uz + c,    0],
                [0,              0,              0,              1]
            ];

            const toOrigin = translationMatrix(-point.x, -point.y, -point.z);
            const fromOrigin = translationMatrix(point.x, point.y, point.z);
            
            return multiplyMatrices(fromOrigin, multiplyMatrices(rotMat, toOrigin));
        }

        function reflectionMatrix(normal, d) {
            const n = normal.normalize();
            const nx = n.x, ny = n.y, nz = n.z;
            
            return [
                [1 - 2*nx*nx, -2*nx*ny, -2*nx*nz, -2*d*nx],
                [-2*ny*nx, 1 - 2*ny*ny, -2*ny*nz, -2*d*ny],
                [-2*nz*nx, -2*nz*ny, 1 - 2*nz*nz, -2*d*nz],
                [0, 0, 0, 1]
            ];
        }

        // Projeção 3D com rotação de câmera
        function project3D(point) {
            const scale = 80;
            const distance = 500;
            
            // Aplicar rotação da câmera
            let x = point.x;
            let y = point.y;
            let z = point.z;
            
            // Rotação Y
            const angleY = cameraRotationY * Math.PI / 180;
            const cosY = Math.cos(angleY);
            const sinY = Math.sin(angleY);
            let tempX = x * cosY - z * sinY;
            let tempZ = x * sinY + z * cosY;
            x = tempX;
            z = tempZ;
            
            // Rotação X
            const angleX = cameraRotationX * Math.PI / 180;
            const cosX = Math.cos(angleX);
            const sinX = Math.sin(angleX);
            let tempY = y * cosX - z * sinX;
            tempZ = y * sinX + z * cosX;
            y = tempY;
            z = tempZ;
            
            const factor = distance / (distance + z);
            
            return {
                x: canvas.width / 2 + x * scale * factor,
                y: canvas.height / 2 - y * scale * factor,
                z: z
            };
        }

        // Desenhar funções
        function drawAxes() {
            const origin = new Vector3(0, 0, 0);
            const axisLength = 3;

            drawLine3D(origin, new Vector3(axisLength, 0, 0), '#ff0000', 3);
            drawLine3D(origin, new Vector3(0, axisLength, 0), '#00ff00', 3);
            drawLine3D(origin, new Vector3(0, 0, axisLength), '#0000ff', 3);

            const xLabel = project3D(new Vector3(axisLength + 0.3, 0, 0));
            const yLabel = project3D(new Vector3(0, axisLength + 0.3, 0));
            const zLabel = project3D(new Vector3(0, 0, axisLength + 0.3));
            
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('X', xLabel.x, xLabel.y);
            ctx.fillStyle = '#00ff00';
            ctx.fillText('Y', yLabel.x, yLabel.y);
            ctx.fillStyle = '#0000ff';
            ctx.fillText('Z', zLabel.x, zLabel.y);
        }

        function drawLine3D(p1, p2, color, width) {
            const proj1 = project3D(p1);
            const proj2 = project3D(p2);
            
            ctx.beginPath();
            ctx.moveTo(proj1.x, proj1.y);
            ctx.lineTo(proj2.x, proj2.y);
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.stroke();
        }

        function drawCube(vertices, color, alpha = 1) {
            const edges = [
                [0,1],[1,2],[2,3],[3,0],
                [4,5],[5,6],[6,7],[7,4],
                [0,4],[1,5],[2,6],[3,7]
            ];

            ctx.globalAlpha = alpha;
            edges.forEach(([i, j]) => {
                drawLine3D(vertices[i], vertices[j], color, 2);
            });
            ctx.globalAlpha = 1;

            // Desenhar vértices
            vertices.forEach(v => {
                const proj = project3D(v);
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
            });
        }

        function formatMatrix(matrix, name = '') {
            let html = name ? `<strong>${name}:</strong><pre>` : '<pre>';
            for (let i = 0; i < 4; i++) {
                html += '[';
                for (let j = 0; j < 4; j++) {
                    const val = matrix[i][j];
                    html += val.toFixed(4).padStart(9);
                }
                html += ' ]\n';
            }
            html += '</pre>';
            return html;
        }

        // Criar cubo unitário
        function createUnitCube() {
            const s = 0.5;
            return [
                new Vector3(-s, -s, -s),
                new Vector3( s, -s, -s),
                new Vector3( s,  s, -s),
                new Vector3(-s,  s, -s),
                new Vector3(-s, -s,  s),
                new Vector3( s, -s,  s),
                new Vector3( s,  s,  s),
                new Vector3(-s,  s,  s)
            ];
        }

        // SIMULAÇÃO A: Arco Circular
        class SimulationA {
            constructor() {
                this.A = new Vector3(2, -2, -3);
                this.B = new Vector3(2, 1, 0);
                this.C = new Vector3(0, -1, -1);
                this.cube = createUnitCube().map(v => v.add(this.A));
                this.currentAngle = 0;
                this.angleStep = 30;
                this.maxAngle = this.calculateMaxAngle();
                this.axis = this.calculateAxis();
            }

            calculateMaxAngle() {
                const CA = this.A.subtract(this.C);
                const CB = this.B.subtract(this.C);
                const dotProduct = CA.dot(CB);
                const radius = Math.sqrt(CA.x * CA.x + CA.y * CA.y + CA.z * CA.z);
                return Math.acos(dotProduct / (radius * radius)) * 180 / Math.PI;
            }

            calculateAxis() {
                const CA = this.A.subtract(this.C);
                const CB = this.B.subtract(this.C);
                return CA.cross(CB).normalize();
            }

            step() {
                if (this.currentAngle < this.maxAngle) {
                    this.currentAngle = Math.min(this.currentAngle + this.angleStep, this.maxAngle);
                    return true;
                }
                return false;
            }

            draw() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawAxes();

                // Pontos de referência
                const projC = project3D(this.C);
                ctx.beginPath();
                ctx.arc(projC.x, projC.y, 6, 0, Math.PI * 2);
                ctx.fillStyle = '#ff6b6b';
                ctx.fill();
                ctx.fillText('C', projC.x + 10, projC.y);

                // Cubo original
                drawCube(this.cube, '#4ecdc4', 0.3);

                // Cubo transformado
                const matrix = rotationMatrixAroundAxis(this.axis, this.currentAngle, this.C);
                const transformedCube = this.cube.map(v => applyMatrix(matrix, v));
                drawCube(transformedCube, '#f38181');

                stepEl.textContent = `${this.currentAngle.toFixed(1)}° / ${this.maxAngle.toFixed(1)}°`;
            }

            getMatrices() {
                const matrix = rotationMatrixAroundAxis(this.axis, this.angleStep, this.C);
                let html = '<strong>Simulação A: Movimento em Arco Circular</strong><br>';
                html += `<p>A = (2,-2,-3), B = (2,1,0), C = (0,-1,-1)</p>`;
                html += `<p>Eixo de rotação: (${this.axis.x.toFixed(3)}, ${this.axis.y.toFixed(3)}, ${this.axis.z.toFixed(3)})</p>`;
                html += `<p>Ângulo por passo: ${this.angleStep}°</p>`;
                html += formatMatrix(matrix, 'Matriz de Rotação (30°)');
                return html;
            }
        }

        // SIMULAÇÃO B: Rotação + Escala + Translação
        class SimulationB {
            constructor() {
                this.cube = createUnitCube();
                this.currentStep = 0;
                this.steps = [];
                this.calculateSteps();
            }

            calculateSteps() {
                const axis = new Vector3(1, -1, 1);
                const point = new Vector3(-1, 1, 0);
                const rotMat = rotationMatrixAroundAxis(axis, 30, point);
                const scaleMat = scaleMatrix(3, -2, 0.5);
                const transMat = translationMatrix(1, -2, -3);

                this.steps = [
                    { matrix: createIdentity(), name: 'Original' },
                    { matrix: rotMat, name: 'Após Rotação 30°' },
                    { matrix: multiplyMatrices(scaleMat, rotMat), name: 'Após Escala' },
                    { matrix: multiplyMatrices(transMat, multiplyMatrices(scaleMat, rotMat)), name: 'Após Translação' }
                ];

                this.matrices = { rotMat, scaleMat, transMat, final: this.steps[3].matrix };
            }

            step() {
                if (this.currentStep < this.steps.length - 1) {
                    this.currentStep++;
                    return true;
                }
                return false;
            }

            draw() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawAxes();

                drawCube(this.cube, '#4ecdc4', 0.3);

                const transformed = this.cube.map(v => applyMatrix(this.steps[this.currentStep].matrix, v));
                drawCube(transformed, '#f38181');

                stepEl.textContent = this.steps[this.currentStep].name;
            }

            getMatrices() {
                let html = '<strong>Simulação B: Rotação + Escala + Translação</strong><br>';
                html += formatMatrix(this.matrices.rotMat, '1. Rotação 30° (eixo (1,-1,1), ponto (-1,1,0))');
                html += formatMatrix(this.matrices.scaleMat, '2. Escala (3, -2, 0.5)');
                html += formatMatrix(this.matrices.transMat, '3. Translação (1, -2, -3)');
                html += formatMatrix(this.matrices.final, 'Matriz Final (T × S × R)');
                return html;
            }
        }

        // SIMULAÇÃO C: Reflexão + Rotação
        class SimulationC {
            constructor() {
                this.cube = createUnitCube();
                this.currentStep = 0;
                this.steps = [];
                this.calculateSteps();
            }

            calculateSteps() {
                // Reflexão no plano x - y = 1 => x - y - 1 = 0
                const normal = new Vector3(1, -1, 0);
                const d = -1;
                const refMat = reflectionMatrix(normal, d);

                // Rotação anti-horária 30° em torno da reta (t, 0, -t)
                const axis = new Vector3(1, 0, -1);
                const point = new Vector3(0, 0, 0);
                const rotMat = rotationMatrixAroundAxis(axis, 30, point);

                this.steps = [
                    { matrix: createIdentity(), name: 'Original' },
                    { matrix: refMat, name: 'Após Reflexão' },
                    { matrix: multiplyMatrices(rotMat, refMat), name: 'Após Rotação' }
                ];

                this.matrices = { refMat, rotMat, final: this.steps[2].matrix };
            }

            step() {
                if (this.currentStep < this.steps.length - 1) {
                    this.currentStep++;
                    return true;
                }
                return false;
            }

            draw() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawAxes();

                drawCube(this.cube, '#4ecdc4', 0.3);

                const transformed = this.cube.map(v => applyMatrix(this.steps[this.currentStep].matrix, v));
                drawCube(transformed, '#f38181');

                stepEl.textContent = this.steps[this.currentStep].name;
            }

            getMatrices() {
                let html = '<strong>Simulação C: Reflexão + Rotação</strong><br>';
                html += '<p>Plano de reflexão: x - y = 1</p>';
                html += formatMatrix(this.matrices.refMat, '1. Reflexão no plano x - y = 1');
                html += '<p>Eixo de rotação: (t, 0, -t) com sentido (1, 0, -1)</p>';
                html += formatMatrix(this.matrices.rotMat, '2. Rotação 30° anti-horária');
                html += formatMatrix(this.matrices.final, 'Matriz Final (R × Ref)');
                return html;
            }
        }

        // Controle de animação
        function animate() {
            if (currentSimulation) {
                currentSimulation.draw();
                
                const delay = 101 - animationSpeed;
                animationFrame = setTimeout(() => {
                    if (currentSimulation.step()) {
                        animate();
                    } else {
                        statusEl.textContent = 'Animação completa - Arraste para rotacionar';
                    }
                }, delay * 10);
            }
        }

        function stopAnimation() {
            if (animationFrame) {
                clearTimeout(animationFrame);
                animationFrame = null;
            }
        }

        function startSimulation(SimClass) {
            stopAnimation();
            currentSimulation = new SimClass();
            matrixDisplayEl.innerHTML = currentSimulation.getMatrices();
            statusEl.textContent = 'Animando...';
            animate();
        }

        function renderStatic() {
            if (currentSimulation) {
                currentSimulation.draw();
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawAxes();
            }
        }

        function reset() {
            stopAnimation();
            currentSimulation = null;
            cameraRotationX = -20;
            cameraRotationY = 30;
            statusEl.textContent = 'Pronto - Arraste para rotacionar';
            stepEl.textContent = '-';
            matrixDisplayEl.innerHTML = 'Clique em uma simulação para ver as matrizes em coordenadas homogêneas';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawAxes();
        }

        // Event listeners
        document.getElementById('btnSimA').addEventListener('click', () => startSimulation(SimulationA));
        document.getElementById('btnSimB').addEventListener('click', () => startSimulation(SimulationB));
        document.getElementById('btnSimC').addEventListener('click', () => startSimulation(SimulationC));
        document.getElementById('btnReset').addEventListener('click', reset);

        // Render contínuo para rotação da câmera
        setInterval(() => {
            if (!animationFrame) {
                renderStatic();
            }
        }, 50);

        // Inicializar
        renderStatic();