---
title: 红黑树
categories:
- 数据结构
- algorithm
description: 红黑树是一种自平衡搜索二叉树。在红黑树中，每个节点都存储了其颜色（红色或黑色），用于帮助树在插入或删除过程中保持平衡。
permalink: "/posts/red-black-tree"
excerpt: 红黑树是一种自平衡搜索二叉树。在红黑树中，每个节点都存储了其颜色（红色或黑色），用于帮助树在插入或删除过程中保持平衡。
---

+ [Wiki](https://en.wikipedia.org/wiki/Red%E2%80%93black_tree)
+ [中文Wiki](https://zh.wikipedia.org/wiki/%E7%BA%A2%E9%BB%91%E6%A0%91)
+ [推荐文档](https://www.jianshu.com/p/e136ec79235c)

## 红黑树的4条性质

1. 任何节点非黑即红
2. 所有叶子节点（NULL节点）都是黑色节点
3. 一个红色节点没有红色子节点
4. 从任何节点到其后代所有叶子节点（NULL节点）的每条路径都有相同数量的黑色节点


## 插入

所有插入操作都是在叶子结点进行的，插入节点默认为红色。

### 插入的6种情况及处理方法

<ul style="list-style-type: none;">
<li>1️⃣ 空树 👉 创建树，插入节点作为根节点，颜色改为黑色</li>
<li>2️⃣ 节点已经存在 👉 无需做处理</li>
<li>3️⃣ 父节点是黑色 👉 由于插入节点是红色，直接插入不会影响平衡</li>
<li>⤵ 父节点红</li>
    <ul style="list-style-type: none;">
    <li>4️⃣ 叔叔节点为红色 👉 父亲和叔叔设置为黑色，祖父设置为红色，并把祖父当成插入节点向上递归</li>
    <li>⤵ 叔叔节点不存在或为黑色</li>
        <ul style="list-style-type: none;">
        <li>5️⃣ 插入节点与父节点顺边 👉 父亲、祖父颜色反转，对祖父做旋转</li>
        <li>6️⃣ 插入节点与父节点反边 👉 旋转成顺边处理，得到情况5 ⤴</li>
        </ul>
    </ul>
</ul>


### 插入情况图示

![插入情况图示](/assets/images/red-black-tree/rbt-insert.drawio.svg)

## 删除

1. 当删除的节点有两个子节点时，用右树最左节点或左树最右节点进行替换后，可以把情况转换成删除替换节点，这类替换节点只能是有0个或有1个子节点；
2. 有一个子节点时，改节点必然是黑色，子节点是红色。（如果改节点是红色，则违反性质4；如果唯一子节点也是黑色，也会违反性质4）
3. 没有子节点时，这种情况最复杂，需要看兄弟节点那边的情况；

### 删除的8种情况及处理方法

<ul style="list-style-type: none;">
<li>1️⃣ 空树 👉 无需做处理</li>
<li>2️⃣ 节点不存在 👉 无需做处理</li>
<li>3️⃣ 节点是红色 👉 直接删除</li>
<li>⤵ 节点是黑色</li>
    <ul style="list-style-type: none;">
    <li>4️⃣ 有子节点 👉 把子节点改为黑色，并用子节点替换</li>
    <li>⤵ 没有子节点</li>
        <ul style="list-style-type: none;">
        <li>5️⃣ 兄弟节点是红色 👉 父节点变红，兄弟节点变黑，对父节点旋转，得到情况8 ⤵</li>
        <li>⤵ 兄弟节点是黑色</li>
            <ul style="list-style-type: none;">
            <li>6️⃣ 兄弟节点顺边子节点是红色 👉 将父节点和兄弟的顺边子节点设置为黑，兄弟节点设置为父节点颜色，并向替换节点方向旋转兄弟节点</li>
            <li>⤵ 兄弟节点顺边子节点是黑色</li>
                <ul style="list-style-type: none;">
                <li>7️⃣ 兄弟节点对边子节点是红色 👉 将兄弟对边子节点设为黑，兄弟节点设为红，对兄弟节点顺边旋转，得到情况6 ⤴</li>
                <li>8️⃣ 兄弟节点对边子节点是黑色 👉 将兄弟节点设置为红，把父亲节点作为新的处理节点递归 ⤴</li>
                </ul>
            </ul>
        </ul>
    </ul>
</ul>

### 删除情况图示

![删除情况图示](/assets/images/red-black-tree/rbt-delete.drawio.svg)
