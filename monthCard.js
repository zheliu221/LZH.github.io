// ===== 月卡管理列表页业务逻辑 =====
(function () {
    // 数据源：从 localStorage 读取
    var cards = loadMonthCards();
    // 过滤后的数据（查询结果）
    var filteredCards = cards.slice();
    // 分页状态
    var currentPage = 1;
    var pageSize = 10;
    // 当前编辑/续费的月卡 id
    var currentEditId = null;
    // 当前弹窗模式：edit / renew
    var editMode = 'edit';

    // ===== 封装渲染函数：表格 DOM 动态生成 =====
    function renderTable() {
        var tbody = document.getElementById('tableBody');
        var total = filteredCards.length;
        var totalPages = Math.max(1, Math.ceil(total / pageSize));
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        // 数组 slice 切片实现分页
        var start = (currentPage - 1) * pageSize;
        var end = start + pageSize;
        var pageData = filteredCards.slice(start, end);

        // 生成表格行
        if (pageData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="14" class="empty-row">暂无数据</td></tr>';
        } else {
            tbody.innerHTML = pageData.map(function (card, idx) {
                return '<tr>' +
                    '<td><input type="checkbox" class="row-check" data-id="' + card.id + '"></td>' +
                    '<td>' + (start + idx + 1) + '</td>' +
                    '<td>' + escapeHtml(card.carNumber) + '</td>' +
                    '<td>' + escapeHtml(card.ownerName) + '</td>' +
                    '<td>' + escapeHtml(card.phone) + '</td>' +
                    '<td>' + escapeHtml(card.carBrand) + '</td>' +
                    '<td>' + escapeHtml(card.cardType) + '</td>' +
                    '<td>' + formatThousand(card.paymentAmount) + '</td>' +
                    '<td>' + escapeHtml(card.paymentMethod) + '</td>' +
                    '<td>' + escapeHtml(card.startDate) + '</td>' +
                    '<td>' + escapeHtml(card.endDate) + '</td>' +
                    '<td>' + card.remainDay + '</td>' +
                    '<td><span class="tag ' + (Number(card.status) === 0 ? 'tag-success' : 'tag-danger') + '">' + statusText(card.status) + '</span></td>' +
                    '<td class="action-col">' +
                        '<button class="btn-link" data-action="view" data-id="' + card.id + '">查看</button>' +
                        '<button class="btn-link" data-action="edit" data-id="' + card.id + '">编辑</button>' +
                        '<button class="btn-link" data-action="renew" data-id="' + card.id + '">续费</button>' +
                        '<button class="btn-link btn-link-danger" data-action="delete" data-id="' + card.id + '">删除</button>' +
                    '</td>' +
                '</tr>';
            }).join('');
        }

        // 更新分页信息
        document.getElementById('totalRecords').textContent = total;
        document.getElementById('currentPage').textContent = currentPage;
        document.getElementById('totalPage').textContent = totalPages;
        // 取消全选
        document.getElementById('checkAll').checked = false;
    }

    // 简单 HTML 转义，避免 XSS
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ===== 查询筛选：使用 filter() 对数组条件过滤 =====
    function doSearch() {
        var kw = document.getElementById('filterCarNumber').value.trim();
        var st = document.getElementById('filterStatus').value;
        filteredCards = cards.filter(function (c) {
            var matchCar = kw ? String(c.carNumber).indexOf(kw) > -1 : true;
            var matchStatus = st === '' ? true : String(c.status) === st;
            return matchCar && matchStatus;
        });
        // 点击查询将页码重置为第 1 页
        currentPage = 1;
        renderTable();
    }

    // 重置：清空表单输入，恢复全部原始数据
    function doReset() {
        document.getElementById('filterCarNumber').value = '';
        document.getElementById('filterStatus').value = '';
        filteredCards = cards.slice();
        currentPage = 1;
        renderTable();
    }

    // ===== 弹窗工具 =====
    function openModal(id) {
        document.getElementById(id).style.display = 'flex';
    }
    function closeModal(id) {
        document.getElementById(id).style.display = 'none';
    }

    // 填充表单（查看/编辑/续费共用）
    function fillForm(formId, card, readonly) {
        var form = document.getElementById(formId);
        ['carNumber', 'ownerName', 'phone', 'carBrand', 'cardType', 'paymentAmount', 'paymentMethod', 'remainDay', 'startDate', 'endDate', 'status'].forEach(function (name) {
            var el = form.querySelector('[name="' + name + '"]');
            if (!el) return;
            // status 用 select
            if (name === 'status') {
                el.value = String(card.status);
            } else if (name === 'paymentMethod') {
                el.value = card.paymentMethod;
            } else {
                el.value = card[name];
            }
            el.readOnly = readonly;
            el.disabled = false;
        });
    }

    // 续费模式：车辆信息字段只读，只允许修改缴费相关 + 剩余有效天数字段
    function setRenewReadonly() {
        var form = document.getElementById('editForm');
        // 车辆信息字段只读
        ['carNumber', 'ownerName', 'phone', 'carBrand', 'cardType'].forEach(function (name) {
            var el = form.querySelector('[name="' + name + '"]');
            if (el) el.readOnly = true;
        });
        // 缴费相关 + 剩余有效天数可编辑
        ['paymentAmount', 'paymentMethod', 'remainDay', 'startDate', 'endDate', 'status'].forEach(function (name) {
            var el = form.querySelector('[name="' + name + '"]');
            if (el) { el.readOnly = false; el.disabled = false; }
        });
    }

    // 编辑模式：全部字段可编辑
    function setEditAllEditable() {
        var form = document.getElementById('editForm');
        ['carNumber', 'ownerName', 'phone', 'carBrand', 'cardType', 'paymentAmount', 'paymentMethod', 'remainDay', 'startDate', 'endDate', 'status'].forEach(function (name) {
            var el = form.querySelector('[name="' + name + '"]');
            if (!el) return;
            el.readOnly = false;
            el.disabled = false;
        });
    }

    // 根据 id 查找月卡对象
    function findCard(id) {
        return cards.find(function (c) { return Number(c.id) === Number(id); });
    }

    // ===== 查看：只读弹窗 =====
    function doView(id) {
        var card = findCard(id);
        if (!card) return;
        fillForm('viewForm', card, true);
        // 状态显示中文
        var statusEl = document.querySelector('#viewForm [name="status"]');
        if (statusEl) statusEl.value = statusText(card.status);
        openModal('viewModal');
    }

    // ===== 编辑弹窗（可修改全部字段） =====
    function doEdit(id) {
        var card = findCard(id);
        if (!card) return;
        currentEditId = id;
        editMode = 'edit';
        document.getElementById('editModalTitle').textContent = '编辑月卡';
        fillForm('editForm', card, false);
        setEditAllEditable();
        openModal('editModal');
    }

    // ===== 续费弹窗：复用编辑弹窗，仅可修改缴费相关信息 =====
    function doRenew(id) {
        var card = findCard(id);
        if (!card) return;
        currentEditId = id;
        editMode = 'renew';
        document.getElementById('editModalTitle').textContent = '续费月卡';
        fillForm('editForm', card, false);
        setRenewReadonly();
        openModal('editModal');
    }

    // ===== 编辑/续费保存 =====
    function doSaveEdit() {
        var form = document.getElementById('editForm');
        var idx = cards.findIndex(function (c) { return Number(c.id) === Number(currentEditId); });
        if (idx === -1) return;

        // 收集表单数据
        var updated = {
            id: currentEditId,
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
            status: Number(form.status.value)
        };

        // 续费模式：结束日期变化后自动重算剩余天数 + 状态
        if (editMode === 'renew' && updated.endDate) {
            updated.remainDay = calcRemainDay(updated.endDate);
            updated.status = calcStatus(updated.endDate);
        }

        // 替换数组对象
        cards[idx] = Object.assign({}, cards[idx], updated);
        // 持久化存储
        saveMonthCards(cards);
        // 重新过滤 + 渲染
        doSearch();
        closeModal('editModal');
    }

    // ===== 单条删除：浏览器原生 confirm() 二次确认 =====
    function doDelete(id) {
        if (!confirm('确认删除该月卡记录？')) return;
        cards = cards.filter(function (c) { return Number(c.id) !== Number(id); });
        saveMonthCards(cards);
        filteredCards = filteredCards.filter(function (c) { return Number(c.id) !== Number(id); });
        renderTable();
    }

    // ===== 复选框全选 / 取消全选 =====
    function bindCheckAll() {
        var checkAll = document.getElementById('checkAll');
        checkAll.addEventListener('change', function () {
            var checks = document.querySelectorAll('.row-check');
            checks.forEach(function (cb) { cb.checked = checkAll.checked; });
        });
    }

    // ===== 批量删除：根据勾选 id 过滤数组 =====
    function doBatchDelete() {
        var checks = document.querySelectorAll('.row-check:checked');
        if (checks.length === 0) {
            alert('请先勾选要删除的记录');
            return;
        }
        if (!confirm('确认批量删除选中的 ' + checks.length + ' 条记录？')) return;
        var ids = Array.prototype.map.call(checks, function (cb) { return Number(cb.getAttribute('data-id')); });
        cards = cards.filter(function (c) { return ids.indexOf(Number(c.id)) === -1; });
        saveMonthCards(cards);
        filteredCards = filteredCards.filter(function (c) { return ids.indexOf(Number(c.id)) === -1; });
        renderTable();
    }

    // ===== 事件绑定 =====
    function bindEvents() {
        // 查询 / 重置
        document.getElementById('btnSearch').addEventListener('click', doSearch);
        document.getElementById('btnReset').addEventListener('click', doReset);

        // 添加月卡：跳转 addMonthCard.html
        document.getElementById('btnAdd').addEventListener('click', function () {
            location.href = 'addMonthCard.html';
        });

        // 批量删除
        document.getElementById('btnBatchDelete').addEventListener('click', doBatchDelete);

        // 表格操作事件委托
        document.getElementById('tableBody').addEventListener('click', function (e) {
            var btn = e.target.closest('[data-action]');
            if (!btn) return;
            var id = btn.getAttribute('data-id');
            var action = btn.getAttribute('data-action');
            if (action === 'view') doView(id);
            else if (action === 'edit') doEdit(id);
            else if (action === 'renew') doRenew(id);
            else if (action === 'delete') doDelete(id);
        });

        // 全选
        bindCheckAll();

        // 分页：上一页 / 下一页
        document.getElementById('btnPrev').addEventListener('click', function () {
            if (currentPage > 1) { currentPage--; renderTable(); }
        });
        document.getElementById('btnNext').addEventListener('click', function () {
            var totalPages = Math.max(1, Math.ceil(filteredCards.length / pageSize));
            if (currentPage < totalPages) { currentPage++; renderTable(); }
        });

        // 切换每页条数
        document.getElementById('pageSize').addEventListener('change', function () {
            pageSize = Number(this.value);
            currentPage = 1;
            renderTable();
        });

        // 弹窗关闭按钮
        document.querySelectorAll('[data-close]').forEach(function (el) {
            el.addEventListener('click', function () {
                closeModal(this.getAttribute('data-close'));
            });
        });

        // 编辑弹窗保存
        document.getElementById('btnSaveEdit').addEventListener('click', doSaveEdit);
    }

    // 页面加载初始化
    window.addEventListener('load', function () {
        bindEvents();
        renderTable();
    });
})();
