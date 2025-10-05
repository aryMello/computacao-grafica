// VARIÁVEIS GLOBAIS

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let cubeVertices = [
    [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5],
    [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5],
    [-0.5, -0.5, 0.5], [0.5, -0.5, 0.5],
    [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]
];

let originalCube = JSON.parse(JSON.stringify(cubeVertices));
let targetCube = JSON.parse(JSON.stringify(cubeVertices));
let currentTransform = 0;
let isAnimating = false;
let progress = 0;
let animationSpeed = 0.01;

// OPERADOR 1: ROTAÇÃO EM TORNO DE s
// s = {(x,y,z) | x=2, y=1} (reta paralela a z)

function rotationAroundS(point, angle) {
    const x = point[0];
    const y = point[1];
    const z = point[2];

    // Centro da rotação
    const cx = 2;
    const cy = 1;

    // Translada para origem
    const dx = x - cx;
    const dy = y - cy;

    // Rotação no plano xy
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const newX = dx * cos - dy * sin + cx;
    const newY = dx * sin + dy * cos + cy;
    const newZ = z;

    return [newX, newY, newZ];
}

// OPERADOR 2: REFLEXÃO NO PLANO C
// C = {(x,y,z) | (0,1,0) + q*v1 + p*v2}
// v1 = (-2, 4, -2), v2 = (-1, -1, 1)

function reflectionPlaneC(point) {
    const x = point[0];
    const y = point[1];
    const z = point[2];

    // Normal ao plano: v1 × v2
    // v1 = (-2, 4, -2), v2 = (-1, -1, 1)
    // n = (2, 4, 6) normalizado
    const sqrt14 = Math.sqrt(14);
    const nx = 2 / sqrt14;
    const ny = 4 / sqrt14;
    const nz = 6 / sqrt14;

    // Ponto no plano P0 = (0, 1, 0)
    const p0x = 0, p0y = 1, p0z = 0;

    // Vetor do ponto P0 ao ponto atual
    const vx = x - p0x;
    const vy = y - p0y;
    const vz = z - p0z;

    // Distância ao plano (projeção na normal)
    const dist = vx * nx + vy * ny + vz * nz;

    // Reflexão: ponto - 2 * dist * normal
    const newX = x - 2 * dist * nx;
    const newY = y - 2 * dist * ny;
    const newZ = z - 2 * dist * nz;

    return [newX, newY, newZ];
}

// OPERADOR 3: ROTAÇÃO HELICOIDAL
// D = (-t, 1-t, t) -> direção (-1, -1, 1)
// fator de translação: 2/π

function helicalRotation(point, angle) {
    const x = point[0];
    const y = point[1];
    const z = point[2];

    // Direção do eixo (normalizada)
    const sqrt3 = Math.sqrt(3);
    const dx = -1 / sqrt3;
    const dy = -1 / sqrt3;
    const dz = 1 / sqrt3;

    // Ponto no eixo: (0, 1, 0)
    const p0 = [0, 1, 0];

    // Vetor do ponto no eixo ao ponto atual
    const vx = x - p0[0];
    const vy = y - p0[1];
    const vz = z - p0[2];

    // Componente paralela ao eixo
    const dotVD = vx * dx + vy * dy + vz * dz;
    const parX = dotVD * dx;
    const parY = dotVD * dy;
    const parZ = dotVD * dz;

    // Componente perpendicular
    const perpX = vx - parX;
    const perpY = vy - parY;
    const perpZ = vz - parZ;

    // Fórmula de Rodrigues para rotação
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // d × perp
    const crossX = dy * perpZ - dz * perpY;
    const crossY = dz * perpX - dx * perpZ;
    const crossZ = dx * perpY - dy * perpX;

    // Rotação
    const rotX = perpX * cos + crossX * sin;
    const rotY = perpY * cos + crossY * sin;
    const rotZ = perpZ * cos + crossZ * sin;

    // Translação helicoidal
    const h = (2 / Math.PI) * angle;

    const newX = p0[0] + rotX + parX + h * dx;
    const newY = p0[1] + rotY + parY + h * dy;
    const newZ = p0[2] + rotZ + parZ + h * dz;

    return [newX, newY, newZ];
}

// PROJEÇÃO 3D -> 2D

function project3D(point) {
    const scale = 60; // Reduzido para caber transformações distantes
    const distance = 8; // Aumentado para melhor perspectiva
    
    // Offset da câmera para centralizar melhor as transformações
    const offsetX = currentTransform === 1 ? -1 : 0;
    const offsetY = currentTransform === 1 ? -0.5 : 0;

    const factor = distance / (distance + point[2]);
    const x2d = canvas.width / 2 + (point[0] + offsetX) * scale * factor;
    const y2d = canvas.height / 2 - (point[1] + offsetY) * scale * factor;

    return [x2d, y2d, factor];
}

// DESENHAR CUBO

function drawCube(vertices, color, alpha) {
    const projected = vertices.map(v => project3D(v));

    // Arestas do cubo
    const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0], // face traseira
        [4, 5], [5, 6], [6, 7], [7, 4], // face frontal
        [0, 4], [1, 5], [2, 6], [3, 7]  // conexões
    ];

    // Desenhar arestas
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = alpha;

    edges.forEach(([i, j]) => {
        ctx.beginPath();
        ctx.moveTo(projected[i][0], projected[i][1]);
        ctx.lineTo(projected[j][0], projected[j][1]);
        ctx.stroke();
    });

    // Desenhar vértices
    ctx.fillStyle = '#e74c3c';
    projected.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.globalAlpha = 1;
}

