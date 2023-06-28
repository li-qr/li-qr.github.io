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

## Executor

该接口只有一个方法 `execute(Runnable command)` 用于执行提交的 `Runnable` 任务。这个接口的目的是把任务的提交从任务的运行细节中进行解耦，使用者只需要提交任务到执行器，屏蔽了执行器使用线程、进行调度的具体细节。使用了执行器后不需要为每一个任务调用 `new Thread(new RunnableTask()).start()`。

注意，`Executor` 接口不严格限制实现类必须异步执行任务，执行器可以通过直接调用 `r.run()` 在调用线程中运行提交的任务。也就是说提交的任务有可能在一个新线程中执行，有可能在一个线程池中执行，也有可能在调用线程中执行。

JUC 包中提供的实现类同时也都实现了一个功能更丰富的接口 `ExecutorService` 。

`ThreadPoolExecutor` 是一个可扩展的线程池实现类。

`Executors` 工具类为创建不同种类的线程池实现类提供了方便的工厂方法。

提交任务遵循 [Happens-before](/posts/happens-before-order "Happens-before") 顺序

## ExecutorService

属于 Java 中的 Executor 框架。它提供了管理终止和跟踪异步任务进度的方法。ExecutorService 可以被关闭，这将导致它拒绝新的任务。提供了两种不同的方法来关闭ExecutorService 。shutdown 方法允许之前提交的任务在终止之前执行，而 shutdownNow 方法则防止等待任务启动并尝试停止当前正在执行的任务。在终止时，执行器没有任务正在执行，没有任务等待执行，也不能提交新的任务。未使用的 ExecutorService 应该被关闭以允许回收其资源。方法 submit 通过创建并返回可用于取消执行和/或等待完成的 Future 来扩展基本方法Executor.execute(Runnable)。方法 invokeAny 和 invokeAll 执行最常用的批量执行形式，执行一组任务，然后等待至少一个或全部完成。Executors 类提供了工厂方法，用于提供此包中提供的执行器服务。

## AbstractExecutorService

`AbstractExecutorService` 类提供了 `ExecutorService` 执行方法的默认实现。在默认实现的 `submit`、`invokeAny` 和 `invokeAll` 方法中，会把参数 `Runnable` 或 `Callable` 使用过 `newTaskFor` 方法包装成 `RunnableFuture` 对象来运行。

## ThreadPoolExecutor

`ExecutorService` 使用线程池来执行提交的任务，通常使用 `Executors` 工厂方法进行配置。线程池解决了两个不同的问题：当执行大量异步任务时，它们通常提供了更好的性能，因为减少了每个任务调用的开销；同时，它们提供了一种管理资源、线程的方式，以便在执行任务集合时限制和管理这些资源的消耗。每个 `ThreadPoolExecutor`还维护一些基本的统计信息，例如已完成的任务数。为了在广泛的上下文中有用，该类提供了许多可调参数和可扩展性钩子。

然而，更多情况下应该使用更方便的 `Executors` 工厂方法 `Executors.newCachedThreadPool`（无限制线程池，具有自动线程回收），`Executors.newFixedThreadPool`（固定大小线程池）和 `Executors.newSingleThreadExecutor`（单个后台线程），这些方法预配置了最常见的使用场景的设置。

否则，在手动配置和调整此类时，请注意以下问题：

### 线程池的最小和最大线程数量

`ThreadPoolExecutor`将根据 `corePoolSize`和 `maximumPoolSize`设置的边界自动调整池大小（参见 `getPoolSize`）。当在 `execute(Runnable)`方法中提交新任务，并且正在运行的线程少于 `corePoolSize`时，即使其他工作线程处于空闲状态，也将创建一个新线程来处理请求。如果正在运行的线程数大于 `corePoolSize`但小于 `maximumPoolSize`，则仅当队列已满时才会创建新线程。通过将 `corePoolSize`和 `maximumPoolSize`设置为相同的值，可以创建一个固定大小的线程池。通过将 `maximumPoolSize`设置为一个基本上无限制的值，例如 `Integer.MAX_VALUE`，可以允许池容纳任意数量的并发任务。通常，核心和最大池大小仅在构造时设置，但也可以使用 `setCorePoolSize`和 `setMaximumPoolSize`动态更改。

### 按需构建

默认情况下，即使是核心线程，也仅在有新任务到达时才会创建和启动，但是可以使用 `prestartCoreThread`或 `prestartAllCoreThreads`方法动态地覆盖此行为。如果使用非空的任务队列创建线程池，则可能需要预启动线程。

### 如何创建新线程

使用 `ThreadFactory`创建新线程。如果没有另外指定，将使用 `Executors.defaultThreadFactory`，它创建的线程都在同一个 `ThreadGroup`中，并具有相同的 `NORM_PRIORITY`优先级和非守护进程状态。通过提供不同的 `ThreadFactory`，可以更改线程的名称、线程组、优先级、守护进程状态等。如果 `ThreadFactory` 在调用 `newThread` 创建线程时返回 `null` ，则执行程序将继续运行，但可能无法执行任何任务。线程池具有 “modifyThread” 的 `RuntimePermission`。"modifyThread" 它允许修改线程。通常，需要修改线程状态的代码（例如更改线程优先级或中断线程）需要此权限。要将此权限授予 Java 应用程序，您可以将以下行添加到应用程序的安全策略文件中，`grant java.lang.RuntimePermission "modifyThread";`这将允许应用程序在运行时修改线程。但是，授予此权限可能存在风险，因为它允许应用程序潜在地干扰 Java 虚拟机的正常操作。因此，它应该只授予需要它的可信代码。

