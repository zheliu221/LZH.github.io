// ===== 增加月卡页面业务逻辑 =====
// 读取 URL 参数 id，区分新增模式 / 编辑模式
// 通过 URLSearchParams 读取浏览器 url 查询参数 id
(function () {
    // 校验正则
    var PHONE_REG = /^1[3-9]\d{9}$/;                                          // 手机号正则
    var PLATE_REG = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-HJ-NP-Z][0-9A-HJ-NP-Z]{4,6}$/; // 国内车牌正则

    var params = new URLSearchParams(location.search);
    var editId = params.get('id');     // 无 id 代表新增，携带 id 代表编辑模式
    var isEdit = !!editId;             // 是否为编辑模式
    var cards = loadMonthCards();      // JS 读取本地月卡数据源

    var form = document.getElementById('cardForm');

    // ===== 编辑模式：根据 id 查询对应月卡数据，完成表单回填 =====
    function fillFormForEdit() {
        if (!isEdit) return;
        var card = cards.find(function (c) { return String(c.id) === String(editId); });
        if (!card) {
            alert('未找到对应的月卡记录');
            location.href = 'monthCard.html';
            return;
        }
        form.carNumber.value = card.carNumber || '';
        form.ownerName.value = card.ownerName || '';
        form.phone.value = card.phone || '';
        form.carBrand.value = card.carBrand || '';
        form.cardType.value = card.cardType || '';
        form.paymentAmount.value = card.paymentAmount || '';
        form.paymentMethod.value = card.paymentMethod || '';
        form.startDate.value = card.startDate || '';
        form.endDate.value = card.endDate || '';
        form.remainDay.value = card.remainDay !== undefined ? card.remainDay : '';
        form.status.value = Number(card.status) === 0 ? '可用' : '已过期';
        // 修改页面标题
        document.getElementById('pageTitle').textContent = '编辑月卡';
    }

    // ===== 自动计算剩余有效天数、自动判断月卡状态 =====
    function autoCalcRemain() {
        var endStr = form.endDate.value;
        if (!endStr) {
            form.remainDay.value = '';
            form.status.value = '';
            return;
        }
        // 根据结束日期计算剩余有效天数
        form.remainDay.value = calcRemainDay(endStr);
        // 对比结束日期与当前时间，自动判断月卡状态
        form.status.value = calcStatus(endStr) === 0 ? '可用' : '已过期';
    }

    // ===== 显示 / 清除错误提示 =====
    function showError(name, msg) {
        var el = form.querySelector('[data-error="' + name + '"]');
        if (el) el.textContent = msg || '';
    }
    function clearAllErrors() {
        form.querySelectorAll('.error-tip').forEach(function (el) { el.textContent = ''; });
    }

    // ===== 表单校验 =====
    function validate() {
        clearAllErrors();
        var ok = true;

        // 必填项不为空
        if (!form.carNumber.value.trim()) { showError('carNumber', '请输入车牌号'); ok = false; }
        else if (!PLATE_REG.test(form.carNumber.value.trim())) { showError('carNumber', '车牌号格式不正确（如：京A12345）'); ok = false; }

        if (!form.ownerName.value.trim()) { showError('ownerName', '请输入车主姓名'); ok = false; }

        if (!form.phone.value.trim()) { showError('phone', '请输入手机号'); ok = false; }
        else if (!PHONE_REG.test(form.phone.value.trim())) { showError('phone', '手机号格式不正确'); ok = false; }

        if (!form.paymentAmount.value.trim()) { showError('paymentAmount', '请输入支付金额'); ok = false; }
        else if (Number(form.paymentAmount.value) <= 0) { showError('paymentAmount', '支付金额必须为正数'); ok = false; }

        if (!form.paymentMethod.value) { showError('paymentMethod', '请选择支付方式'); ok = false; }

        if (!form.startDate.value) { showError('startDate', '请选择开始日期'); ok = false; }
        if (!form.endDate.value) { showError('endDate', '请选择结束日期'); ok = false; }

        // 结束日期不能早于开始日期
        if (form.startDate.value && form.endDate.value) {
            var s = new Date(form.startDate.value).getTime();
            var e = new Date(form.endDate.value).getTime();
            if (e < s) { showError('endDate', '结束日期不能早于开始日期'); ok = false; }
        }

        return ok;
    }

    // ===== 收集表单数据，组装月卡对象 =====
    function getFormData() {
        return {
            carNumber: form.carNumber.value.trim(),
            ownerName: form.ownerName.value.trim(),
            phone: form.phone.value.trim(),
            carBrand: form.carBrand.value.trim(),
            cardType: form.cardType.value.trim(),
            paymentAmount: Number(form.paymentAmount.value),
            paymentMethod: form.paymentMethod.value,
            startDate: form.startDate.value,
            endDate: form.endDate.value,
            remainDay: Number(form.remainDay.value),
            status: form.status.value === '可用' ? 0 : 1
        };
    }

    // ===== 保存：组装完整月卡对象 =====
    function doSave() {
        // 校验不通过阻止提交
        if (!validate()) return;

        var data = getFormData();

        if (isEdit) {
            // 编辑模式：找到对应下标替换数组对象
            var idx = cards.findIndex(function (c) { return String(c.id) === String(editId); });
            if (idx > -1) {
                data.id = Number(editId);
                cards[idx] = Object.assign({}, cards[idx], data);
            }
        } else {
            // 新增模式：使用 Date.now() 生成唯一 id，push 到月卡数组
            data.id = Date.now();
            cards.push(data);
        }

        // 调用保存函数写入 localStorage
        saveMonthCards(cards);
        // 保存成功跳转回月卡管理页面
        location.href = 'monthCard.html';
    }

    // ===== 重置：清空全部表单输入框 + 清除校验错误提示 =====
    function doReset() {
        form.reset();
        clearAllErrors();
        form.remainDay.value = '';
        form.status.value = '';
    }

    // ===== 事件绑定 =====
    function bindEvents() {
        // 返回按钮：跳回 monthCard.html
        document.getElementById('btnBack').addEventListener('click', function () {
            location.href = 'monthCard.html';
        });
        // 确定 / 重置
        document.getElementById('btnSave').addEventListener('click', doSave);
        document.getElementById('btnReset').addEventListener('click', doReset);
        // 结束日期变化时自动计算剩余天数 + 状态
        form.endDate.addEventListener('change', autoCalcRemain);
    }

    // 页面加载初始化
    window.addEventListener('load', function () {
        bindEvents();
        fillFormForEdit();      // 编辑模式自动回填
        if (!isEdit) {
            // 新增模式：表单全部清空
            form.reset();
        }
    });
})();
