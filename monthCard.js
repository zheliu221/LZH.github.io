// ===== 月卡管理列表页 =====

// 全局变量
var cards = loadMonthCards();   // 全部月卡数据
var filteredCards = cards;      // 查询后的数据
var currentPage = 1;           // 当前页码
var pageSize = 10;              // 每页条数
var currentEditId = null;       // 当前编辑/续费的 id
var editMode = 'edit';          // 模式：edit 编辑 / renew 续费

// 1. 渲染表格（修改数据后调用这个函数刷新页面）
function renderTable() {
    var tbody = document.getElementById('tableBody');
    var total = filteredCards.length;
    var totalPages = Math.ceil(total / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    var start = (currentPage - 1) * pageSize;   // 起始下标
    var end = start + pageSize;                   // 结束下标
    var html = '';

    if (total == 0) {
        html = '<tr><td colspan="14" class="empty-row">暂无数据</td></tr>';
    } else {
        for (var i = start; i < end && i < total; i++) {
            var c = filteredCards[i];
            html += '<tr>';
            html += '<td><input type="checkbox" class="row-check" value="' + c.id + '"></td>';
            html += '<td>' + (i + 1) + '</td>';
            html += '<td>' + c.carNumber + '</td>';
            html += '<td>' + c.ownerName + '</td>';
            html += '<td>' + c.phone + '</td>';
            html += '<td>' + c.carBrand + '</td>';
            html += '<td>' + c.cardType + '</td>';
            html += '<td>' + formatThousand(c.paymentAmount) + '</td>';
            html += '<td>' + c.paymentMethod + '</td>';
            html += '<td>' + c.startDate + '</td>';
            html += '<td>' + c.endDate + '</td>';
            html += '<td>' + c.remainDay + '</td>';
            // 状态码 0 显示"可用"，1 显示"已过期"
            if (c.status == 0) {
                html += '<td><span class="tag tag-success">可用</span></td>';
            } else {
                html += '<td><span class="tag tag-danger">已过期</span></td>';
            }
            // 操作按钮用内联 onclick 直接调用函数，最直观
            html += '<td class="action-col">';
            html += '<button class="btn-link" onclick="doView(' + c.id + ')">查看</button>';
            html += '<button class="btn-link" onclick="doEdit(' + c.id + ')">编辑</button>';
            html += '<button class="btn-link" onclick="doRenew(' + c.id + ')">续费</button>';
            html += '<button class="btn-link btn-link-danger" onclick="doDelete(' + c.id + ')">删除</button>';
            html += '</td>';
            html += '</tr>';
        }
    }
    tbody.innerHTML = html;

    // 更新分页信息
    document.getElementById('totalRecords').innerHTML = total;
    document.getElementById('currentPage').innerHTML = currentPage;
    document.getElementById('totalPage').innerHTML = totalPages;
    document.getElementById('checkAll').checked = false;
}

// 2. 查询：用 for 循环过滤数组
function doSearch() {
    var kw = document.getElementById('filterCarNumber').value;
    var st = document.getElementById('filterStatus').value;
    var result = [];
    for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        var matchCar = true;
        var matchStatus = true;
        if (kw) {
            // 车牌号包含关键字
            matchCar = (c.carNumber.indexOf(kw) > -1);
        }
        if (st != '') {
            matchStatus = (c.status == st);
        }
        if (matchCar && matchStatus) {
            result.push(c);
        }
    }
    filteredCards = result;
    currentPage = 1;   // 查询后重置到第 1 页
    renderTable();
}

// 3. 重置：清空筛选条件，恢复全部数据
function doReset() {
    document.getElementById('filterCarNumber').value = '';
    document.getElementById('filterStatus').value = '';
    filteredCards = cards;
    currentPage = 1;
    renderTable();
}

// 4. 弹窗打开/关闭
function openModal(id) {
    document.getElementById(id).style.display = 'flex';
}
function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// 5. 根据 id 查找月卡对象（用 for 循环）
function findCard(id) {
    for (var i = 0; i < cards.length; i++) {
        if (cards[i].id == id) return cards[i];
    }
    return null;
}

// 6. 填表单：把 card 的字段塞到指定 form 里
function fillForm(formId, card) {
    var form = document.getElementById(formId);
    form.carNumber.value = card.carNumber || '';
    form.ownerName.value = card.ownerName || '';
    form.phone.value = card.phone || '';
    form.carBrand.value = card.carBrand || '';
    form.cardType.value = card.cardType || '';
    form.paymentAmount.value = card.paymentAmount || '';
    form.paymentMethod.value = card.paymentMethod || '';
    form.startDate.value = card.startDate || '';
    form.endDate.value = card.endDate || '';
    form.remainDay.value = card.remainDay || '';
    form.status.value = card.status;
}

// 7. 查看：只读弹窗
function doView(id) {
    var c = findCard(id);
    if (!c) return;
    fillForm('viewForm', c);
    // 状态显示中文
    document.getElementById('viewForm').status.value = statusText(c.status);
    openModal('viewModal');
}

// 8. 编辑：弹窗可改全部字段
function doEdit(id) {
    var c = findCard(id);
    if (!c) return;
    currentEditId = id;
    editMode = 'edit';
    document.getElementById('editModalTitle').innerHTML = '编辑月卡';
    fillForm('editForm', c);
    // 编辑模式全部字段可改
    setEditFormReadonly(false);
    openModal('editModal');
}