// DESENHAR EIXO/PLANO DE REFERÊNCIA

function drawReference() {
    ctx.strokeStyle = '#95a5a6';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    if (currentTransform === 1) {
        // Eixo s (x=2, y=1)
        const p1 = project3D([2, 1, -2]);
        const p2 = project3D([2, 1, 2]);
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();

        ctx.fillStyle = '#34495e';
        ctx.font = '12px Arial';
        ctx.fillText('Eixo s', p1[0] + 10, p1[1]);
    } else if (currentTransform === 2) {
        // Plano C (simplificado)
        ctx.fillStyle = 'rgba(52, 152, 219, 0.2)';
        const planePoints = [
            project3D([1, 1, 1]),
            project3D([-1, 1, -1]),
            project3D([-1, 1, 1]),
            project3D([1, 1, -1])
        ];
        ctx.beginPath();
        ctx.moveTo(planePoints[0][0], planePoints[0][1]);
        planePoints.forEach(p => ctx.lineTo(p[0], p[1]));
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#34495e';
        ctx.font = '12px Arial';
        ctx.fillText('Plano C', planePoints[0][0] + 10, planePoints[0][1]);
    } else if (currentTransform === 3) {
        // Eixo D
        const p1 = project3D([2, -1, -2]);
        const p2 = project3D([-2, 3, 2]);
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();

        ctx.fillStyle = '#34495e';
        ctx.font = '12px Arial';
        ctx.fillText('Eixo D', p1[0] + 10, p1[1]);
    }

    ctx.setLineDash([]);
}

// INTERPOLAÇÃO LINEAR

function lerp(start, end, t) {
    return start.map((val, i) => val + (end[i] - val) * t);
}

// ATUALIZAR ANIMAÇÃO

function animate() {
    if (!isAnimating) return;

    progress += animationSpeed;
    if (progress >= 1) {
        progress = 1;
        isAnimating = false;
    }

    // Interpolação suave (ease-in-out)
    const t = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    // Interpolar cada vértice
    const currentCube = cubeVertices.map((start, i) =>
        lerp(start, targetCube[i], t)
    );

    // Desenhar
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawReference();
    drawCube(targetCube, '#95a5a6', 0.3); // cubo final (fantasma)
    drawCube(currentCube, '#3498db', 1);   // cubo animado

    // Atualizar coordenadas
    updateCoordinates(currentCube[6]);

    requestAnimationFrame(animate);
}

// APLICAR TRANSFORMAÇÃO

function applyTransform(transformType) {
    const angle = Math.PI; // 180 graus para rotações

    targetCube = originalCube.map(vertex => {
        switch (transformType) {
            case 1:
                return rotationAroundS(vertex, angle);
            case 2:
                return reflectionPlaneC(vertex);
            case 3:
                return helicalRotation(vertex, angle);
            default:
                return vertex;
        }
    });
}

// CONTROLES

function startTransform(type) {
    currentTransform = type;
    progress = 0;

    // Resetar para posição original
    cubeVertices = JSON.parse(JSON.stringify(originalCube));

    // Calcular transformação
    applyTransform(type);

    // Atualizar interface
    updateInfo(type);

    // Iniciar animação
    isAnimating = true;
    animate();
}

function reset() {
    isAnimating = false;
    progress = 0;
    currentTransform = 0;
    cubeVertices = JSON.parse(JSON.stringify(originalCube));
    targetCube = JSON.parse(JSON.stringify(originalCube));

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCube(cubeVertices, '#3498db', 1);

    document.getElementById('status').textContent = 'Selecione uma transformação';
    document.getElementById('transformTitle').textContent = 'Informações da Transformação';
    document.getElementById('transformDesc').textContent = 'Clique em uma transformação para ver os detalhes.';
    updateCoordinates(originalCube[6]);
}

// ATUALIZAR INFORMAÇÕES

function updateInfo(type) {
    const titles = [
        '',
        'Rotação em torno de s (x=2, y=1)',
        'Reflexão no Plano C',
        'Rotação Helicoidal em D'
    ];

    const descs = [
        '',
        'Rotação de 180° em torno da reta paralela ao eixo z passando por (2,1,0). Matriz: R(θ) aplicada após transladar para origem.',
        'Reflexão em relação ao plano C definido por P₀=(0,1,0) com vetores direcionais v₁=(-2,4,-2) e v₂=(-1,-1,1). Normal: n=(2,4,6)/√14.',
        'Rotação helicoidal de 180° em torno da reta D=(-t,1-t,t) com translação h=(2/π)θ. Combina rotação (Rodrigues) + translação axial.'
    ];

    document.getElementById('status').textContent = titles[type];
    document.getElementById('transformTitle').textContent = titles[type];
    document.getElementById('transformDesc').textContent = descs[type];
}

function updateCoordinates(point) {
    const start = originalCube[6];
    document.getElementById('pointStart').textContent =
        `(${start[0].toFixed(2)}, ${start[1].toFixed(2)}, ${start[2].toFixed(2)})`;
    document.getElementById('pointEnd').textContent =
        `(${point[0].toFixed(2)}, ${point[1].toFixed(2)}, ${point[2].toFixed(2)})`;
}

// INICIALIZAÇÃO

drawCube(cubeVertices, '#3498db', 1);
updateCoordinates(originalCube[6]);