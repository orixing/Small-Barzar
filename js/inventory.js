// 背包和商店系统
class InventorySystem {
    constructor(game) {
        this.game = game;
        this.inventory = new Array(6).fill(null); // 6×1战斗区
        this.backpack = new Array(6).fill(null); // 6×1背包
        this.shopItems = [];
        this.refreshCost = 1;
        this.refreshCooldown = 0;
        this.backpackOpen = false;
        
        // 品质系统定义
        this.qualitySystem = {
            qualities: [
                { name: 'common', label: '普通', color: '#9E9E9E', level: 0 },
                { name: 'uncommon', label: '优秀', color: '#4CAF50', level: 1 }, // 绿
                { name: 'rare', label: '稀有', color: '#2196F3', level: 2 }, // 蓝
                { name: 'epic', label: '史诗', color: '#9C27B0', level: 3 }, // 紫
                { name: 'legendary', label: '传说', color: '#FF9800', level: 4 }, // 橙
                { name: 'mythic', label: '神话', color: '#F44336', level: 5 } // 红
            ],
            getQuality: function(level) {
                return this.qualities[level] || this.qualities[0];
            },
            getQualityMultiplier: function(level) {
                return 1 + (level * 0.25); // 每级25%加成
            }
        };
        
        // 物品模板定义
        this.itemTemplates = {
            // 1×1 物品 - 基础价值2
            sword: {
                name: '近战剑',
                icon: '⚔️',
                size: 1,
                baseValue: 2,
                unitType: 'melee',
                unitCount: 1,
                cooldown: 300, // 5秒
                description: '生产1个近战兵'
            },
            bow: {
                name: '战弓',
                icon: '🏹',
                size: 1,
                baseValue: 2,
                unitType: 'ranged',
                unitCount: 1,
                cooldown: 360, // 6秒
                description: '生产1个弓箭手'
            },
            staff: {
                name: '法杖',
                icon: '🔮',
                size: 1,
                baseValue: 2,
                unitType: 'mage',
                unitCount: 1,
                cooldown: 420, // 7秒
                description: '生产1个法师'
            },
            
            // 2×1 物品 - 基础价值4
            swordPair: {
                name: '双剑',
                icon: '⚔️⚔️',
                size: 2,
                baseValue: 4,
                unitType: 'melee',
                unitCount: 2,
                cooldown: 480, // 8秒
                description: '生产2个近战兵'
            },
            bowSquad: {
                name: '弓箭营',
                icon: '🏹🏹',
                size: 2,
                baseValue: 4,
                unitType: 'ranged',
                unitCount: 2,
                cooldown: 540, // 9秒
                description: '生产2个弓箭手'
            },
            shieldWall: {
                name: '盾牌阵',
                icon: '🛡️🛡️',
                size: 2,
                baseValue: 4,
                unitType: 'tank',
                unitCount: 1,
                cooldown: 600, // 10秒
                description: '生产1个强化重装兵'
            },
            
            // 3×1 物品 - 基础价值6
            swordLegion: {
                name: '剑士军团',
                icon: '⚔️⚔️⚔️',
                size: 3,
                baseValue: 6,
                unitType: 'melee',
                unitCount: 3,
                cooldown: 720, // 12秒
                description: '生产3个近战兵'
            },
            archerCorps: {
                name: '弓箭军团',
                icon: '🏹🏹🏹',
                size: 3,
                baseValue: 6,
                unitType: 'ranged',
                unitCount: 3,
                cooldown: 780, // 13秒
                description: '生产3个弓箭手'
            },
            heavyArmy: {
                name: '重装军团',
                icon: '🛡️🛡️🛡️',
                size: 3,
                baseValue: 6,
                unitType: 'tank',
                unitCount: 2,
                cooldown: 900, // 15秒
                description: '生产2个强化重装兵'
            },
            mageCircle: {
                name: '法师团',
                icon: '🔮🔮🔮',
                size: 3,
                baseValue: 6,
                unitType: 'mage',
                unitCount: 3,
                cooldown: 840, // 14秒
                description: '生产3个法师'
            }
        };
        
        this.init();
    }
    
    // 根据基础价值和品质计算实际价值
    calculateItemValue(baseValue, qualityLevel) {
        return baseValue * Math.pow(2, qualityLevel);
    }
    
    // 根据物品模板和品质计算价格（价值）
    getItemPrice(template, qualityLevel) {
        return this.calculateItemValue(template.baseValue, qualityLevel);
    }
    
    // 根据物品模板和品质计算出售价格（价值的一半）
    getItemSellPrice(template, qualityLevel) {
        return Math.floor(this.getItemPrice(template, qualityLevel) / 2);
    }
    
    init() {
        this.generateShopItems();
        this.bindEvents();
    }
    
    bindEvents() {
        // 移除商店物品点击购买，改为拖拽购买
        this.setupShopDragAndDrop();
        
        // 刷新商店按钮
        document.getElementById('refresh-shop').addEventListener('click', () => {
            this.refreshShop();
        });
        
        // 背包按钮
        document.getElementById('backpack-btn').addEventListener('click', () => {
            this.toggleBackpack();
        });
        
        
        // 背包物品点击事件（用于拖拽，不再直接使用）
        document.querySelectorAll('.inventory-slot').forEach((slot, index) => {
            // 移除点击使用逻辑，物品将自动生产
        });
        
        this.setupDragAndDrop();
    }
    
    generateShopItems() {
        // 生成3个不重复的随机商店物品
        const itemKeys = Object.keys(this.itemTemplates);
        this.shopItems = [];
        const usedItems = new Set(); // 记录已使用的物品
        
        // 权重系统：1×1物品更常见
        const sizeWeights = {
            1: 0.6, // 60%概率
            2: 0.3, // 30%概率
            3: 0.1  // 10%概率
        };
        
        let attempts = 0; // 防止无限循环
        while (this.shopItems.length < 3 && attempts < 20) {
            attempts++;
            const randomSize = this.getWeightedRandomSize(sizeWeights);
            const sizedItems = itemKeys.filter(key => 
                this.itemTemplates[key].size === randomSize && !usedItems.has(key)
            );
            
            if (sizedItems.length > 0) {
                const randomKey = sizedItems[Math.floor(Math.random() * sizedItems.length)];
                const quality = this.generateQualityForItem(randomKey);
                
                // 如果品质为null，说明该物品不能在当前波数出现，跳过
                if (quality !== null) {
                    this.shopItems.push({
                        id: randomKey,
                        template: this.itemTemplates[randomKey],
                        quality: quality,
                        available: true
                    });
                }
                
                usedItems.add(randomKey); // 无论是否添加成功都标记为已使用，避免重复尝试
            }
        }
        
        this.updateShopDisplay();
    }
    
    getWeightedRandomSize(weights) {
        const random = Math.random();
        let cumulative = 0;
        
        for (const [size, weight] of Object.entries(weights)) {
            cumulative += weight;
            if (random <= cumulative) {
                return parseInt(size);
            }
        }
        
        return 1; // 默认返回1×1
    }
    
    generateQualityForItem(itemKey) {
        // 检查背包和战斗区中是否已有此物品
        const existingQuality = this.getExistingItemQuality(itemKey);
        if (existingQuality !== null) {
            // 检查已有物品的品质是否可以在当前波数出现
            if (this.canQualityAppear(existingQuality)) {
                return existingQuality; // 返回已有物品的品质
            } else {
                return null; // 品质不能出现，返回null表示不能生成此物品
            }
        }
        
        // 如果没有已有物品，随机生成当前波数可以出现的品质
        return this.generateRandomQualityForWave();
    }
    
    // 检查品质是否可以在当前波数出现
    canQualityAppear(quality) {
        const wave = this.game.wave;
        switch(quality) {
            case 1: return wave >= 1; // 绿色：第1波后
            case 2: return wave >= 3; // 蓝色：第3波后
            case 3: return wave >= 5; // 紫色：第5波后
            case 4: return wave >= 7; // 橙色：第7波后
            default: return false; // 红色和其他品质不出现
        }
    }
    
    // 获取玩家已有物品的品质（背包+战斗区）
    getExistingItemQuality(itemKey) {
        // 检查战斗区
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            if (item && item !== 'occupied' && item.id === itemKey) {
                return item.quality;
            }
        }
        
