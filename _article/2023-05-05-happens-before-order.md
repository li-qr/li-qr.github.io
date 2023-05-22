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

两个动作按照 happens-before 关系按序进行。如果一个动作 happens-before 另一个动作，则第一个动作在第二个动作之前进行，并且第一个动作的结果对第二个动作可见。

我们定义 *hb(x,y)* 来代表动作 *x* happens-before 动作 *y* ，则有：

* 如果在同一个线程中，动作 *x* [program order](https://docs.oracle.com/javase/specs/jls/se8/html/jls-17.html#jls-17.4.3 "Threads and Locks") 先于动作 *y* ，则 *hb(x,y)*。
* 围绕一个对象实例的 happens-before 边界是从这个对象的构造方法结束到析构方法开始。
* 如果动作 y 通过锁同步在动作 *x* 之后执行，则 *hb(x,y)*。
* 如果 hb(x,y) 并且 hb(y,z)，则 hb(x,z)。

Objcet 类中定义了几个 *wait* 方法，具有一系列加锁和释放锁的动作。这些动作 happens-before 由这些动作关联关系定义。

JLS 不约束 JVM 的实现对两个具有 happens-before 关系的动作强制按先后顺序执行，只需要确保通过指令重排后不影响最终结果。

例如，对线程创建的对象的所有属性的默认值赋值动作，不一定要发生在线程开始之前。只需要在对属性进行观察的操作之前完成即可。
