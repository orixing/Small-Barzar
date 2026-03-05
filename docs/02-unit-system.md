# 单位系统设计文档

## 概述

单位系统是游戏的核心战斗模块，负责管理所有战斗单位的属性、行为、技能和AI逻辑。系统支持多种兵种类型，每种兵种都有独特的特性和战术价值。

## 单位类型体系

### 基础兵种分类

| 兵种类型 | 图标 | 特色 | 战术定位 |
|---------|------|------|---------|
| **近战 (melee)** | ⚔️ | 高攻击，近距离 | 前排输出 |
| **远程 (ranged)** | 🏹 | 远距离攻击 | 后排输出 |  
| **坦克 (tank)** | 🛡️ | 高血量，高防御 | 前排肉盾 |
| **法师 (mage)** | 🔮 | 魔法攻击，特殊技能 | 特殊战术 |

## 单位属性系统

### 核心属性

每个单位具有以下基础属性：

```javascript
// Unit类核心属性
{
    type: 'melee',              // 兵种类型
    itemId: 'warrior',          // 具体物品ID
    itemQuality: 3,             // 物品品质等级
    team: 'player',             // 所属阵营
    health: 120,                // 当前血量
    maxHealth: 120,             // 最大血量
    shield: 0,                  // 护盾值
    maxShield: 0,               // 最大护盾
    attackPower: 30,            // 攻击力
    attackRange: 30,            // 攻击距离
    speed: 1.23,                // 移动速度
    baseDamage: 20,             // 对基地伤害
    cost: 50,                   // 单位成本
    extraTargets: 0,            // 额外攻击目标数
    areaAttackRadius: 0         // 范围攻击半径
}
```

### 属性计算公式

**移动速度计算**:
```javascript
// 实际速度 = 基础速度值 × 0.123
// 例：战士速度10 → 实际1.23像素/帧
actualSpeed = baseSpeed × 0.123
```

**基地伤害计算**:
```javascript
// 实际基地伤害 = 基地伤害 × 当前血量百分比
actualBaseDamage = baseDamage × (health / maxHealth)
```

## 具体单位配置

### 近战单位

| 单位名 | 图标 | 血量 | 攻击力 | 速度 | 基地伤害 | 特殊能力 |
|--------|------|------|--------|------|---------|----------|
| 战士 | ⚔️ | 120 | 30 | 10 | 20 | 基础近战单位 |
| 刺客 | 🥷 | 80 | 20 | 12 | 20 | 高速度，低血量 |
| 角斗士 | 🪓 | 120 | 40 | 10 | 20 | 击杀敌人获得永久攻击力+5 |
| 野蛮人 | 👹 | 120 | 40 | 9 | 20 | 高攻击力 |
| 巨人 | 💪 | 200 | 50 | 6 | 40 | 受非近战伤害-40% |
| 骑兵 | 🐎 | 160 | 60 | 14 | 40 | 高速度，高攻击 |
| 民兵团 | 👪 | 120 | 20 | 9 | 20 | 经济实惠 |
| 剑圣 | 🥋 | 120 | 30 | 11 | 20 | 每次攻击获得攻击力+2 |
| 泰坦 | 🗿 | 300 | 150 | 3 | 60 | 800护盾值 |

### 远程单位

| 单位名 | 图标 | 血量 | 攻击力 | 攻击距离 | 特殊能力 |
|--------|------|------|--------|---------|----------|
| 弓箭手 | 🏹 | 80 | 20 | 80 | 远程攻击 |

### 坦克单位

| 单位名 | 图标 | 血量 | 攻击力 | 防御特性 | 特殊能力 |
|--------|------|------|--------|---------|----------|
| 盾兵 | 🛡️ | 200 | 20 | 高血量 | 前排保护 |

### 法师单位

| 单位名 | 图标 | 血量 | 攻击力 | 攻击距离 | 特殊技能 |
|--------|------|------|--------|---------|----------|
| 学徒 | 🧝‍♂️ | 100 | 10 | 60 | 基础法师 |
| 水元素 | 🌊 | 200 | 30 | 60 | 召唤类单位 |
| 魔偶 | 🤖 | 200 | 30 | 60 | 机械类 |
| 奥数魔像 | 🧞‍♂️ | 400 | 90 | 60 | 品质护盾：紫400/橙800/红1200 |
| 大法师 | 🧙‍♂️ | 100 | 50 | 60 | 高攻击法师 |
| 药剂师 | ⚗️ | 100 | 20 | 60 | 辅助型法师 |
| 女巫 | 🧙🏿‍♀️ | 100 | 20 | 60 | 品质多目标：紫2/橙3/红4 |
| 魔法巨龙 | 🐉 | - | 70 | 60 | 范围攻击：橙24像素/红36像素 |