        // 检查背包
        for (let i = 0; i < this.backpack.length; i++) {
            const item = this.backpack[i];
            if (item && item !== 'occupied' && item.id === itemKey) {
                return item.quality;
            }
        }
        
        return null; // 没有找到
    }
    
    // 根据当前波数随机生成品质
    generateRandomQualityForWave() {
        const wave = this.game.wave;
        const availableQualities = [];
        
        if (wave >= 1) availableQualities.push(1); // 绿色
        if (wave >= 3) availableQualities.push(2); // 蓝色
        if (wave >= 5) availableQualities.push(3); // 紫色
        if (wave >= 7) availableQualities.push(4); // 橙色
        
        if (availableQualities.length === 0) {
            return null; // 第1波之前不出现任何品质
        }
        
        // 随机选择一个可用品质（偏向较低品质）
        const random = Math.random();
        if (availableQualities.includes(1) && random < 0.4) return 1; // 40% 绿色
        if (availableQualities.includes(2) && random < 0.7) return 2; // 30% 蓝色
        if (availableQualities.includes(3) && random < 0.85) return 3; // 15% 紫色
        if (availableQualities.includes(4) && random < 0.95) return 4; // 10% 橙色
        
        // 如果上面都没选中，返回最低可用品质
        return availableQualities[0];
    }
    
    
    findExistingItem(itemKey, quality) {
        // 查找背包中相同类型和品质的物品
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            if (item && item !== 'occupied' && item.id === itemKey && item.quality === quality) {
                return i;
            }
        }
        return -1;
    }
    
    upgradeItem(itemIndex) {
        const item = this.inventory[itemIndex];
        if (!item || item === 'occupied') return;
        
        // 品质升级
        if (item.quality < 5) { // 最大品质为5
            item.quality++;
            
            // 显示升级特效
            this.showUpgradeEffect(itemIndex);
            
            console.log(`物品升级！${item.template.name} -> ${this.qualitySystem.getQuality(item.quality).label}`);
        }
    }
    
    showUpgradeEffect(itemIndex) {
        // 获取物品在背包中的位置，显示升级特效
        const slot = document.querySelector(`[data-slot="${itemIndex}"]`);
        if (slot) {
            const rect = slot.getBoundingClientRect();
            const effect = Utils.createEffect('⬆️ 升级!', 
                rect.left + rect.width / 2, 
                rect.top, 
                'upgrade-effect');
            
            effect.style.color = '#FFD700';
            effect.style.fontWeight = 'bold';
            effect.style.fontSize = '16px';
            effect.style.animation = 'sellEffect 2s ease-out forwards';
        }
    }
    
    updateShopDisplay() {
        this.shopItems.forEach((item, index) => {
            const shopElement = document.getElementById(`shop-item-${index}`);
            if (shopElement) {
                if (!item || !item.available) {
                    // 已售出的物品直接隐藏
                    shopElement.style.display = 'none';
                    return;
                }
                
                // 显示可用物品
                shopElement.style.display = 'block';
                const template = item.template;
                const visualElement = shopElement.querySelector('.shop-item-visual');
                
                // 更新图标
                shopElement.querySelector('.shop-item-icon').textContent = template.icon;
                
                // 设置大小样式和品质
                const quality = this.qualitySystem.getQuality(item.quality);
                visualElement.className = `shop-item-visual size-${template.size}`;
                visualElement.style.borderColor = quality.color;
                visualElement.style.boxShadow = `inset 0 0 0 2px ${quality.color}`;
                
                // 添加攻击力显示标签
                this.addAttackDisplay(visualElement, template, item.quality);
                
                // 更新价格（根据品质计算）
                const itemPrice = this.getItemPrice(template, item.quality);
                const priceElement = shopElement.querySelector('.shop-item-price');
                priceElement.textContent = `💰${itemPrice}`;
                
                // 根据玩家金币设置价格颜色
                if (this.game.playerGold >= itemPrice) {
                    priceElement.style.color = '#f39c12'; // 金色 - 买得起
                } else {
                    priceElement.style.color = '#e74c3c'; // 红色 - 买不起
                }
                
                // 移除禁用状态，所有可用物品都正常显示
                shopElement.classList.remove('disabled');
            }
        });
        
        // 重新设置商店拖拽功能，确保新生成的物品也能拖拽
        this.setupShopDragAndDrop();
    }
    
    canFitItem(size) {
        // 检查背包是否有足够连续空间
        for (let i = 0; i <= this.inventory.length - size; i++) {
            let canFit = true;
            for (let j = 0; j < size; j++) {
                if (this.inventory[i + j] !== null) {
                    canFit = false;
                    break;
                }
            }
            if (canFit) return true;
        }
        return false;
    }
    
    buyItem(shopIndex) {
        const shopItem = this.shopItems[shopIndex];
        if (!shopItem || !shopItem.available) return;
        
        const template = shopItem.template;
        const itemPrice = this.getItemPrice(template, shopItem.quality);
        const canAfford = this.game.playerGold >= itemPrice;
        const hasSpace = this.canFitItem(template.size);
        
        if (canAfford && hasSpace) {
            // 检查是否已有相同物品，如果是则升级
            const existingItemIndex = this.findExistingItem(shopItem.id, shopItem.quality);
            
            if (existingItemIndex !== -1) {
                // 升级现有物品
                this.upgradeItem(existingItemIndex);
                this.game.playerGold -= itemPrice;
            } else {
                // 扣除金币
                this.game.playerGold -= itemPrice;
                
                // 创建物品实例
                const item = {
                    id: shopItem.id,
                    template: template,
                    quality: shopItem.quality,
                    cooldownRemaining: template.cooldown, // 始终从满冷却开始
                    isReady: false // 进度条始终为0
                };
                
                // 放入背包
                this.addItemToInventory(item);
            }
            
            // 标记为已售出
            shopItem.available = false;
            
            // 更新显示
            this.updateShopDisplay();
            this.updateInventoryDisplay();
            this.game.updateUI();
            
            Utils.playSound('purchase');
        }
    }
    
    buyItemAtSlot(shopIndex, targetSlot) {
        const shopItem = this.shopItems[shopIndex];
        if (!shopItem || !shopItem.available) return;
        
        const template = shopItem.template;
        const itemPrice = this.getItemPrice(template, shopItem.quality);
        const canAfford = this.game.playerGold >= itemPrice;
        const canPlaceAtSlot = this.canDropAt(targetSlot, template.size);
        
        if (canAfford && canPlaceAtSlot) {
            // 检查是否已有相同物品，如果是则升级
            const existingItemIndex = this.findExistingItem(shopItem.id, shopItem.quality);
            
            if (existingItemIndex !== -1) {
                // 升级现有物品
                this.upgradeItem(existingItemIndex);
                this.game.playerGold -= itemPrice;
            } else {
                // 扣除金币
                this.game.playerGold -= itemPrice;
                
                // 创建物品实例
                const item = {
                    id: shopItem.id,
                    template: template,
                    quality: shopItem.quality,
                    cooldownRemaining: template.cooldown, // 始终从满冷却开始
                    isReady: false // 进度条始终为0
                };
                
                // 放入指定位置
                this.addItemToInventoryAtSlot(item, targetSlot);
            }
            
            // 标记为已售出
            shopItem.available = false;
            
            // 更新显示
            this.updateShopDisplay();
            this.updateInventoryDisplay();
            this.game.updateUI();
            
            Utils.playSound('purchase');
        }
    }
    
    addItemToInventory(item) {
        const size = item.template.size;
        
        // 找到第一个可用位置
        for (let i = 0; i <= this.inventory.length - size; i++) {
            let canFit = true;
            for (let j = 0; j < size; j++) {
                if (this.inventory[i + j] !== null) {
                    canFit = false;
                    break;
                }
            }
            
            if (canFit) {
                // 放置物品
                for (let j = 0; j < size; j++) {
                    if (j === 0) {
                        this.inventory[i + j] = item; // 主位置
                    } else {
                        this.inventory[i + j] = 'occupied'; // 占用标记
                    }
                }
                break;
            }
        }
    }
    
    addItemToInventoryAtSlot(item, targetSlot) {
        const size = item.template.size;
        
        // 在指定位置放置物品
        for (let j = 0; j < size; j++) {
            if (j === 0) {
                this.inventory[targetSlot + j] = item; // 主位置
            } else {
                this.inventory[targetSlot + j] = 'occupied'; // 占用标记
            }
        }
    }
    
    useItem(slotIndex) {
        const item = this.inventory[slotIndex];
        if (!item || item === 'occupied' || !item.isReady) return;
        
        // 生产单位
        this.produceUnits(item);
        
        // 设置冷却
        item.cooldownRemaining = item.template.cooldown;
        item.isReady = false;
        
        this.updateInventoryDisplay();
        Utils.playSound('spawn');
    }
    
    // 自动生产单位（只在战斗阶段）
    autoProduceUnits() {
        if (this.game.gamePhase !== 'battle') return;
        
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            if (item && item !== 'occupied' && item.isReady) {
                this.useItem(i);
            }
        }
    }
    
    produceUnits(item) {
        const template = item.template;
        
        for (let i = 0; i < template.unitCount; i++) {
            // 稍微延迟每个单位的生产
            setTimeout(() => {
                this.game.spawnPlayerUnitByType(template.unitType);
            }, i * 200); // 0.2秒间隔
        }
    }
    
    refreshShop() {
        if (this.game.playerGold >= this.refreshCost) {
            this.game.playerGold -= this.refreshCost;
            this.refreshCost += 1; // 每次刷新后费用增加1元
            this.generateShopItems();
            this.game.updateUI();
            
            // 刷新商店价格颜色
            this.updateShopDisplay();
            
            Utils.playSound('refresh');
        }
    }
    
    // 开始战斗时重置所有物品冷却
    startBattleCooldown() {
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            if (item && item !== 'occupied') {
                item.cooldownRemaining = item.template.cooldown;
                item.isReady = false;
            }
        }
        // 立即更新显示
        this.updateInventoryDisplay();
    }
    
    // 战斗结束时重置所有物品冷却为0
    resetAllItemCooldowns() {
        // 重置战斗区物品（战斗结束后进度条归0）
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            if (item && item !== 'occupied') {
                item.cooldownRemaining = item.template.cooldown; // 冷却时间重置为满
                item.isReady = false; // 进度条为0
            }
        }
        
        // 重置背包物品（保持进度条为0）
        for (let i = 0; i < this.backpack.length; i++) {
            const item = this.backpack[i];
            if (item && item !== 'occupied') {
                item.cooldownRemaining = item.template.cooldown; // 保持未ready状态
                item.isReady = false; // 进度条为0
            }
        }
        
        // 立即更新显示
        this.updateInventoryDisplay();
        this.updateBackpackDisplay();
    }
    
    updateInventoryDisplay() {
        console.log('=== UPDATING INVENTORY DISPLAY ===');
        // 只选择战斗区的槽位（不包含data-backpack-slot属性的）
        const slots = document.querySelectorAll('.inventory-slot:not([data-backpack-slot])');
        console.log('Found inventory slots:', slots.length);
        console.log('Inventory state:', this.inventory);
        
        slots.forEach((slot, index) => {
            const item = this.inventory[index];
            slot.innerHTML = ''; // 清空
            slot.classList.remove('occupied');
            slot.classList.remove('occupied-by-large-item');
            
            if (item && item !== 'occupied') {
                this.renderInventoryItem(slot, item, index, false); // false表示是战斗区
            } else if (item === 'occupied') {
                // 被占用的格子，不显示内容但标记样式
                slot.classList.add('occupied-by-large-item');
            }
        });
        
        // 更新拖拽事件
        if (this.updateSlotEvents) {
            this.updateSlotEvents();
        }
    }
    
    setupDragAndDrop() {
        this.draggedItem = null;
        this.draggedFromSlot = -1;
        this.draggedFromBackpackSlot = -1;
        
        // 为每个战斗区槽位设置拖拽事件  
        const updateSlotEvents = () => {
            const slots = document.querySelectorAll('.inventory-slot:not([data-backpack-slot])');
            
            slots.forEach((slot, index) => {
                // 设置原生拖拽事件
                slot.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    // 处理背包内物品拖拽
                    if (this.draggedItem && this.canDropAt(index, this.draggedItem.template.size)) {
                        this.highlightSlots(index, this.draggedItem.template.size, true);
                        e.dataTransfer.dropEffect = 'move';
                    }
                    // 处理商店物品拖拽
                    else if (this.draggedShopItem && this.canDropAt(index, this.draggedShopItem.item.template.size)) {
                        this.highlightSlots(index, this.draggedShopItem.item.template.size, true);
                        e.dataTransfer.dropEffect = 'move';
                    }
                });
                
                slot.addEventListener('dragleave', () => {
                    this.clearAllHighlights();
                });
                
                slot.addEventListener('drop', (e) => {
                    e.preventDefault();
                    this.clearAllHighlights();
                    
                    // 处理战斗区内物品移动
                    if (this.draggedItem && this.draggedFromSlot !== -1) {
                        // 检查目标位置是否可以放置
                        if (this.canDropAt(index, this.draggedItem.template.size)) {
                            // 直接在目标位置放置物品
                            this.addItemToInventoryAtSlot(this.draggedItem, index);
                            this.updateInventoryDisplay();
                            
                            // 清除拖拽数据，表示成功放置
                            this.draggedItem = null;
                            this.draggedFromSlot = -1;
                        }
                    }
                    // 处理从背包拖拽到战斗区
                    else if (this.draggedItem && this.draggedFromBackpackSlot !== -1) {
                        // 检查目标位置是否可以放置
                        if (this.canDropAt(index, this.draggedItem.template.size)) {
                            // 将物品从背包移动到战斗区
                            this.moveItemFromBackpackToInventory(this.draggedFromBackpackSlot, index);
                            
                            // 清除拖拽数据
                            this.draggedItem = null;
                            this.draggedFromBackpackSlot = -1;
                        }
                    }
                    // 处理商店物品放置到特定位置
                    else if (this.draggedShopItem) {
                        this.buyItemAtSlot(this.draggedShopItem.index, index);
                    }
                });
            });
        };
        
        // 出售区域已移除，只保留商店区域出售功能
        
        // 设置商店区域的拖拽出售事件
        this.setupShopSellZone();
        
        // 全局鼠标松开事件
        document.addEventListener('mouseup', () => {
            this.resetDrag();
        });
        
        // 初始化事件
        updateSlotEvents();
        
        // 保存更新函数以便后续调用
        this.updateSlotEvents = updateSlotEvents;
    }
    
    handleInventoryDragStart(e, slotIndex, item) {
        // 战斗阶段禁用拖动
        if (this.game.gamePhase === 'battle') {
            e.preventDefault();
            return;
        }
        
        // 设置拖拽数据
        this.draggedItem = JSON.parse(JSON.stringify(item));
        this.draggedFromSlot = slotIndex;
        this.draggedFromBackpackSlot = -1; // 确保不是从背包拖拽的
        
        // 使用统一的拖拽图像创建
        this.createDragImage(e, item);
        
        // 直接从战斗区移除物品
        this.removeItemFromInventory(slotIndex);
        
        // 延迟更新显示，避免中断拖拽操作
        setTimeout(() => {
            this.updateInventoryDisplay();
        }, 50);
        
        e.dataTransfer.effectAllowed = 'move';
    }
    
    handleInventoryDragEnd(e) {
        // 如果拖拽的物品还存在，说明拖拽失败，需要放回原位置
        if (this.draggedItem && this.draggedFromSlot !== -1) {
            // 将物品放回原位置
            this.addItemToInventoryAtSlot(this.draggedItem, this.draggedFromSlot);
            this.updateInventoryDisplay();
        }
        
        // 清理拖拽状态
        const slots = document.querySelectorAll('.inventory-slot');
        slots.forEach(slot => {
            slot.style.opacity = '';
        });
        
        // 清除所有高亮
        this.clearAllHighlights();
        
        this.draggedItem = null;
        this.draggedFromSlot = -1;
    }
    
    createDragImage(e, item, isShopItem = false) {
        // 统一的拖拽图像创建逻辑
        const dragImage = document.createElement('div');
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        dragImage.style.left = '-1000px';
        dragImage.style.zIndex = '9999';
        dragImage.style.pointerEvents = 'none';
        dragImage.style.transform = 'rotate(5deg)';
        dragImage.style.opacity = '0.9';
        
        // 设置尺寸
        const itemSize = isShopItem ? item.template.size : item.template.size;
        const slotWidth = 48;
        const dragWidth = slotWidth * itemSize;
        const dragHeight = 48;
        
        dragImage.style.width = dragWidth + 'px';
        dragImage.style.height = dragHeight + 'px';
        dragImage.style.display = 'flex';
        dragImage.style.alignItems = 'center';
        dragImage.style.justifyContent = 'center';
        
        // 获取品质颜色
        const quality = this.qualitySystem.getQuality(isShopItem ? item.quality : item.quality);
        dragImage.style.background = `linear-gradient(135deg, ${quality.color}22, ${quality.color}44)`;
        dragImage.style.border = `2px solid ${quality.color}`;
        dragImage.style.borderRadius = '4px';
        
        // 添加物品图标
        const iconElement = document.createElement('div');
        iconElement.textContent = isShopItem ? item.template.icon : item.template.icon;
        iconElement.style.fontSize = '20px';
        iconElement.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)';
        dragImage.appendChild(iconElement);
        
        document.body.appendChild(dragImage);
        
        // 设置拖拽图像
        const firstSlotCenterX = slotWidth / 2;
        const firstSlotCenterY = dragHeight / 2;
        e.dataTransfer.setDragImage(dragImage, firstSlotCenterX, firstSlotCenterY);
        
        // 清理拖拽图像元素
        setTimeout(() => {
            if (dragImage.parentNode) {
                document.body.removeChild(dragImage);
            }
        }, 1000);
    }
    
    createShopItemDragImage(e, shopItem) {
        // 使用统一的拖拽图像创建逻辑
        this.createDragImage(e, shopItem, true);
    }
    
    
    setupShopDragAndDrop() {
        // 清除之前的事件监听器
        const shopSlots = document.querySelectorAll('.shop-slot');
        shopSlots.forEach(slot => {
            slot.replaceWith(slot.cloneNode(true));
        });
        
        // 重新获取替换后的元素并设置拖拽事件
        const newShopSlots = document.querySelectorAll('.shop-slot');
        newShopSlots.forEach((slot, index) => {
            slot.draggable = true;
            
            // 添加点击显示物品信息事件
            slot.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                const shopItem = this.shopItems[index];
                if (shopItem && shopItem.available) {
                    this.showShopItemInfo(shopItem, index, slot);
                }
            });
            
            slot.addEventListener('dragstart', (e) => {
                const shopItem = this.shopItems[index];
                if (!shopItem || !shopItem.available) {
                    e.preventDefault();
                    return;
                }
                
                // 创建商店物品的自定义拖拽图像
                this.createShopItemDragImage(e, shopItem);
                
                this.draggedShopItem = {
                    index: index,
                    item: shopItem
                };
                
                slot.style.opacity = '0';
                e.dataTransfer.effectAllowed = 'move';
            });
            
            slot.addEventListener('dragend', (e) => {
                slot.style.opacity = '';
                this.draggedShopItem = null;
            });
            
        });
        
        // 为背包区域设置放下事件
        const inventorySection = document.querySelector('.inventory-section');
        if (inventorySection) {
            inventorySection.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (this.draggedShopItem) {
                    e.dataTransfer.dropEffect = 'move';
                    inventorySection.classList.add('drag-buy-over');
                }
            });
            
            inventorySection.addEventListener('dragleave', (e) => {
                // 检查是否真的离开了背包区域
                if (!inventorySection.contains(e.relatedTarget)) {
                    inventorySection.classList.remove('drag-buy-over');
                }
            });
            
            // 背包区域的drop事件 - 自动寻找空位购买
            inventorySection.addEventListener('drop', (e) => {
                e.preventDefault();
                inventorySection.classList.remove('drag-buy-over');
                
                if (this.draggedShopItem) {
                    // 检查是否拖拽到了具体的格子上
                    const droppedOnSlot = e.target.closest('.inventory-slot');
                    if (!droppedOnSlot) {
                        // 没有拖拽到具体格子，尝试自动寻找空位
                        const shopItem = this.draggedShopItem.item;
                        const canFit = this.canFitItem(shopItem.template.size);
                        
                        if (canFit) {
                            // 有空位，使用原始的buyItem方法自动寻找位置购买
                            this.buyItem(this.draggedShopItem.index);
                        }
                        // 如果没有空位，什么都不做（物品保持在商店中）
                    }
                }
            });
        }
    }
    
    setupShopSellZone() {
        const shopSection = document.querySelector('.shop-section');
        if (!shopSection) return;
        
        // 商店区域拖拽经过
        shopSection.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (this.draggedItem) {
                shopSection.classList.add('shop-sell-hover');
            }
        });
        
        // 鼠标移动到商店区域
        shopSection.addEventListener('mousemove', (e) => {
            e.preventDefault();
            if (this.draggedItem) {
                shopSection.classList.add('shop-sell-hover');
            }
        });
        
        // 鼠标离开商店区域
        shopSection.addEventListener('mouseleave', () => {
            shopSection.classList.remove('shop-sell-hover');
        });
        
        // 在商店区域放下物品
        shopSection.addEventListener('mouseup', (e) => {
            e.preventDefault();
            shopSection.classList.remove('shop-sell-hover');
            
            if (this.draggedItem && (this.draggedFromSlot !== -1 || this.draggedFromBackpackSlot !== -1)) {
                this.sellDraggedItem();
            }
        });
        
        // 拖拽放下事件（兼容性）
        shopSection.addEventListener('drop', (e) => {
            e.preventDefault();
            shopSection.classList.remove('shop-sell-hover');
            
            if (this.draggedItem && (this.draggedFromSlot !== -1 || this.draggedFromBackpackSlot !== -1)) {
                this.sellDraggedItem();
            }
        });
    }
    
    sellItem(slotIndex) {
        const item = this.inventory[slotIndex];
        if (!item || item === 'occupied') return;
        
        // 计算出售价格（价值的一半）
        const sellPrice = this.getItemSellPrice(item.template, item.quality);
        
        // 获得金币
        this.game.playerGold += sellPrice;
        
        // 从背包中移除物品
        this.removeItemFromInventory(slotIndex);
        
        // 显示出售效果
        this.showSellEffect(sellPrice);
        
        // 更新显示
        this.updateInventoryDisplay();
        this.game.updateUI();
        
        // 播放音效
        Utils.playSound('sell');
        
        // 重置拖拽状态
        this.resetDrag();
    }
    
    sellDraggedItem() {
        if (!this.draggedItem) return;
        
        // 计算出售价格（价值的一半）
        const sellPrice = this.getItemSellPrice(this.draggedItem.template, this.draggedItem.quality);
        
        // 获得金币
        this.game.playerGold += sellPrice;
        
        // 显示出售效果
        this.showSellEffect(sellPrice);
        
        // 更新相应的显示
        if (this.draggedFromBackpackSlot !== -1) {
            // 如果是从背包拖拽的，更新背包显示
            this.updateBackpackDisplay();
        } else {
            // 如果是从战斗区拖拽的，更新战斗区显示
            this.updateInventoryDisplay();
        }
        
        this.game.updateUI();
        
        // 出售后金币增加，需要更新商店价格颜色
        this.updateShopDisplay();
        
        // 播放音效
        Utils.playSound('sell');
        
        // 清除拖拽数据，表示物品已出售
        this.draggedItem = null;
        this.draggedFromSlot = -1;
        this.draggedFromBackpackSlot = -1;
        
        // 重置拖拽状态
        this.resetDrag();
    }
    
    removeItemFromInventory(slotIndex) {
        const item = this.inventory[slotIndex];
        if (!item || item === 'occupied') return;
        
        const itemSize = item.template.size;
        
        // 清除物品占用的所有格子
        for (let i = 0; i < itemSize; i++) {
            this.inventory[slotIndex + i] = null;
        }
    }
    
    showSellEffect(sellPrice) {
        // 获取商店区域位置
        const shopSection = document.querySelector('.shop-section');
        if (!shopSection) return;
        
        const rect = shopSection.getBoundingClientRect();
        
        // 创建金币获得特效
        const effect = Utils.createEffect(`+💰${sellPrice}`, 
            rect.left + rect.width / 2, 
            rect.top, 
            'sell-effect');
        
        effect.style.color = '#FFD700';
        effect.style.fontWeight = 'bold';
        effect.style.fontSize = '16px';
        effect.style.animation = 'sellEffect 1.5s ease-out forwards';
    }
    
    resetDrag() {
        const slots = document.querySelectorAll('.inventory-slot');
        const shopSection = document.querySelector('.shop-section');
        const inventorySection = document.querySelector('.inventory-section');
        const shopSlots = document.querySelectorAll('.shop-slot');
        
        slots.forEach(slot => {
            slot.style.opacity = '';
        });
        
        // 使用统一的高亮清除方法
        this.clearAllHighlights();
        
        shopSlots.forEach(slot => {
            slot.style.opacity = '';
        });
        
        if (shopSection) {
            shopSection.classList.remove('shop-sell-hover');
        }
        
        if (inventorySection) {
            inventorySection.classList.remove('drag-buy-over');
        }
        
        this.draggedItem = null;
        this.draggedFromSlot = -1;
        this.draggedFromBackpackSlot = -1;
        this.draggedShopItem = null;
    }
    
    canDropAt(targetSlot, itemSize) {
        if (targetSlot + itemSize > this.inventory.length) {
            return false; // 超出背包范围
        }
        
        // 检查目标位置是否有足够空间
        for (let i = 0; i < itemSize; i++) {
            const checkSlot = targetSlot + i;
            const item = this.inventory[checkSlot];
            // 允许放在原位置
            if (item && (checkSlot < this.draggedFromSlot || checkSlot >= this.draggedFromSlot + (this.draggedItem ? this.draggedItem.template.size : 1))) {
                return false;
            }
        }
        return true;
    }
    
    moveItem(fromSlot, toSlot) {
        const item = this.inventory[fromSlot];
        if (!item || item === 'occupied') return false;
        
        const itemSize = item.template.size;
        
        // 检查目标位置是否可放置
        if (!this.canDropAt(toSlot, itemSize)) {
            return false;
        }
        
        // 清除原位置
        for (let i = 0; i < itemSize; i++) {
            this.inventory[fromSlot + i] = null;
        }
        
        // 放置到新位置
        for (let i = 0; i < itemSize; i++) {
            if (i === 0) {
                this.inventory[toSlot + i] = item; // 主位置
            } else {
                this.inventory[toSlot + i] = 'occupied'; // 占用标记
            }
        }
        
        return true;
    }
    
    highlightSlots(startSlot, itemSize, highlight) {
        // 先清除所有高亮
        this.clearAllHighlights();
        
        if (highlight) {
            // 高亮指定范围的格子
            for (let i = 0; i < itemSize && (startSlot + i) < this.inventory.length; i++) {
                const slot = document.querySelector(`[data-slot="${startSlot + i}"]`);
                if (slot) {
                    slot.classList.add('drag-over');
                }
            }
        }
    }
    
    clearAllHighlights() {
        const slots = document.querySelectorAll('.inventory-slot');
        slots.forEach(slot => {
            slot.classList.remove('drag-over');
        });
    }
    
    updateProgressBars() {
        // 只选择战斗区的槽位，排除背包槽位
        const slots = document.querySelectorAll('.inventory-slot:not([data-backpack-slot])');
        
        slots.forEach((slot, index) => {
            const item = this.inventory[index];
            if (item && item !== 'occupied') {
                const progressFill = slot.querySelector('.inventory-item-progress-fill');
                
                if (progressFill) {
                    // 更新进度条
                    const progressPercent = item.isReady ? 100 : 
                        ((item.template.cooldown - item.cooldownRemaining) / item.template.cooldown) * 100;
                    progressFill.style.width = progressPercent + '%';
                    
                    // 更新进度条颜色
                    progressFill.className = `inventory-item-progress-fill ${item.isReady ? 'ready' : ''}`;
                }
            }
        });
    }
    
    update() {
        let needsUpdate = false;
        
        // 只在战斗阶段更新物品冷却时间
        if (this.game.gamePhase === 'battle') {
            for (let i = 0; i < this.inventory.length; i++) {
                const item = this.inventory[i];
                if (item && item !== 'occupied' && !item.isReady) {
                    item.cooldownRemaining--;
                    if (item.cooldownRemaining <= 0) {
                        item.isReady = true;
                        needsUpdate = true;
                    }
                }
            }
        }
        
        // 每帧都更新进度条以保证实时性
        this.updateProgressBars();
        
        // 更新显示
        if (needsUpdate) {
            this.updateInventoryDisplay();
            this.updateShopDisplay();
        }
        
        // 自动生产单位（只在战斗阶段）
        this.autoProduceUnits();
        
        // 更新刷新按钮状态
        const refreshBtn = document.getElementById('refresh-shop');
        refreshBtn.disabled = this.game.playerGold < this.refreshCost;
        refreshBtn.textContent = `🔄 刷新 (💰${this.refreshCost})`;
    }
    
    toggleBackpack() {
        this.backpackOpen = !this.backpackOpen;
        
        const backpackSection = document.querySelector('.backpack-section');
        const shopSection = document.querySelector('.shop-section');
        
        if (this.backpackOpen) {
            // 打开背包，商店保持显示
            backpackSection.classList.remove('hidden');
            
            // 更新背包显示
            this.updateBackpackDisplay();
            
            // 设置背包的拖拽功能
            this.setupBackpackDragAndDrop();
        } else {
            // 关闭背包，商店保持显示
            backpackSection.classList.add('hidden');
        }
    }
    
    updateBackpackDisplay() {
        console.log('=== UPDATING BACKPACK DISPLAY ===');
        console.log('Backpack state:', this.backpack);
        
        // 使用与战斗区相同的选择器，但通过data-backpack-slot属性区分
        const slots = document.querySelectorAll('[data-backpack-slot]');
        console.log('Found backpack slots:', slots.length);
        
        slots.forEach((slot, index) => {
            const item = this.backpack[index];
            console.log(`Processing backpack slot ${index}, item:`, item);
            
            slot.innerHTML = ''; // 清空
            slot.classList.remove('occupied');
            slot.classList.remove('occupied-by-large-item');
            
            if (item && item !== 'occupied') {
                console.log(`Rendering backpack item in slot ${index}:`, item);
                // 使用战斗区相同的渲染逻辑
                this.renderInventoryItem(slot, item, index, true); // true表示是背包
            } else if (item === 'occupied') {
                slot.classList.add('occupied-by-large-item');
                console.log(`Backpack slot ${index} marked as occupied`);
            } else {
                console.log(`Backpack slot ${index} is empty`);
            }
        });
        
        console.log('Backpack display updated successfully');
    }
    
    updateBackpackDisplayOnly() {
        // 直接调用完整更新，因为现在使用统一逻辑
        this.updateBackpackDisplay();
    }
    
    renderInventoryItem(slot, item, index, isBackpack = false) {
        console.log(`Rendering ${isBackpack ? 'backpack' : 'inventory'} item:`, {slot, item, index});
        
        // 显示物品
        slot.classList.add('occupied');
        
        const itemElement = document.createElement('div');
        itemElement.className = `inventory-item ${item.template.size > 1 ? `size-${item.template.size}` : ''}`;
        
        // 根据游戏阶段设置拖拽属性
        const canDrag = isBackpack || this.game.gamePhase !== 'battle';
        itemElement.draggable = canDrag;
        
        if (canDrag) {
            // 强化拖拽属性设置，特别是背包物品
            if (isBackpack) {
                itemElement.setAttribute('draggable', 'true');
                itemElement.style.webkitUserDrag = 'element';
                itemElement.style.webkitUserSelect = 'none';
                itemElement.style.userSelect = 'none';
                itemElement.style.cursor = 'grab';
                console.log('Enhanced backpack drag attributes for item:', {index, draggable: itemElement.draggable, webkitUserDrag: itemElement.style.webkitUserDrag});
            } else {
                itemElement.style.cursor = 'grab';
            }
        } else {
            // 战斗阶段的战斗区物品不可拖拽
            itemElement.style.cursor = 'default';
            itemElement.style.opacity = '1';
        }
        
        const iconElement = document.createElement('div');
        iconElement.className = 'inventory-item-icon';
        iconElement.textContent = item.template.icon;
        
        // 添加进度条
        const progressElement = document.createElement('div');
        progressElement.className = 'inventory-item-progress';
        
        const progressFillElement = document.createElement('div');
        
        if (isBackpack) {
            // 背包物品进度条始终为0
            progressFillElement.className = 'inventory-item-progress-fill';
            progressFillElement.style.width = '0%';
        } else {
            // 战斗区物品有冷却时间
            progressFillElement.className = `inventory-item-progress-fill ${item.isReady ? 'ready' : ''}`;
            const progressPercent = item.isReady ? 100 : 
                ((item.template.cooldown - item.cooldownRemaining) / item.template.cooldown) * 100;
            progressFillElement.style.width = progressPercent + '%';
        }
        
        progressElement.appendChild(progressFillElement);
        
        // 添加拖拽事件（只有可拖拽时才添加）
        if (canDrag) {
            if (isBackpack) {
                console.log('Adding backpack drag events to item:', {index, item});
                
                // 使用单一的拖拽事件处理，避免重复调用
                itemElement.addEventListener('dragstart', (e) => {
                    console.log('!!! BACKPACK DRAGSTART !!!', {index, item});
                    e.stopPropagation(); // 防止事件冒泡
                    this.handleBackpackDragStart(e, index, item);
                });
                
                itemElement.addEventListener('dragend', (e) => {
                    console.log('!!! BACKPACK DRAGEND !!!');
                    this.handleBackpackDragEnd(e);
                });
            } else {
                itemElement.addEventListener('dragstart', (e) => {
                    this.handleInventoryDragStart(e, index, item);
                });
                
                itemElement.addEventListener('dragend', (e) => {
                    this.handleInventoryDragEnd(e);
                });
            }
        }
        
        // 添加点击显示弹窗事件
        itemElement.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止事件冒泡，避免干扰拖拽
            console.log(`${isBackpack ? 'Backpack' : 'Inventory'} item clicked:`, {index, item});
            this.showItemInfo(item, slot);
        });
        
        itemElement.appendChild(iconElement);
        itemElement.appendChild(progressElement);
        slot.appendChild(itemElement);
        
        // 设置品质边框
        const quality = this.qualitySystem.getQuality(item.quality);
        
        if (item.template.size > 1) {
            itemElement.style.left = '0';
            itemElement.style.top = '0';
            itemElement.style.border = `2px solid ${quality.color}`;
            itemElement.style.borderRadius = '4px';
            itemElement.style.background = `${quality.color}20`;
        } else {
            itemElement.style.border = `1px solid ${quality.color}`;
            itemElement.style.background = `${quality.color}10`;
        }
        
        console.log(`${isBackpack ? 'Backpack' : 'Inventory'} item rendered successfully:`, itemElement);
    }
    
    renderBackpackItem(slot, item, index) {
        slot.classList.add('occupied');
        
        const itemElement = document.createElement('div');
        itemElement.className = `inventory-item ${item.template.size > 1 ? `size-${item.template.size}` : ''}`;
        itemElement.draggable = true;
        itemElement.setAttribute('draggable', 'true');
        itemElement.style.webkitUserDrag = 'element';
        itemElement.style.webkitUserSelect = 'none';
        itemElement.style.userSelect = 'none';
        console.log('Created backpack item element:', itemElement, 'draggable:', itemElement.draggable, 'webkitUserDrag:', itemElement.style.webkitUserDrag);
        
        const iconElement = document.createElement('div');
        iconElement.className = 'inventory-item-icon';
        iconElement.textContent = item.template.icon;
        
        const progressElement = document.createElement('div');
        progressElement.className = 'inventory-item-progress';
        
        const progressFillElement = document.createElement('div');
        progressFillElement.className = 'inventory-item-progress-fill ready';
        progressFillElement.style.width = '100%';
        
        progressElement.appendChild(progressFillElement);
        
        // 添加拖拽事件
        itemElement.addEventListener('dragstart', (e) => {
            console.log('!!! DRAGSTART EVENT FIRED !!!', {index, item});
            e.stopPropagation();
            this.handleBackpackDragStart(e, index, item);
        });
        
        itemElement.addEventListener('dragend', (e) => {
            console.log('!!! DRAGEND EVENT FIRED !!!');
            e.stopPropagation();
            this.handleBackpackDragEnd(e);
        });
        
        // 添加鼠标事件作为备用方案
        itemElement.addEventListener('mousedown', (e) => {
            console.log('MouseDown on backpack item:', {index, item});
        });
        
        // 强制启用拖拽
        itemElement.ondragstart = (e) => {
            console.log('!!! ONDRAGSTART TRIGGERED !!!', {index, item});
            this.handleBackpackDragStart(e, index, item);
        };
        
        itemElement.appendChild(iconElement);
        itemElement.appendChild(progressElement);
        slot.appendChild(itemElement);
        
        // 测试点击事件和元素层级
        itemElement.addEventListener('click', (e) => {
            console.log('!!! BACKPACK ITEM CLICKED !!!', {index, item});
            console.log('Event target:', e.target);
            console.log('Current target:', e.currentTarget);
            e.stopPropagation();
        });
        
        console.log('Item element added to slot, final element:', itemElement);
        console.log('Element position and size:', {
            offsetTop: itemElement.offsetTop,
            offsetLeft: itemElement.offsetLeft, 
            offsetWidth: itemElement.offsetWidth,
            offsetHeight: itemElement.offsetHeight
        });
        
        // 设置品质边框
        const quality = this.qualitySystem.getQuality(item.quality);
        if (item.template.size > 1) {
            itemElement.style.left = '0';
            itemElement.style.top = '0';
            itemElement.style.border = `2px solid ${quality.color}`;
            itemElement.style.borderRadius = '4px';
            itemElement.style.background = `${quality.color}20`;
        } else {
            itemElement.style.border = `1px solid ${quality.color}`;
            itemElement.style.background = `${quality.color}10`;
        }
    }
    
    setupBackpackDragAndDrop() {
        // 背包现在使用与战斗区相同的HTML结构和CSS类，
        // 所以可以直接复用setupDragAndDrop中的事件处理逻辑
        console.log('Setting up backpack drag and drop - using unified system');
        
        // 为背包槽位添加拖拽接收事件
        const backpackSlots = document.querySelectorAll('[data-backpack-slot]');
        
        backpackSlots.forEach((slot, index) => {
            // 添加拖拽接收事件
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                
                // 使用统一的拖拽处理逻辑
                if (this.draggedItem) {
                    const canDrop = this.canDropAtBackpack(index, this.draggedItem.template.size);
                    if (canDrop) {
                        this.highlightBackpackSlots(index, this.draggedItem.template.size, true);
                        e.dataTransfer.dropEffect = 'move';
                    }
                } else if (this.draggedShopItem) {
                    const template = this.shopItems[this.draggedShopItem.index].template;
                    const canDrop = this.canDropAtBackpack(index, template.size);
                    if (canDrop) {
                        this.highlightBackpackSlots(index, template.size, true);
                        e.dataTransfer.dropEffect = 'move';
                    }
                }
            });
            
            slot.addEventListener('dragleave', () => {
                this.clearBackpackHighlights();
            });
            
            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                this.clearBackpackHighlights();
                
                // 统一的拖拽处理
                if (this.draggedItem && this.draggedFromSlot !== -1) {
                    // 从战斗区到背包
                    const success = this.moveItemToBackpack(this.draggedFromSlot, index);
                    if (success) {
                        console.log('Successfully moved item to backpack, clearing drag state');
                        // 清除拖拽状态，防止dragend时恢复物品
                        this.draggedItem = null;
                        this.draggedFromSlot = -1;
                        this.draggedFromBackpackSlot = -1;
                    }
                } else if (this.draggedItem && this.draggedFromBackpackSlot !== -1) {
                    // 背包内移动
                    const success = this.moveItemWithinBackpack(this.draggedFromBackpackSlot, index);
                    if (success) {
                        console.log('Successfully moved item within backpack, clearing drag state');
                        // 清除拖拽状态
                        this.draggedItem = null;
                        this.draggedFromSlot = -1;
                        this.draggedFromBackpackSlot = -1;
                    }
                } else if (this.draggedShopItem) {
                    // 从商店到背包
                    this.buyItemToBackpack(this.draggedShopItem.index, index);
                    // 商店拖拽状态会在buyItemToBackpack中处理
                }
            });
        });
    }
    
    canDropAtBackpack(targetSlot, itemSize) {
        if (targetSlot + itemSize > this.backpack.length) {
            return false; // 超出背包范围
        }
        
        // 检查目标位置是否有足够空间
        for (let i = 0; i < itemSize; i++) {
            const checkSlot = targetSlot + i;
            const item = this.backpack[checkSlot];
            
            if (item) {
                // 如果是背包内移动，允许放在原物品的位置范围内
                if (this.draggedFromBackpackSlot !== -1) {
                    const draggedItemSize = this.draggedItem ? this.draggedItem.template.size : 1;
                    // 如果当前检查的格子在原物品的占用范围内，则允许
                    if (checkSlot >= this.draggedFromBackpackSlot && checkSlot < this.draggedFromBackpackSlot + draggedItemSize) {
                        continue; // 这个格子原本就被拖拽的物品占用，可以使用
                    } else {
                        return false; // 这个格子被其他物品占用
                    }
                } else {
                    return false; // 不是背包内移动，且格子被占用
                }
            }
        }
        return true;
    }
    
    moveItemToBackpack(fromInventorySlot, toBackpackSlot) {
        // 使用拖拽数据中的物品，因为原物品在拖拽开始时已被移除
        const item = this.draggedItem;
        console.log('moveItemToBackpack called with:', {fromInventorySlot, toBackpackSlot, item});
        
        if (!item) {
            console.log('Dragged item not found');
            return false;
        }
        
        const itemSize = item.template.size;
        
        // 检查背包目标位置是否可放置
        if (!this.canDropAtBackpack(toBackpackSlot, itemSize)) {
            console.log('Cannot drop at backpack slot');
            return false;
        }
        
        // 放置到背包（原物品已在拖拽开始时被移除）
        for (let i = 0; i < itemSize; i++) {
            if (i === 0) {
                this.backpack[toBackpackSlot + i] = item; // 主位置
            } else {
                this.backpack[toBackpackSlot + i] = 'occupied'; // 占用标记
            }
        }
        
        console.log('Item moved to backpack:', this.backpack[toBackpackSlot]);
        
        // 更新显示
        this.updateInventoryDisplay();
        this.updateBackpackDisplay();
        
        return true;
    }
    
    highlightBackpackSlots(startSlot, itemSize, highlight) {
        // 先清除所有高亮
        this.clearBackpackHighlights();
        
        if (highlight) {
            // 高亮指定范围的格子
            for (let i = 0; i < itemSize && (startSlot + i) < this.backpack.length; i++) {
                const slot = document.querySelector(`[data-backpack-slot="${startSlot + i}"]`);
                if (slot) {
                    slot.classList.add('drag-over');
                }
            }
        }
    }
    
    clearBackpackHighlights() {
        const slots = document.querySelectorAll('.backpack-slot');
        slots.forEach(slot => {
            slot.classList.remove('drag-over');
        });
    }
    
    handleBackpackDragStart(e, slotIndex, item) {
        console.log('=== BACKPACK DRAG START ===');
        console.log('Slot:', slotIndex, 'Item:', item);
        
        // 战斗阶段禁用拖动
        if (this.game.gamePhase === 'battle') {
            e.preventDefault();
            return;
        }
        
        // 使用与战斗区完全相同的逻辑
        this.draggedItem = JSON.parse(JSON.stringify(item));
        this.draggedFromBackpackSlot = slotIndex;
        this.draggedFromSlot = -1;
        
        console.log('Drag state:', {
            draggedItem: this.draggedItem,
            draggedFromBackpackSlot: this.draggedFromBackpackSlot,
            draggedFromSlot: this.draggedFromSlot
        });
        
        // 创建拖拽图像
        console.log('Creating drag image for backpack item...');
        this.createDragImage(e, item);
        console.log('Drag image created');
        
        // 立即从背包移除物品
        this.removeItemFromBackpack(slotIndex);
        console.log('Item removed from backpack, backpack state:', this.backpack);
        
        // 延迟更新显示，避免中断拖拽
        setTimeout(() => {
            this.updateBackpackDisplayOnly();
        }, 50);
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', 'backpack-item');
        console.log('Backpack drag started successfully, effectAllowed:', e.dataTransfer.effectAllowed);
    }
    
    handleBackpackDragEnd(e) {
        // 如果拖拽的物品还存在，说明拖拽失败，需要放回原位置
        if (this.draggedItem && this.draggedFromBackpackSlot !== -1) {
            console.log('Drag failed, restoring item to backpack position:', this.draggedFromBackpackSlot);
            // 将物品放回背包原位置
            this.addItemToBackpackAtSlot(this.draggedItem, this.draggedFromBackpackSlot);
            this.updateBackpackDisplay();
        }
        
        // 清理拖拽状态
        this.clearAllHighlights();
        this.clearBackpackHighlights();
        
        this.draggedItem = null;
        this.draggedFromBackpackSlot = -1;
    }
    
    
    removeItemFromBackpack(slotIndex) {
        const item = this.backpack[slotIndex];
        if (!item || item === 'occupied') return;
        
        const itemSize = item.template.size;
        
        // 清除物品占用的所有格子
        for (let i = 0; i < itemSize; i++) {
            this.backpack[slotIndex + i] = null;
        }
    }
    
    addItemToBackpackAtSlot(item, slotIndex) {
        const itemSize = item.template.size;
        
        // 确保背包物品进度条始终为0
        item.cooldownRemaining = item.template.cooldown;
        item.isReady = false;
        
        // 放置到背包指定位置
        for (let i = 0; i < itemSize; i++) {
            if (i === 0) {
                this.backpack[slotIndex + i] = item; // 主位置
            } else {
                this.backpack[slotIndex + i] = 'occupied'; // 占用标记
            }
        }
    }
    
    moveItemFromBackpackToInventory(fromBackpackSlot, toInventorySlot) {
        // 使用拖拽数据中的物品，因为原物品在拖拽开始时已被移除
        const item = this.draggedItem;
        console.log('moveItemFromBackpackToInventory called with:', {fromBackpackSlot, toInventorySlot, item});
        
        if (!item) {
            console.log('Dragged item not found');
            return false;
        }
        
        const itemSize = item.template.size;
        
        // 检查战斗区目标位置是否可放置
        if (!this.canDropAt(toInventorySlot, itemSize)) {
            console.log('Cannot drop at inventory slot');
            return false;
        }
        
        // 放置到战斗区（原物品已在拖拽开始时被移除）
        for (let i = 0; i < itemSize; i++) {
            if (i === 0) {
                this.inventory[toInventorySlot + i] = item; // 主位置
            } else {
                this.inventory[toInventorySlot + i] = 'occupied'; // 占用标记
            }
        }
        
        console.log('Item moved to inventory:', this.inventory[toInventorySlot]);
        
        // 更新显示
        this.updateInventoryDisplay();
        this.updateBackpackDisplay();
        
        return true;
    }
    
    buyItemToBackpack(shopIndex, targetSlot) {
        const shopItem = this.shopItems[shopIndex];
        if (!shopItem || !shopItem.available) return;
        
        const template = shopItem.template;
        const itemPrice = this.getItemPrice(template, shopItem.quality);
        const canAfford = this.game.playerGold >= itemPrice;
        const canPlaceAtSlot = this.canDropAtBackpack(targetSlot, template.size);
        
        if (canAfford && canPlaceAtSlot) {
            // 检查背包是否已有相同物品，如果是则升级
            const existingItemIndex = this.findExistingItemInBackpack(shopItem.id, shopItem.quality);
            
            if (existingItemIndex !== -1) {
                // 升级现有物品品质
                const existingItem = this.backpack[existingItemIndex];
                if (existingItem.quality < this.qualitySystem.qualities.length - 1) {
                    existingItem.quality++;
                }
            } else {
                // 添加新物品到背包指定位置
                const newItem = {
                    id: shopItem.id,
                    template: template,
                    quality: shopItem.quality,
                    cooldownRemaining: template.cooldown, // 始终从满冷却开始
                    isReady: false // 进度条始终为0
                };
                
                this.addItemToBackpackAtSlot(newItem, targetSlot);
            }
            
            // 扣除金币
            this.game.playerGold -= itemPrice;
            
            // 标记为已售出
            shopItem.available = false;
            
            // 更新显示
            this.updateShopDisplay();
            this.updateBackpackDisplay();
            this.game.updateUI();
            
            Utils.playSound('purchase');
        }
    }
    
    findExistingItemInBackpack(itemId, quality) {
        for (let i = 0; i < this.backpack.length; i++) {
            const item = this.backpack[i];
            if (item && item !== 'occupied' && item.id === itemId && item.quality === quality) {
                return i;
            }
        }
        return -1;
    }
    
    moveItemWithinBackpack(fromSlot, toSlot) {
        // 使用拖拽数据中的物品
        const item = this.draggedItem;
        console.log('moveItemWithinBackpack called with:', {fromSlot, toSlot, item});
        
        if (!item) {
            console.log('Dragged item not found');
            return false;
        }
        
        const itemSize = item.template.size;
        
        // 检查目标位置是否可放置
        if (!this.canDropAtBackpack(toSlot, itemSize)) {
            console.log('Cannot drop at backpack slot');
            return false;
        }
        
        // 放置到新位置（原物品已在拖拽开始时被移除）
        for (let i = 0; i < itemSize; i++) {
            if (i === 0) {
                this.backpack[toSlot + i] = item; // 主位置
            } else {
                this.backpack[toSlot + i] = 'occupied'; // 占用标记
            }
        }
        
        console.log('Item moved within backpack:', this.backpack[toSlot]);
        
        // 更新显示
        this.updateBackpackDisplay();
        
        return true;
    }
    
    // 显示物品信息弹窗（通用方法）
    showItemInfo(item, slotElement) {
        const popup = document.getElementById('shop-item-info');
        if (!popup) return;
        
        // 先清理之前的事件监听器
        if (this.popupClickHandler) {
            document.removeEventListener('click', this.popupClickHandler);
            this.popupClickHandler = null;
        }
        
        const template = item.template;
        const quality = item.quality;
        
        // 更新弹窗内容
        document.getElementById('shop-info-icon').textContent = template.icon;
        document.getElementById('shop-info-name').textContent = template.name;
        
        // 设置品质信息 - 显示等级数字
        const qualityElement = document.getElementById('shop-info-quality');
        qualityElement.textContent = `等级 ${quality}`;
        qualityElement.className = 'shop-info-quality';
        
        // 获取品质信息并设置颜色
        const qualityInfo = this.qualitySystem.getQuality(quality);
        let qualityColor = '#3498db'; // 默认蓝色边框
        
        // 根据品质设置颜色类和边框颜色
        if (quality === 1) {
            qualityElement.classList.add('green');
            qualityColor = '#4CAF50'; // 绿色
        } else if (quality === 2) {
            qualityElement.classList.add('blue');
            qualityColor = '#2196F3'; // 蓝色
        } else if (quality === 3) {
            qualityElement.classList.add('purple');
            qualityColor = '#9C27B0'; // 紫色
        } else if (quality === 4) {
            qualityElement.classList.add('orange');
            qualityColor = '#FF9800'; // 橙色
        } else if (quality === 5) {
            qualityElement.classList.add('red');
            qualityColor = '#F44336'; // 红色
        }
        
        // 设置弹窗边框颜色
        const popupContent = popup.querySelector('.shop-info-content');
        if (popupContent) {
            popupContent.style.borderColor = qualityColor;
        }
        
        // 计算品质加成后的属性
        const multiplier = this.qualitySystem.getQualityMultiplier(quality);
        
        // 获取单位属性（基于unitType）
        const unitStats = this.getUnitStats(template.unitType);
        
        // 更新属性显示
        document.getElementById('shop-info-health').textContent = Math.floor(unitStats.health * multiplier);
        document.getElementById('shop-info-attack').textContent = Math.floor(unitStats.attack * multiplier);
        document.getElementById('shop-info-range').textContent = unitStats.range;
        document.getElementById('shop-info-speed').textContent = unitStats.speed;
        
        // 更新价格显示
        const price = this.getItemPrice(template, quality);
        document.getElementById('shop-info-cost').textContent = `💰${price}`;
        
        
        // 存储事件监听器以便后续清理
        this.popupClickHandler = (e) => {
            if (!popup.contains(e.target)) {
                this.hideShopItemInfo();
            }
        };
        
        // 阻止点击弹窗内容时关闭弹窗
        const contentElement = popup.querySelector('.shop-info-content');
        if (contentElement) {
            contentElement.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
        // 延迟添加事件监听器，避免立即触发
        setTimeout(() => {
            document.addEventListener('click', this.popupClickHandler);
        }, 100);
        
        // 计算弹窗位置
        this.positionPopupAboveSlot(popup, slotElement);
        
        // 显示弹窗
        popup.classList.remove('hidden');
    }
    
    // 显示商店物品信息弹窗（包装方法）
    showShopItemInfo(shopItem, index, slotElement) {
        this.showItemInfo(shopItem, slotElement);
    }
    
    // 隐藏商店物品信息弹窗
    hideShopItemInfo() {
        const popup = document.getElementById('shop-item-info');
        if (popup) {
            popup.classList.add('hidden');
        }
        
        // 清理事件监听器
        if (this.popupClickHandler) {
            document.removeEventListener('click', this.popupClickHandler);
            this.popupClickHandler = null;
        }
    }
    
    // 计算弹窗位置，显示在商店物品上方
    positionPopupAboveSlot(popup, slotElement) {
        if (!popup || !slotElement) return;
        
        // 获取商店物品的位置信息
        const slotRect = slotElement.getBoundingClientRect();
        const popupContent = popup.querySelector('.shop-info-content');
        
        if (!popupContent) return;
        
        // 临时显示弹窗以获取尺寸（设为不可见）
        popup.style.visibility = 'hidden';
        popup.classList.remove('hidden');
        
        const popupRect = popupContent.getBoundingClientRect();
        const popupWidth = popupRect.width;
        const popupHeight = popupRect.height;
        
        // 隐藏弹窗
        popup.classList.add('hidden');
        popup.style.visibility = 'visible';
        
        // 计算弹窗位置
        let left = slotRect.left + (slotRect.width / 2) - (popupWidth / 2);
        let top = slotRect.top - popupHeight - 10; // 10px间距
        
        // 边界检查 - 确保弹窗不超出屏幕
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // 左右边界检查
        if (left < 10) {
            left = 10;
        } else if (left + popupWidth > viewportWidth - 10) {
            left = viewportWidth - popupWidth - 10;
        }
        
        // 上下边界检查
        if (top < 10) {
            // 如果上方空间不够，显示在物品下方
            top = slotRect.bottom + 10;
        }
        
        // 设置弹窗位置
        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;
    }
    
    // 获取单位属性
    getUnitStats(unitType) {
        const stats = {
            melee: { health: 120, attack: 25, range: 30, speed: 8 },
            ranged: { health: 80, attack: 20, range: 100, speed: 6 },
            tank: { health: 200, attack: 15, range: 35, speed: 4 },
            mage: { health: 60, attack: 35, range: 120, speed: 7 }
        };
        return stats[unitType] || { health: 100, attack: 20, range: 50, speed: 6 };
    }
    
    // 为商店物品添加攻击力显示标签
    addAttackDisplay(visualElement, template, quality) {
        // 先移除已存在的攻击力标签（如果有）
        const existingAttackLabel = visualElement.querySelector('.attack-label');
        if (existingAttackLabel) {
            existingAttackLabel.remove();
        }
        
        // 计算带品质加成的攻击力
        const unitStats = this.getUnitStats(template.unitType);
        const multiplier = this.qualitySystem.getQualityMultiplier(quality);
        const attackPower = Math.floor(unitStats.attack * multiplier);
        
        // 创建攻击力标签元素
        const attackLabel = document.createElement('div');
        attackLabel.className = `attack-label ${template.unitType}`;
        attackLabel.textContent = `${attackPower}`;
        
        // 添加到visual元素中
        visualElement.appendChild(attackLabel);
    }
    
}