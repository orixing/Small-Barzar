// 游戏实体类定义

// 基础单位类
class Unit {
    constructor(type, team, x, y, itemId = null) {
        this.type = type;
        this.itemId = itemId; // 具体的物品ID，如'warrior', 'assassin'等
        this.team = team; // 'player' or 'enemy'
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.health = this.maxHealth = this.getMaxHealth();
        this.speed = this.getSpeed();
        this.attackPower = this.getAttackPower();
        this.attackRange = this.getAttackRange();
        this.baseDamage = this.getBaseDamage();
        this.cost = this.getCost();
        this.size = 20;
        this.target = null;
        this.attackCooldown = 0;
        this.maxAttackCooldown = 60; // 1秒（60帧）
        this.alive = true;
        this.moving = false;
        this.direction = team === 'player' ? 1 : -1; // 1向右，-1向左
    }

    getMaxHealth() {
        const stats = {
            melee: 120,
            ranged: 80,
            tank: 200,
            mage: 60
        };
        return stats[this.type] || 100;
    }

    getSpeed() {
        // 速度系统重新设计：速度值 × 0.123 = 实际像素/帧
        // 这样速度10的角色实际移动1.23像素/帧，10秒到达对面基地
        const speedMultiplier = 0.123;
        
        const speeds = {
            melee: 8,   // 8 × 0.123 ≈ 0.98像素/帧
            ranged: 6,  // 6 × 0.123 ≈ 0.74像素/帧  
            tank: 4,    // 4 × 0.123 ≈ 0.49像素/帧
            mage: 7     // 7 × 0.123 ≈ 0.86像素/帧
        };
        
        const baseSpeed = speeds[this.type] || 6;
        return baseSpeed * speedMultiplier;
    }

    getAttackPower() {
        const powers = {
            melee: 25,
            ranged: 20,
            tank: 15,
            mage: 35
        };
        return powers[this.type] || 20;
    }

    getAttackRange() {
        const ranges = {
            melee: 30,
            ranged: 100,
            tank: 35,
            mage: 120
        };
        return ranges[this.type] || 50;
    }

    getCost() {
        const costs = {
            melee: 50,
            ranged: 80,
            tank: 150,
            mage: 120
        };
        return costs[this.type] || 50;
    }

    getBaseDamage() {
        // 如果有具体的物品ID，使用具体的基地伤害值
        if (this.itemId) {
            const specificBaseDamage = {
                // 近战单位
                warrior: 20,
                assassin: 20,
                gladiator: 20,
                barbarian: 20,
                giant: 50,
                cavalry: 20,
                militia: 15,
                
                // 其他兵种
                bow: 20,
                staff: 20,
                shield: 20
            };
            
            if (specificBaseDamage[this.itemId]) {
                return specificBaseDamage[this.itemId];
            }
        }
        
        // 备用方案：按兵种类型
        const baseDamages = {
            melee: 20,
            ranged: 20,
            tank: 20,
            mage: 20
        };
        return baseDamages[this.type] || 20;
    }

    getIcon() {
        // 如果有具体的物品ID，使用物品对应的图标
        if (this.itemId) {
            const specificIcons = {
                // 近战单位
                warrior: '⚔️',
                assassin: '🥷',
                gladiator: '🏺', 
                barbarian: '🪓',
                giant: '👹',
                cavalry: '🐎',
                militia: '👥',
                
                // 其他兵种
                bow: '🏹',
                staff: '🔮',
                shield: '🛡️'
            };
            
            if (specificIcons[this.itemId]) {
                return specificIcons[this.itemId];
            }
        }
        
        // 备用方案：使用通用类型图标
        const icons = {
            melee: '⚔️',
            ranged: '🏹',
            tank: '🛡️',
            mage: '🔮'
        };
        return icons[this.type] || '👤';
    }

    update(enemyUnits, canvas) {
        if (!this.alive) return;

        // 攻击冷却
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }

        // 寻找目标
        this.findTarget(enemyUnits);

