// ===== 首页统计渲染 =====
// 年度累计收费、入驻企业总数、一体杆总数使用模拟固定值
// 月卡车辆总数读取月卡数组长度动态获取
var FIXED_INCOME = 56233;      // 年度累计收费（模拟固定值）
var FIXED_COMPANY = 6;        // 入驻企业总数（模拟固定值）
var FIXED_POLE = 48;          // 一体杆总数（模拟固定值）

// 封装渲染函数：修改数据源后调用渲染函数更新 DOM
function renderHomeStat() {
    var cards = loadMonthCards();           // 读取本地月卡数据源
    document.getElementById('statIncome').textContent = formatThousand(FIXED_INCOME);
    document.getElementById('statCompany').textContent = FIXED_COMPANY;
    document.getElementById('statMonthCard').textContent = cards.length; // 月卡车辆总数动态获取
    document.getElementById('statPole').textContent = FIXED_POLE;
}

// 页面 onload 加载完成调用渲染函数
window.addEventListener('load', function () {
    renderHomeStat();
    // 监听 storage 事件：其他页面修改数据后同步刷新首页统计
    window.addEventListener('storage', function (e) {
        if (e.key === STORAGE_KEY) renderHomeStat();
    });
});