// 9. 续费：复用编辑弹窗，车辆信息字段只读
function doRenew(id) {
    var c = findCard(id);
    if (!c) return;
    currentEditId = id;
    editMode = 'renew';
    document.getElementById('editModalTitle').innerHTML = '续费月卡';
    fillForm('editForm', c);
    // 续费模式：车辆信息只读，缴费相关可改
    setEditFormReadonly(true);
    openModal('editModal');
}

// 设置编辑表单各字段是否只读
function setEditFormReadonly(renewMode) {
    var form = document.getElementById('editForm');
    // 车辆信息字段
    var carFields = ['carNumber', 'ownerName', 'phone', 'carBrand', 'cardType'];
    for (var i = 0; i < carFields.length; i++) {
        var el = form[carFields[i]];
        if (el) el.readOnly = renewMode;   // renew 模式下只读
    }
    // 缴费 + 日期 + 状态可改
    var editFields = ['paymentAmount', 'paymentMethod', 'remainDay', 'startDate', 'endDate', 'status'];
    for (var j = 0; j < editFields.length; j++) {
        var el2 = form[editFields[j]];
        if (el2) el2.readOnly = false;
    }
}

// 10. 编辑/续费保存
function doSaveEdit() {
    var form = document.getElementById('editForm');
    // 找到对应下标
    var idx = -1;
    for (var i = 0; i < cards.length; i++) {
        if (cards[i].id == currentEditId) { idx = i; break; }
    }
    if (idx == -1) return;

    // 收集表单数据
    var updated = {
        id: currentEditId,
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
        status: Number(form.status.value)
    };

    // 续费模式：结束日期变化后自动重算剩余天数 + 状态
    if (editMode == 'renew' && updated.endDate) {
        updated.remainDay = calcRemainDay(updated.endDate);
        updated.status = calcStatus(updated.endDate);
    }

    // 用 for 循环把原对象各字段覆盖一遍
    var oldCard = cards[idx];
    for (var key in updated) {
        oldCard[key] = updated[key];
    }

    // 保存到 localStorage
    saveMonthCards(cards);
    // 刷新页面
    doSearch();
    closeModal('editModal');
}

// 11. 单条删除：浏览器 confirm 二次确认
function doDelete(id) {
    if (!confirm('确认删除该月卡记录？')) return;
    var result = [];
    for (var i = 0; i < cards.length; i++) {
        if (cards[i].id != id) result.push(cards[i]);
    }
    cards = result;
    saveMonthCards(cards);
    // 同时从 filteredCards 里去掉
    var result2 = [];
    for (var j = 0; j < filteredCards.length; j++) {
        if (filteredCards[j].id != id) result2.push(filteredCards[j]);
    }
    filteredCards = result2;
    renderTable();
}

// 12. 全选/取消全选
function toggleCheckAll(checkbox) {
    var checks = document.getElementsByClassName('row-check');
    for (var i = 0; i < checks.length; i++) {
        checks[i].checked = checkbox.checked;
    }
}

// 13. 批量删除
function doBatchDelete() {
    var checks = document.getElementsByClassName('row-check');
    var ids = [];
    for (var i = 0; i < checks.length; i++) {
        if (checks[i].checked) ids.push(Number(checks[i].value));
    }
    if (ids.length == 0) {
        alert('请先勾选要删除的记录');
        return;
    }
    if (!confirm('确认批量删除选中的 ' + ids.length + ' 条记录？')) return;

    // 过滤掉被选中的
    var result = [];
    for (var j = 0; j < cards.length; j++) {
        var keep = true;
        for (var k = 0; k < ids.length; k++) {
            if (cards[j].id == ids[k]) { keep = false; break; }
        }
        if (keep) result.push(cards[j]);
    }
    cards = result;
    saveMonthCards(cards);
    doSearch();   // 重新过滤渲染
}

// 14. 上一页
function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
}
// 15. 下一页
function nextPage() {
    var totalPages = Math.ceil(filteredCards.length / pageSize) || 1;
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
}
// 16. 切换每页条数
function changePageSize(sel) {
    pageSize = Number(sel.value);
    currentPage = 1;
    renderTable();
}

// 17. 关闭弹窗（供 HTML 的 data-close 按钮用 onclick 调用）
function closeBtn(id) {
    closeModal(id);
}

// 页面加载完成绑定事件
window.onload = function () {
    // 查询 / 重置
    document.getElementById('btnSearch').onclick = doSearch;
    document.getElementById('btnReset').onclick = doReset;

    // 添加月卡：跳转
    document.getElementById('btnAdd').onclick = function () {
        location.href = 'addMonthCard.html';
    };

    // 批量删除
    document.getElementById('btnBatchDelete').onclick = doBatchDelete;

    // 全选复选框
    document.getElementById('checkAll').onchange = function () {
        toggleCheckAll(this);
    };

    // 分页
    document.getElementById('btnPrev').onclick = prevPage;
    document.getElementById('btnNext').onclick = nextPage;
    document.getElementById('pageSize').onchange = function () {
        changePageSize(this);
    };

    // 弹窗关闭按钮（HTML 用 data-close="viewModal" 标记）
    var closeBtns = document.querySelectorAll('[data-close]');
    for (var i = 0; i < closeBtns.length; i++) {
        closeBtns[i].onclick = function () {
            closeModal(this.getAttribute('data-close'));
        };
    }

    // 编辑弹窗保存按钮
    document.getElementById('btnSaveEdit').onclick = doSaveEdit;

    // 首次渲染
    renderTable();
};
