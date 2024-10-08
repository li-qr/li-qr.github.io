---
title: 浮点数与二进制转换
categories:
- 数据结构
- algorithm
description: 十进制小数如何进行二进制的互相转换，以及计算机如何存储浮点数。
permalink: "/posts/floating-point"
excerpt: 十进制小数如何进行二进制的互相转换，以及计算机如何存储浮点数。
---

+ [IEEE 754](https://zh.wikipedia.org/zh-cn/IEEE_754)
+ [单精度浮点数](https://zh.wikipedia.org/wiki/%E5%96%AE%E7%B2%BE%E5%BA%A6%E6%B5%AE%E9%BB%9E%E6%95%B8)
+ [双精度浮点数](https://zh.wikipedia.org/wiki/%E9%9B%99%E7%B2%BE%E5%BA%A6%E6%B5%AE%E9%BB%9E%E6%95%B8)

# 进制转换

## 二进制转换成十进制

按权相加法，把二进制数写成加权系数展开式，然后按十进制加法求和。例如：

$$ 
\begin{align}
 110.11 &= 1 \times 2^2 + 1 \times 2^1 + 0 \times 2^0 + 1 \times 2^{-1} + 1 \times 2^{-2} \\
        &= 4 + 2 + 0 + 0.5 + 0.25 \\
        &= 6.75
\end{align}
$$

## 十进制转换成二进制

十进制转成二进制，整数部分和小数部分采用两种不同的转换方法，最后将两部分转换的结果合并。例如173.8125先对整数部分173进行进制转换得到二进制a，再把小数部分0.8125进行进制转换得到二进制b，其结果就是a拼接b。

### 整数部分转换

整数转换采用“除2取余，逆序排列”法。例如：

$$
\begin{align}
173 \div 2 &= 86 &\cdots 1 \\
86 \div 2 &= 43 &\cdots 0 \\
43 \div 2 &= 21 &\cdots 1 \\
21 \div 2 &= 10 &\cdots 1 \\
10 \div 2 &= 5 &\cdots 0 \\
5 \div 2 &= 2 &\cdots 1 \\
2 \div 2 &= 1 &\cdots 0 \\
1 \div 2 &= 0 &\cdots 1 \\
&= 10101101
\end{align}
$$


### 小数部分转换

小数转换采用“乘2取整，顺序排列”法。直到达到精度或等于 0 为止。

$$
\begin{align}
0.8125 \times 2 &= 1.625 &\cdots 1 \\
0.625 \times 2 &= 1.25 &\cdots 1 \\
0.25 \times 2 &= 0.5 &\cdots 0 \\
0.5 \times 2 &= 1.0 &\cdots 1 \\
&= 1101
\end{align}
$$

### 把整数部分和小数部分合并

$$
\begin{align}
173 & .8125 \\
10101101 &. 1101
\end{align}
$$



# 浮点数存储

根据国际标准IEEE 754，浮点数使用下面的格式使用二进制存储：

$$ V = (-1)^S \times M \times 2 ^ E $$

+ $ (-1)^S $表示符号位，当S=0，V为正数，当S=1，V为负数。
+ $ M $表示有效数字，大于等于1，小于2。
+ $ 2^E $表示指数位。

例如，十进制 $5.0$，对应的二进制是 $101.0$，相当于 $1.01 \times 2^2$，于是有$ S=0,M=1.01,E=2 $。

十进制 $-5.0$，对应的二进制是 $-101.0$，相当于 $-1.01 \times 2^2$，于是有$ S=1,M=1.01,E=2 $

对于 32 位的单精度浮点数，最高 1 位是符号位 S ，后面 8 位是指数 E ，剩下的 23 位是有效数字 M 。

![单精度浮点数](../assets/images/floating-point/single-precision-floating.png)

对于 64 位的双精度浮点数，最高 1 位是符号位 S ，后面的 11 位是指数 E ，剩下的 52 位是有效数字 M 。

![双精度浮点数](../assets/images/floating-point/double_precision_float.png)

以下是一些特殊规定：

对于有效数字 M 。因为 $ 1 \leq M < 2 $ , M 永远都是 “1.xxxx” 的形式，所以在存储的时候第一位被舍去，只保存后面的 “xxxx” 部分。等到读取的时候再把前面的 “1.” 补上。

对于指数 E 。需要进行偏移计算，对于指数为什么要采用移位计算的方式，参考[Link](https://www.zhihu.com/question/24115452)。即存储的值等于实际值加上一个固定的值，这个值的计算方式是 $2^{e-1} - 1$ 。单精度浮点数指数位占 8 位，就是 $2^{8-1} -1 = 127$。双精度浮点数指数位占 11 位，就是 $2^{11-1} - 1 = 1023$。然后 E 的值还分三种情况：
1. E 不全为 0 或不全为 1 。这是浮点数采用上面的规则表示。
2. E 全为 0 。这时浮点数的指数 E 等于 1-127（或1-1023），有效数字 M 不再加上第一位的 1，而是还原为 “0.xxxx” 的小数。又分为两种情况：
   1. 有效数字是 0 ，表示 $\pm0$ 。
   2. 有效数字非 0 ，表示大于 0 小于 1 的数字。
3. E 全为 1 ，也分为两种情况：
   1. 有效数字是 0 ，表示 $\pm\infty$ 。
   2. 有效数字非 0 ，表示这个数为[非数（NaN）](https://zh.m.wikipedia.org/zh-hans/NaN)

