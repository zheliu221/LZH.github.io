// ===== 数据模块：负责 localStorage 读写 =====

// 存储用的 key 名
var STORAGE_KEY = 'monthCardData';

// 默认模拟数据（浏览器本地没数据时用这个）
var DEFAULT_CARDS = [
    { id: 1, carNumber: '京A12345', ownerName: '张三', phone: '13800138001', carBrand: '丰田',   cardType: '月卡', paymentAmount: 300, paymentMethod: '微信',   startDate: '2026-08-15', endDate: '2026-10-15', remainDay: 37, status: 0 },
    { id: 2, carNumber: '京B88888', ownerName: '李四', phone: '13800138002', carBrand: '本田',   cardType: '月卡', paymentAmount: 300, paymentMethod: '支付宝', startDate: '2026-07-01', endDate: '2026-09-30', remainDay: 22, status: 0 },
    { id: 3, carNumber: '沪C66666', ownerName: '王五', phone: '13800138003', carBrand: '大众',   cardType: '季卡', paymentAmount: 800, paymentMethod: '银行卡', startDate: '2026-06-01', endDate: '2026-09-01', remainDay: -7, status: 1 },
    { id: 4, carNumber: '粤D99999', ownerName: '赵六', phone: '13800138004', carBrand: '别克',   cardType: '月卡', paymentAmount: 300, paymentMethod: '现金',   startDate: '2026-08-20', endDate: '2026-09-20', remainDay: 12, status: 0 },
    { id: 5, carNumber: '川E55555', ownerName: '孙七', phone: '13800138005', carBrand: '雪佛兰', cardType: '月卡', paymentAmount: 300, paymentMethod: '微信',   startDate: '2026-08-25', endDate: '2026-09-25', remainDay: 17, status: 0 }
];

// 读取月卡数组（本地没数据就写入默认数据）
function loadMonthCards() {
    var str = localStorage.getItem(STORAGE_KEY);
    if (str) {
        var arr = JSON.parse(str);
        if (arr) return arr;
    }
    // 本地没有，把默认数据存进去
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CARDS));
    return DEFAULT_CARDS;
}

// 保存月卡数组到本地
function saveMonthCards(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

// 金额千分位格式化：56233 -> 56,233
function formatThousand(num) {
    return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 状态码转文字
function statusText(code) {
    if (code == 0) return '可用';
    return '已过期';
}

// 根据结束日期算剩余天数（向下取整）
function calcRemainDay(endStr) {
    var end = new Date(endStr).getTime();
    var now = Date.now();
    return Math.floor((end - now) / (24 * 3600 * 1000));
}

// 根据结束日期判断状态：晚于现在 -> 0 可用；否则 1 已过期
function calcStatus(endStr) {
    var end = new Date(endStr).getTime();
    var now = Date.now();
    if (end >= now) return 0;
    return 1;
}
