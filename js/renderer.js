// 游戏渲染器
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
    }

    clear() {
        // 清除画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBackground() {
        // 绘制背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB'); // 天空蓝
        gradient.addColorStop(0.3, '#98FB98'); // 浅绿色
        gradient.addColorStop(1, '#DEB887'); // 沙色

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制分界线
        const centerX = this.canvas.width / 2;
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([10, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, 0);
        this.ctx.lineTo(centerX, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // 绘制装饰元素
        this.drawDecorations();
    }

    drawDecorations() {
        // 绘制一些装饰性的地形元素
        this.ctx.font = '20px -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Noto Color Emoji\', Arial';
        this.ctx.textAlign = 'center';

        // 每次都重新计算装饰位置，以适应画布大小变化
        const decorations = ['🌲', '🌳', '🪨', '🌿'];
        
        // 使用固定种子生成固定位置
        for (let i = 0; i < 6; i++) {
            const decoration = decorations[i % decorations.length];
            // 使用索引作为种子，确保位置固定
            const topY = 20 + (i * 7) % 40;
            const bottomY = this.canvas.height - topY;
            const x = 80 + (i * 50) % (this.canvas.width - 160);
            
            this.ctx.fillText(decoration, x, topY);
            this.ctx.fillText(decoration, x, bottomY);
        }
    }

    drawUnits(units) {
        // 按Y坐标排序，实现简单的深度效果
        units.sort((a, b) => a.y - b.y);
        
        for (const unit of units) {
            if (unit.alive) {
                unit.render(this.ctx);
            }
        }
    }

    drawBases(bases) {
        for (const base of bases) {
            if (base.alive) {
                base.render(this.ctx);
            }
        }
    }

    drawParticles() {
        // 更新和绘制粒子效果
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update();
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            particle.render(this.ctx);
        }
    }

    addParticle(x, y, type = 'explosion') {
        const particle = new Particle(x, y, type);
        this.particles.push(particle);
    }

    addExplosion(x, y) {
        // 创建爆炸粒子效果
        for (let i = 0; i < 8; i++) {
            this.addParticle(
                x + Utils.randomInt(-10, 10),
                y + Utils.randomInt(-10, 10),
                'explosion'
            );
        }
    }

    drawUI(gameState) {
        // 绘制一些游戏内的特效
        this.drawCombatEffects();
    }

    drawCombatEffects() {
        // 绘制战斗特效（如攻击线条等）
        // 在实际游戏中可以添加更多视觉效果
    }

    // 调整画布大小
    resize() {
        const container = this.canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        // 横向战场比例
        const aspectRatio = 16 / 9; // 宽高比
        let newWidth = containerRect.width;
        let newHeight = containerRect.height;
        
        // 确保画布填满容器
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        this.canvas.style.width = newWidth + 'px';
        this.canvas.style.height = newHeight + 'px';
    }
}

// 粒子效果类
class Particle {
    constructor(x, y, type = 'explosion') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.vx = Utils.random(-2, 2);
        this.vy = Utils.random(-3, 1);
        this.life = this.maxLife = 30;
        this.size = Utils.random(2, 6);
        this.color = this.getColor();
    }

    getColor() {
        const colors = {
            explosion: ['#FF4500', '#FF6347', '#FFD700', '#FF1493'],
            magic: ['#9400D3', '#4169E1', '#00CED1', '#ADFF2F'],
            blood: ['#DC143C', '#B22222', '#8B0000']
        };
        
        const colorSet = colors[this.type] || colors.explosion;
        return colorSet[Math.floor(Math.random() * colorSet.length)];
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // 重力
        this.life--;
        
        // 大小随时间减小
        this.size *= 0.98;
    }

    render(ctx) {
        ctx.save();
        
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}