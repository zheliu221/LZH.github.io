// ===== 添加月卡页面 =====

// 1. 手写 getUrlParam：从 location.search 读取 id 参数
//    例如 ?id=12345  ->  返回 '12345'
function getUrlParam(name) {
    var search = location.search;          // 例如 "?id=12345"
    if (search.charAt(0) == '?') {
        search = search.substring(1);       // 去掉 ?
    }
    var pairs = search.split('&');          // 切成 ["id=12345"]
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        if (pair[0] == name) return pair[1];
    }
    return null;
}

// 校验正则
var PHONE_REG = /^1[3-9]\d{9}$/;   // 11 位手机号
var PLATE_REG = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-HJ-NP-Z][0-9A-HJ-NP-Z]{4,6}$/;  // 国内车牌

// 全局变量
var editId = getUrlParam('id');
var isEdit = (editId != null);     // 有 id 就是编辑模式
var cards = loadMonthCards();       // 读取本地月卡数据

// 2. 编辑模式：根据 id 回填表单
function fillFormForEdit() {
    if (!isEdit) return;
    var card = null;
    for (var i = 0; i < cards.length; i++) {
        if (cards[i].id == editId) { card = cards[i]; break; }
    }
    if (!card) {
        alert('未找到对应的月卡记录');
        location.href = 'monthCard.html';
        return;
    }
    var form = document.getElementById('cardForm');
    form.carNumber.value = card.carNumber;
    form.ownerName.value = card.ownerName;
    form.phone.value = card.phone;
    form.carBrand.value = card.carBrand;
    form.cardType.value = card.cardType;
    form.paymentAmount.value = card.paymentAmount;
    form.paymentMethod.value = card.paymentMethod;
    form.startDate.value = card.startDate;
    form.endDate.value = card.endDate;
    form.remainDay.value = card.remainDay;
    form.status.value = statusText(card.status);
    // 修改页面标题
    document.getElementById('pageTitle').innerHTML = '编辑月卡';
}

// 3. 自动计算剩余天数 + 判断状态（结束日期变化时调用）
function autoCalcRemain() {
    var form = document.getElementById('cardForm');
    var endStr = form.endDate.value;
    if (!endStr) {
        form.remainDay.value = '';
        form.status.value = '';
        return;
    }
    form.remainDay.value = calcRemainDay(endStr);
    form.status.value = statusText(calcStatus(endStr));
}

// 4. 显示错误提示
function showError(name, msg) {
    var el = document.querySelector('[data-error="' + name + '"]');
    if (el) el.innerHTML = msg;
}
// 5. 清空所有错误提示
function clearAllErrors() {
    var tips = document.getElementsByClassName('error-tip');
    for (var i = 0; i < tips.length; i++) {
        tips[i].innerHTML = '';
    }
}

// 6. 表单校验
function validate() {
    clearAllErrors();
    var form = document.getElementById('cardForm');
    var ok = true;

    // 必填项不为空
    if (!form.carNumber.value) {
        showError('carNumber', '请输入车牌号');
        ok = false;
    } else if (!PLATE_REG.test(form.carNumber.value)) {
        showError('carNumber', '车牌号格式不正确（如：京A12345）');
        ok = false;
    }

    if (!form.ownerName.value) {
        showError('ownerName', '请输入车主姓名');
        ok = false;
    }

    if (!form.phone.value) {
        showError('phone', '请输入手机号');
        ok = false;
    } else if (!PHONE_REG.test(form.phone.value)) {
        showError('phone', '手机号格式不正确');
        ok = false;
    }

    if (!form.paymentAmount.value) {
        showError('paymentAmount', '请输入支付金额');
        ok = false;
    } else if (Number(form.paymentAmount.value) <= 0) {
        showError('paymentAmount', '支付金额必须为正数');
        ok = false;
    }

    if (!form.paymentMethod.value) {
        showError('paymentMethod', '请选择支付方式');
        ok = false;
    }

    if (!form.startDate.value) {
        showError('startDate', '请选择开始日期');
        ok = false;
    }

    if (!form.endDate.value) {
        showError('endDate', '请选择结束日期');
        ok = false;
    }

    // 结束日期不能早于开始日期
    if (form.startDate.value && form.endDate.value) {
        var s = new Date(form.startDate.value).getTime();
        var e = new Date(form.endDate.value).getTime();
        if (e < s) {
            showError('endDate', '结束日期不能早于开始日期');
            ok = false;
        }
    }

    return ok;
}

// 7. 保存：校验通过 -> 组装月卡对象 -> 写入 localStorage -> 跳回列表
function doSave() {
    if (!validate()) return;   // 校验不通过阻止提交

    var form = document.getElementById('cardForm');
    var data = {
        carNumber: form.carNumber.value,
        ownerName: form.ownerName.value,
        phone: form.phone.value,
        carBrand: form.carBrand.value,
        cardType: form.cardType.value,
        paymentAmount: Number(form.paymentAmount.value),
        paymentMethod: form.paymentMethod.value,
        startDate: form.startDate.value,
        endDate: form.endDate.value,
        remainDay: Number(form.remainDay.value),
        status: (form.status.value == '可用') ? 0 : 1
    };

    if (isEdit) {
        // 编辑模式：找到下标，覆盖原对象的字段
        for (var i = 0; i < cards.length; i++) {
            if (cards[i].id == editId) {
                for (var key in data) {
                    cards[i][key] = data[key];
                }
                break;
            }
        }
    } else {
        // 新增模式：用 Date.now() 生成唯一 id，加到数组末尾
        data.id = Date.now();
        cards.push(data);
    }

    // 保存到 localStorage，跳回月卡管理页面
    saveMonthCards(cards);
    location.href = 'monthCard.html';
}

// 8. 重置：清空表单 + 清空错误提示
function doReset() {
    var form = document.getElementById('cardForm');
    form.reset();
    clearAllErrors();
    form.remainDay.value = '';
    form.status.value = '';
}

// 页面加载完成
window.onload = function () {
    // 绑定事件
    document.getElementById('btnBack').onclick = function () {
        location.href = 'monthCard.html';
    };
    document.getElementById('btnSave').onclick = doSave;
    document.getElementById('btnReset').onclick = doReset;

    var form = document.getElementById('cardForm');
    form.endDate.onchange = autoCalcRemain;   // 结束日期变化时自动计算

    // 初始化
    if (isEdit) {
        fillFormForEdit();   // 编辑模式回填
    } else {
        form.reset();         // 新增模式表单清空
    }
};
