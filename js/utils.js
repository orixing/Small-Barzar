// 游戏工具函数
class Utils {
    // 生成随机数
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }

    // 生成随机整数
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // 距离计算
    static distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    // 角度计算
    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    // 限制值在范围内
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    // 线性插值
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    // 格式化数字显示
    static formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    // 创建特效元素
    static createEffect(text, x, y, className = '') {
        const effect = document.createElement('div');
        effect.textContent = text;
        effect.className = className;
        effect.style.position = 'absolute';
        effect.style.left = x + 'px';
        effect.style.top = y + 'px';
        effect.style.pointerEvents = 'none';
        effect.style.zIndex = '1000';
        
        document.body.appendChild(effect);
        
        // 自动移除
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 1000);
        
        return effect;
    }

    // 播放音效（模拟）
    static playSound(soundType) {
        // 在实际项目中可以添加音效
        console.log(`Playing sound: ${soundType}`);
    }

    // 震动效果（移动端）
    static vibrate(duration = 100) {
        if (navigator.vibrate) {
            navigator.vibrate(duration);
        }
    }

    // 本地存储
    static saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.warn('Cannot save data to localStorage:', e);
        }
    }

    static loadData(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.warn('Cannot load data from localStorage:', e);
            return defaultValue;
        }
    }
}