### Keep-alive

线程池中线程的保活时间。如果池当前有超过 `corePoolSize`个线程，那么如果它们空闲时间超过 `keepAliveTime`（参见 `getKeepAliveTime(TimeUnit)`），则多余的线程将被终止。这提供了一种在池没有活跃时减少资源消耗的方法。如果线程池池稍后变得更加活跃，将构造新线程。可以使用 `setKeepAliveTime(long, TimeUnit)`方法动态更改此参数。使用 `Long.MAX_VALUE TimeUnit.NANOSECONDS` 可以防止线程被回收。默认情况下，仅适用于池内线程个数超过 `corePoolSize` 个线程的情况。但是，`allowCoreThreadTimeOut(boolean)`方法可以用于将此超时策略应用于核心线程，只要 `keepAliveTime`值为非零即可。

### 任务队列

Java中的线程池中的任务队列可以使用任何实现了BlockingQueue接口的队列。线程池的使用与队列的选择有关：

1. 如果正在运行的线程数少于 `corePoolSize`，则执行器始终优先添加新线程而不是排队。
2. 如果正在运行的线程数等于或大于 `corePoolSize`，则执行器始终优先将请求排队而不是添加新线程。
3. 如果无法将请求排队，则创建一个新线程，除非这将超过 `maximumPoolSize`，否则将拒绝该任务。

有三种常见的队列策略：

1. 不排队。对于工作队列来说，SynchronousQueue 是一个很好的默认选择，它将任务直接交给线程而不会保留它们。在这里，如果没有立即可用的线程来运行任务，将构造一个新线程。这种策略避免了处理可能具有内部依赖关系的请求集时出现死锁。直接交接通常需要无限制的 `maximumPoolSizes`，以避免拒绝新提交的任务。命令的平均到达速度比它们可以被处理的速度更快时，可能导致线程无限增长。
2. 无界队列。使用无界队列（例如没有预定义容量的 LinkedBlockingQueue）将导致新任务在所有 `corePoolSize` 线程都忙时等待队列。因此，最多只会创建 `corePoolSize`个线程。（因此，`maximumPoolSize`的值没有作用。）当每个任务完全独立于其他任务时，这可能是适当的，因此任务不能影响彼此的执行。当命令的平均到达速度比它们可以被处理的速度更快时，会导致工作队列无限增长。
3. 有界队列。有界队列（例如ArrayBlockingQueue）有助于在使用有限 `maximumPoolSizes`时防止资源耗尽，但可能更难以调整和控制。队列大小和最大池大小可以相互交换：使用大队列和小池最小化CPU使用率、操作系统资源和上下文切换开销，但可能导致人为降低吞吐量。如果任务经常阻塞（例如，如果它们是I/O绑定的），则系统可能能够为更多线程安排时间，而不是您允许的线程数。使用小队列通常需要更大的池大小，这使CPU更忙碌，但可能会遇到不可接受的调度开销，这也会降低吞吐量。

方法 `getQueue()` 允许访问工作队列，以便进行监视和调试。强烈不建议将此方法用于任何其他目的。当大量排队的任务被取消时，提供了两个方法 `remove(Runnable)` 和 `purge` 来协助存储回收。

### 拒绝策略

在方法 `execute(Runnable)` 中提交的新任务将在执行器已关闭时被拒绝，以及当执行器对最大线程数和工作队列容量都使用有限边界，并且已经饱和时也会被拒绝。在任一情况下，`execute`方法都会调用其RejectedExecutionHandler的 `RejectedExecutionHandler.rejectedExecution(Runnable, ThreadPoolExecutor)`方法。提供了四种预定义的处理程序策略：

1. 在默认的ThreadPoolExecutor.AbortPolicy中，处理程序在拒绝时抛出运行时RejectedExecutionException。
2. 在ThreadPoolExecutor.CallerRunsPolicy中，调用 `execute`的线程本身运行任务。这提供了一个简单的反馈控制机制，可以减缓提交新任务的速率。
3. 在ThreadPoolExecutor.DiscardPolicy中，无法执行的任务将被简单地丢弃。
4. 在ThreadPoolExecutor.DiscardOldestPolicy中，如果执行器没有关闭，则丢弃工作队列头部的任务，然后重试执行（这可能会再次失败，导致重复执行）。

可以定义和使用其他类型的RejectedExecutionHandler类。这样做需要一些小心，特别是当策略仅设计为在特定容量或排队策略下工作时。

### 钩子方法

这个类提供了受保护的可重写的 `beforeExecute(Thread, Runnable)` 和 `afterExecute(Runnable, Throwable)` 方法，它们在每个任务执行之前和之后被调用。这些方法可以用于操作执行环境；例如，重新初始化 ThreadLocals、收集统计信息或添加日志。此外，可以重写方法 `terminated` 来执行任何需要在执行器完全终止后完成的特殊处理。
如果钩子或回调方法抛出异常，内部工作线程可能会失败并突然终止。

### 析构

如果一个线程池在程序中不再被引用，并且没有剩余的线程，它将自动关闭。如果您希望确保即使用户忘记调用shutdown，未引用的线程池也会被回收，那么您必须通过设置适当的 Keep-alive Time、设置 0 个 `corePoolSize` 或设置 `allowCoreThreadTimeOut(boolean)` 来确保未使用的线程会被回收。
