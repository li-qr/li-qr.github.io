---
title: JDK源码rt.jar中java.util.concurrent包拆解
categories:
- jdk8
- rt.jar
- java
- util
- concurrent
description: JDK源码rt.jar中java.util.concurrent包拆解、详解
permalink: "/posts/jdk-rt-jar-java-util-concurrent"
excerpt: Executor、ExecutorService、ScheduledExecutorService、AbstractExecutorService、BlockingQueue、RejectedExecutionHandler、ConcurrentMap、SortedMap、AbstractList、AbstractSet
---
基于 jdk8 [https://docs.oracle.com/javase/8/docs/api/index.html](https://docs.oracle.com/javase/8/docs/api/index.html)

## 概览

![概览](../assets/images/java-util-concurrent/java-util-concurrent.svg)

## Executor interface

该接口只有一个方法 `execute(Runnable command)` 用于执行提交的 `Runnable` 任务。这个接口的目的是把任务的提交从任务的运行细节中进行解耦，使用者只需要提交任务到执行器，屏蔽了执行器使用线程、进行调度的具体细节。使用了执行器后不需要为每一个任务调用 `new Thread(new RunnableTask()).start()`。

注意，`Executor` 接口不严格限制实现类必须异步执行任务，执行器可以通过直接调用 `r.run()` 在调用线程中运行提交的任务。

JUC 包中提供的实现类同时也都实现了一个功能更丰富的接口 `ExecutorService` 。

`ThreadPoolExecutor` 是一个可扩展的线程池实现类。

`Executors` 工具类为创建不同种类的线程池实现类提供了方便的工厂方法。
