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
        this.isFirstShopGeneration = true; // 标记是否为第一次生成商店
        
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
            // === 近战单位 ===
            
            // 小尺寸近战单位 (1x1)
            warrior: {
                name: '战士',
                icon: '⚔️',
                size: 1,
                baseValue: 1,
                unitType: 'melee',
                unitCount: 1,
                cooldown: 360, // 6秒 
                minQuality: 1, // 绿品质起始
                description: '基础近战战士'
            },
            assassin: {
                name: '忍者',
                icon: '🥷',
                size: 1,
                baseValue: 1,
                unitType: 'melee',
                unitCount: 1,
                cooldown: 300, // 5秒
                minQuality: 1, // 绿品质起始
                description: '快速高攻击近战单位'
            },
            gladiator: {
                name: '狂战士',
                icon: '🪓',
                size: 1,
                baseValue: 1,
                unitType: 'melee',
                unitCount: 1,
                cooldown: 480, // 8秒
                minQuality: 3, // 紫品质起始
                description: '高级近战战士'
            },
            barbarian: {
                name: '野蛮人',
                icon: '👹',
                size: 1,
                baseValue: 1,
                unitType: 'melee',
                unitCount: 1,
                cooldown: 300, // 5秒
                minQuality: 2, // 蓝品质起始
                description: '快速召唤的野蛮战士'
            },
            
            // 中尺寸近战单位 (2x1)
            giant: {
                name: '巨人',
                icon: '💪',
                size: 2,
                baseValue: 2,
                unitType: 'melee',
                unitCount: 1,
                cooldown: 540, // 9秒
                minQuality: 3, // 紫品质起始
                description: '抗远程攻击的巨型战士'
            },
            cavalry: {
                name: '骑兵',
                icon: '🐎',
                size: 2,
                baseValue: 2,
                unitType: 'melee',
                unitCount: 1,
                cooldown: 540, // 9秒
                minQuality: 1, // 绿品质起始
                description: '高速高攻击的骑兵单位'
            },
            
            // 大尺寸近战单位 (3x1)
            militia: {
                name: '民兵团',
                icon: '👪',
                size: 3,
                baseValue: 3,
                unitType: 'melee',
                unitCount: 1,
                cooldown: 600, // 10秒
                minQuality: 2, // 蓝品质起始
                description: '多单位的民兵组织'
            },
            
            // 特殊单位
            swordmaster: {
                name: '武士',
                icon: '🥋',
                size: 1,
                baseValue: 2,
                unitType: 'melee',
                unitCount: 1,
                cooldown: 540, // 9秒
                minQuality: 4, // 橙品质起始
                description: '相邻单位召唤时增强攻击力'
            },
            titan: {
                name: '泰坦',
                icon: '🗿',
                size: 3,
                baseValue: 3,
                unitType: 'melee',
                unitCount: 1,
                cooldown: 1200, // 20秒
                minQuality: 4, // 橙品质起始
                description: '近战单位召唤时减少冷却时间'
            },
            
            // === 其他兵种 ===
            
            bow: {
                name: '战弓',
                icon: '🏹',
                size: 1,
                baseValue: 1,
                unitType: 'ranged',
                unitCount: 1,
                cooldown: 360, // 6秒
                minQuality: 1,
                description: '生产1个弓箭手'
            },
            staff: {
                name: '法杖',
                icon: '🔮',
                size: 1,
                baseValue: 1,
                unitType: 'mage',
                unitCount: 1,
                cooldown: 420, // 7秒
                minQuality: 1,
                description: '生产1个法师'
            },
            shield: {
                name: '盾牌',
                icon: '🛡️',
                size: 1,
                baseValue: 1,
                unitType: 'tank',
                unitCount: 1,
                cooldown: 480, // 8秒
                minQuality: 1,
                description: '生产1个坦克兵'
            },
            
            // === 支援物品 ===
            warBanner: {
                name: '战旗',
                icon: '🚩',
                size: 2,
                baseValue: 2,
                unitType: 'melee',
                unitCount: 0,
                cooldown: 240, // 4秒
                minQuality: 3, // 紫色起始
                description: '全场其他近战物品召唤加速2秒'
            },
            
            magicSword: {
                name: '宝剑',
                icon: '🗡️',
                size: 1,
                baseValue: 1,
                unitType: 'melee',
                unitCount: 0,
                cooldown: 300, // 5秒
                minQuality: 2, // 蓝色起始
                description: '触发时为相邻的近战物品增加10攻击力'
            },
            
            badge: {
                name: '徽章',
                icon: '🏅',
                size: 1,
                baseValue: 1,
                unitType: 'melee',
                unitCount: 0,
                cooldown: -1, // 被动物品
                minQuality: 4, // 橙色起始
                description: '为左侧近战物品减少2秒冷却时间'
            }
        };
        
        this.preloadEmojis(); // 预加载emoji
        this.init();
    }
    
    // 预加载关键emoji
    preloadEmojis() {
        // 在DOM中创建隐藏元素预加载emoji
        const preloader = document.createElement('div');
        preloader.style.position = 'absolute';
        preloader.style.left = '-9999px';
        preloader.style.fontSize = '16px';
        preloader.style.fontFamily = '"Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji"';
        
        const keyEmojis = ['🥷', '🐎', '🏹', '🏅', '⚔️', '🪓', '💪'];
        preloader.textContent = keyEmojis.join('');
        
        document.body.appendChild(preloader);
        
        // 1秒后移除预加载元素
        setTimeout(() => {
            document.body.removeChild(preloader);
        }, 1000);
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
        // 短暂延迟确保emoji预加载完成
        setTimeout(() => {
            this.generateShopItems();
        }, 100);
        
        this.bindEvents();
        this.addTestUnits(); // 添加测试单位
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
        this.shopItems = [];
        const usedItems = new Set();
        
        if (this.isFirstShopGeneration) {
            // 第一次生成：固定包含忍者、骑兵和弓箭手
            console.log('第一次生成商店，固定包含忍者、骑兵和弓箭手');
            
            // 添加忍者（绿色品质）
            this.shopItems.push({
                id: 'assassin',
                template: this.itemTemplates.assassin,
                quality: 1, // 绿色品质
                available: true
            });
            usedItems.add('assassin');
            
            // 添加骑兵（绿色品质）
            this.shopItems.push({
                id: 'cavalry',
                template: this.itemTemplates.cavalry,
                quality: 1, // 绿色品质
                available: true
            });
            usedItems.add('cavalry');
            
            // 添加弓箭手（绿色品质）
            this.shopItems.push({
                id: 'bow',
                template: this.itemTemplates.bow,
                quality: 1, // 绿色品质
                available: true
            });
            usedItems.add('bow');
            
            this.isFirstShopGeneration = false; // 标记已完成第一次生成
        } else {
            // 后续生成：使用原来的随机逻辑
            const itemKeys = Object.keys(this.itemTemplates);
            
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
        const template = this.itemTemplates[itemKey];
        if (!template) return null;
        
        // 检查背包和战斗区中是否已有此物品
        const existingQuality = this.getExistingItemQuality(itemKey);
        if (existingQuality !== null) {
            // 检查已有物品的品质是否可以在当前波数出现且满足最低品质要求
            if (this.canQualityAppear(existingQuality) && existingQuality >= template.minQuality) {
                return existingQuality; // 返回已有物品的品质
            } else {
                return null; // 品质不能出现，返回null表示不能生成此物品
            }
        }
        
        // 如果没有已有物品，生成满足条件的品质
        const randomQuality = this.generateRandomQualityForWave();
        if (randomQuality !== null && randomQuality >= template.minQuality) {
            return randomQuality;
        }
        
        // 如果随机品质不满足要求，尝试使用最低要求品质
        if (this.canQualityAppear(template.minQuality)) {
            return template.minQuality;
        }
        
        return null; // 无法生成满足条件的品质
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
        // 先查找战斗区中相同类型和品质的物品
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            if (item && item !== 'occupied' && item.id === itemKey && item.quality === quality) {
                return i;
            }
        }
        
        // 如果战斗区没有，查找背包中相同类型和品质的物品
        for (let i = 0; i < this.backpack.length; i++) {
            const item = this.backpack[i];
            if (item && item !== 'occupied' && item.id === itemKey && item.quality === quality) {
                return -(i + 1000); // 用负数区分背包位置：-1000, -1001, -1002...
            }
        }
        
        return -1;
    }
    
    upgradeItem(itemIndex) {
        let item;
        let isInBackpack = false;
        let actualIndex = itemIndex;
        
        if (itemIndex < 0) {
            // 背包中的物品（负数索引）
            actualIndex = -itemIndex - 1000;
            item = this.backpack[actualIndex];
            isInBackpack = true;
        } else {
            // 战斗区中的物品
            item = this.inventory[itemIndex];
        }
        
        if (!item || item === 'occupied') return;
        
        // 品质升级
        if (item.quality < 5) { // 最大品质为5
            item.quality++;
            
            // 显示升级特效
            this.showUpgradeEffect(isInBackpack ? actualIndex : itemIndex, isInBackpack);
            
            console.log(`物品升级！${item.template.name} -> ${this.qualitySystem.getQuality(item.quality).label}`);
            
            // 更新对应显示
            if (isInBackpack) {
                this.updateBackpackDisplay();
            } else {
                this.updateInventoryDisplay();
            }
            
            // 如果是徽章升级，刷新所有徽章效果
            if (item.id === 'badge') {
                this.refreshAllBadgeEffects();
            }
        }
    }
    
    showUpgradeEffect(itemIndex, isInBackpack = false) {
        // 获取物品在对应区域中的位置，显示升级特效
        let slot;
        if (isInBackpack) {
            slot = document.querySelector(`[data-backpack-slot="${itemIndex}"]`);
        } else {
            slot = document.querySelector(`[data-slot="${itemIndex}"]`);
        }
        
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
                this.addAttackDisplay(visualElement, template, item.quality, item.id);
                
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
        
        if (!canAfford) return; // 买不起直接返回
        
        // 先检查是否已有相同物品，如果是则升级
        const existingItemIndex = this.findExistingItem(shopItem.id, shopItem.quality);
        
        if (existingItemIndex !== -1) {
            // 升级现有物品（不需要检查空位）
            this.upgradeItem(existingItemIndex);
            this.game.playerGold -= itemPrice;
            
            // 忍者特殊技能：如果购买的是近战物品，给所有忍者加攻击力
            if (template.unitType === 'melee') {
                this.boostAssassinAttack();
            }
            
            // 标记为已售出
            shopItem.available = false;
            
            // 更新显示
            this.updateShopDisplay();
            this.updateInventoryDisplay();
            this.updateBackpackDisplay(); // 也要更新背包显示
            this.game.updateUI();
            
            Utils.playSound('purchase');
        } else {
            // 没有相同物品，检查是否有空位放新物品
            const hasSpace = this.canFitItem(template.size);
            
            if (hasSpace) {
                // 扣除金币
                this.game.playerGold -= itemPrice;
                
                // 忍者特殊技能：如果购买的是近战物品，先给所有忍者加攻击力
                if (template.unitType === 'melee') {
                    this.boostAssassinAttack();
                }
                
                // 创建物品实例
                const item = {
                    id: shopItem.id,
                    template: template,
                    quality: shopItem.quality,
                    cooldownRemaining: 0, // 先设为0，后面会更新
                    isReady: false, // 进度条始终为0
                    attackBonus: 0, // 通用攻击力加成（宝剑等物品会修改这个值）
                    cooldownReduction: 0, // 冷却时间减少（徽章等物品会修改这个值）
                    meleeBonus: 0, // 忍者特殊技能：近战攻击力加成
                    militiaBonus: 0, // 民兵团特殊技能：额外单位计数器
                    barbarianBonus: 0, // 野蛮人特殊技能：品质攻击力加成
                    accelerationTime: 0 // 战旗加速剩余时间
                };
                
                // 计算实际的冷却时间（考虑升级效果）
                const actualCooldown = this.getActualCooldown(item);
                item.cooldownRemaining = actualCooldown;
                
                // 为野蛮人计算品质攻击力加成（相对于起始品质）
                if (item.id === 'barbarian') {
                    const qualityLevelsAboveMin = item.quality - template.minQuality;
                    item.barbarianBonus = qualityLevelsAboveMin * 30; // 每提升一个品质+30攻击力
                }
                
                // 为巨人计算品质生命值加成（相对于起始品质）
                if (item.id === 'giant') {
                    const qualityLevelsAboveMin = item.quality - template.minQuality;
                    item.giantHealthBonus = qualityLevelsAboveMin * 100; // 每提升一个品质+100生命值
                }
                
                
                // 放入背包
                this.addItemToInventory(item);
                
                // 标记为已售出
                shopItem.available = false;
                
                // 更新显示
                this.updateShopDisplay();
                this.updateInventoryDisplay();
                this.game.updateUI();
                
                Utils.playSound('purchase');
            }
            // 如果没有空位，什么都不做（不购买）
        }
    }
    
    buyItemAtSlot(shopIndex, targetSlot) {
        const shopItem = this.shopItems[shopIndex];
        if (!shopItem || !shopItem.available) return;
        
        const template = shopItem.template;
        const itemPrice = this.getItemPrice(template, shopItem.quality);
        const canAfford = this.game.playerGold >= itemPrice;
        
        if (!canAfford) return; // 买不起直接返回
        
        // 先检查是否已有相同物品，如果是则升级（不需要检查位置）
        const existingItemIndex = this.findExistingItem(shopItem.id, shopItem.quality);
        
        if (existingItemIndex !== -1) {
            // 升级现有物品
            this.upgradeItem(existingItemIndex);
            this.game.playerGold -= itemPrice;
            
            // 忍者特殊技能：如果购买的是近战物品，给所有忍者加攻击力
            if (template.unitType === 'melee') {
                this.boostAssassinAttack();
            }
            
            // 标记为已售出
            shopItem.available = false;
            
            // 更新显示
            this.updateShopDisplay();
            this.updateInventoryDisplay();
            this.game.updateUI();
            
            Utils.playSound('purchase');
            return;
        }
        
        // 没有相同物品，尝试新放置
        const canPlaceAtSlot = this.canDropAt(targetSlot, template.size);
        
        if (canPlaceAtSlot) {
            // 能在指定位置放置
            this.game.playerGold -= itemPrice;
            
            // 忍者特殊技能：如果购买的是近战物品，先给所有忍者加攻击力
            if (template.unitType === 'melee') {
                this.boostAssassinAttack();
            }
            
            // 创建物品实例
            const item = {
                id: shopItem.id,
                template: template,
                quality: shopItem.quality,
                cooldownRemaining: 0, // 先设为0，后面会更新
                isReady: false, // 进度条始终为0
                attackBonus: 0, // 通用攻击力加成（宝剑等物品会修改这个值）
                cooldownReduction: 0 // 冷却时间减少（徽章等物品会修改这个值）
            };
            
            // 计算实际的冷却时间（考虑升级效果）
            const actualCooldown = this.getActualCooldown(item);
            item.cooldownRemaining = actualCooldown;
            
            // 放入指定位置
            this.addItemToInventoryAtSlot(item, targetSlot);
        } else {
            // 不能在指定位置放置，尝试自动找位置
            const hasSpace = this.canFitItem(template.size);
            
            if (hasSpace) {
                this.game.playerGold -= itemPrice;
                
                // 忍者特殊技能：如果购买的是近战物品，先给所有忍者加攻击力
                if (template.unitType === 'melee') {
                    this.boostAssassinAttack();
                }
                
                // 创建物品实例
                const item = {
                    id: shopItem.id,
                    template: template,
                    quality: shopItem.quality,
                    cooldownRemaining: 0, // 先设为0，后面会更新
                    isReady: false, // 进度条始终为0
                    attackBonus: 0, // 通用攻击力加成（宝剑等物品会修改这个值）
                    cooldownReduction: 0 // 冷却时间减少（徽章等物品会修改这个值）
                };
                
                // 计算实际的冷却时间（考虑升级效果）
                const actualCooldown = this.getActualCooldown(item);
                item.cooldownRemaining = actualCooldown;
                
                // 自动找位置放入
                this.addItemToInventory(item);
            } else {
                // 完全没有空位，购买失败
                return;
            }
        }
        
        // 标记为已售出
        shopItem.available = false;
        
        // 更新显示
        this.updateShopDisplay();
        this.updateInventoryDisplay();
        this.game.updateUI();
        
        Utils.playSound('purchase');
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
        
        // 刷新徽章效果
        this.refreshAllBadgeEffects();
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
        
        // 徽章被动效果：放置时为左侧近战物品减少冷却时间
        if (item.id === 'badge') {
            this.applyBadgeEffect(targetSlot);
        }
        
        // 如果是近战物品，检查右侧是否有徽章
        if (item.template.unitType === 'melee') {
            this.checkRightBadge(targetSlot);
        }
        
        // 刷新所有徽章效果
        this.refreshAllBadgeEffects();
    }
    
    useItem(slotIndex) {
        const item = this.inventory[slotIndex];
        if (!item || item === 'occupied' || !item.isReady) return;
        
        // 宝剑特殊效果：触发时为相邻近战物品增加攻击力
        if (item.id === 'magicSword') {
            this.triggerMagicSwordEffect(slotIndex);
        } else {
            // 生产单位
            this.produceUnits(item, slotIndex);
        }
        
        // 设置冷却（使用实际的冷却时间）
        item.cooldownRemaining = this.getActualCooldown(item);
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
    
    produceUnits(item, itemSlot) {
        const template = item.template;
        
        // 战旗特殊处理：触发全场近战单位加速
        if (item.id === 'warBanner') {
            this.triggerWarBannerAcceleration();
            return;
        }
        
        // 计算实际生产的单位数（基础数量 + 民兵团额外单位）
        let actualUnitCount = template.unitCount;
        if (item.id === 'militia') {
            actualUnitCount += item.militiaBonus || 0;
        }
        
        for (let i = 0; i < actualUnitCount; i++) {
            // 稍微延迟每个单位的生产
            setTimeout(() => {
                // 计算各种单位的属性加成
                let bonusAttack = 0;
                let bonusHealth = 0;
                
                // 通用攻击力加成（宝剑等支援物品提供）
                bonusAttack += item.attackBonus || 0;
                
                if (item.id === 'gladiator') {
                    bonusAttack += item.gladiatorBonus || 0;
                } else if (item.id === 'giant') {
                    bonusHealth = item.giantHealthBonus || 0;
                } else if (item.id === 'swordmaster') {
                    bonusAttack += item.swordmasterBonus || 0;
                }
                
                this.game.spawnPlayerUnitBySpecificType(item.id, template.unitType, bonusAttack, bonusHealth);
            }, i * 200); // 0.2秒间隔
        }
        
        // 民兵团特殊技能：生产后增加下次额外单位数
        if (item.id === 'militia') {
            item.militiaBonus = (item.militiaBonus || 0) + 1;
            console.log(`民兵团技能触发！下次将额外生产 ${item.militiaBonus} 个单位`);
            
            // 更新显示以反映技能状态
            this.updateInventoryDisplay();
            this.updateBackpackDisplay();
        }
        
        // 武士特殊技能：检查相邻位置是否有武士，如果召唤的是近战单位则根据数量增加攻击力
        if (template.unitType === 'melee') {
            this.boostAdjacentSwordmasters(itemSlot, actualUnitCount);
        }
        
        // 泰坦特殊技能：如果召唤的是近战单位，为所有泰坦充能1秒
        if (template.unitType === 'melee' && item.id !== 'titan' && actualUnitCount > 0) {
            this.chargeTitans();
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
                item.cooldownRemaining = this.getActualCooldown(item);
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
                item.cooldownRemaining = this.getActualCooldown(item); // 冷却时间重置为实际值
                item.isReady = false; // 进度条为0
                
                // 重置民兵团特殊技能状态
                if (item.id === 'militia') {
                    item.militiaBonus = 0;
                    console.log('民兵团技能已重置，下次生产回到基础数量');
                }
            }
        }
        
        // 重置背包物品（保持进度条为0）
        for (let i = 0; i < this.backpack.length; i++) {
            const item = this.backpack[i];
            if (item && item !== 'occupied') {
                item.cooldownRemaining = this.getActualCooldown(item); // 使用实际冷却时间
                item.isReady = false; // 进度条为0
                
                // 重置民兵团特殊技能状态
                if (item.id === 'militia') {
                    item.militiaBonus = 0;
                    console.log('背包民兵团技能已重置');
                }
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
                        // 没有拖拽到具体格子，检查是否能购买（升级或新放置）
                        const shopItem = this.draggedShopItem.item;
                        const existingItemIndex = this.findExistingItem(shopItem.id, shopItem.quality);
                        const canFit = this.canFitItem(shopItem.template.size);
                        const canAfford = this.game.playerGold >= this.getItemPrice(shopItem.template, shopItem.quality);
                        
                        // 如果能升级现有物品或者有空位放新物品，就购买
                        if (canAfford && (existingItemIndex !== -1 || canFit)) {
                            this.buyItem(this.draggedShopItem.index);
                        }
                        // 如果没有空位且没有可升级物品，什么都不做
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
        
        // 刷新徽章效果（物品移除可能影响徽章效果）
        this.refreshAllBadgeEffects();
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
                    // 更新进度条（使用实际冷却时间）
                    const actualCooldown = this.getActualCooldown(item);
                    const progressPercent = item.isReady ? 100 : 
                        ((actualCooldown - item.cooldownRemaining) / actualCooldown) * 100;
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
                    // 计算冷却减少量（加速状态下翻倍）
                    let cooldownDecrease = 1;
                    if (item.accelerationTime > 0) {
                        cooldownDecrease = 2; // 加速状态下冷却速度翻倍
                        item.accelerationTime--; // 减少加速时间
                        if (item.accelerationTime <= 0) {
                            console.log(`物品${item.template.name}加速状态结束`);
                        }
                    }
                    
                    item.cooldownRemaining -= cooldownDecrease;
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
        itemElement.style.position = 'relative'; // 确保攻击力标签能正确定位
        
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
            // 战斗区物品有冷却时间（使用实际冷却时间计算进度）
            const actualCooldown = this.getActualCooldown(item);
            progressFillElement.className = `inventory-item-progress-fill ${item.isReady ? 'ready' : ''}`;
            const progressPercent = item.isReady ? 100 : 
                ((actualCooldown - item.cooldownRemaining) / actualCooldown) * 100;
            progressFillElement.style.width = progressPercent + '%';
        }
        
        progressElement.appendChild(progressFillElement);
        
        // 添加攻击力显示标签
        this.addAttackDisplayToItem(itemElement, item.template, item.quality, item.id, item);
        
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
            itemElement.style.width = `${item.template.size * 100}%`; // 基于百分比而不是固定像素
            itemElement.style.height = '100%';
            itemElement.style.border = `2px solid ${quality.color}`;
            itemElement.style.borderRadius = '4px';
            itemElement.style.background = `${quality.color}20`;
            itemElement.style.position = 'absolute';
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
        
        // 确保背包物品进度条始终为0（使用实际冷却时间）
        item.cooldownRemaining = this.getActualCooldown(item);
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
        
        // 刷新徽章效果（物品位置变化可能影响徽章效果）
        this.refreshAllBadgeEffects();
        
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
        
        if (!canAfford) return; // 买不起直接返回
        
        // 先检查背包是否已有相同物品，如果是则升级（不需要检查位置）
        const existingItemIndex = this.findExistingItemInBackpack(shopItem.id, shopItem.quality);
        
        if (existingItemIndex !== -1) {
            // 升级现有物品品质
            const existingItem = this.backpack[existingItemIndex];
            if (existingItem.quality < this.qualitySystem.qualities.length - 1) {
                existingItem.quality++;
            }
            
            // 忍者特殊技能：如果购买的是近战物品，先给所有忍者加攻击力
            if (template.unitType === 'melee') {
                this.boostAssassinAttack();
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
            return;
        }
        
        // 没有相同物品，尝试新放置
        const canPlaceAtSlot = this.canDropAtBackpack(targetSlot, template.size);
        
        if (canPlaceAtSlot) {
            // 能在指定位置放置
            this.game.playerGold -= itemPrice;
            
            // 忍者特殊技能：如果购买的是近战物品，先给所有忍者加攻击力
            if (template.unitType === 'melee') {
                this.boostAssassinAttack();
            }
            
            // 添加新物品到背包指定位置
            const newItem = {
                id: shopItem.id,
                template: template,
                quality: shopItem.quality,
                cooldownRemaining: 0, // 先设为0，后面会更新
                isReady: false, // 进度条始终为0
                attackBonus: 0, // 通用攻击力加成（宝剑等物品会修改这个值）
                cooldownReduction: 0, // 冷却时间减少（徽章等物品会修改这个值）
                meleeBonus: 0, // 忍者特殊技能：近战攻击力加成
                militiaBonus: 0, // 民兵团特殊技能：额外单位计数器
                barbarianBonus: 0, // 野蛮人特殊技能：品质攻击力加成
                gladiatorBonus: 0, // 角斗士特殊技能：战斗攻击力加成
                accelerationTime: 0, // 战旗加速剩余时间
                giantHealthBonus: 0, // 巨人升级效果：品质生命值加成
                swordmasterBonus: 0 // 剑圣特殊技能：相邻召唤攻击力加成
            };
            
            // 计算实际的冷却时间（考虑升级效果）
            const actualCooldown = this.getActualCooldown(newItem);
            newItem.cooldownRemaining = actualCooldown;
            
            // 为野蛮人计算品质攻击力加成（相对于起始品质）
            if (newItem.id === 'barbarian') {
                const qualityLevelsAboveMin = newItem.quality - template.minQuality;
                newItem.barbarianBonus = qualityLevelsAboveMin * 30; // 每提升一个品质+30攻击力
            }
            
            // 为巨人计算品质生命值加成（相对于起始品质）
            if (newItem.id === 'giant') {
                const qualityLevelsAboveMin = newItem.quality - template.minQuality;
                newItem.giantHealthBonus = qualityLevelsAboveMin * 100; // 每提升一个品质+100生命值
            }
            
            
            this.addItemToBackpackAtSlot(newItem, targetSlot);
        } else {
            // 不能在指定位置放置，尝试自动找位置
            // 检查背包是否有空位
            const hasBackpackSpace = this.canFitItemInBackpack(template.size);
            
            if (hasBackpackSpace) {
                this.game.playerGold -= itemPrice;
                
                // 忍者特殊技能：如果购买的是近战物品，先给所有忍者加攻击力
                if (template.unitType === 'melee') {
                    this.boostAssassinAttack();
                }
                
                // 添加新物品到背包（自动找位置）
                const newItem = {
                    id: shopItem.id,
                    template: template,
                    quality: shopItem.quality,
                    cooldownRemaining: 0, // 先设为0，后面会更新
                    isReady: false, // 进度条始终为0
                    attackBonus: 0, // 通用攻击力加成（宝剑等物品会修改这个值）
                    cooldownReduction: 0, // 冷却时间减少（徽章等物品会修改这个值）
                    meleeBonus: 0, // 忍者特殊技能：近战攻击力加成
                    militiaBonus: 0, // 民兵团特殊技能：额外单位计数器
                    barbarianBonus: 0, // 野蛮人特殊技能：品质攻击力加成
                    gladiatorBonus: 0, // 角斗士特殊技能：战斗攻击力加成
                    giantHealthBonus: 0, // 巨人升级效果：品质生命值加成
                    swordmasterBonus: 0 // 剑圣特殊技能：相邻召唤攻击力加成
                };
                
                // 计算实际的冷却时间（考虑升级效果）
                const actualCooldown = this.getActualCooldown(newItem);
                newItem.cooldownRemaining = actualCooldown;
                
                // 为野蛮人计算品质攻击力加成（相对于起始品质）
                if (newItem.id === 'barbarian') {
                    const qualityLevelsAboveMin = newItem.quality - template.minQuality;
                    newItem.barbarianBonus = qualityLevelsAboveMin * 30; // 每提升一个品质+30攻击力
                }
                
                
                this.addItemToBackpackAutoSlot(newItem);
            } else {
                // 背包完全没有空位，购买失败
                return;
            }
        }
        
        // 标记为已售出
        shopItem.available = false;
        
        // 更新显示
        this.updateShopDisplay();
        this.updateBackpackDisplay();
        this.game.updateUI();
        
        Utils.playSound('purchase');
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
        
        // 设置物品类型信息（替换原本的等级显示）
        const qualityElement = document.getElementById('shop-info-quality');
        const attackTypeNames = {
            melee: '近战',
            ranged: '远程',
            tank: '坦克',
            mage: '魔法'
        };
        qualityElement.textContent = attackTypeNames[template.unitType] || '近战';
        qualityElement.className = `shop-info-quality ${template.unitType}`;
        
        // 根据兵种类型设置颜色
        let qualityColor = '#3498db'; // 默认蓝色边框
        
        // 根据兵种设置颜色类和边框颜色
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
        
        // 为显示创建临时的完整物品对象（包含所有加成计算）
        let displayItem = item;
        if (!item.giantHealthBonus && item.id === 'giant' && item.quality) {
            // 为商店中的巨人物品临时计算生命值加成
            displayItem = {...item};
            const qualityLevelsAboveMin = item.quality - template.minQuality;
            displayItem.giantHealthBonus = qualityLevelsAboveMin * 100;
        }
        
        // 获取单位属性（基于具体单位key）
        const unitStats = this.getUnitStats(template.unitType, item.id, displayItem);
        
        // 更新攻击emoji和颜色
        const attackEmojiElement = document.getElementById('shop-info-attack-emoji');
        if (attackEmojiElement) {
            // 根据兵种设置不同的攻击图标
            const attackIcons = {
                melee: '⚔️',
                ranged: '🏹', 
                tank: '🛡️',
                mage: '🔮'
            };
            
            attackEmojiElement.textContent = attackIcons[template.unitType] || '⚔️';
            attackEmojiElement.className = `attack-emoji ${template.unitType}`;
        }
        
        // 隐藏攻击类型标签（已移动到品质位置显示）
        const attackTypeBadge = document.getElementById('attack-type-badge');
        if (attackTypeBadge) {
            attackTypeBadge.style.display = 'none';
        }
        
        // 更新属性显示（触发间隔显示实际值，考虑升级效果）
        const actualCooldown = this.getActualCooldown(item);
        
        // 检查是否为非召唤物品
        const isNonSummonItem = template.unitCount === 0;
        
        // 获取所有stat-row元素
        const statRows = document.querySelectorAll('.shop-info-stats .stat-row');
        
        if (isNonSummonItem) {
            // 非召唤物品：只显示CD和特殊技能
            // 被动物品（CD=-1）不显示CD属性
            if (actualCooldown === -1) {
                // 被动物品：完全隐藏包含CD的第二行
                if (statRows[1]) statRows[1].style.display = 'none';
            } else {
                // 普通非召唤物品：显示CD
                document.getElementById('shop-info-cooldown').textContent = `${actualCooldown/60}秒`;
                const cooldownStatItem = document.getElementById('shop-info-cooldown').closest('.stat-item');
                if (cooldownStatItem) {
                    cooldownStatItem.style.display = '';
                }
                
                // 显示第二行，但隐藏单位数
                if (statRows[1]) {
                    const countItem = statRows[1].querySelector('.stat-item:nth-child(2)');
                    if (countItem) countItem.style.visibility = 'hidden'; // 隐藏单位数，保持布局空间
                    statRows[1].style.display = 'flex';
                }
            }
            
            // 隐藏不相关的属性行
            if (statRows[0]) statRows[0].style.display = 'none'; // 攻击力和血量
            if (statRows[2]) statRows[2].style.display = 'none'; // 速度和基地伤害
        } else {
            // 召唤物品：显示所有属性
            document.getElementById('shop-info-attack').textContent = unitStats.attack;
            document.getElementById('shop-info-health').textContent = unitStats.health;
            document.getElementById('shop-info-cooldown').textContent = `${actualCooldown/60}秒`;
            document.getElementById('shop-info-speed').textContent = unitStats.speed;
            
            // 显示属性行
            if (statRows[0]) statRows[0].style.display = 'flex'; // 攻击力和血量
            if (statRows[1]) statRows[1].style.display = 'flex'; // CD和速度
        }
        
        // 更新价格显示
        const price = this.getItemPrice(template, quality);
        document.getElementById('shop-info-cost').textContent = `💰${price}`;
        
        // 显示特殊技能（忍者和民兵团有特殊技能）
        const specialSkillElement = document.getElementById('shop-info-special-skill');
        if (item.id === 'assassin' && specialSkillElement) {
            specialSkillElement.classList.remove('hidden');
            const meleeBonus = item.meleeBonus || 0;
            
            // 根据当前品质动态生成技能描述
            const currentQualityBonus = this.getAssassinQualityBonus(item.quality);
            const qualityColor = this.getQualityColor(item.quality);
            const skillDescElement = document.getElementById('skill-description');
            if (skillDescElement) {
                skillDescElement.innerHTML = `每购买一个<span class="melee-badge">近战</span>物品，忍者的攻击力增加 <span style="color: white; font-weight: bold;">+${currentQualityBonus}</span>`;
            }
            
            const skillStatusElement = document.getElementById('skill-status');
            skillStatusElement.innerHTML = `当前加成: <span style="color: white; font-weight: bold;">+${meleeBonus}</span>`;
        } else if (item.id === 'militia' && specialSkillElement) {
            specialSkillElement.classList.remove('hidden');
            const militiaBonus = item.militiaBonus || 0;
            const qualityColor = this.getQualityColor(item.quality);
            
            const skillDescElement = document.getElementById('skill-description');
            if (skillDescElement) {
                skillDescElement.innerHTML = `战斗中召唤后，本场战斗下次召唤多生产 <span style="color: white; font-weight: bold;">+1</span> 个单位`;
            }
            
            const skillStatusElement = document.getElementById('skill-status');
            skillStatusElement.innerHTML = `下次额外生产: <span style="color: white; font-weight: bold;">+${militiaBonus}</span> 个`;
        } else if (item.id === 'gladiator' && specialSkillElement) {
            specialSkillElement.classList.remove('hidden');
            const gladiatorBonus = item.gladiatorBonus || 0;
            const totalBonus = gladiatorBonus;
            const qualityColor = this.getQualityColor(item.quality);
            
            const skillDescElement = document.getElementById('skill-description');
            if (skillDescElement) {
                const killBonus = this.getGladiatorKillBonus(item.quality);
                skillDescElement.innerHTML = `战斗中我方近战单位消灭敌人后，物品攻击力 <span style="color: white; font-weight: bold;">+${killBonus}</span>`;
            }
            
            const skillStatusElement = document.getElementById('skill-status');
            skillStatusElement.innerHTML = `当前攻击力加成: <span style="color: white; font-weight: bold;">+${totalBonus}</span>`;
        } else if (item.id === 'swordmaster' && specialSkillElement) {
            specialSkillElement.classList.remove('hidden');
            const swordmasterBonus = item.swordmasterBonus || 0;
            const qualityColor = this.getQualityColor(item.quality);
            
            const skillDescElement = document.getElementById('skill-description');
            if (skillDescElement) {
                const qualityBonus = item.quality === 4 ? '+10' : '+15'; // 橙色+10, 红色+15
                skillDescElement.innerHTML = `相邻物品每召唤一个<span class="melee-badge">近战</span>单位，本场战斗武士攻击力 <span style="color: white; font-weight: bold;">${qualityBonus}</span>`;
            }
            
            const skillStatusElement = document.getElementById('skill-status');
            skillStatusElement.innerHTML = `当前攻击力加成: <span style="color: white; font-weight: bold;">+${swordmasterBonus}</span>`;
        } else if (item.id === 'titan' && specialSkillElement) {
            specialSkillElement.classList.remove('hidden');
            const titanCharges = item.titanCharges || 0;
            const qualityColor = this.getQualityColor(item.quality);
            
            const skillDescElement = document.getElementById('skill-description');
            if (skillDescElement) {
                skillDescElement.innerHTML = `每次召唤<span class="melee-badge">近战</span>单位时，为泰坦 <span style="color: #17a2b8; font-weight: bold;">充能1秒</span><br>拥有 <span style="color: #f39c12; font-weight: bold;">800护盾</span>`;
            }
            
            const skillStatusElement = document.getElementById('skill-status');
            skillStatusElement.innerHTML = ``; // 不显示任何状态信息
        } else if (item.id === 'giant' && specialSkillElement) {
            specialSkillElement.classList.remove('hidden');
            const qualityColor = this.getQualityColor(item.quality);
            
            const skillDescElement = document.getElementById('skill-description');
            if (skillDescElement) {
                skillDescElement.innerHTML = `受到非近战伤害减免 <span style="color: white; font-weight: bold;">40%</span>`;
            }
            
            const skillStatusElement = document.getElementById('skill-status');
            skillStatusElement.innerHTML = ``; // 不显示任何状态信息
        } else if (item.id === 'warBanner' && specialSkillElement) {
            specialSkillElement.classList.remove('hidden');
            const qualityColor = this.getQualityColor(item.quality);
            
            const skillDescElement = document.getElementById('skill-description');
            if (skillDescElement) {
                skillDescElement.innerHTML = `为全场其他<span class="melee-badge">近战</span>物品 <span style="color: #17a2b8; font-weight: bold;">加速2秒</span>`;
            }
            
            const skillStatusElement = document.getElementById('skill-status');
            skillStatusElement.innerHTML = ``; // 不显示任何状态信息
        } else if (item.id === 'magicSword' && specialSkillElement) {
            specialSkillElement.classList.remove('hidden');
            const attackBonus = this.getMagicSwordBonus(item.quality);
            
            const skillDescElement = document.getElementById('skill-description');
            if (skillDescElement) {
                skillDescElement.innerHTML = `为相邻的<span class="melee-badge">近战</span>物品增加 <span style="color: white; font-weight: bold;">+${attackBonus}</span> 攻击力`;
            }
            
            const skillStatusElement = document.getElementById('skill-status');
            skillStatusElement.innerHTML = ``; // 不显示任何状态信息
        } else if (item.id === 'badge' && specialSkillElement) {
            specialSkillElement.classList.remove('hidden');
            const cooldownReduction = this.getBadgeReduction(item.quality);
            
            const skillDescElement = document.getElementById('skill-description');
            if (skillDescElement) {
                skillDescElement.innerHTML = `左侧<span class="melee-badge">近战</span>物品<span style="color: #3498db; font-weight: bold;">冷却-${cooldownReduction}秒</span>`;
            }
            
            const skillStatusElement = document.getElementById('skill-status');
            skillStatusElement.innerHTML = ``; // 不显示任何状态信息
        } else if (specialSkillElement) {
            specialSkillElement.classList.add('hidden');
        }
        
        
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
    
    // 获取单位属性 - 根据具体单位类型而不是兵种类型
    getUnitStats(unitType, unitKey = null, item = null) {
        // 如果有具体的单位key，使用具体的单位属性
        if (unitKey) {
            const specificStats = {
                // 近战单位 - 按尺寸设计基地伤害
                warrior:    { health: 100, attack: 30, range: 30, speed: 10, baseDamage: 20 }, // 小型
                assassin:   { health: 100, attack: 20, range: 30, speed: 12, baseDamage: 20 }, // 小型
                gladiator:  { health: 100, attack: 40, range: 30, speed: 10, baseDamage: 20 }, // 小型
                barbarian:  { health: 100, attack: 40, range: 30, speed: 9, baseDamage: 20 },  // 小型
                giant:      { health: 200, attack: 50, range: 30, speed: 6, baseDamage: 40 },  // 中型
                cavalry:    { health: 200, attack: 60, range: 30, speed: 14, baseDamage: 40 }, // 中型
                militia:    { health: 100, attack: 20, range: 30, speed: 9, baseDamage: 20 },  // 特殊：每个人20
                swordmaster:{ health: 100, attack: 30, range: 30, speed: 11, baseDamage: 20 }, // 小型
                titan:      { health: 400, attack: 150, range: 35, speed: 3, baseDamage: 60 }, // 大型
                
                // 其他兵种按小型标准
                bow:        { health: 80, attack: 20, range: 100, speed: 6, baseDamage: 20 },  // 小型
                staff:      { health: 60, attack: 35, range: 120, speed: 7, baseDamage: 20 },  // 小型
                shield:     { health: 200, attack: 15, range: 35, speed: 4, baseDamage: 20 }   // 小型
            };
            
            if (specificStats[unitKey]) {
                const stats = { ...specificStats[unitKey] };
                
                // 忍者特殊技能：添加近战攻击力加成
                if (unitKey === 'assassin' && item && item.meleeBonus) {
                    stats.attack += item.meleeBonus;
                }
                
                // 野蛮人特殊技能：添加品质攻击力加成
                if (unitKey === 'barbarian' && item && item.barbarianBonus) {
                    stats.attack += item.barbarianBonus;
                }
                
                // 角斗士技能：添加战斗攻击力加成
                if (unitKey === 'gladiator' && item && item.gladiatorBonus) {
                    stats.attack += item.gladiatorBonus;
                }
                
                // 巨人升级效果：添加品质生命值加成
                if (unitKey === 'giant' && item && item.giantHealthBonus) {
                    stats.health += item.giantHealthBonus;
                }
                
                // 武士特殊技能：添加相邻召唤攻击力加成
                if (unitKey === 'swordmaster' && item && item.swordmasterBonus) {
                    stats.attack += item.swordmasterBonus;
                }
                
                // 宝剑等支援物品的通用攻击力加成
                if (item && item.attackBonus) {
                    stats.attack += item.attackBonus;
                }
                
                return stats;
            }
        }
        
        // 备用方案：按兵种类型
        const stats = {
            melee: { health: 100, attack: 30, range: 30, speed: 10, baseDamage: 20 },
            ranged: { health: 80, attack: 20, range: 100, speed: 6, baseDamage: 20 },
            tank: { health: 200, attack: 15, range: 35, speed: 4, baseDamage: 20 },
            mage: { health: 60, attack: 35, range: 120, speed: 7, baseDamage: 20 }
        };
        return stats[unitType] || { health: 100, attack: 20, range: 50, speed: 6, baseDamage: 20 };
    }
    
    // 为商店物品添加攻击力显示标签
    addAttackDisplay(visualElement, template, quality, unitKey = null) {
        // 先移除已存在的攻击力标签（如果有）
        const existingAttackLabel = visualElement.querySelector('.attack-label');
        if (existingAttackLabel) {
            existingAttackLabel.remove();
        }
        
        // 检查是否为非召唤物品
        const isNonSummonItem = template.unitCount === 0;
        
        // 创建标签元素
        const attackLabel = document.createElement('div');
        attackLabel.className = `attack-label ${template.unitType}`;
        
        if (isNonSummonItem) {
            // 非召唤物品：显示流派图标
            if (template.unitType === 'melee') {
                attackLabel.innerHTML = '<span style="color: white; font-weight: bold;">⚔️</span>';
            }
            // 可以在这里为其他流派添加图标
        } else {
            // 召唤物品：显示攻击力数字
            const unitStats = this.getUnitStats(template.unitType, unitKey);
            const attackPower = unitStats.attack;
            attackLabel.textContent = `${attackPower}`;
        }
        
        // 添加到visual元素中
        visualElement.appendChild(attackLabel);
    }
    
    // 为战斗区和背包物品添加攻击力显示标签
    addAttackDisplayToItem(itemElement, template, quality, unitKey = null, item = null) {
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
            }
            // 可以在这里为其他流派添加图标
        } else {
            // 召唤物品：显示攻击力数字（包括忍者的meleeBonus加成）
            const unitStats = this.getUnitStats(template.unitType, unitKey, item);
            const attackPower = unitStats.attack;
            attackLabel.textContent = `${attackPower}`;
        }
        
        // 添加到物品元素中
        itemElement.appendChild(attackLabel);
    }
    
    // 检查背包是否有足够连续空间
    canFitItemInBackpack(size) {
        for (let i = 0; i <= this.backpack.length - size; i++) {
            let canFit = true;
            for (let j = 0; j < size; j++) {
                if (this.backpack[i + j] !== null) {
                    canFit = false;
                    break;
                }
            }
            if (canFit) return true;
        }
        return false;
    }
    
    // 自动找位置添加物品到背包
    addItemToBackpackAutoSlot(item) {
        const size = item.template.size;
        
        // 找到第一个可用位置
        for (let i = 0; i <= this.backpack.length - size; i++) {
            let canFit = true;
            for (let j = 0; j < size; j++) {
                if (this.backpack[i + j] !== null) {
                    canFit = false;
                    break;
                }
            }
            
            if (canFit) {
                // 放置物品
                for (let j = 0; j < size; j++) {
                    if (j === 0) {
                        this.backpack[i + j] = item; // 主位置
                    } else {
                        this.backpack[i + j] = 'occupied'; // 占用标记
                    }
                }
                break;
            }
        }
    }
    
    // 忍者特殊技能：给所有忍者物品增加攻击力（根据品质等级）
    boostAssassinAttack() {
        // 检查战斗区中的忍者物品
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            if (item && item !== 'occupied' && item.id === 'assassin') {
                const qualityBonus = this.getAssassinQualityBonus(item.quality);
                item.meleeBonus = (item.meleeBonus || 0) + qualityBonus;
                console.log(`忍者获得攻击力加成！品质${item.quality}级加成+${qualityBonus}，当前总加成: +${item.meleeBonus}`);
            }
        }
        
        // 检查背包中的忍者物品
        for (let i = 0; i < this.backpack.length; i++) {
            const item = this.backpack[i];
            if (item && item !== 'occupied' && item.id === 'assassin') {
                const qualityBonus = this.getAssassinQualityBonus(item.quality);
                item.meleeBonus = (item.meleeBonus || 0) + qualityBonus;
                console.log(`背包忍者获得攻击力加成！品质${item.quality}级加成+${qualityBonus}，当前总加成: +${item.meleeBonus}`);
            }
        }
        
        // 更新游戏中忍者单位的攻击力
        this.updateAssassinUnitsAttack();
        
        // 更新显示
        this.updateInventoryDisplay();
        this.updateBackpackDisplay();
    }
    
    // 根据忍者品质等级获取技能加成值
    getAssassinQualityBonus(quality) {
        // 品质等级对应的加成：绿+1，蓝+2，紫+3，橙+4，红+5
        const bonusMap = {
            1: 1,   // 绿色
            2: 2,   // 蓝色
            3: 3,   // 紫色
            4: 4,   // 橙色
            5: 5    // 红色
        };
        return bonusMap[quality] || 1; // 默认加成为1
    }
    
    // 获取品质对应的颜色
    getQualityColor(quality) {
        const colorMap = {
            1: '#4CAF50',  // 绿色
            2: '#2196F3',  // 蓝色
            3: '#9C27B0',  // 紫色
            4: '#FF9800',  // 橙色
            5: '#F44336'   // 红色
        };
        return colorMap[quality] || '#4CAF50'; // 默认绿色
    }
    
    
    // 计算物品升级后的真实触发间隔
    getActualCooldown(item) {
        const template = item.template;
        let baseCooldown = template.cooldown;
        
        // 被动物品直接返回-1
        if (baseCooldown === -1) {
            return -1;
        }
        
        // 忍者、野蛮人、角斗士、巨人和武士的升级效果是技能升级，不改变触发间隔
        if (item.id === 'assassin' || item.id === 'barbarian' || item.id === 'gladiator' || item.id === 'giant' || item.id === 'swordmaster') {
            // 这些单位不享受品质减少，但仍然享受徽章减少
            const badgeReduction = (item.cooldownReduction || 0) * 60; // 转换为帧数
            const finalCooldown = baseCooldown - badgeReduction;
            return Math.max(60, finalCooldown); // 最小60帧（1秒）
        }
        
        // 其他单位每升一级触发间隔减少（相对于起始品质）
        const qualityLevelsAboveMin = item.quality - item.template.minQuality; // 相对于起始品质的升级次数
        
        // 不同单位的冷却减免
        let reductionPerLevel;
        if (item.id === 'militia') {
            reductionPerLevel = 1.0; // 民兵团每升级-1秒
        } else if (item.id === 'titan') {
            reductionPerLevel = 4.0; // 泰坦每升级-4秒
        } else {
            reductionPerLevel = 0.5; // 其他单位-0.5秒
        }
        
        const qualityReduction = qualityLevelsAboveMin * reductionPerLevel;
        const qualityReductionInFrames = qualityReduction * 60; // 转换为帧数（60帧/秒）
        
        // 徽章等物品提供的冷却时间减少
        const badgeReduction = (item.cooldownReduction || 0) * 60; // 转换为帧数
        
        const finalCooldown = baseCooldown - qualityReductionInFrames - badgeReduction;
        return Math.max(60, finalCooldown); // 最小60帧（1秒）
    }
    
    // 根据角斗士品质获取每次击杀的攻击力加成
    getGladiatorKillBonus(quality) {
        const bonusMap = {
            green: 3,
            blue: 3,
            purple: 3,
            orange: 5,
            red: 7
        };
        return bonusMap[quality] || 3;
    }

    // 为所有角斗士物品增加攻击力（消灭敌人时触发）
    boostGladiatorAttack() {
        let boosted = false;
        
        // 为战斗区的角斗士加攻击力（根据品质决定加成数值）
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            if (item && item !== 'occupied' && item.id === 'gladiator') {
                const killBonus = this.getGladiatorKillBonus(item.quality);
                item.gladiatorBonus = (item.gladiatorBonus || 0) + killBonus;
                boosted = true;
                console.log(`战斗区角斗士(${item.quality})攻击力增加 +${killBonus}！当前战斗加成: +${item.gladiatorBonus}`);
            }
        }
        
        // 为背包的角斗士加攻击力（根据品质决定加成数值）
        for (let i = 0; i < this.backpack.length; i++) {
            const item = this.backpack[i];
            if (item && item !== 'occupied' && item.id === 'gladiator') {
                const killBonus = this.getGladiatorKillBonus(item.quality);
                item.gladiatorBonus = (item.gladiatorBonus || 0) + killBonus;
                boosted = true;
                console.log(`背包角斗士(${item.quality})攻击力增加 +${killBonus}！当前战斗加成: +${item.gladiatorBonus}`);
            }
        }
        
        if (boosted) {
            // 更新现有角斗士单位的攻击力
            this.updateGladiatorUnitsAttack();
            // 更新显示
            this.updateInventoryDisplay();
            this.updateBackpackDisplay();
            console.log('角斗士特殊技能触发：根据品质获得不同攻击力加成！');
        }
    }
    
    // 更新在场角斗士单位的攻击力
    updateGladiatorUnitsAttack() {
        // 获取当前所有角斗士物品的最大战斗攻击力加成
        let maxGladiatorBonus = 0;
        
        // 检查战斗区角斗士
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            if (item && item !== 'occupied' && item.id === 'gladiator') {
                maxGladiatorBonus = Math.max(maxGladiatorBonus, item.gladiatorBonus || 0);
            }
        }
        
        // 检查背包角斗士
        for (let i = 0; i < this.backpack.length; i++) {
            const item = this.backpack[i];
            if (item && item !== 'occupied' && item.id === 'gladiator') {
                maxGladiatorBonus = Math.max(maxGladiatorBonus, item.gladiatorBonus || 0);
            }
        }
        
        // 更新所有在场的角斗士单位攻击力
        for (const unit of this.game.playerUnits) {
            if (unit.itemId === 'gladiator') {
                // 重新计算攻击力：基础 + 战斗加成
                const baseAttack = this.getUnitStats('gladiator').attack;
                unit.attackPower = baseAttack + maxGladiatorBonus;
            }
        }
    }
    
    // 更新在场忍者单位的攻击力
    updateAssassinUnitsAttack() {
        // 获取当前所有忍者物品的最大攻击力加成
        let maxMeleeBonus = 0;
        
        // 检查战斗区
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            if (item && item !== 'occupied' && item.id === 'assassin') {
                maxMeleeBonus = Math.max(maxMeleeBonus, item.meleeBonus || 0);
            }
        }
        
        // 检查背包
        for (let i = 0; i < this.backpack.length; i++) {
            const item = this.backpack[i];
            if (item && item !== 'occupied' && item.id === 'assassin') {
                maxMeleeBonus = Math.max(maxMeleeBonus, item.meleeBonus || 0);
            }
        }
        
        // 更新游戏中所有忍者单位的攻击力
        if (this.game && this.game.playerUnits) {
            this.game.playerUnits.forEach(unit => {
                if (unit.itemId === 'assassin') {
                    // 重新计算攻击力：基础攻击力 + 近战加成
                    const baseAttack = unit.getAttackPower() - (unit.meleeBonus || 0);
                    unit.meleeBonus = maxMeleeBonus;
                    unit.attackPower = baseAttack + maxMeleeBonus;
                    console.log(`更新忍者单位攻击力: ${unit.attackPower} (基础${baseAttack} + 加成${maxMeleeBonus})`);
                }
            });
        }
    }
    
    // 根据武士品质获取每次相邻召唤的攻击力加成
    getSwordmasterBonus(quality) {
        // 支持数字格式的品质
        if (typeof quality === 'number') {
            return quality >= 5 ? 15 : 10; // 红色(5)+15, 其他+10
        }
        
        // 支持字符串格式的品质
        const bonusMap = {
            green: 10,
            blue: 10,
            purple: 10,
            orange: 10,  // 橙色升级效果：+10
            red: 15      // 红色升级效果：+15
        };
        return bonusMap[quality] || 10;
    }
    
    // 检查并增强相邻位置的武士攻击力（当有近战单位召唤时触发）
    boostAdjacentSwordmasters(currentSlot, unitCount = 1) {
        // 检查左右相邻位置
        const adjacentSlots = [currentSlot - 1, currentSlot + 1];
        
        for (const slot of adjacentSlots) {
            // 检查位置是否合法（0-5范围内）
            if (slot >= 0 && slot < 6) {
                const adjacentItem = this.inventory[slot];
                
                // 如果相邻位置是武士
                if (adjacentItem && adjacentItem !== 'occupied' && adjacentItem.id === 'swordmaster') {
                    const singleBonus = this.getSwordmasterBonus(adjacentItem.quality);
                    const totalBonus = singleBonus * unitCount; // 按召唤数量叠加
                    adjacentItem.swordmasterBonus = (adjacentItem.swordmasterBonus || 0) + totalBonus;
                    
                    console.log(`武士(位置${slot})攻击力增加 +${totalBonus}(${singleBonus}×${unitCount})！当前加成: +${adjacentItem.swordmasterBonus}`);
                    
                    // 更新显示
                    this.updateInventoryDisplay();
                }
            }
        }
    }
    
    // 每场战斗结束时重置所有武士的攻击力加成
    resetSwordmasterBonuses() {
        // 重置战斗区武士
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            if (item && item !== 'occupied' && item.id === 'swordmaster') {
                item.swordmasterBonus = 0;
            }
        }
        
        // 重置背包武士
        for (let i = 0; i < this.backpack.length; i++) {
            const item = this.backpack[i];
            if (item && item !== 'occupied' && item.id === 'swordmaster') {
                item.swordmasterBonus = 0;
            }
        }
        
        console.log('所有武士攻击力加成已重置');
    }
    
    // 每场战斗结束时重置所有物品的宝剑攻击力加成
    resetAttackBonuses() {
        // 重置战斗区物品的攻击力加成
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            if (item && item !== 'occupied' && item.attackBonus) {
                item.attackBonus = 0;
            }
        }
        
        // 重置背包物品的攻击力加成
        for (let i = 0; i < this.backpack.length; i++) {
            const item = this.backpack[i];
            if (item && item !== 'occupied' && item.attackBonus) {
                item.attackBonus = 0;
            }
        }
        
        console.log('所有宝剑攻击力加成已重置');
    }
    
    // 每场战斗结束时重置所有角斗士的攻击力加成
    resetGladiatorBonuses() {
        // 重置战斗区角斗士
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            if (item && item !== 'occupied' && item.gladiatorBonus) {
                item.gladiatorBonus = 0;
            }
        }
        
        // 重置背包角斗士
        for (let i = 0; i < this.backpack.length; i++) {
            const item = this.backpack[i];
            if (item && item !== 'occupied' && item.gladiatorBonus) {
                item.gladiatorBonus = 0;
            }
        }
        
        console.log('所有角斗士攻击力加成已重置');
    }
    
    // 宝剑特殊技能：获取品质对应的攻击力加成
    getMagicSwordBonus(quality) {
        const bonusMap = {
            2: 10,  // 蓝色
            3: 15,  // 紫色  
            4: 20,  // 橙色
            5: 25   // 红色
        };
        return bonusMap[quality] || 10;
    }
    
    // 宝剑特殊技能：触发时为相邻的近战物品增加攻击力
    triggerMagicSwordEffect(swordSlot) {
        const swordItem = this.inventory[swordSlot];
        if (!swordItem || swordItem.id !== 'magicSword') return;
        
        const bonus = this.getMagicSwordBonus(swordItem.quality);
        const adjacentSlots = [swordSlot - 1, swordSlot + 1];
        let affectedCount = 0;
        
        for (const slot of adjacentSlots) {
            if (slot >= 0 && slot < 6) {
                const adjacentItem = this.inventory[slot];
                if (adjacentItem && adjacentItem !== 'occupied' && adjacentItem.template.unitType === 'melee') {
                    // 为相邻近战物品永久增加攻击力（本场战斗中）
                    adjacentItem.attackBonus = (adjacentItem.attackBonus || 0) + bonus;
                    affectedCount++;
                    console.log(`宝剑触发！为相邻近战物品(位置${slot})增加攻击力 +${bonus}！当前总加成: +${adjacentItem.attackBonus}`);
                }
            }
        }
        
        if (affectedCount > 0) {
            console.log(`宝剑效果触发完成，影响了 ${affectedCount} 个相邻近战物品`);
            // 更新显示以反映攻击力变化
            this.updateInventoryDisplay();
        } else {
            console.log('宝剑触发，但没有相邻的近战物品');
        }
    }
    
    // 徽章特殊技能：获取品质对应的冷却时间减少
    getBadgeReduction(quality) {
        const reductionMap = {
            4: 2,  // 橙色：-2秒
            5: 3   // 红色：-3秒
        };
        return reductionMap[quality] || 2;
    }
    
    // 徽章被动效果：为左侧第一格的近战物品减少冷却时间
    applyBadgeEffect(badgeSlot) {
        const badgeItem = this.inventory[badgeSlot];
        if (!badgeItem || badgeItem.id !== 'badge') return;
        
        const leftSlot = badgeSlot - 1;
        if (leftSlot >= 0) {
            const leftItem = this.inventory[leftSlot];
            
            if (leftItem === 'occupied') {
                // 左侧被占用，查找这个被占用格子属于哪个物品
                const actualItem = this.findItemByOccupiedSlot(leftSlot);
                if (actualItem && actualItem.template.unitType === 'melee') {
                    const reduction = this.getBadgeReduction(badgeItem.quality);
                    actualItem.cooldownReduction = (actualItem.cooldownReduction || 0) + reduction;
                    console.log(`徽章为左侧被占用格子的近战物品(${actualItem.id})减少冷却时间 -${reduction}秒！当前总减少: -${actualItem.cooldownReduction}秒`);
                    
                    // 重新计算并更新冷却时间
                    const newCooldown = this.getActualCooldown(actualItem);
                    actualItem.cooldownRemaining = newCooldown;
                }
            } else if (leftItem && leftItem.template.unitType === 'melee') {
                // 左侧是实际的近战物品
                const reduction = this.getBadgeReduction(badgeItem.quality);
                leftItem.cooldownReduction = (leftItem.cooldownReduction || 0) + reduction;
                console.log(`徽章为左侧近战物品(位置${leftSlot}, ${leftItem.id})减少冷却时间 -${reduction}秒！当前总减少: -${leftItem.cooldownReduction}秒`);
                
                // 重新计算并更新冷却时间
                const newCooldown = this.getActualCooldown(leftItem);
                leftItem.cooldownRemaining = newCooldown;
            }
        }
    }
    
    // 根据被占用的格子查找对应的实际物品
    findItemByOccupiedSlot(occupiedSlot) {
        // 向左查找可能的主物品位置
        for (let i = occupiedSlot - 1; i >= 0; i--) {
            const item = this.inventory[i];
            if (item && item !== 'occupied') {
                // 检查这个物品的大小是否覆盖了occupiedSlot
                const itemSize = item.template.size;
                if (i + itemSize > occupiedSlot) {
                    return item; // 找到了覆盖这个位置的物品
                }
                break; // 如果这个物品不覆盖，就不用继续找了
            }
        }
        return null;
    }
    
    // 检查右侧是否有徽章，并应用冷却减少
    checkRightBadge(itemSlot) {
        const item = this.inventory[itemSlot];
        if (!item || item.template.unitType !== 'melee') return;
        
        const rightSlot = itemSlot + 1;
        if (rightSlot < 6) {
            const rightItem = this.inventory[rightSlot];
            if (rightItem && rightItem !== 'occupied' && rightItem.id === 'badge') {
                const reduction = this.getBadgeReduction(rightItem.quality);
                item.cooldownReduction = (item.cooldownReduction || 0) + reduction;
                console.log(`近战物品(位置${itemSlot})受到右侧徽章减少冷却时间 -${reduction}秒！当前总减少: -${item.cooldownReduction}秒`);
                
                // 重新计算并更新冷却时间
                const newCooldown = this.getActualCooldown(item);
                item.cooldownRemaining = newCooldown;
            }
        }
    }
    
    // 刷新所有物品的徽章冷却减少效果
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
            const item = this.inventory[i];
            if (item && item !== 'occupied' && item.id === 'badge') {
                this.applyBadgeEffect(i);
            }
        }
        
        // 重新计算所有物品的冷却时间
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            if (item && item !== 'occupied') {
                const newCooldown = this.getActualCooldown(item);
                if (newCooldown !== -1) { // 非被动物品
                    item.cooldownRemaining = newCooldown;
                }
            }
        }
    }
    
    // 泰坦特殊技能：为所有泰坦充能1秒（减少冷却时间）
    chargeTitans() {
        let charged = false;
        const chargeAmount = 60; // 1秒 = 60帧
        
        // 为战斗区的泰坦充能
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            if (item && item !== 'occupied' && item.id === 'titan') {
                // 只有在冷却中的泰坦才能充能
                if (item.cooldownRemaining > 0) {
                    item.cooldownRemaining = Math.max(0, item.cooldownRemaining - chargeAmount);
                    charged = true;
                    
                    // 如果充能后冷却时间归零，标记为准备就绪
                    if (item.cooldownRemaining === 0) {
                        item.isReady = true;
                    }
                    
                    console.log(`泰坦(位置${i})充能1秒，剩余冷却: ${Math.ceil(item.cooldownRemaining/60)}秒`);
                }
            }
        }
        
        
        if (charged) {
            // 更新显示以反映充能效果
            this.updateInventoryDisplay();
            this.updateBackpackDisplay();
            console.log('泰坦特殊技能触发：近战单位召唤为泰坦充能！');
        }
    }
    
    // 添加测试单位到战斗区和背包
    addTestUnits() {
        // 在背包中添加一个初始泰坦
        const titanTemplate = this.itemTemplates.titan;
        const titanItem = {
            id: 'titan',
            template: titanTemplate,
            quality: titanTemplate.minQuality, // 橙色品质
            cooldownRemaining: 0,
            isReady: false,
            attackBonus: 0,
            cooldownReduction: 0,
            meleeBonus: 0,
            militiaBonus: 0,
            barbarianBonus: 0,
            accelerationTime: 0
        };

        // 计算实际的冷却时间
        const actualCooldown = this.getActualCooldown(titanItem);
        titanItem.cooldownRemaining = actualCooldown;

        // 将泰坦放到背包第一个位置（大小为3，占用0,1,2位置）
        this.backpack[0] = titanItem;
        this.backpack[1] = 'occupied';
        this.backpack[2] = 'occupied';

        console.log('游戏开始：背包中已添加一个泰坦');
    }
    
    // 战旗特殊能力：全场近战单位加速2秒
    triggerWarBannerAcceleration() {
        let acceleratedCount = 0;
        const accelerationTime = 120; // 2秒 = 120帧
        
        // 为战斗区所有其他近战物品加速（排除战旗自己）
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            if (item && item !== 'occupied' && item.template.unitType === 'melee' && item.id !== 'warBanner') {
                // 累加加速时间
                item.accelerationTime = (item.accelerationTime || 0) + accelerationTime;
                acceleratedCount++;
            }
        }
        
        console.log(`战旗效果触发！${acceleratedCount}个其他近战物品获得2秒加速`);
        Utils.playSound('buff');
        
        // 更新显示
        this.updateInventoryDisplay();
    }
    
}