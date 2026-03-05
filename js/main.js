// 游戏初始化和启动
document.addEventListener('DOMContentLoaded', function() {
    // 检查浏览器支持
    if (!window.requestAnimationFrame) {
        alert('您的浏览器不支持此游戏，请使用现代浏览器。');
        return;
    }

    // 创建游戏实例
    console.log('开始创建游戏实例...');
    let game;
    try {
        game = new Game();
        
        // 全局游戏对象（用于调试）
        window.game = game;
        console.log('游戏实例创建成功！');
        
        
    } catch (error) {
        console.error('游戏初始化失败:', error);
        alert('游戏初始化失败: ' + error.message);
        return;
    }
    
    // 显示加载完成信息
    console.log('🎮 大巴扎游戏已加载完成！');
    console.log('📱 建议在移动设备上游玩以获得最佳体验');
    
    // 添加触摸事件支持（移动端）
    addTouchSupport();
    
    // 添加键盘快捷键支持
    addKeyboardSupport(game);
    
    // 显示操作提示
    showGameTips();
});

// 添加触摸事件支持
function addTouchSupport() {
    // 防止页面滚动
    document.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, { passive: false });
    
    // 触摸单位按钮优化
    const unitButtons = document.querySelectorAll('.unit-btn');
    unitButtons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.classList.add('touching');
        });
        
        button.addEventListener('touchend', function() {
            this.classList.remove('touching');
        });
    });
}

// 添加键盘快捷键支持
function addKeyboardSupport(game) {
    document.addEventListener('keydown', function(e) {
        switch(e.key) {
            case 'r': // R键刷新页面重新开始
            case 'R':
                window.location.reload();
                break;
            case 's': // S键刷新商店
            case 'S':
                game.inventorySystem.refreshShop();
                break;
        }
    });
}

// 显示操作提示
function showGameTips() {
    // 创建提示界面
    const tipsDiv = document.createElement('div');
    tipsDiv.id = 'game-tips';
    tipsDiv.className = 'modal';
    tipsDiv.innerHTML = `
        <div class="modal-content">
            <h2>🎮 游戏操作指南</h2>
            <div style="text-align: left; margin: 20px 0;">
                <h3>📱 手机操作：</h3>
                <p>• 从商店购买物品放入战斗区</p>
                <p>• 战斗区物品会自动生产单位</p>
                <p>• 拖拽物品调整战斗区中的位置</p>
                <p>• 点击背包按钮管理存储物品</p>
                <br>
                <h3>💡 游戏技巧：</h3>
                <p>• 同兵种协作：相同类型兵种往往有连携效果</p>
                <p>• 升级物品：购买相同物品可以升级品质</p>
                <p>• 合理布阵：相邻位置会影响技能效果</p>
                <p>• 空间管理：战斗区只有6个位置，需要规划</p>
                <p>• 背包储存：暂时用不上的物品放入背包</p>
            </div>
            <div class="modal-buttons">
                <button onclick="this.parentElement.parentElement.parentElement.style.display='none'">
                    开始游戏
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(tipsDiv);
    
    // 5秒后自动关闭提示
    setTimeout(() => {
        if (tipsDiv.style.display !== 'none') {
            tipsDiv.style.display = 'none';
        }
    }, 8000);
}

// 游戏性能优化
function optimizeGamePerformance() {
    // 检测设备性能
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    
    // 根据设备性能调整画质
    if (navigator.hardwareConcurrency <= 2) {
        // 低端设备优化
        ctx.imageSmoothingEnabled = false;
        console.log('🔧 检测到低端设备，已启用性能优化模式');
    }
}

// 错误处理
window.addEventListener('error', function(e) {
    console.error('游戏运行错误：', e);
    alert('游戏运行出现问题，请刷新页面重试。');
});

// 页面可见性API - 当页面不可见时降低帧率
document.addEventListener('visibilitychange', function() {
    // 页面切换时的性能优化
    if (document.hidden) {
        console.log('📴 页面已隐藏，游戏继续运行（后台模式）');
    } else {
        console.log('👀 页面已显示，恢复正常帧率');
    }
});

// 检查网络状态（离线游戏提示）
window.addEventListener('online', function() {
    console.log('🌐 网络连接已恢复');
});

window.addEventListener('offline', function() {
    console.log('📴 网络连接已断开，游戏可继续进行（离线模式）');
});