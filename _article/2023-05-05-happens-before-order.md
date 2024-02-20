---
title: Java中的Happens-before概念
categories:
- jdk8
- java
- happens-before
- threads and locks
description: Happens-before关系是Java内存模型（JMM）的一个基本概念，它定义了多线程程序中内存操作的顺序规则，确保并发环境下操作的可见性和有序性。简单来说，如果一个操作happens-before另一个操作，那么第一个操作的结果对第二个操作是可见的，且第一个操作在逻辑上先于第二个操作发生。
permalink: "/posts/happens-before-order"
excerpt: Happens-before关系是Java内存模型（JMM）的一个基本概念，它定义了多线程程序中内存操作的顺序规则，确保并发环境下操作的可见性和有序性。简单来说，如果一个操作happens-before另一个操作，那么第一个操作的结果对第二个操作是可见的，且第一个操作在逻辑上先于第二个操作发生。
---
* [Chapter 17 of the Java Language Specification](https://docs.oracle.com/javase/specs/jls/se7/html/jls-17.html#jls-17.4.5)
* [tutorials](https://jenkov.com/tutorials/java-concurrency/java-happens-before-guarantee.html#instruction-reordering "jenkov")

# Java中的Happens-before概念

## 定义

Happens-before关系是Java内存模型（JMM）的一个基本概念，它定义了多线程程序中内存操作的顺序规则，确保并发环境下操作的可见性和有序性。简单来说，如果一个操作happens-before另一个操作，那么第一个操作的结果对第二个操作是可见的，且第一个操作在逻辑上先于第二个操作发生。

## 作用

Happens-before规则的主要作用是为了解决并发编程中的两大问题：线程间的可见性问题和指令重排序问题。它确保在没有额外同步措施的情况下，当一个线程修改了共享变量的值，另一个线程能够看到这个修改；同时，它也保证了代码的执行顺序与程序员的预期相符。

## 核心原则

1. **内存可见性**：如果一个操作happens-before另一个操作，那么第一个操作的结果对后续操作是可见的。
2. **顺序一致性**：happens-before关系保证了程序的执行顺序在多线程环境下仍然是一致的。

## Happens-before规则

1. **程序顺序规则**：在同一个线程中，按照程序代码顺序，前面的操作happens-before后续的操作。
2. **监视器锁规则**：解锁（unlock）happens-before随后对同一个锁的加锁（lock）操作。
3. **volatile变量规则**：对一个volatile变量的写操作happens-before后续对这个变量的读操作。
4. **传递性**：如果操作A happens-before操作B，操作B happens-before操作C，那么操作A happens-before操作C。
5. **线程启动规则**：Thread对象的start()方法happens-before此线程的每一个动作。
6. **线程终止规则**：线程中的所有操作都happens-before其他线程检测到这个线程已经终止的动作，或者从Thread.join()方法成功返回的动作。
7. **线程中断规则**：对线程interrupt()的调用happens-before被中断线程检测到中断事件的发生。
8. **对象终结规则**：一个对象的初始化完成（构造函数执行结束）happens-before它的finalize()方法的开始。

## 重要性

Happens-before规则为开发者提供了一种在多线程程序中推理和保证操作顺序和内存可见性的机制。遵循这些规则可以避免并发编程中的竞态条件和内存一致性错误。

## 应用

在Java并发编程中，正确理解和应用happens-before规则是非常重要的。例如，使用volatile修饰符来保证变量的可见性，使用synchronized块或ReentrantLock来确保临界区内操作的原子性和内存可见性，以及合理使用Thread.join()来等待线程结束。

通过遵守这些规则，Java内存模型保证了在不同线程中操作共享数据的正确性和效率。理解happens-before概念对于编写可靠、高效的并发程序至关重要。
