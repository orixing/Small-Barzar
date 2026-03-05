// 游戏实体类定义

// 基础单位类
class Unit {
    constructor(type, team, x, y, itemId = null, itemQuality = null, extraTargets = 0) {
        this.type = type;
        this.itemId = itemId; // 具体的物品ID，如'warrior', 'assassin'等
        this.itemQuality = itemQuality; // 物品品质，用于女巫等技能
        this.team = team; // 'player' or 'enemy'
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.health = this.maxHealth = this.getMaxHealth();
        this.shield = this.maxShield = this.getMaxShield();
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
        this.extraTargets = extraTargets; // 额外攻击目标数量（来自魔法阵等效果）
        this.areaAttackRadius = this.getAreaAttackRadius(); // 范围攻击半径
    }

    getMaxHealth() {
        // 如果有具体的物品ID，使用具体的血量值
        if (this.itemId) {
            const specificHealth = {
                // 近战单位
                warrior: 120,
                assassin: 80,
                gladiator: 120,
                barbarian: 120,
                giant: 200,
                cavalry: 160,
                militia: 120,
                swordmaster: 120,
                titan: 300,
                
                // 其他兵种
                bow: 80,
                staff: 60,  // 不召唤单位，血量不重要
                shield: 200,
                
                // 魔法单位 - 根据JSON配置
                apprentice: 100,        // 学徒
                waterElemental: 200,    // 水元素
                golem: 200,             // 魔偶
                golemArcane: 400,       // 奥数魔像
                archmage: 100,          // 大法师
                alchemist: 100,         // 药剂师
                witch: 100,             // 女巫
                dragonMagic: 400        // 魔法巨龙
            };
            
            if (specificHealth[this.itemId]) {
                return specificHealth[this.itemId];
            }
        }
        
        // 备用方案：使用通用类型血量
        const stats = {
            melee: 120,
            ranged: 80,
            tank: 200
            // 删除了基础魔法单位(mage)的通用配置，所有魔法单位现在都使用JSON中的具体配置
        };
        return stats[this.type] || 100;
    }

    getMaxShield() {
        // 泰坦拥有固定护盾
        if (this.itemId === 'titan') {
            return 800;
        }
        // 奥数魔像拥有条件护盾（需要相邻魔法单位）
        if (this.itemId === 'golemArcane') {
            // 护盾数量根据品质等级决定
            const shieldByQuality = {
                3: 400,  // 紫色
                4: 800,  // 橙色
                5: 1200  // 红色
            };
            return shieldByQuality[this.itemQuality] || 400;
        }
        return 0;
    }

    getSpeed() {
        // 如果有具体的物品ID，使用具体的速度值
        if (this.itemId) {
            const specificSpeeds = {
                // 近战单位
                warrior: 10,    // 战士
                assassin: 12,   // 刺客  
                gladiator: 10,  // 角斗士
                barbarian: 9,   // 野蛮人
                giant: 6,       // 巨人
                cavalry: 14,    // 骑兵 
                militia: 9,     // 民兵团
                swordmaster: 11,// 剑圣
                titan: 3,       // 泰坦
                
                // 其他兵种
                bow: 6,         // 弓箭手
                staff: 7,       // 法师
                shield: 4,      // 盾兵
                
                // 魔法单位
                apprentice: 8,  // 学徒
                waterElemental: 10,  // 水元素
                golemArcane: 6, // 奥数魔像
                archmage: 8,    // 大法师
                alchemist: 8,   // 药剂师
                witch: 8       // 女巫
            };
            
            if (specificSpeeds[this.itemId]) {
                // 速度值 × 0.123 = 实际像素/帧 (参考设计文档)
                return specificSpeeds[this.itemId] * 0.123;
            }
        }
        
        // 备用方案：使用通用兵种类型速度
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
        // 如果有具体的物品ID，使用具体的攻击力值
        if (this.itemId) {
            const specificAttackPower = {
                // 近战单位
                warrior: 30,     // 战士
                assassin: 20,    // 刺客
                gladiator: 40,   // 角斗士
                barbarian: 40,   // 野蛮人
                giant: 50,       // 巨人
                cavalry: 60,     // 骑兵
                militia: 20,     // 民兵团
                swordmaster: 30, // 剑圣
                titan: 150,      // 泰坦
                
                // 其他兵种
                bow: 20,         // 弓箭手
                staff: 25,       // 法师
                shield: 20,      // 盾牌
                
                // 魔法单位 - 根据JSON配置
                apprentice: 10,      // 学徒 JSON: 10
                waterElemental: 30,  // 水元素 JSON: 30
                golem: 30,           // 魔偶 JSON: 30
                golemArcane: 90,     // 奥数魔像 JSON: 90
                archmage: 50,        // 大法师 JSON: 50
                alchemist: 20,       // 药剂师 JSON: 20
                witch: 10,           // 女巫 JSON: 10
                dragonMagic: 70      // 魔法巨龙 JSON: 70
            };
            
            if (specificAttackPower[this.itemId]) {
                return specificAttackPower[this.itemId];
            }
        }

        // 备用：使用通用类型攻击力
        const powers = {
            melee: 25,
            ranged: 20,
            tank: 15,
            mage: 25
        };
        return powers[this.type] || 20;
    }