        if (this.target && this.target.alive) {
            const distance = Utils.distance(this.x, this.y, this.target.x, this.target.y);
            
            if (distance <= this.attackRange) {
                // 在攻击范围内，停止移动并攻击
                this.moving = false;
                this.attack();
            } else {
                // 追击目标
                this.moveTowards(this.target.x, this.target.y);
            }
        } else {
            // 没有目标，向前移动
            const centerY = canvas.height / 2;
            if (this.team === 'player') {
                this.moveTowards(canvas.width, centerY);
            } else {
                this.moveTowards(0, centerY);
            }
        }

        // 边界检查
        this.x = Utils.clamp(this.x, this.size, canvas.width - this.size);
        this.y = Utils.clamp(this.y, this.size, canvas.height - this.size);
    }

    findTarget(enemyUnits) {
        if (this.target && this.target.alive) {
            return; // 已有活着的目标
        }

        let closestEnemy = null;
        let closestDistance = Infinity;

        for (const enemy of enemyUnits) {
            if (!enemy.alive) continue;
            
            const distance = Utils.distance(this.x, this.y, enemy.x, enemy.y);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        }

        this.target = closestEnemy;
    }

    moveTowards(targetX, targetY) {
        this.moving = true;
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
    }

    attack() {
        if (this.attackCooldown > 0 || !this.target || !this.target.alive) {
            return;
        }

        this.attackCooldown = this.maxAttackCooldown;
        
        // 造成伤害
        const damage = this.attackPower + Utils.randomInt(-5, 5);
        this.target.takeDamage(damage);

        // 播放攻击效果
        Utils.playSound('attack');
        
        // 特殊攻击效果
        if (this.type === 'mage') {
            // 法师有范围伤害
            this.areaAttack();
        }
    }

    areaAttack() {
        // 法师的范围攻击（简化版）
        // 在实际游戏中可以添加更复杂的范围效果
    }

    takeDamage(damage) {
        this.health -= damage;
        
        if (this.health <= 0) {
            this.health = 0;
            this.alive = false;
        }

        // 受伤效果
        Utils.vibrate(50);
    }

    // 计算对基地的实际伤害 = 基地伤害 × 生命百分比
    calculateBaseDamage() {
        const healthPercent = this.health / this.maxHealth;
        return Math.floor(this.baseDamage * healthPercent);
    }

    render(ctx) {
        if (!this.alive) return;

        // 绘制单位图标
        ctx.font = `${this.size}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Color Emoji', Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 添加阴影效果
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 4;
        
        ctx.fillText(this.getIcon(), this.x, this.y);
        
        // 清除阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;

        // 绘制血条
        this.renderHealthBar(ctx);

        // 绘制选中框（如果是目标）
        if (this.target) {
            ctx.strokeStyle = this.team === 'player' ? '#4CAF50' : '#F44336';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
            ctx.setLineDash([]);
        }
    }

    renderHealthBar(ctx) {
        const barWidth = this.size * 1.2;
        const barHeight = 4;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.size / 2 - 8;

        // 血条背景
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // 血条
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.6 ? '#4CAF50' : 
                       healthPercent > 0.3 ? '#FFA500' : '#F44336';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        // 血条边框
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
}

// 基地类
class Base {
    constructor(team, x, y, wave = 1) {
        this.team = team;
        this.x = x;
        this.y = y;
        this.health = this.maxHealth = 100 + 100 * wave;  // 100 + 100 × 波数
        this.size = 50;
        this.alive = true;
        this.wave = wave;  // 记录当前波数
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.health = 0;
            this.alive = false;
        }
        
        Utils.vibrate(100);
    }

    render(ctx) {
        // 绘制基地
        ctx.font = `${this.size}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Color Emoji', Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const icon = this.team === 'player' ? '🏰' : '🏛️';
        ctx.fillText(icon, this.x, this.y);

        // 绘制基地血条
        this.renderHealthBar(ctx);
    }

    renderHealthBar(ctx) {
        const barWidth = this.size * 2;
        const barHeight = 8;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.size / 2 - 15;

        // 血条背景
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // 血条
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = this.team === 'player' ? '#4CAF50' : '#F44336';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        // 血条边框
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
}