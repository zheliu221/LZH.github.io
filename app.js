// 根据当前页面文件名自动高亮对应菜单项
(function () {
    // 获取当前页面文件名，如 index.html
    var current = location.pathname.split('/').pop() || 'index.html';
    // 去掉查询参数
    current = current.split('?')[0];

    // 遍历所有菜单项的 a 标签
    var links = document.querySelectorAll('.menu a');
    links.forEach(function (a) {
        var href = a.getAttribute('href');
        if (href && href === current) {
            // 给匹配的 li 加 active 类
            var li = a.parentElement;
            li.classList.add('active');

            // 如果是子菜单项，展开父级 has-sub
            var parentSubmenu = li.closest('.submenu');
            if (parentSubmenu) {
                var parentItem = parentSubmenu.closest('.menu-item.has-sub');
                if (parentItem) {
                    parentItem.classList.add('open');
                    // 同时去掉兄弟项的 active
                    parentItem.parentElement.querySelectorAll(':scope > .menu-item.active').forEach(function (el) {
                        if (el !== parentItem) el.classList.remove('active');
                    });
                }
            } else {
                // 顶级菜单，去掉兄弟项的 active
                li.parentElement.querySelectorAll(':scope > .menu-item.active').forEach(function (el) {
                    if (el !== li) el.classList.remove('active');
                });
            }
        }
    });

    // 子菜单折叠/展开交互
    var subs = document.querySelectorAll('.menu-item.has-sub > a');
    subs.forEach(function (a) {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            this.parentElement.classList.toggle('open');
        });
    });
})();