    getAttackRange() {
        const ranges = {
            melee: 30,
            ranged: 80,
            tank: 35,
            mage: 50
        };
        return ranges[this.type] || 50;
    }

    getAreaAttackRadius() {
        // 只有魔法巨龙才有范围攻击
        if (this.itemId === 'dragonMagic') {
            const quality = this.itemQuality || 4; // 默认橙色品质
            const unitWidth = 20; // 单位宽度
            // 橙色：1.2倍单位宽度，红色：1.8倍单位宽度
            const radiusMap = {
                4: Math.round(unitWidth * 1.2),  // 橙色：24像素
                5: Math.round(unitWidth * 1.8)   // 红色：36像素
            };
            return radiusMap[quality] || Math.round(unitWidth * 1.2);
        }
        return 0; // 其他单位没有范围攻击
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
                // 近战单位 - 按尺寸设计
                warrior: 20,     // 小型
                assassin: 20,    // 小型
                gladiator: 20,   // 小型
                barbarian: 20,   // 小型
                giant: 40,       // 中型
                cavalry: 40,     // 中型
                militia: 20,     // 特殊：每个人20
                swordmaster: 20, // 小型
                titan: 60,       // 大型
                
                // 其他兵种 - 小型标准
                bow: 20,
                staff: 20,
                shield: 20,
                
                // 魔法单位 - 根据JSON配置
                apprentice: 20,     // 学徒 JSON: 20
                waterElemental: 40, // 水元素 JSON: 40
                golem: 40,          // 魔偶 JSON: 40
                golemArcane: 60,    // 奥数魔像 JSON: 60
                archmage: 20,       // 大法师 JSON: 20
                alchemist: 20,      // 药剂师 JSON: 20
                witch: 20,          // 女巫 JSON: 20
                dragonMagic: 60     // 魔法巨龙 JSON: 60
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
                gladiator: '🪓', 
                barbarian: '👹',
                giant: '💪',
                cavalry: '🐎',
                militia: '👪',
                swordmaster: '🥋',
                titan: '🗿',
                
                // 其他兵种
                bow: '🏹',
                staff: '🔮',
                shield: '🛡️',
                
                // 魔法单位
                apprentice: '🧝‍♂️',
                waterElemental: '🌊',
                golem: '🤖',
                golemArcane: '🧞‍♂️',
                archmage: '🧙‍♂️',
                alchemist: '⚗️',
                witch: '🧙🏿‍♀️',
                dragonMagic: '🐉'
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
        
        // 获取总攻击目标数量
        const totalTargets = this.getTotalTargetCount();
        
        // 如果攻击目标数大于1，使用多目标攻击
        if (totalTargets > 1) {
            this.multiTargetAttack();
        } else {
            // 普通单目标攻击
            const damage = this.attackPower + Utils.randomInt(-5, 5);
            this.target.takeDamage(damage, this);
        }

        // 播放攻击效果
        Utils.playSound('attack');
        
        // 特殊攻击效果
        if (this.type === 'mage') {
            // 法师有范围伤害
            this.areaAttack();
        }
    }

    areaAttack() {
        // 魔法巨龙的范围攻击
        if (this.itemId === 'dragonMagic' && this.areaAttackRadius > 0) {
            this.dragonAreaAttack();
        }
        // 其他法师的范围攻击（目前为空）
    }

