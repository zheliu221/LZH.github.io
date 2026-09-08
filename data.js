// ===== 公共数据模块：localStorage 持久化 + 默认模拟数据 =====
// 存储 key
var STORAGE_KEY = 'monthCardData';

// 默认模拟月卡数据（本地无数据时加载）
var DEFAULT_MONTH_CARDS = [
    { id: 1,  carNumber: '京A12345', ownerName: '张三', phone: '13800138001', carBrand: '丰田',     cardType: '月卡', paymentAmount: 300, paymentMethod: '微信',   startDate: '2026-08-15', endDate: '2026-10-15', remainDay: 37, status: 0 },
    { id: 2,  carNumber: '京B88888', ownerName: '李四', phone: '13800138002', carBrand: '本田',     cardType: '月卡', paymentAmount: 300, paymentMethod: '支付宝', startDate: '2026-07-01', endDate: '2026-09-30', remainDay: 22, status: 0 },
    { id: 3,  carNumber: '沪C66666', ownerName: '王五', phone: '13800138003', carBrand: '大众',     cardType: '季卡', paymentAmount: 800, paymentMethod: '银行卡', startDate: '2026-06-01', endDate: '2026-09-01', remainDay: -7, status: 1 },
    { id: 4,  carNumber: '粤D99999', ownerName: '赵六', phone: '13800138004', carBrand: '别克',     cardType: '月卡', paymentAmount: 300, paymentMethod: '现金',   startDate: '2026-08-20', endDate: '2026-09-20', remainDay: 12, status: 0 },
    { id: 5,  carNumber: '川E55555', ownerName: '孙七', phone: '13800138005', carBrand: '雪佛兰',   cardType: '月卡', paymentAmount: 300, paymentMethod: '微信',   startDate: '2026-08-25', endDate: '2026-09-25', remainDay: 17, status: 0 }
];

// 读取本地月卡数据源；本地无数据时加载默认模拟数据并写回
function loadMonthCards() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            var arr = JSON.parse(raw);
            if (Array.isArray(arr)) return arr;
        } catch (e) {
            console.warn('本地数据解析失败，加载默认数据', e);
        }
    }
    // 本地无数据，加载默认数据并持久化
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MONTH_CARDS));
    return DEFAULT_MONTH_CARDS.slice();
}

// 保存月卡数组到 localStorage
function saveMonthCards(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

// 金额千分位格式化：56233 -> "56,233"
function formatThousand(num) {
    if (num === null || num === undefined || num === '') return '0';
    return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 状态码转文字
function statusText(code) {
    return Number(code) === 0 ? '可用' : '已过期';
}

// 计算两个日期相差天数（end - start，向下取整）
function diffDays(startStr, endStr) {
    var s = new Date(startStr).getTime();
    var e = new Date(endStr).getTime();
    if (isNaN(s) || isNaN(e)) return 0;
    return Math.floor((e - s) / (24 * 3600 * 1000));
}

// 根据结束日期判断状态：晚于当前时间 -> 0 可用；否则 1 已过期
function calcStatus(endStr) {
    var end = new Date(endStr).getTime();
    var now = Date.now();
    return end >= now ? 0 : 1;
}

// 根据结束日期计算剩余有效天数（向下取整，负数表示已过期）
function calcRemainDay(endStr) {
    var end = new Date(endStr).getTime();
    var now = Date.now();
    if (isNaN(end)) return 0;
    return Math.floor((end - now) / (24 * 3600 * 1000));
}
