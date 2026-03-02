// 游戏核心逻辑
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        
        // 游戏状态
        this.gameState = 'playing'; // 'playing', 'paused', 'gameover'
        this.gamePhase = 'preparation'; // 'preparation', 'battle'
        this.playerGold = 20;
        this.enemyGold = 300;
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
            spawnInterval: 240, // 4秒
            strategy: 'balanced'
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
        
        // 重置所有物品的进度条为0
        this.inventorySystem.resetAllItemCooldowns();
        
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

    spawnEnemyUnit() {
        if (this.gameState !== 'playing' || this.gamePhase !== 'battle') return;
        
        // AI选择单位类型
        const unitTypes = ['melee', 'ranged', 'tank', 'mage'];
        let unitType;
        
        switch (this.enemyAI.strategy) {
            case 'aggressive':
                unitType = Utils.randomInt(0, 10) < 7 ? 'melee' : 'ranged';
                break;
            case 'defensive':
                unitType = Utils.randomInt(0, 10) < 6 ? 'tank' : 'ranged';
                break;
            default: // balanced
                unitType = unitTypes[Utils.randomInt(0, unitTypes.length - 1)];
        }
        
        const unit = new Unit(unitType, 'enemy',
            this.canvas.width - 70 + Utils.randomInt(-20, 20),
            this.canvas.height / 2 + Utils.randomInt(-30, 30)
        );
        
        const cost = unit.getCost();
        if (this.enemyGold >= cost) {
            this.enemyGold -= cost;
            this.enemyUnits.push(unit);
        }
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
                this.enemyBase.takeDamage(unit.attackPower);
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
                this.playerBase.takeDamage(unit.attackPower);
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
            
            // 根据波数调整AI策略
            if (this.wave % 3 === 0) {
                this.enemyAI.strategy = 'aggressive';
                this.enemyAI.spawnInterval = 180; // 更快生产
            } else if (this.wave % 5 === 0) {
                this.enemyAI.strategy = 'defensive';
                this.enemyAI.spawnInterval = 300; // 更慢但更强
            } else {
                this.enemyAI.strategy = 'balanced';
                this.enemyAI.spawnInterval = 240;
            }
        }
        
        // 敌方也获得金币
        this.enemyGold += 1;
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
        const newHealth = this.wave * 200;
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
        
        // 每波开始给予20金币
        this.playerGold += 20;
        
        // 重置商店刷新费用为1元
        this.inventorySystem.refreshCost = 1;
        
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