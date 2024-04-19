---
title: JDK源码rt.jar中java.util.concurrent.locks包拆解
categories:
- jdk8
- rt.jar
- java
- util
- concurrent
- locks
description: JDK源码rt.jar中java.util.concurrent.locks包拆解、详解
permalink: "/posts/jdk-rt-jar-java-util-concurrent-lock"
excerpt: AbstractOwnableSynchronizer、AbstractQueuedLongSynchronizer、AbstractQueuedSynchronizer、ReadWriteLock、Lock、Condition
---
基于 jdk8 [https://docs.oracle.com/javase/8/docs/api/index.html](https://docs.oracle.com/javase/8/docs/api/index.html)

## 概览

![概览](/assets/images/java-util-concurrent-locks/java-util-concurrent-locks.svg)

# AbstractOwnableSynchronizer

用于表示被线程独占的同步器，保存了独占该同步器的线程。

# AbstractQueuedSynchronizer

提供了用于实现阻塞锁或者基于此实现的同步器的框架。使用 FIFO 队列管理抢占锁的线程。AQS 使用一个 int 值来表示锁状态，且实现了所有锁排队和阻塞的机制。实现类只需要根据自己的需要更新锁状态，来表示同步状态。

AQS **提供了统一的锁同步机制**，每种锁不需要重复的造轮子，**减少了代码的复杂度和维护成本**；AQS 使用队列来管理阻塞线程，**优化了性能和资源管理**；还支持条件变量、共享模式、独占模式等**高级同步特性**；AQS的存在**促进了Java并发编程的发展**，它为开发者提供了构建可靠并发应用的工具。许多高级同步组件，如 `ReentrantLock`、`Semaphore`、`CountDownLatch`和 `FutureTask`都是基于AQS实现的。

要实现AQS，请根据需要通过使用 `getState`、`setState`和/或 `compareAndSetState`检查和/或修改同步状态，重新定义以下方法：

* `tryAcquire`
* `tryRelease`
* `tryAcquireShared`
* `tryReleaseShared`
* `isHeldExclusively`

这些方法默认情况下都会抛出 `UnsupportedOperationException`。这些方法的实现必须是内部线程安全的，并且通常应该简短且不阻塞。定义这些方法是使用此类的唯一支持方式。所有其他方法都声明为final，因为它们不能独立变化。
