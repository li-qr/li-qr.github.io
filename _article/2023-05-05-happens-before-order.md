---
title: Happens-before 顺序
categories:
- jdk8
- java
- happens-before
- threads and locks
description: 两个动作按照 happens-before 关系按序进行。如果一个动作 happens-before 另一个动作，则第一个动作在第二个动作之前进行，并且第一个动作的结果对第二个动作可见。
permalink: "/posts/happens-before-order"
excerpt: 两个动作按照 happens-before 关系按序进行。如果一个动作 happens-before 另一个动作，则第一个动作在第二个动作之前进行，并且第一个动作的结果对第二个动作可见。
---
* [Chapter 17 of the Java Language Specification](https://docs.oracle.com/javase/specs/jls/se7/html/jls-17.html#jls-17.4.5)
* [tutorials](https://jenkov.com/tutorials/java-concurrency/java-happens-before-guarantee.html#instruction-reordering "jenkov")

两个动作按照 happens-before 关系按序进行。如果一个动作 happens-before 于另一个动作，则代表第一个动作的结果对第二个动作可见。 happens-before 重点强调的是两个动作之间的可见性，而非动作完成的顺序。happens-before 侧重于多线程环境下，允许优化 CPU 指令执行效率对指令重排序的屏障要求。

代表动作 *x* happens-before 动作 *y*，可以用定义 hb(x,y) 表示。

* 如果在同一个线程中，动作 *x* [program order](https://docs.oracle.com/javase/specs/jls/se8/html/jls-17.html#jls-17.4.3 "Threads and Locks") 在动作 *y* 前面，则 *x* happens-before 动作 *y*。
* 围绕一个对象实例的 happens-before 边界是从这个对象的构造方法结束到析构方法开始。
* 如果动作 y 通过锁同步在动作 *x* 之后执行，则 *hb(x,y)*。
* 如果 hb(x,y) 并且 hb(y,z)，则 hb(x,z)。
* 对一个监视器的解锁动作 happens-before 所有后续对这个监视器的加锁动作。
* 对一个 `volatile` 修饰变量的写动作 happens-before 所有对这个变量的读动作。
* 对线程的 `start()`  方法调用 happens-before 所有此线程开始之后的动作。
* 被 `join()` 调用的线程的所有动作都要 happens-before 线程结束之前。
* 对象字段的初始化 happens-before 所有其他动作（默认值赋值除外）。
