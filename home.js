// ===== 首页：渲染统计卡片 =====

// 封装渲染函数：从 localStorage 读月卡数据，把月卡车辆总数动态填到页面上
function renderHomeStat() {
    var cards = loadMonthCards();
    // 前三个用固定值，月卡车辆总数从数组长度取
    document.getElementById('statIncome').innerHTML = formatThousand(56233);
    document.getElementById('statCompany').innerHTML = 6;
    document.getElementById('statMonthCard').innerHTML = cards.length;
    document.getElementById('statPole').innerHTML = 48;
}

// 页面加载完成自动调用
window.onload = function () {
    renderHomeStat();
};
