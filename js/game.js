// 游戏核心逻辑
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        
        // 游戏状态
        this.gameState = 'playing'; // 'playing', 'paused', 'gameover'
        this.gamePhase = 'preparation'; // 'preparation', 'battle'
        this.playerGold = 12; // 初始金币12
        this.enemyGold = 200; // 降低第1关敌人初始金币
        this.wave = 1;
        this.showWaveInfo = false;
        this.waveInfoTimer = 0;
        
        // 游戏实体
        this.playerUnits = [];
        this.enemyUnits = [];
        this.playerBase = null;
        this.enemyBase = null;
        
        // 背包系统
        this.inventorySystem = null;
        
        // AI设置
        this.enemyAI = {
            spawnTimer: 0,
            spawnInterval: 300 // 5秒，第1波初始速度
        };
        
        // 游戏计时器
        this.gameTimer = 0;
        this.goldTimer = 0;
        this.goldInterval = 120; // 2秒获得金币
        
        this.init();
    }

    init() {
        // 调整画布大小
        this.renderer.resize();
        
        // 创建基地（传入当前波数）
        this.playerBase = new Base('player', 30, this.canvas.height / 2, this.wave);
        this.enemyBase = new Base('enemy', this.canvas.width - 30, this.canvas.height / 2, this.wave);
        
        // 初始化背包系统
        this.inventorySystem = new InventorySystem(this);
        
        // 绑定事件
        this.bindEvents();
        
        // 开始游戏循环
        this.gameLoop();
        
        // 初始化UI状态
        this.updatePhaseUI();
        
        // 显示第一波信息
        this.showWave(1);
    }

    // 敌人被消灭时的回调（用于角斗士技能）
    onEnemyKilled(deadEnemy, killer) {
        // 只有玩家的近战单位击杀敌人才触发角斗士技能
        if (killer.team === 'player' && killer.type === 'melee') {
            this.inventorySystem.boostGladiatorAttack();
        }
    }

    bindEvents() {
        // 游戏结束界面按钮
        document.getElementById('restart-game').addEventListener('click', () => {
            window.location.reload();
        });

        document.getElementById('back-to-menu').addEventListener('click', () => {
            window.location.reload();
        });

        // 开始战斗按钮
        document.getElementById('start-battle-btn').addEventListener('click', () => {
            this.startBattle();
        });

        // 窗口大小调整
        window.addEventListener('resize', () => {
            this.renderer.resize();
        });
    }

    startBattle() {
        if (this.gamePhase === 'preparation') {
            this.gamePhase = 'battle';
            this.updatePhaseUI();
            
            // 开始生产敌方单位
            this.enemyAI.spawnTimer = 0;
        }
    }

    endBattle() {
        this.gamePhase = 'preparation';
        this.updatePhaseUI();
        
        // 清理战斗状态
        this.playerUnits = [];
        this.enemyUnits = [];
        
        // 法杖成长：战斗胜利时增强
        this.inventorySystem.onBattleVictory();
        
        // 重置所有物品的进度条为0
        this.inventorySystem.resetAllItemCooldowns();
        
        // 重置剑圣攻击力加成
        this.inventorySystem.resetSwordmasterBonuses();
        
        // 重置宝剑攻击力加成
        this.inventorySystem.resetAttackBonuses();
        
        // 重置角斗士攻击力加成
        this.inventorySystem.resetGladiatorBonuses();
        
        // 进入下一波
        this.nextWave();
    }

    updatePhaseUI() {
        const enemyIntro = document.getElementById('enemy-intro');
        const battlefield = document.getElementById('battlefield');
        const shopSection = document.querySelector('.shop-section');
        const backpackSection = document.querySelector('.backpack-section');
        const backpackBtn = document.getElementById('backpack-btn');
        const goldDisplay = document.querySelector('.gold-display');
        
        if (this.gamePhase === 'preparation') {
            // 备战阶段：显示敌人介绍、商店、背包，隐藏战场
            enemyIntro.classList.remove('hidden');
            battlefield.classList.add('hidden');
            shopSection.style.display = 'flex';
            
            // 显示背包按钮和金钱显示
            if (backpackBtn) backpackBtn.style.display = 'block';
            if (goldDisplay) goldDisplay.style.display = 'flex';
            
            // 更新敌人介绍内容
            this.updateEnemyIntro();
            
            // 如果背包是打开的，保持显示；否则隐藏
            if (!this.inventorySystem.backpackOpen) {
                backpackSection.classList.add('hidden');
            }
            
            // 刷新战斗区物品显示，恢复拖拽功能
            this.inventorySystem.updateInventoryDisplay();
        } else if (this.gamePhase === 'battle') {
            // 战斗阶段：显示战场，隐藏敌人介绍、商店、背包
            console.log('切换到战斗阶段');
            console.log('战场元素：', battlefield);
            console.log('战场元素类名：', battlefield.className);
            
            enemyIntro.classList.add('hidden');
            battlefield.classList.remove('hidden');
            shopSection.style.display = 'none';
            backpackSection.classList.add('hidden');
            
            // 隐藏背包按钮和金钱显示
            if (backpackBtn) backpackBtn.style.display = 'none';
            if (goldDisplay) goldDisplay.style.display = 'none';
            
            console.log('移除hidden类后的战场类名：', battlefield.className);
            console.log('战场元素计算样式display：', window.getComputedStyle(battlefield).display);
            console.log('战场元素计算样式visibility：', window.getComputedStyle(battlefield).visibility);
            console.log('战场元素计算样式height：', window.getComputedStyle(battlefield).height);
            console.log('战场元素计算样式width：', window.getComputedStyle(battlefield).width);
            
            // 重新调整画布大小以确保正确显示
            setTimeout(() => {
                this.renderer.resize();
                // 重新调整基地位置
                this.playerBase.x = 30;
                this.playerBase.y = this.canvas.height / 2;
                this.enemyBase.x = this.canvas.width - 30;
                this.enemyBase.y = this.canvas.height / 2;
                console.log('画布大小已重新调整，基地位置已更新');
                console.log('画布尺寸：', this.canvas.width, 'x', this.canvas.height);
            }, 100);
            
            // 强制关闭背包
            this.inventorySystem.backpackOpen = false;
            
            // 重置所有物品的冷却时间，开始战斗冷却
            this.inventorySystem.startBattleCooldown();
            
            // 刷新战斗区物品显示，禁用拖拽功能
            this.inventorySystem.updateInventoryDisplay();
        }
    }

    updateEnemyIntro() {
        const title = document.getElementById('enemy-intro-title');
        const enemyIcon = document.getElementById('enemy-main-icon');
        const enemyTypeName = document.getElementById('enemy-type-name');
        
        title.textContent = `第 ${this.wave} 波敌军`;
        
        // 根据波数确定敌人类型
        const enemyTypes = [
            { icon: '⚔️', name: '近战兵团' },
            { icon: '🏹', name: '弓箭军团' },
            { icon: '🛡️', name: '重装部队' },
            { icon: '🔮', name: '法师军团' },
            { icon: '⚔️🏹', name: '混合军团' },
            { icon: '🛡️⚔️', name: '精锐军团' },
            { icon: '🔮⚔️', name: '魔战军团' },
            { icon: '🏹🛡️', name: '守护军团' },
            { icon: '⚔️🔮🏹', name: '联合军团' },
            { icon: '👑', name: '王牌军团' }
        ];
        
        const currentType = enemyTypes[Math.min(this.wave - 1, enemyTypes.length - 1)];
        enemyIcon.textContent = currentType.icon;
        enemyTypeName.textContent = currentType.name;
    }

    spawnPlayerUnitByType(type) {
        if (this.gameState === 'playing' && this.gamePhase === 'battle') {
            const unit = new Unit(type, 'player', 
                70 + Utils.randomInt(-20, 20), 
                this.canvas.height / 2 + Utils.randomInt(-30, 30)
            );
            
            this.playerUnits.push(unit);
            Utils.playSound('spawn');
        }
    }

    spawnPlayerUnitBySpecificType(itemId, unitType, bonusAttack = 0, bonusHealth = 0, itemQuality = null, extraTargets = 0) {
        if (this.gameState === 'playing' && this.gamePhase === 'battle') {
            const unit = new Unit(unitType, 'player', 
                70 + Utils.randomInt(-20, 20), 
                this.canvas.height / 2 + Utils.randomInt(-30, 30),
                itemId,  // 传递具体的物品ID
                itemQuality,  // 传递物品品质
                extraTargets  // 传递额外攻击目标数
            );
            
            // 应用额外的攻击力加成（主要用于角斗士）
            if (bonusAttack > 0) {
                unit.attackPower += bonusAttack;
                console.log(`${itemId} 单位获得攻击力加成 +${bonusAttack}，总攻击力: ${unit.attackPower}`);
            }
            
            // 应用额外的生命值加成（主要用于巨人）
            if (bonusHealth > 0) {
                unit.health += bonusHealth;
                unit.maxHealth += bonusHealth;
                console.log(`${itemId} 单位获得生命值加成 +${bonusHealth}，总生命值: ${unit.maxHealth}`);
            }
            
            this.playerUnits.push(unit);
            Utils.playSound('spawn');
        }
    }

    spawnEnemyUnit() {
        if (this.gameState !== 'playing' || this.gamePhase !== 'battle') return;
        
        // 根据波数确定本次刷怪数量
        const spawnCount = this.getWaveSpawnCount();
        
        // 应用波次数值成长：每波×1.05倍数值（第1波=1.0倍，第2波=1.05倍，第3波=1.10倍...）
        const waveMultiplier = Math.pow(1.05, this.wave - 1);
        
        for (let i = 0; i < spawnCount; i++) {
            // 根据波数选择兵种类型
            const unitType = this.getWaveUnitType();
            
            const unit = new Unit(unitType, 'enemy',
                this.canvas.width - 70 + Utils.randomInt(-20, 20),
                this.canvas.height / 2 + Utils.randomInt(-30, 30)
            );
            
            // 增强怪物血量和攻击力
            unit.health = Math.round(unit.health * waveMultiplier);
            unit.maxHealth = unit.health;
            unit.attackPower = Math.round(unit.attackPower * waveMultiplier);
            
            const cost = unit.getCost();
            if (this.enemyGold >= cost) {
                this.enemyGold -= cost;
                this.enemyUnits.push(unit);
            } else {
                // 金币不足时停止生产
                break;
            }
        }
        
        if (spawnCount > 1) {
            console.log(`第${this.wave}波敌人: 生产${spawnCount}个单位, 强化倍数: ${waveMultiplier.toFixed(2)}倍`);
        }
    }

    getWaveSpawnCount() {
        // 根据波数确定每次刷怪数量
        if (this.wave >= 10) {
            return 4; // 第10波每次刷4个
        } else if (this.wave >= 8) {
            return 3; // 第8-9波每次刷3个
        } else if (this.wave >= 5) {
            return 2; // 第5-7波每次刷2个
        } else if (this.wave === 1) {
            return 1; // 第1波每次刷1个
        } else {
            return 1; // 第2-4波每次刷1个
        }
    }

    getWaveUnitType() {
        // 每波的兵种配置 - 按照波次名称设计
        const waveConfigs = {
            1: { // 近战兵团 ⚔️
                melee: 90,   // 90%近战
                tank: 10     // 10%坦克
            },
            2: { // 弓箭军团 🏹
                ranged: 70,  // 70%远程
                melee: 20,   // 20%近战
                mage: 10     // 10%法师
            },
            3: { // 重装部队 🛡️
                tank: 60,    // 60%坦克
                melee: 30,   // 30%近战
                ranged: 10   // 10%远程
            },
            4: { // 法师军团 🔮
                mage: 60,    // 60%法师
                ranged: 25,  // 25%远程
                melee: 15    // 15%近战
            },
            5: { // 混合军团 ⚔️🏹
                melee: 40,   // 40%近战
                ranged: 40,  // 40%远程
                tank: 15,    // 15%坦克
                mage: 5      // 5%法师
            },
            6: { // 精锐军团 🛡️⚔️
                melee: 45,   // 45%近战
                tank: 45,    // 45%坦克
                ranged: 10   // 10%远程
            },
            7: { // 魔战军团 🔮⚔️
                mage: 50,    // 50%法师
                melee: 35,   // 35%近战
                ranged: 15   // 15%远程
            },
            8: { // 守护军团 🏹🛡️
                ranged: 45,  // 45%远程
                tank: 45,    // 45%坦克
                mage: 10     // 10%法师
            },
            9: { // 联合军团 ⚔️🔮🏹
                melee: 35,   // 35%近战
                mage: 35,    // 35%法师
                ranged: 30   // 30%远程
            },
            10: { // 王牌军团 👑 (全兵种平衡但更强)
                melee: 25,   // 25%近战
                ranged: 25,  // 25%远程
                tank: 25,    // 25%坦克
                mage: 25     // 25%法师
            }
        };

        const config = waveConfigs[this.wave] || waveConfigs[1];
        
        // 根据概率选择兵种
        const rand = Utils.randomInt(1, 100);
        let cumulative = 0;
        
        for (const [unitType, probability] of Object.entries(config)) {
            cumulative += probability;
            if (rand <= cumulative) {
                return unitType;
            }
        }
        
        // 默认返回近战（不应该到达这里）
        return 'melee';
    }

    updateUnits() {
        // 更新玩家单位
        for (let i = this.playerUnits.length - 1; i >= 0; i--) {
            const unit = this.playerUnits[i];
            
            if (!unit.alive) {
                // 单位死亡，给敌方金币奖励
                this.enemyGold += Math.floor(unit.cost / 4);
                this.renderer.addExplosion(unit.x, unit.y);
                this.playerUnits.splice(i, 1);
                continue;
            }
            
            // 检查是否到达敌方基地
            const distanceToEnemyBase = Utils.distance(
                unit.x, unit.y, 
                this.enemyBase.x, this.enemyBase.y
            );
            
            if (distanceToEnemyBase < 50) {
                const baseDamage = unit.calculateBaseDamage();
                this.enemyBase.takeDamage(baseDamage);
                this.renderer.addExplosion(unit.x, unit.y);
                this.playerUnits.splice(i, 1);
                continue;
            }
            
            unit.update(this.enemyUnits, this.canvas);
        }

        // 更新敌方单位
        for (let i = this.enemyUnits.length - 1; i >= 0; i--) {
            const unit = this.enemyUnits[i];
            
            if (!unit.alive) {
                // 单位死亡
                this.renderer.addExplosion(unit.x, unit.y);
                this.enemyUnits.splice(i, 1);
                continue;
            }
            
            // 检查是否到达玩家基地
            const distanceToPlayerBase = Utils.distance(
                unit.x, unit.y, 
                this.playerBase.x, this.playerBase.y
            );
            
            if (distanceToPlayerBase < 50) {
                const baseDamage = unit.calculateBaseDamage();
                this.playerBase.takeDamage(baseDamage);
                this.enemyGold += unit.cost;
                this.renderer.addExplosion(unit.x, unit.y);
                this.enemyUnits.splice(i, 1);
                continue;
            }
            
            unit.update(this.playerUnits, this.canvas);
        }
    }

    updateAI() {
        if (this.gameState !== 'playing' || this.gamePhase !== 'battle') return;
        
        this.enemyAI.spawnTimer++;
        
        if (this.enemyAI.spawnTimer >= this.enemyAI.spawnInterval) {
            this.enemyAI.spawnTimer = 0;
            this.spawnEnemyUnit();
            
            // 根据波数设置生产间隔 - 渐进式加快
            this.enemyAI.spawnInterval = this.getWaveSpawnInterval();
        }
        
        // 敌方也获得金币
        this.enemyGold += 1;
    }

    getWaveSpawnInterval() {
        // 每波的生产间隔（帧数，60帧=1秒）
        // 指定每波的刷新间隔
        const intervalSeconds = {
            1: 4.0,   // 第1波: 4秒 (-1.0s)
            2: 3.5,   // 第2波: 3.5秒 (-1.0s)
            3: 3.0,   // 第3波: 3秒 (-1.0s)
            4: 2.5,   // 第4波: 2.5秒 (-1.0s)
            5: 3.5,   // 第5波: 3.5秒 (-1.0s)
            6: 3.0,   // 第6波: 3秒 (-1.0s)
            7: 2.5,   // 第7波: 2.5秒 (-1.0s)
            8: 3.5,   // 第8波: 3.5秒 (-1.0s)
            9: 3.0,   // 第9波: 3秒 (-1.0s)
            10: 2.5   // 第10波: 2.5秒 (-1.0s)
        };
        
        const seconds = intervalSeconds[this.wave] || 3.0; // 默认3秒 (-1.0s)
        const intervalFrames = Math.round(seconds * 60);
        
        console.log(`第${this.wave}波刷怪间隔: ${seconds}秒 (${intervalFrames}帧)`);
        return intervalFrames;
    }


    updateGoldGeneration() {
        // 战斗中不再获得金币
    }


    showWave(wave) {
        // 显示新的波次覆盖层
        const waveDisplay = document.getElementById('wave-display');
        const waveNumber = document.getElementById('wave-number');
        
        waveNumber.textContent = wave;
        waveDisplay.classList.remove('hidden');
        
        // 3秒后隐藏
        setTimeout(() => {
            waveDisplay.classList.add('hidden');
        }, 3000);
    }

    showGoldEffect(x, y, text) {
        const effect = Utils.createEffect(text, x, y, 'gold-earn-effect');
        effect.style.color = '#FFD700';
        effect.style.fontWeight = 'bold';
        effect.style.fontSize = '14px';
    }

    checkGameOver() {
        if (!this.playerBase.alive) {
            this.gameState = 'gameover';
            this.showGameOverScreen('defeat');
        } else if (!this.enemyBase.alive && this.gamePhase === 'battle') {
            // 敌方基地被摧毁，结束战斗
            this.endBattle();
        }
    }
    
    nextWave() {
        this.wave++;
        
        // 检查是否已经完成10波，游戏胜利
        if (this.wave > 10) {
            this.gameState = 'gameover';
            this.showGameOverScreen('victory');
            return;
        }
        
        // 重置双方基地血量（基于新波数）
        const newHealth = 50 + 50 * this.wave;
        this.playerBase.health = this.playerBase.maxHealth = newHealth;
        this.playerBase.wave = this.wave;
        this.enemyBase.health = this.enemyBase.maxHealth = newHealth;
        this.enemyBase.wave = this.wave;
        this.enemyBase.alive = true;
        
        // 清除敌方单位
        this.enemyUnits = [];
        
        // 增强敌方实力
        this.enemyGold += this.wave * 50;
        this.enemyAI.spawnInterval = Math.max(90, 240 - this.wave * 15);
        
        // 显示新波次
        this.showWave(this.wave);
        
        // 每波开始给予5*波次数的金币
        const waveGold = 5 * this.wave;
        this.playerGold += waveGold;
        console.log(`第${this.wave}波开始，获得${waveGold}金币`);
        
        // 重置商店刷新次数
        this.inventorySystem.refreshesUsedThisWave = 0;
        
        // 新波开始时免费刷新商店
        this.inventorySystem.generateShopItems();
        
        // 切换到备战阶段
        this.gamePhase = 'preparation';
        this.updatePhaseUI();
        
        this.updateUI();
    }

    showGameOverScreen(result) {
        const gameOverDiv = document.getElementById('game-over');
        const resultTitle = document.getElementById('game-result');
        const resultText = document.getElementById('game-result-text');
        
        if (result === 'victory') {
            resultTitle.textContent = '🎉 完美胜利！';
            resultText.textContent = `恭喜！你成功通关了全部10波战斗！\n成为真正的战略大师！`;
            resultTitle.style.color = '#4CAF50';
        } else {
            resultTitle.textContent = '💀 战败';
            resultText.textContent = `你的基地被摧毁了...\n在第 ${this.wave} 波战斗中败北`;
            resultTitle.style.color = '#F44336';
        }
        
        gameOverDiv.classList.remove('hidden');
    }




    updateUI() {
        // 更新资源显示
        document.getElementById('player-gold').textContent = Utils.formatNumber(this.playerGold);
        
        // 更新当前波次显示
        document.getElementById('current-wave').textContent = `${this.wave}/10`;
        
        // 更新血条
        const playerHealthPercent = this.playerBase.health / this.playerBase.maxHealth * 100;
        const enemyHealthPercent = this.enemyBase.health / this.enemyBase.maxHealth * 100;
        
        document.getElementById('player-health').style.width = playerHealthPercent + '%';
        document.getElementById('enemy-health').style.width = enemyHealthPercent + '%';
        
        document.getElementById('player-health-text').textContent = 
            `${Math.ceil(this.playerBase.health)}/${this.playerBase.maxHealth}`;
        document.getElementById('enemy-health-text').textContent = 
            `${Math.ceil(this.enemyBase.health)}/${this.enemyBase.maxHealth}`;
    }

    gameLoop() {
        // 游戏主循环
        if (this.gameState === 'playing') {
            this.gameTimer++;
            
            // 更新游戏逻辑
            this.updateUnits();
            this.updateAI();
            this.updateGoldGeneration();
            this.checkGameOver();
            
            // 更新背包系统
            this.inventorySystem.update();
            
            // 更新波数信息显示
            if (this.waveInfoTimer > 0) {
                this.waveInfoTimer--;
                if (this.waveInfoTimer <= 0) {
                    this.showWaveInfo = false;
                }
            }
        }
        
        // 渲染
        this.render();
        
        // 更新UI
        if (this.gameTimer % 10 === 0) { // 每10帧更新一次UI
            this.updateUI();
        }
        
        // 下一帧
        requestAnimationFrame(() => this.gameLoop());
    }

    render() {
        // 清除画布
        this.renderer.clear();
        
        // 绘制背景
        this.renderer.drawBackground();
        
        // 绘制基地
        this.renderer.drawBases([this.playerBase, this.enemyBase]);
        
        // 绘制单位
        this.renderer.drawUnits([...this.playerUnits, ...this.enemyUnits]);
        
        // 绘制粒子效果
        this.renderer.drawParticles();
        
        // 绘制UI效果
        this.renderer.drawUI();
    }
}