    // 魔法巨龙的范围攻击实现
    dragonAreaAttack() {
        if (!this.target || !this.target.alive) return;
        
        // 显示攻击范围效果
        if (window.game && window.game.renderer) {
            window.game.renderer.addAreaAttackEffect(this.target.x, this.target.y, this.areaAttackRadius);
        }
        
        // 获取可攻击的敌人单位列表
        const enemyUnits = this.getEnemyUnits();
        
        // 找到主目标周围范围内的所有敌人
        const enemiesInRange = enemyUnits.filter(enemy => {
            if (!enemy.alive) return false;
            const distance = Utils.distance(this.target.x, this.target.y, enemy.x, enemy.y);
            return distance <= this.areaAttackRadius;
        });
        
        console.log(`魔法巨龙范围攻击：范围内${enemiesInRange.length}个敌人`);
        
        // 对每个敌人计算距离递减伤害
        enemiesInRange.forEach((enemy, index) => {
            const distance = Utils.distance(this.target.x, this.target.y, enemy.x, enemy.y);
            
            // 计算伤害比例：100%到20%线性递减
            let damageRatio;
            if (distance === 0) {
                damageRatio = 1.0; // 主目标100%伤害
            } else {
                // 距离越远伤害越低，最边缘20%伤害
                damageRatio = 1.0 - (distance / this.areaAttackRadius) * 0.8;
                damageRatio = Math.max(0.2, damageRatio); // 确保最低20%伤害
            }
            
            const baseDamage = this.attackPower + Utils.randomInt(-5, 5);
            const finalDamage = Math.floor(baseDamage * damageRatio);
            
            enemy.takeDamage(finalDamage, this);
            
            const percentage = Math.round(damageRatio * 100);
            console.log(`魔法巨龙范围攻击目标${index + 1}：距离${distance.toFixed(1)}，${percentage}%伤害(${finalDamage})`);
        });
        
        if (enemiesInRange.length === 0) {
            console.log('魔法巨龙范围攻击：主目标周围无其他敌人');
        }
    }

    // 多目标攻击（通用方法）
    multiTargetAttack() {
        // 获取总攻击目标数量
        const targetCount = this.getTotalTargetCount();
        
        // 获取可攻击的敌人单位列表（需要从游戏中获取）
        const enemyUnits = this.getEnemyUnits();
        
        // 筛选攻击范围内的敌人
        const enemiesInRange = enemyUnits.filter(enemy => {
            if (!enemy.alive) return false;
            const distance = Utils.distance(this.x, this.y, enemy.x, enemy.y);
            return distance <= this.attackRange;
        });
        
        // 按距离排序，选择最近的N个目标
        const targets = enemiesInRange
            .sort((a, b) => {
                const distA = Utils.distance(this.x, this.y, a.x, a.y);
                const distB = Utils.distance(this.x, this.y, b.x, b.y);
                return distA - distB;
            })
            .slice(0, targetCount);
        
        console.log(`${this.itemId}多目标攻击：范围内${enemiesInRange.length}个敌人，攻击${targets.length}个目标`);
        
        // 对每个目标造成完整伤害
        targets.forEach((target, index) => {
            const damage = this.attackPower + Utils.randomInt(-5, 5);
            target.takeDamage(damage, this);
            console.log(`${this.itemId}攻击目标${index + 1}：对${target.itemId || 'enemy'}造成${damage}伤害`);
        });
        
        // 如果没有目标，攻击失效
        if (targets.length === 0) {
            console.log(`${this.itemId}多目标攻击：攻击范围内没有敌人`);
        }
    }

    // 获取总的攻击目标数量（基础1个 + 女巫品质加成 + 魔法阵加成）
    getTotalTargetCount() {
        let baseTargets = 1; // 基础攻击目标数
        
        // 女巫特殊技能：根据品质增加攻击目标
        if (this.itemId === 'witch') {
            const quality = this.itemQuality || 3;
            const targetMap = {
                3: 2, // 紫色：2个目标
                4: 3, // 橙色：3个目标  
                5: 4  // 红色：4个目标
            };
            baseTargets = targetMap[quality] || 2;
        }
        
        // 加上魔法阵等提供的额外目标数
        const totalTargets = baseTargets + this.extraTargets;
        
        console.log(`${this.itemId}攻击目标数: 基础${baseTargets} + 额外${this.extraTargets} = 总计${totalTargets}`);
        return totalTargets;
    }

    // 获取女巫根据品质的攻击目标数量（保留用于兼容性）
    getWitchTargetCount() {
        return this.getTotalTargetCount();
    }

    // 获取敌方单位列表（需要从游戏系统中获取）
    getEnemyUnits() {
        // 从全局游戏对象获取敌方单位列表
        if (window.game) {
            return this.team === 'player' ? window.game.enemyUnits : window.game.playerUnits;
        }
        return [];
    }

