// 敌人物品系统 - 完全镜像玩家物品系统
class EnemyInventorySystem {
    constructor(game) {
        this.game = game;
        this.inventory = new Array(6).fill(null); // 6格战斗区，和玩家一样
        
        // 直接复用玩家系统的核心组件
        this.itemTemplates = game.inventorySystem.itemTemplates;
        this.qualitySystem = game.inventorySystem.qualitySystem;
        
        // 当前波次配置
        this.currentWaveConfig = null;
        
        console.log('敌人物品系统初始化完成');
    }
    
    // 核心更新函数：镜像玩家的update逻辑
    update() {
        if (this.game.gamePhase !== 'battle') return;
        
        this.updateItemCooldowns();
        this.autoProduceUnits();
    }
    
    // CD倒计时更新（镜像玩家逻辑）
    updateItemCooldowns() {
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            if (item && item !== 'occupied' && !item.isReady) {
                // 计算冷却减少量（加速状态下翻倍）
                let cooldownDecrease = 1;
                if (item.accelerationTime > 0) {
                    cooldownDecrease = 2;
                    item.accelerationTime--;
                }
                
                item.cooldownRemaining -= cooldownDecrease;
                if (item.cooldownRemaining <= 0) {
                    item.isReady = true;
                }
            }
        }
    }
    
    // 自动生产单位（镜像玩家逻辑）
    autoProduceUnits() {
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            if (item && item !== 'occupied' && item.isReady) {
                this.useItem(i);
            }
        }
    }
    
    // 使用物品（镜像玩家逻辑）
    useItem(slotIndex) {
        const item = this.inventory[slotIndex];
        if (!item || item === 'occupied' || !item.isReady) return;
        
        // 宝剑特殊效果
        if (item.id === 'magicSword') {
            this.triggerMagicSwordEffect(slotIndex);
        } else {
            this.produceUnits(item, slotIndex);
        }
        
        // 重置CD
        item.cooldownRemaining = this.getActualCooldown(item);
        item.isReady = false;
        
        console.log(`敌人物品${item.template.name}触发生产`);
    }
    
    // 生产单位（镜像玩家逻辑，但调用敌方生成）
    produceUnits(item, itemSlot) {
        const template = item.template;
        
        // 特殊物品处理
        if (item.id === 'warBanner') {
            this.triggerWarBannerAcceleration();
            return;
        }
        
        // 药剂师特殊处理：召唤时加速相邻魔法物品
        if (item.id === 'alchemist') {
            this.triggerAlchemistAcceleration(itemSlot);
        }
        
        // 计算生产单位数量
        let unitCount = template.unitCount;
        if (item.id === 'militia' && item.militiaBonus) {
            unitCount += item.militiaBonus;
            item.militiaBonus = 0;
        }
        
        // 批量生产单位
        for (let i = 0; i < unitCount; i++) {
            setTimeout(() => {
                // 计算各种攻击力加成（完全镜像玩家逻辑）
                let bonusAttack = item.attackBonus || 0;
                let bonusHealth = item.healthBonus || 0;
                
                // 野蛮人攻击力加成
                if (item.id === 'barbarian') {
                    bonusAttack += (item.barbarianAdjacentBonus || 0);
                } else if (item.id === 'golem') {
                    bonusAttack += item.golemAdjacentBonus || 0;
                }
                
                // 法杖技能：所有魔法物品都受到法杖攻击力加成
                if (template.unitType === 'mage') {
                    bonusAttack += item.staffBonus || 0;
                }
                
                // 调用敌方单位生成
                this.game.spawnEnemyUnitBySpecificType(
                    item.id, 
                    template.unitType, 
                    bonusAttack, 
                    bonusHealth, 
                    item.quality
                );
            }, i * 100); // 延迟100ms避免同时生成
        }
        
        // 后续特殊技能触发
        if (item.id === 'militia') {
            item.militiaBonus = (item.militiaBonus || 0) + 1;
        }
    }
    
    // 直接复用玩家的CD计算逻辑
    getActualCooldown(item) {
        return this.game.inventorySystem.getActualCooldown(item);
    }
    
    // 复用玩家的野蛮人逻辑
    applyBarbarianBonus() {
        // 先清除所有加成
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            if (item && item !== 'occupied' && item.barbarianAdjacentBonus) {
                item.barbarianAdjacentBonus = 0;
            }
        }
        
        // 重新应用野蛮人相邻加成
        for (let i = 0; i < this.inventory.length; i++) {
            const barbarianItem = this.inventory[i];
            if (barbarianItem && barbarianItem !== 'occupied' && barbarianItem.id === 'barbarian') {
                this.applySingleBarbarianEffect(i);
            }
        }
    }
    
    // 应用单个野蛮人的效果（复用玩家逻辑）
    applySingleBarbarianEffect(barbarianSlot) {
        const barbarianItem = this.inventory[barbarianSlot];
        if (!barbarianItem || barbarianItem.id !== 'barbarian') return;
        
        const bonus = this.game.inventorySystem.getBarbarianQualityBonus(barbarianItem.quality);
        
        // 检查相邻位置的近战物品
        const adjacentPositions = this.getAdjacentPositions(barbarianSlot, barbarianItem.template.size);
        
        for (const pos of adjacentPositions) {
            const targetItem = this.inventory[pos];
            if (targetItem && targetItem !== 'occupied' && targetItem.template.unitType === 'melee') {
                targetItem.barbarianAdjacentBonus = (targetItem.barbarianAdjacentBonus || 0) + bonus;
                console.log(`敌人野蛮人为位置${pos}的${targetItem.id}提供攻击力加成 +${bonus}`);
            }
        }
    }
    
    // 获取相邻位置（简化版）
    getAdjacentPositions(slot, size) {
        const positions = [];
        
        // 左侧相邻
        if (slot > 0) {
            positions.push(slot - 1);
        }
        
        // 右侧相邻
        if (slot + size < 6) {
            positions.push(slot + size);
        }
        
        return positions;
    }
    
    // 战旗加速效果（复用玩家逻辑）
    triggerWarBannerAcceleration() {
        const accelerationTime = 120; // 2秒
        
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            if (item && item !== 'occupied' && item.template.unitType === 'melee') {
                item.accelerationTime = (item.accelerationTime || 0) + accelerationTime;
                console.log(`敌人战旗为${item.id}提供${accelerationTime/60}秒加速`);
            }
        }
    }
    
    // 宝剑效果（复用玩家逻辑）
    triggerMagicSwordEffect(slotIndex) {
        const swordItem = this.inventory[slotIndex];
        if (!swordItem || swordItem.id !== 'magicSword') return;
        
        const bonus = 15; // 宝剑固定+15攻击力
        const adjacentPositions = this.getAdjacentPositions(slotIndex, swordItem.template.size);
        
        for (const pos of adjacentPositions) {
            const targetItem = this.inventory[pos];
            if (targetItem && targetItem !== 'occupied' && targetItem.template.unitType === 'melee') {
                targetItem.attackBonus = (targetItem.attackBonus || 0) + bonus;
                console.log(`敌人宝剑为位置${pos}的${targetItem.id}提供攻击力 +${bonus}`);
            }
        }
    }
    
    // 波次配置数据
    getWaveConfigs() {
        return {
            1: { // 第1波 - 双学徒阵容
                name: '双学徒阵容',
                icon: '📚',
                description: '两个学徒的基础魔法阵容',
                layout: [
                    {item: 'apprentice', slot: 1, quality: 1}, // 绿色学徒：第2格
                    {item: 'apprentice', slot: 4, quality: 1}  // 绿色学徒：第5格
                ]
            },
            2: { // 第2波 - 魔法先锋
                name: '魔法先锋',
                icon: '🔮',
                description: '魔法单位的初次登场',
                layout: [
                    {item: 'apprentice', slot: 1, quality: 1}, // 绿色学徒：第2格
                    {item: 'staff', slot: 2, quality: 1},      // 绿色法杖：第3格
                    {item: 'waterElemental', slot: 3, quality: 1} // 绿色水元素：第4格
                ]
            },
            3: { // 第3波 - 魔像守卫
                name: '魔像守卫',
                icon: '🗿',
                description: '魔像配合学徒和战士',
                layout: [
                    {item: 'golem', slot: 0, quality: 2},      // 蓝色魔偶：第1-2格（占2格：0,1）
                    {item: 'apprentice', slot: 2, quality: 2}, // 蓝色学徒：第3格
                    {item: 'warrior', slot: 3, quality: 2}     // 蓝色战士：第4格
                ]
            },
            4: { // 第4波 - 混合战团
                name: '混合战团',
                icon: '⚔️',
                description: '多兵种协同作战',
                layout: [
                    {item: 'warrior', slot: 0, quality: 1},    // 绿色战士：第1格
                    {item: 'gladiator', slot: 1, quality: 2},  // 蓝色狂战士：第2格
                    {item: 'assassin', slot: 2, quality: 2},   // 蓝色忍者：第3格
                    {item: 'cavalry', slot: 3, quality: 1}     // 绿色骑兵：第4格
                ]
            },
            5: { // 第5波 - 炼金法师
                name: '炼金法师',
                icon: '🧪',
                description: '魔法与炼金的结合',
                layout: [
                    {item: 'apprentice', slot: 0, quality: 3}, // 紫色学徒：第1格
                    {item: 'alchemist', slot: 1, quality: 3},  // 紫色药剂师：第2格
                    {item: 'golem', slot: 2, quality: 2},      // 蓝色魔偶：第3-4格（占2格：2,3）
                    {item: 'waterElemental', slot: 4, quality: 2} // 蓝色水元素：第5格
                ]
            },
            6: { // 第6波 - 战旗军团
                name: '战旗军团',
                icon: '🏴',
                description: '战旗加速的精英军团',
                layout: [
                    {item: 'cavalry', slot: 0, quality: 2},    // 蓝色骑兵：快速突击
                    {item: 'warBanner', slot: 2, quality: 3},  // 紫色战旗：加速所有近战（占2格：2,3）
                    {item: 'cavalry', slot: 4, quality: 2}     // 蓝色骑兵：快速突击
                ]
            },
            7: { // 第7波 - 巨人军团
                name: '巨人军团',
                icon: '🗿',
                description: '巨人与民兵的组合',
                layout: [
                    {item: 'giant', slot: 0, quality: 3},      // 紫色巨人：高血量坦克
                    {item: 'militia', slot: 3, quality: 2}     // 蓝色民兵团：数量优势（占3格：3,4,5）
                ]
            },
            8: { // 第8波 - 奥数实验室
                name: '奥数实验室',
                icon: '🧞‍♂️',
                description: '高等魔法研究阵容',
                layout: [
                    {item: 'golemArcane', slot: 0, quality: 3}, // 紫色奥数魔像：核心单位（占3格：0,1,2）
                    {item: 'apprentice', slot: 3, quality: 2},  // 蓝色学徒：魔法加成
                    {item: 'laboratory', slot: 4, quality: 4}   // 橙色实验室：攻击力加成（占2格：4,5）
                ]
            },
            9: { // 第9波 - 巨人军团
                name: '巨人军团',
                icon: '💪',
                description: '三个橙色巨人的强力阵容',
                layout: [
                    {item: 'giant', slot: 0, quality: 4},       // 橙色巨人：坦克（占2格：0,1）
                    {item: 'giant', slot: 2, quality: 4},       // 橙色巨人：坦克（占2格：2,3）
                    {item: 'giant', slot: 4, quality: 4}        // 橙色巨人：坦克（占2格：4,5）
                ]
            },
            10: { // 第10波 - 终极法师
                name: '终极法师',
                icon: '🧙‍♂️',
                description: '最强魔法组合',
                layout: [
                    {item: 'golemArcane', slot: 0, quality: 3}, // 紫色奥数魔像：大型单位（占3格：0,1,2）
                    {item: 'archmage', slot: 3, quality: 4},    // 橙色大法师：小型单位
                    {item: 'golem', slot: 4, quality: 4}        // 橙色魔偶：中型单位（占2格：4,5）
                ]
            }
            // 后续波次可以继续添加...
        };
    }

    // 初始化波次配置
    initializeWave(waveNumber) {
        console.log(`敌人开始装备第${waveNumber}波配置`);
        
        // 清空当前装备
        this.inventory = new Array(6).fill(null);
        
        const configs = this.getWaveConfigs();
        const config = configs[waveNumber];
        
        if (!config) {
            console.log(`第${waveNumber}波配置未定义，使用默认配置`);
            // 从第3波开始默认配置：只有一个魔像
            if (waveNumber >= 3) {
                this.inventory[0] = this.createItemInstance('golem', 1);
            } else {
                // 前两波使用战士
                this.inventory[0] = this.createItemInstance('warrior', 1);
            }
            this.applyAllSynergyEffects();
            return;
        }
        
        this.currentWaveConfig = config;
        console.log(`装备${config.name}配置: ${config.description}`);
        
        // 按配置装备物品
        config.layout.forEach(({item, slot, quality}) => {
            const newItem = this.createItemInstance(item, quality);
            if (newItem) {
                this.inventory[slot] = newItem;
                
                // 处理大尺寸物品的占用（镜像玩家逻辑）
                const size = newItem.template.size || 1;
                for (let i = 1; i < size; i++) {
                    if (slot + i < this.inventory.length) {
                        this.inventory[slot + i] = 'occupied';
                    }
                }
                
                console.log(`敌人在位置${slot}装备${item}(品质${quality}, 尺寸${size})`);
            }
        });
        
        // 应用所有协同效果
        this.applyAllSynergyEffects();
        
        console.log(`敌人第${waveNumber}波装备完成`, this.inventory.filter(item => item !== null));
        
        // 更新UI显示
        this.updateEnemyInventoryDisplay();
    }
    
    // 创建物品实例（复用玩家逻辑）
    createItemInstance(itemId, quality) {
        const template = this.itemTemplates[itemId];
        if (!template) {
            console.error(`物品模板不存在: ${itemId}`);
            console.error('可用的模板列表:', Object.keys(this.itemTemplates));
            return null;
        }
        
        // 创建物品实例（镜像玩家的创建逻辑）
        const item = {
            id: itemId,
            template: template,
            quality: quality,
            cooldownRemaining: 0,
            isReady: false,
            attackBonus: 0,
            cooldownReduction: 0,
            barbarianAdjacentBonus: 0,
            golemAdjacentBonus: 0, // 魔偶相邻加成
            accelerationTime: 0, // 加速时间
            // 其他属性按需添加...
        };
        
        // 敌人物品初始CD设为实际冷却时间，避免一开始就生产
        const actualCooldown = this.getActualCooldown(item);
        item.cooldownRemaining = actualCooldown;
        item.isReady = false;
        
        return item;
    }
    
    // 应用所有协同效果
    applyAllSynergyEffects() {
        // 应用野蛮人协同效果
        this.applyBarbarianBonus();
        
        // 应用徽章效果（复用玩家逻辑）
        this.refreshAllBadgeEffects();
        
        // 应用学徒效果（复用玩家逻辑） 
        this.applyApprenticeBonus();
        
        // 应用法杖效果（复用玩家逻辑）
        this.applyStaffBonus();
        
        // 应用魔偶相邻加成效果（复用玩家逻辑）
        this.applyGolemAdjacentBonus();
        
        console.log('敌人协同效果应用完成');
    }
    
    // 复用玩家的徽章逻辑
    refreshAllBadgeEffects() {
        // 先重置所有物品的cooldownReduction
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            if (item && item !== 'occupied') {
                item.cooldownReduction = 0;
            }
        }
        
        // 重新计算所有徽章的效果
        for (let i = 0; i < this.inventory.length; i++) {
            const badgeItem = this.inventory[i];
            if (badgeItem && badgeItem !== 'occupied' && badgeItem.id === 'badge') {
                this.applySingleBadgeEffect(i);
            }
        }
    }
    
    // 应用单个徽章的效果
    applySingleBadgeEffect(badgeSlot) {
        const badgeItem = this.inventory[badgeSlot];
        if (!badgeItem || badgeItem.id !== 'badge') return;
        
        const reduction = this.game.inventorySystem.getBadgeQualityReduction(badgeItem.quality);
        
        // 检查右侧物品
        const rightSlot = badgeSlot + badgeItem.template.size;
        if (rightSlot < 6) {
            const rightItem = this.inventory[rightSlot];
            if (rightItem && rightItem !== 'occupied' && rightItem.template.unitType === 'melee') {
                rightItem.cooldownReduction = (rightItem.cooldownReduction || 0) + reduction;
                console.log(`敌人徽章为位置${rightSlot}的${rightItem.id}减少冷却时间 -${reduction}秒`);
            }
        }
    }
    
    // 复用玩家的学徒逻辑
    applyApprenticeBonus() {
        // 先清除所有学徒加成
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            if (item && item !== 'occupied' && item.apprenticeBonus) {
                item.apprenticeBonus = 0;
            }
        }
        
        // 重新应用学徒加成
        for (let i = 0; i < this.inventory.length; i++) {
            const apprenticeItem = this.inventory[i];
            if (apprenticeItem && apprenticeItem !== 'occupied' && apprenticeItem.id === 'apprentice') {
                this.applySingleApprenticeEffect(apprenticeItem);
            }
        }
    }
    
    // 应用单个学徒的效果
    applySingleApprenticeEffect(apprenticeItem) {
        // 计算所有魔法物品数量
        let mageItemCount = 0;
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            if (item && item !== 'occupied' && item.template.unitType === 'mage') {
                mageItemCount++;
            }
        }
        
        if (mageItemCount > 0) {
            const bonus = this.game.inventorySystem.getApprenticeQualityBonus(apprenticeItem.quality);
            const totalBonus = (mageItemCount - 1) * bonus; // 不计算学徒本身
            
            apprenticeItem.apprenticeBonus = totalBonus;
            console.log(`敌人学徒从${mageItemCount-1}个其他魔法物品获得攻击力+${totalBonus}`);
        }
    }
    
    // 复用玩家的法杖逻辑
    applyStaffBonus() {
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            if (item && item !== 'occupied') {
                // 重置法杖加成
                if (item.staffBonus !== undefined) {
                    item.staffBonus = 0;
                }
                
                // 如果是魔法物品，应用法杖加成
                if (item.template.unitType === 'mage') {
                    let totalStaffBonus = 0;
                    
                    // 查找所有法杖
                    for (let j = 0; j < this.inventory.length; j++) {
                        const staffItem = this.inventory[j];
                        if (staffItem && staffItem !== 'occupied' && staffItem.id === 'staff') {
                            totalStaffBonus += (staffItem.staffMageBonus || 5); // 基础加成
                        }
                    }
                    
                    if (totalStaffBonus > 0) {
                        item.staffBonus = totalStaffBonus;
                        console.log(`敌人${item.id}受法杖影响，攻击力+${totalStaffBonus}`);
                    }
                }
            }
        }
    }
    
    // 应用魔偶的相邻魔法物品攻击力加成效果（复用玩家逻辑）
    applyGolemAdjacentBonus() {
        // 清除所有魔偶的相邻加成
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            if (item && item !== 'occupied' && item.golemAdjacentBonus) {
                item.golemAdjacentBonus = 0;
            }
        }
        
        // 重新应用魔偶相邻加成
        for (let i = 0; i < this.inventory.length; i++) {
            const golemItem = this.inventory[i];
            if (golemItem && golemItem !== 'occupied' && golemItem.id === 'golem') {
                // 检查相邻位置是否有魔法物品
                const hasAdjacentMage = this.hasAdjacentMageUnit(i);
                if (hasAdjacentMage) {
                    const bonus = this.game.inventorySystem.getGolemAdjacentBonus(golemItem.quality);
                    golemItem.golemAdjacentBonus = bonus;
                    console.log(`敌人魔偶(位置${i})检测到相邻魔法物品，获得攻击力加成 +${bonus}`);
                } else {
                    console.log(`敌人魔偶(位置${i})没有相邻的魔法物品，无加成`);
                }
            }
        }
        
        // 更新显示
        this.updateEnemyInventoryDisplay();
    }
    
    // 药剂师特殊能力：召唤时加速相邻魔法物品1秒（镜像玩家逻辑）
    triggerAlchemistAcceleration(alchemistSlot) {
        const accelerationTime = 60; // 1秒 = 60帧
        
        console.log(`敌人药剂师(位置${alchemistSlot})触发加速技能，开始检查相邻位置`);
        
        // 使用通用相邻查找函数，过滤魔法物品
        const adjacentMageItems = this.findAdjacentItems(
            alchemistSlot, 
            1, // 药剂师是小尺寸物品
            (item) => item.template.unitType === 'mage' // 过滤魔法物品
        );
        
        let acceleratedCount = 0;
        
        for (const adjacent of adjacentMageItems) {
            const { item: targetItem, position } = adjacent;
            
            // 累加加速时间
            const oldAcceleration = targetItem.accelerationTime || 0;
            this.addAccelerationTime(targetItem, accelerationTime);
            acceleratedCount++;
            
            console.log(`✓ 敌人药剂师为${position}侧魔法物品(${targetItem.template.name})提供1秒加速，加速时间: ${oldAcceleration} -> ${targetItem.accelerationTime}`);
        }
        
        if (acceleratedCount > 0) {
            console.log(`✓ 敌人药剂师效果触发！${acceleratedCount}个相邻魔法物品获得1秒加速`);
        } else {
            console.log('✗ 敌人药剂师召唤，但没有相邻的魔法物品');
        }
        
        // 更新显示
        this.updateEnemyInventoryDisplay();
    }
    
    // 统一的加速处理函数
    addAccelerationTime(item, accelerationTime) {
        const oldTime = item.accelerationTime || 0;
        item.accelerationTime = oldTime + accelerationTime;
        return item.accelerationTime;
    }
    
    // 检查指定位置是否有相邻的魔法物品（复用玩家逻辑）
    hasAdjacentMageUnit(slotIndex) {
        const item = this.inventory[slotIndex];
        if (!item || item === 'occupied') return false;
        
        // 使用通用相邻查找函数，过滤魔法物品（包括召唤和非召唤的魔法物品）
        const adjacentMageItems = this.findAdjacentItems(
            slotIndex, 
            item.template.size, // 考虑物品尺寸
            (targetItem) => targetItem.template.unitType === 'mage' // 移除unitCount限制，支持所有魔法物品
        );
        
        if (adjacentMageItems.length > 0) {
            for (const adjacent of adjacentMageItems) {
                console.log(`敌人魔偶(位置${slotIndex})${adjacent.position}侧发现魔法物品: ${adjacent.item.id}`);
            }
            return true;
        } else {
            console.log(`敌人魔偶(位置${slotIndex})未发现相邻魔法物品`);
            return false;
        }
    }
    
    // 查找相邻物品（复用玩家逻辑）
    findAdjacentItems(slotIndex, itemSize, filterFunction) {
        const adjacentItems = [];
        
        // 检查左侧相邻位置
        const leftSlot = slotIndex - 1;
        if (leftSlot >= 0) {
            const leftItem = this.inventory[leftSlot];
            if (leftItem && leftItem !== 'occupied' && filterFunction(leftItem)) {
                adjacentItems.push({
                    item: leftItem,
                    slot: leftSlot,
                    position: 'left'
                });
            }
        }
        
        // 检查右侧相邻位置（考虑物品尺寸）
        const rightSlot = slotIndex + itemSize;
        if (rightSlot < this.inventory.length) {
            const rightItem = this.inventory[rightSlot];
            if (rightItem && rightItem !== 'occupied' && filterFunction(rightItem)) {
                adjacentItems.push({
                    item: rightItem,
                    slot: rightSlot,
                    position: 'right'
                });
            }
        }
        
        return adjacentItems;
    }
    
    // === UI显示相关函数 ===
    
    // 更新敌人战斗区显示
    updateEnemyInventoryDisplay() {
        try {
            console.log('开始更新敌人战斗区UI...');
            const slots = document.querySelectorAll('.enemy-inventory-section .inventory-slot');
            
            if (slots.length === 0) {
                console.error('未找到敌人战斗区插槽元素！');
                return;
            }
            
            console.log(`找到${slots.length}个敌人插槽，当前装备:`, this.inventory);
            
            slots.forEach((slot, index) => {
                const item = this.inventory[index];
                
                // 清空插槽
                slot.innerHTML = '';
                slot.removeAttribute('data-item-id');
                slot.removeAttribute('data-quality');
                slot.classList.remove('occupied', 'occupied-by-large-item');
                
                if (item && item !== 'occupied') {
                    console.log(`为位置${index}创建物品元素: ${item.id}`);
                    this.createEnemyItemElement(slot, item, index);
                    slot.classList.add('occupied');
                } else if (item === 'occupied') {
                    slot.classList.add('occupied-by-large-item');
                }
            });
            
            console.log('敌人战斗区UI更新完成');
        } catch (error) {
            console.error('敌人战斗区UI更新失败:', error);
            console.error('错误堆栈:', error.stack);
        }
    }
    
    // 创建敌人物品UI元素
    createEnemyItemElement(slot, item, index) {
        const template = item.template;
        
        // 设置插槽属性
        slot.setAttribute('data-item-id', item.id);
        slot.setAttribute('data-quality', item.quality);
        
        // 创建物品容器 - 使用与玩家相同的类名
        const itemElement = document.createElement('div');
        itemElement.className = `inventory-item quality-${item.quality}`;
        
        // 添加尺寸类支持（镜像玩家逻辑）
        if (template.size > 1) {
            itemElement.classList.add(`size-${template.size}`);
        }
        
        // 设置品质背景颜色（镜像玩家逻辑）
        const quality = this.qualitySystem.getQuality(item.quality);
        if (template.size > 1) {
            itemElement.style.background = `${quality.color}20`;
        } else {
            itemElement.style.background = `${quality.color}10`;
        }
        
        // 设置品质边框（镜像玩家逻辑）
        itemElement.style.border = `2px solid ${quality.color}80`;
        itemElement.style.borderRadius = '8px';
        
        // 物品图标 - 使用与玩家相同的类名
        const iconElement = document.createElement('div');
        iconElement.className = 'inventory-item-icon';
        iconElement.textContent = template.icon;
        itemElement.appendChild(iconElement);
        
        // 敌人物品不显示进度条
        
        // 攻击力显示
        this.addEnemyAttackDisplayToItem(itemElement, template, item);
        
        // 点击事件显示物品信息
        itemElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showEnemyItemInfo(item, e.currentTarget);
        });
        
        slot.appendChild(itemElement);
    }
    
    // 添加敌人物品攻击力显示
    addEnemyAttackDisplayToItem(itemElement, template, item) {
        // 先移除已存在的攻击力标签（如果有）
        const existingAttackLabel = itemElement.querySelector('.attack-label');
        if (existingAttackLabel) {
            existingAttackLabel.remove();
        }
        
        // 检查是否为非召唤物品
        const isNonSummonItem = template.unitCount === 0;
        
        // 创建攻击力标签元素
        const attackLabel = document.createElement('div');
        attackLabel.className = `attack-label ${template.unitType}`;
        
        if (isNonSummonItem) {
            // 非召唤物品：显示流派图标
            if (template.unitType === 'melee') {
                attackLabel.innerHTML = '<span style="color: white; font-weight: bold;">⚔️</span>';
            } else if (template.unitType === 'mage') {
                attackLabel.innerHTML = '<span style="color: white; font-weight: bold;">🔮</span>';
            }
        } else {
            // 召唤物品：显示攻击力数字，前面加类型图标
            const attackPower = this.calculateEnemyItemAttack(item);
            
            // 根据单位类型添加简单图标
            let typeIcon = '';
            switch (template.unitType) {
                case 'melee':
                    typeIcon = '⚔️';
                    break;
                case 'ranged':
                    typeIcon = '🏹';
                    break;
                case 'mage':
                    typeIcon = '🔮';
                    break;
                case 'tank':
                    typeIcon = '🛡️';
                    break;
                default:
                    typeIcon = '⚔️';
            }
            
            attackLabel.innerHTML = `<span style="font-size: 10px;">${typeIcon}</span>${attackPower}`;
        }
        
        // 添加到物品元素中
        itemElement.appendChild(attackLabel);
    }
    
    // 计算敌人物品的总攻击力（复用玩家的计算逻辑）
    calculateEnemyItemAttack(item) {
        // 直接使用玩家的单位属性计算系统
        const unitStats = this.game.inventorySystem.getUnitStats(item.template.unitType, item.id, item);
        return unitStats.attack;
    }
    
    // 计算品质攻击力加成
    getQualityAttackBonus(currentQuality, minQuality) {
        const qualityLevelsAboveMin = currentQuality - minQuality;
        return qualityLevelsAboveMin * 1; // 每提升一个品质等级 +1 攻击力
    }
    
    // 显示敌人物品信息弹窗
    showEnemyItemInfo(item, element) {
        // 复用玩家的物品信息显示逻辑，但显示为敌人版本
        const popup = document.getElementById('shop-item-info');
        if (!popup) return;
        
        // 设置物品信息
        const template = item.template;
        const qualityInfo = this.qualitySystem.getQuality(item.quality);
        
        // 更新弹窗内容
        document.getElementById('shop-info-icon').textContent = template.icon;
        document.getElementById('shop-info-name').textContent = template.name;
        
        // 设置物品类型信息（与玩家物品一致）
        const qualityElement = document.getElementById('shop-info-quality');
        const attackTypeNames = {
            melee: '近战',
            ranged: '远程',
            tank: '坦克',
            mage: '魔法'
        };
        qualityElement.textContent = attackTypeNames[template.unitType] || '近战';
        qualityElement.className = `shop-info-quality ${template.unitType}`;
        
        // 根据兵种类型设置边框颜色
        let qualityColor = '#3498db'; // 默认蓝色边框
        
        if (template.unitType === 'melee') {
            qualityColor = '#e74c3c'; // 红色 - 近战
        } else if (template.unitType === 'ranged') {
            qualityColor = '#3498db'; // 蓝色 - 远程
        } else if (template.unitType === 'tank') {
            qualityColor = '#f39c12'; // 橙色 - 坦克
        } else if (template.unitType === 'mage') {
            qualityColor = '#9b59b6'; // 紫色 - 法师
        }
        
        // 设置弹窗边框颜色
        const popupContent = popup.querySelector('.shop-info-content');
        if (popupContent) {
            popupContent.style.borderColor = qualityColor;
        }
        
        // 隐藏攻击类型标签（与玩家物品一致）
        const attackTypeBadge = document.getElementById('attack-type-badge');
        if (attackTypeBadge) {
            attackTypeBadge.style.display = 'none';
        }
        
        // 冷却时间（与玩家物品一致）
        const actualCooldown = this.getActualCooldown(item);
        const cooldownHeaderElement = document.getElementById('shop-info-cooldown-header');
        const cooldownHeaderContainer = document.querySelector('.shop-info-cooldown-header');
        
        if (actualCooldown === -1) {
            // 被动物品：隐藏CD显示
            if (cooldownHeaderContainer) cooldownHeaderContainer.style.display = 'none';
        } else {
            // 显示CD
            if (cooldownHeaderContainer) cooldownHeaderContainer.style.display = 'flex';
            if (cooldownHeaderElement) cooldownHeaderElement.textContent = `${actualCooldown/60}s`;
        }
        
        // 隐藏价格显示
        const costElement = document.getElementById('shop-info-cost');
        if (costElement && costElement.parentElement) {
            costElement.parentElement.style.display = 'none';
        }
        
        // 技能描述
        const skillSection = document.getElementById('shop-info-special-skill');
        if (item.id === 'barbarian') {
            skillSection.classList.remove('hidden');
            const bonus = this.game.inventorySystem.getBarbarianQualityBonus(item.quality);
            document.getElementById('skill-description').innerHTML = 
                `给相邻<span class="melee-badge">近战</span>物品攻击力+${bonus}`;
            document.getElementById('skill-status').textContent = '';
        } else if (item.id === 'apprentice') {
            skillSection.classList.remove('hidden');
            const bonus = this.game.inventorySystem.getApprenticeQualityBonus(item.quality);
            document.getElementById('skill-description').innerHTML = 
                `每个<span class="mage-badge">魔法</span>物品攻击力+${bonus}`;
            document.getElementById('skill-status').textContent = '';
        } else if (item.id === 'badge') {
            skillSection.classList.remove('hidden');
            const reduction = this.game.inventorySystem.getBadgeQualityReduction(item.quality);
            document.getElementById('skill-description').innerHTML = 
                `给右侧<span class="melee-badge">近战</span>物品冷却时间-${reduction}s`;
            document.getElementById('skill-status').textContent = '';
        } else if (item.id === 'warBanner') {
            skillSection.classList.remove('hidden');
            document.getElementById('skill-description').innerHTML = 
                `触发时给所有<span class="melee-badge">近战</span>物品加速2s`;
            document.getElementById('skill-status').textContent = '';
        } else if (item.id === 'magicSword') {
            skillSection.classList.remove('hidden');
            document.getElementById('skill-description').innerHTML = 
                `给相邻<span class="melee-badge">近战</span>物品攻击力+15`;
            document.getElementById('skill-status').textContent = '';
        } else if (item.id === 'staff') {
            skillSection.classList.remove('hidden');
            document.getElementById('skill-description').innerHTML = 
                `给所有<span class="mage-badge">魔法</span>物品攻击力+5`;
            document.getElementById('skill-status').textContent = '';
        } else if (item.id === 'assassin') {
            skillSection.classList.remove('hidden');
            document.getElementById('skill-description').innerHTML = 
                `每次攻击后攻击力+1`;
            document.getElementById('skill-status').textContent = '';
        } else if (item.id === 'militia') {
            skillSection.classList.remove('hidden');
            document.getElementById('skill-description').innerHTML = 
                `每次触发后下次额外生产+1个单位`;
            document.getElementById('skill-status').textContent = '';
        } else if (item.id === 'gladiator') {
            skillSection.classList.remove('hidden');
            document.getElementById('skill-description').innerHTML = 
                `击杀敌人后攻击力+2`;
            document.getElementById('skill-status').textContent = '';
        } else if (item.id === 'titan') {
            skillSection.classList.remove('hidden');
            document.getElementById('skill-description').innerHTML = 
                `每受到攻击增加1层护盾`;
            document.getElementById('skill-status').textContent = '';
        } else if (item.id === 'giant') {
            skillSection.classList.remove('hidden');
            document.getElementById('skill-description').innerHTML = 
                `根据品质获得额外生命值`;
            document.getElementById('skill-status').textContent = '';
        } else if (item.id === 'golem') {
            skillSection.classList.remove('hidden');
            const qualityBonus = this.game.inventorySystem.getGolemAdjacentBonus(item.quality);
            document.getElementById('skill-description').innerHTML = 
                `如果有相邻的<span class="mage-badge">魔法</span>单位，攻击力 <span style="color: white; font-weight: bold;">+${qualityBonus}</span>`;
            document.getElementById('skill-status').textContent = '';
        } else if (item.id === 'alchemist') {
            skillSection.classList.remove('hidden');
            document.getElementById('skill-description').innerHTML = 
                `触发时给相邻物品减少冷却时间`;
            document.getElementById('skill-status').textContent = '';
        } else if (item.id === 'witch') {
            skillSection.classList.remove('hidden');
            document.getElementById('skill-description').innerHTML = 
                `攻击时有概率中毒敌人`;
            document.getElementById('skill-status').textContent = '';
        } else if (item.id === 'laboratory') {
            skillSection.classList.remove('hidden');
            document.getElementById('skill-description').innerHTML = 
                `每有一个魔法物品，给所有物品+6攻击力`;
            document.getElementById('skill-status').textContent = '';
        } else if (item.id === 'alchemyLab') {
            skillSection.classList.remove('hidden');
            document.getElementById('skill-description').innerHTML = 
                `触发时给相邻物品永久攻击力+1`;
            document.getElementById('skill-status').textContent = '';
        } else if (item.id === 'crystal') {
            skillSection.classList.remove('hidden');
            document.getElementById('skill-description').innerHTML = 
                `触发时给所有魔法物品加速3秒`;
            document.getElementById('skill-status').textContent = '';
        } else if (item.id === 'golemArcane') {
            skillSection.classList.remove('hidden');
            document.getElementById('skill-description').innerHTML = 
                `如果有相邻的魔法物品，获得400护盾`;
            document.getElementById('skill-status').textContent = '';
        } else if (item.id === 'archmage') {
            skillSection.classList.remove('hidden');
            document.getElementById('skill-description').innerHTML = 
                `触发时召唤额外的大法师单位`;
            document.getElementById('skill-status').textContent = '';
        } else if (item.id === 'magicCircle') {
            skillSection.classList.remove('hidden');
            document.getElementById('skill-description').innerHTML = 
                `给所有魔法物品增加攻击目标数`;
            document.getElementById('skill-status').textContent = '';
        } else if (item.id === 'dragonMagic') {
            skillSection.classList.remove('hidden');
            document.getElementById('skill-description').innerHTML = 
                `范围攻击，可同时攻击多个敌人`;
            document.getElementById('skill-status').textContent = '';
        } else {
            skillSection.classList.add('hidden');
        }
        
        // 物品描述
        document.getElementById('shop-info-description').textContent = 
            `敌军${template.description}`;
        
        // 先显示弹窗以获取正确的尺寸
        popup.classList.remove('hidden');
        
        // 计算位置 - 显示在物品下方
        const elementRect = element.getBoundingClientRect();
        const popupRect = popup.getBoundingClientRect();
        
        // 设置位置为物品下方，水平居中对齐
        popup.style.position = 'fixed';
        popup.style.left = `${elementRect.left + (elementRect.width - popupRect.width) / 2}px`;
        popup.style.top = `${elementRect.bottom + 10}px`;
        
        // 防止超出屏幕边界
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // 水平边界检查
        if (popup.offsetLeft < 10) {
            popup.style.left = '10px';
        } else if (popup.offsetLeft + popup.offsetWidth > viewportWidth - 10) {
            popup.style.left = `${viewportWidth - popup.offsetWidth - 10}px`;
        }
        
        // 垂直边界检查 - 如果下方空间不够，显示在上方
        if (elementRect.bottom + 10 + popup.offsetHeight > viewportHeight - 10) {
            popup.style.top = `${elementRect.top - popup.offsetHeight - 10}px`;
        }
        
        // 点击外部关闭弹窗
        const closePopup = (e) => {
            if (!popup.contains(e.target)) {
                popup.classList.add('hidden');
                document.removeEventListener('click', closePopup);
            }
        };
        setTimeout(() => {
            document.addEventListener('click', closePopup);
        }, 100);
        
        console.log(`显示敌人物品信息: ${template.name}(品质${item.quality})`);
    }
    
    // 更新敌人物品进度条（在游戏循环中调用）
    updateEnemyProgressBars() {
        const slots = document.querySelectorAll('.enemy-inventory-section .inventory-slot');
        
        slots.forEach((slot, index) => {
            const item = this.inventory[index];
            if (item && item !== 'occupied') {
                const progressFill = slot.querySelector('.inventory-item-progress-fill');
                
                if (progressFill) {
                    // 计算进度
                    const actualCooldown = this.getActualCooldown(item);
                    const progressPercent = item.isReady ? 100 : 
                        ((actualCooldown - item.cooldownRemaining) / actualCooldown) * 100;
                    const isReady = item.isReady;
                    
                    // 更新进度条 - 使用与玩家相同的方式（从底部向上填充）
                    progressFill.style.height = `${progressPercent}%`;
                    progressFill.className = `inventory-item-progress-fill ${isReady ? 'ready' : ''}`;
                }
            }
        });
    }
}