## 单位AI行为系统

### AI行为优先级

1. **攻击冷却管理** - 控制攻击频率
2. **目标搜索** - 寻找最近的敌人
3. **移动决策** - 追击目标或向前推进
4. **攻击执行** - 对目标造成伤害
5. **排斥力处理** - 避免友军重叠

### 目标搜索优化

```javascript
// 搜索优化机制
if (currentTarget && currentTarget.alive) {
    // 每10帧才重新搜索更近目标
    if (targetSearchCounter % 10 !== 0) return;
}

// 距离预筛选
const maxSearchDistance = attackRange * 2;
// 先用曼哈顿距离粗筛，再用真实距离精确计算
```

### 移动系统

**基础移动**:
```javascript
moveTowards(targetX, targetY) {
    const distance = Math.sqrt(dx*dx + dy*dy);
    if (distance > 5) {
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
    }
}
```

**防重叠机制**:
```javascript
// 排斥力计算 - 避免友军堆叠
calculateRepulsionForce() {
    // 只对不同类型单位施加排斥力
    // 每3帧计算一次，减少性能消耗
    // 推挤范围30像素，力度1.8
}
```

### 攻击系统

**单目标攻击**:
```javascript
attack() {
    if (this.attackCooldown > 0) return;
    const damage = this.attackPower + Utils.randomInt(-5, 5);
    this.target.takeDamage(damage, this);
    this.attackCooldown = this.maxAttackCooldown;
}
```

**多目标攻击** (女巫技能):
```javascript
// 根据品质攻击多个目标
const targetCount = getTotalTargetCount(); // 紫2/橙3/红4
const targets = enemiesInRange.slice(0, targetCount);
targets.forEach(target => target.takeDamage(damage, this));
```

**范围攻击** (魔法巨龙):
```javascript
dragonAreaAttack() {
    // 以主目标为中心的圆形范围攻击
    // 距离越远伤害越低：100%→20%线性递减
    const damageRatio = 1.0 - (distance / radius) * 0.8;
    const finalDamage = baseDamage * Math.max(0.2, damageRatio);
}
```

## 特殊技能系统

### 被动技能

**角斗士 - 嗜血**:
- 击杀敌人永久获得攻击力+5
- 效果跨波次保留
- 通过游戏回调实现：`game.onEnemyKilled()`

**剑圣 - 剑气**:
- 每次攻击获得攻击力+2
- 每波结束重置
- 最大叠加无限制

**巨人 - 钢铁皮肤**:
- 受到非近战伤害减免40%
- 在takeDamage中实现判断

### 护盾系统

**泰坦护盾**:
```javascript
// 护盾优先承受伤害
if (actualDamage >= this.shield) {
    remainingDamage = actualDamage - this.shield;
    this.shield = 0;
    this.health -= remainingDamage;
} else {
    this.shield -= actualDamage;
}
```

**奥数魔像品质护盾**:
```javascript
const shieldByQuality = {
    3: 400,   // 紫色品质
    4: 800,   // 橙色品质  
    5: 1200   // 红色品质
};
```

## 性能优化

### 单位数量控制
```javascript
// 防止性能问题的单位上限
const maxPlayerUnits = 50;
const maxEnemyUnits = 30;
```

### 计算优化策略

1. **标记删除**: 死亡单位标记为删除，批量清理
2. **分频计算**: 
   - 排斥力：每3帧计算一次
   - 目标搜索：每10帧搜索一次
3. **距离预筛选**: 曼哈顿距离粗筛 + 真实距离精确计算
4. **内存管理**: 每波结束强制垃圾回收

### 渲染优化

**血条显示策略**:
- 满血单位不显示血条
- 满血满盾单位不显示血条
- 减少不必要的绘制调用

**深度排序**:
```javascript
// 按Y坐标排序实现简单深度效果
units.sort((a, b) => a.y - b.y);
```

## 平衡性设计

### 兵种克制关系
- **近战** vs **远程**: 近战需要接近才能攻击，但攻击力更高
- **坦克** vs **法师**: 坦克血厚但攻击低，法师攻击高但脆弱
- **巨人** vs **远程**: 巨人对远程伤害有减免，但移动缓慢

### 成本效益平衡
- 高攻击力单位通常血量较低或速度较慢
- 特殊技能单位在基础属性上有所妥协
- 护盾系统提供生存能力但不影响攻击力

---

*单位系统的设计保证了游戏的策略深度和战斗观赏性，每种单位都有其独特价值和战术定位。*