    takeDamage(damage, attacker = null) {
        let actualDamage = damage;
        
        // 巨人特殊能力：受到非近战伤害-40%
        if (this.itemId === 'giant') {
            console.log(`巨人单位受到攻击 - 攻击者类型: ${attacker ? attacker.type : 'null'}, 原始伤害: ${damage}`);
            if (attacker && attacker.type !== 'melee') {
                actualDamage = Math.floor(damage * 0.6); // 减免40%，只受60%伤害
                console.log(`巨人单位非近战减伤生效: ${damage} -> ${actualDamage}`);
            } else {
                console.log(`巨人单位受到近战攻击，无减伤`);
            }
        }
        
        // 护盾逻辑：护盾优先承受伤害
        if (this.shield > 0) {
            if (actualDamage >= this.shield) {
                // 伤害超过护盾，护盾破碎，剩余伤害作用于血量
                const remainingDamage = actualDamage - this.shield;
                console.log(`泰坦护盾破碎！护盾吸收${this.shield}伤害，剩余${remainingDamage}伤害作用于血量`);
                this.shield = 0;
                this.health -= remainingDamage;
                // 播放护盾破碎效果
                this.triggerShieldBreak();
            } else {
                // 护盾完全吸收伤害
                this.shield -= actualDamage;
                console.log(`泰坦护盾吸收${actualDamage}伤害，剩余护盾: ${this.shield}`);
                // 播放护盾受击效果
                this.triggerShieldHit();
                return; // 护盾吸收了所有伤害，不影响血量
            }
        } else {
            // 没有护盾，直接扣血量
            this.health -= actualDamage;
        }
        
        if (this.health <= 0) {
            this.health = 0;
            this.alive = false;
            
            // 通知游戏系统有单位死亡（用于角斗士技能）
            if (window.game && attacker) {
                window.game.onEnemyKilled(this, attacker);
            }
        }

        // 受伤效果
        Utils.vibrate(50);
    }

    // 护盾受击特效
    triggerShieldHit() {
        // 添加蓝色闪烁效果
        this.shieldHitEffect = 10; // 10帧的蓝色闪烁
    }

    // 护盾破碎特效
    triggerShieldBreak() {
        // 添加护盾破碎动画效果
        this.shieldBreakEffect = 20; // 20帧的破碎动画
        Utils.playSound('shield_break'); // 护盾破碎音效
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

        // 绘制泰坦护盾光环特效（只在非战斗阶段显示）
        if (this.itemId === 'titan' && this.shield > 0 && window.game && window.game.gamePhase !== 'battle') {
            this.renderShieldAura(ctx);
        }

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
        let currentY = this.y - this.size / 2 - 8;

        // 如果有护盾，绘制护盾条
        if (this.maxShield > 0) {
            const shieldPercent = this.shield / this.maxShield;
            
            // 护盾条背景
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(barX, currentY, barWidth, barHeight);
            
            // 护盾条
            ctx.fillStyle = this.shieldHitEffect > 0 ? '#f1c40f' : '#f39c12'; // 受击时亮橙色，正常时橙色
            ctx.fillRect(barX, currentY, barWidth * shieldPercent, barHeight);
            
            // 护盾条边框
            ctx.strokeStyle = '#e67e22';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, currentY, barWidth, barHeight);
            
            // 更新Y坐标，为血条留空间
            currentY += barHeight + 2;
        }

        // 血条背景
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, currentY, barWidth, barHeight);

        // 血条
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.6 ? '#4CAF50' : 
                       healthPercent > 0.3 ? '#FFA500' : '#F44336';
        ctx.fillRect(barX, currentY, barWidth * healthPercent, barHeight);

        // 血条边框
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, currentY, barWidth, barHeight);

        // 更新特效计时器
        if (this.shieldHitEffect > 0) {
            this.shieldHitEffect--;
        }
        if (this.shieldBreakEffect > 0) {
            this.shieldBreakEffect--;
        }
    }

    // 渲染泰坦护盾光环
    renderShieldAura(ctx) {
        const time = Date.now() * 0.005; // 缓慢旋转
        const shieldStrength = this.shield / this.maxShield;
        
        // 护盾光环的透明度基于护盾剩余量
        const alpha = 0.3 + (shieldStrength * 0.4);
        
        // 绘制外圈光环
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.lineDashOffset = time * 10; // 旋转虚线
        
        const radius = this.size * 0.8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // 如果护盾受击，绘制闪烁效果
        if (this.shieldHitEffect > 0) {
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius - 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// 基地类
class Base {
    constructor(team, x, y, wave = 1) {
        this.team = team;
        this.x = x;
        this.y = y;
        this.health = this.maxHealth = 50 + 50 * wave;  // 50 + 50 × 波数
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