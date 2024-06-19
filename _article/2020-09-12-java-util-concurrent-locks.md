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

## 锁获取和释放

### acquire

`AbstractQueuedSynchronizer`（AQS）的 `acquire` 方法是一个模板方法，它依赖于子类去实现 `tryAcquire`方法以提供具体的获取锁逻辑。当获取锁失败，也就是 `tryAcquire` 返回 false 时。进行排队阻塞流程。

创建一个 EXCLUSIVE 独占节点，通过 for 循环和 `compareAndSet` 操作追加到等待队列的队尾。 AQS 是保证等待队列向前遍历的准确性的，这也是为什么再唤醒等待线程时，会从尾节点往前循环查找。

成功进入等待队列后，就进入了阻塞流程。会在一个新的 for 循环中完成 **清理前面所有失效的节点**；**设置 prev 节点的状态为 SIGNAL(这样才会被 unpark )**；**`park` 阻塞**；**记录中断信号**；**恢复执行** 这 5 个动作。

```java
private Node addWaiter(Node mode) {
    Node node = new Node(Thread.currentThread(), mode);
    Node pred = tail;
    if (pred != null) {
        node.prev = pred;
        if (compareAndSetTail(pred, node)) {
            pred.next = node;
            return node;
        }
    }
    enq(node);
    return node;
}
//在 for 循环中执行上面方法中的过程，单独提取出来只不过是增加了初始化的代码。
private Node enq(final Node node) {
    for (;;) {
        Node t = tail;
        if (t == null) {
            if (compareAndSetHead(new Node()))
                tail = head;
        } else {
            node.prev = t;
            if (compareAndSetTail(t, node)) {//所有争抢中的线程都会设置 node.prev=t ，但是只有一个线程能够成功设置 tail 节点，然后设置 t.next=node。争抢 tail 失败的节点会循环这个过程。
                t.next = node;
                return t;
            }
        }
    }
}
```

### release

如果子类实现的 `tryRelease` 方法返回成功，就开始唤醒后面的等待节点。首先重置当前节点的 `waitStatus` 为默认值 0 。然后如果 `next` 节点不为空且未被取消接直接 `unpark` 。否则从 `tail` 节点往前遍历找到第一个 `waitStatus<=0` 的节点进行 `unpark` 。

### acquireShared

于 `acqiure` 的不同是，在共享模式获取到锁后，如果 `next` 节点不是独占锁会调用 `doReleaseShared` 方法，这个方法在 `releaseShared` 中进行介绍。

`next` 节点可以是 null 或者共享锁，null 是为了处理并发情况下的极端情况。请注意即使后续节点最终是个独占锁，会被唤醒，但是因为无法成功获取锁会再次进入阻塞，所以没有影响

至于为什么共享锁要在获取锁之后向后唤醒，因为 AQS 的设计是等待前一个节点，当前一个节点资源释放后向后唤醒。而共享资源允许多个线程同时获取资源，这里如果再等到释放资源按顺序唤醒会影响后续节点获取共享资源的效率，所以当有 1 个线程获取到共享资源时，会同时唤醒等待队列中的所有正在等待共享资源的后继节点。

### releaseShared

在共享锁释放成功后，会调用 `doReleaseShared` 方法，`acquireShared` 也会调用 `doReleaseShared` 。

在 for 循环中完成两个事情，如果后续节点需要唤醒（`head` 节点状态是 SIGNAL），就调用 `unparkSuccessor` 进行唤醒，同 `release`；如果 head 节点的状态是默认状态 0，说明当前处于一个并发的中间态，需要把 head 状态设置为 PROPAGATE。

PROPAGATE 状态的作用在 [《AQS 中 Node.PROPAGATE 状态引入的意义》](https://yangsanity.me/2022/06/11/AQS-PROPAGATE/) 这篇文章中总结的很详细。具体引入原因是 Semaphore 当中会触发无法唤醒的 bug。

for 循环退出的条件是 head 节点没有被重新设置。这种情况就是没有后续节点了，或者后续节点遇到了独占锁，无法完成获取锁、设置 head 节点的逻辑。

```java
private void doReleaseShared() {
    for (;;) {
        Node h = head;
        if (h != null && h != tail) {
            int ws = h.waitStatus;
            if (ws == Node.SIGNAL) {
                if (!compareAndSetWaitStatus(h, Node.SIGNAL, 0))
                    continue;            // loop to recheck cases
                unparkSuccessor(h);
            }
            else if (ws == 0 &&
                        !compareAndSetWaitStatus(h, 0, Node.PROPAGATE))
                continue;                // loop on failed CAS
        }
        if (h == head)                   // loop if head changed
            break;
    }
}
```

## Condition 条件等待和通知

Condition 是 AbstractQueuedSynchroizer 的内部非静态类，也就是创建 Condition 实例需要依附于一个 AbctractQueuedSynchroizer 实例才可以。并且 Condition 可以操作和使用 AbctractQueuedSynchroizer 实例的内部状态。基于这点属性，Condition 的作用就是在同一个临界资源的完整的 AbctractQueuedSynchroizer 锁周期内实现条件等待和唤醒能力，而减少使用锁的复杂度，同时提供更灵活的条件等待控制。

如果不使用 Condition ，只能到需要等待条件的位置释放锁，然后再手动阻塞等待，在被唤醒后重新获取锁。

同一个 AbstractQueuedSynchroizer 实例可以关联多个 Condition 实例。每个 Condition 实例内部又单独维护了一套自己的条件等待队列。Condition 的等待和唤醒，就是把 AbstractQueuedSynchroizer 锁队列的节点移动到自己的条件等待队列中 `park` 等待，然后把自己内部条件等待队列的节点恢复到 AbstractQueuedSynchroizer 的锁队列中 `unpark` 唤醒重新抢占锁。

### await

创建一个 CONDITION 节点添加到这个 Condition 实例的条件队列中，然后释放锁，`park` 等待直到被 `signal` 通知唤醒。被唤醒后重新 `acquireQueued` 获取锁（根据 `acquire` 流程，还会 `park` 阻塞直到获取到锁）。

### signal

把 Condition 条件队列中的 `firstWaiter` 节点移动到 AQS 的锁队列中，然后唤醒这个节点的线程。让这个线程去抢占锁，当然如果抢占失败会阻塞，这个流程和 `acquire` 是一样的。

### signalAll

从 `firstWaiter` 开始循环到 `lastWaiter` ，依次把所有的条件等待节点移动到 AQS 的锁队列中，并进行唤醒。

# ReentrantReadWriteLock

可以划分为顶层和底层。顶层是锁的实现，提供锁获取释放能力。底层是 AbstractQueuedSynchronizer 实现，提供队列等待、唤醒机制。

## tryAcquire

只有读写锁都空闲，或当前的写锁是被本线程获取（锁重入），可以获取到锁。当读锁被持有，或者写锁被其他线程持有，则获取失败。

```java
 final boolean tryAcquire(int acquires) {
    Thread current = Thread.currentThread();
    int c = getState();
    int w = exclusiveCount(c);
    if (c != 0 ){ //当前锁有抢占
        // (Note: if c != 0 and w == 0 then shared count != 0)
        if (w == 0 || current != getExclusiveOwnerThread())//如果锁被读持有，或者被非本线程持有读锁
            return false;
        if (w + exclusiveCount(acquires) > MAX_COUNT)
            throw new Error("Maximum lock count exceeded");
        // Reentrant acquire
        setState(c + acquires);
        return true;
    }
    if (writerShouldBlock() ||//公平锁：等待队列空才能获取 非公平锁：可直接获取
        !compareAndSetState(c, c + acquires))
        return false;
    setExclusiveOwnerThread(current);
    return true;
}
```

## tryRelease

减少写锁重入计数。如果计数减少到 0，就彻底释放锁，AQS 触发唤醒后续等待节点。具体的实现是，1：写锁的计数归 0；2：移除 AQS 的 `exclusiveOwnerThread`，这个线程用于判断写锁是否可以重入。

```java
protected final boolean tryRelease(int releases) {
    if (!isHeldExclusively())
        throw new IllegalMonitorStateException();
    int nextc = getState() - releases;
    boolean free = exclusiveCount(nextc) == 0;
    if (free)
        setExclusiveOwnerThread(null);
    setState(nextc);
    return free;
}
```

## tryAcquireShared

获取到读锁后，会记录当前线程重复获取读锁的次数。这个次数被存储在两个地方，一个是 ThreadLocal 类型的 `readHolds` 变量存储所有读锁信息。还有一个缓存变量 `cachedHoldCounter` 存储最后一次获取读锁的线程的数量。这样可以在高并发情况下减少对 ThreadLocal 的方法次数，因为 ThreadLocal 的实现也是 Map，在高平发下查找也是会影响到效率的。

这段注释是对 `tryAcquireShared`方法的步骤说明，解释了该方法如何尝试获取共享锁（读锁）。具体步骤如下：

1. **检查写锁状态：** 如果写锁被另一个线程持有，则当前线程尝试获取读锁会失败。这是因为写锁是排他的，一旦被一个线程获取，其他线程无法获取读锁或写锁，直到写锁被释放。
2. **检查当前线程是否符合获取锁的条件：** 如果当前线程符合获取读锁的条件（即没有其他线程持有写锁），则进一步检查当前线程是否应该因为队列策略而阻塞。如果不需要阻塞，尝试通过CAS（比较并交换）操作更新状态并增加读锁计数。这一步没有检查重入获取的情况，即一个已经持有读锁的线程再次尝试获取读锁，这种情况的检查被推迟到完整版本中，以避免在更典型的非重入情况下需要检查持有计数。
3. **重试或失败：** 如果第2步因为线程不符合条件、CAS操作失败或读锁计数达到最大值而失败，则转到带有完整重试循环的版本尝试获取锁。这意味着如果初次尝试获取读锁失败，会有一个更复杂的逻辑来处理重试，直到成功获取读锁或最终确定无法获取。

这个过程确保了在多线程环境中，读锁的获取是公平的，并且遵循特定的队列策略，同时也考虑到了性能，通过减少在典型情况下的检查来提高效率。

```java
protected final int tryAcquireShared(int unused) {
    Thread current = Thread.currentThread();
    int c = getState();
    if (exclusiveCount(c) != 0 &&
        getExclusiveOwnerThread() != current)
        return -1;
    int r = sharedCount(c);
    if (!readerShouldBlock() &&
        r < MAX_COUNT &&
        compareAndSetState(c, c + SHARED_UNIT)) {
        if (r == 0) {
            firstReader = current;
            firstReaderHoldCount = 1;
        } else if (firstReader == current) {
            firstReaderHoldCount++;
        } else {
            HoldCounter rh = cachedHoldCounter;
            if (rh == null || rh.tid != getThreadId(current))
                cachedHoldCounter = rh = readHolds.get();
            else if (rh.count == 0)
                readHolds.set(rh);
            rh.count++;
        }
        return 1;
    }
    return fullTryAcquireShared(current);
}
```

这段描述解释了为什么 `fullTryAcquireShared`方法与 `tryAcquireShared`方法在一定程度上存在重复代码，但同时也指出了 `fullTryAcquireShared`方法的设计选择是为了简化整体逻辑，避免在 `tryAcquireShared`方法中处理重试和延迟读取持有计数之间的复杂交互。

具体来说：

- **重复的原因：** `fullTryAcquireShared`方法处理了 `tryAcquireShared`未能处理的情况，包括CAS操作失败和重入读取。由于这两个方法都需要执行相似的检查和操作（例如，检查写锁状态、更新读锁计数等），因此它们之间存在一定程度的代码重复。
- **简化逻辑：** 尽管存在重复，但这种设计选择是为了简化 `tryAcquireShared`方法的逻辑。`tryAcquireShared`方法专注于处理最典型的非重入获取读锁的情况，而没有涉及到重试逻辑和处理重入读取的复杂性。这样，`tryAcquireShared`方法可以保持相对简单和高效。
- **避免复杂交互：** 在 `tryAcquireShared`方法中直接处理重试和延迟读取持有计数可能会导致逻辑变得复杂和难以理解。通过将这部分逻辑分离到 `fullTryAcquireShared`方法中，可以更清晰地管理这些复杂的交互，同时也使得代码更容易维护和理解。

总的来说，这种设计策略允许 `tryAcquireShared`方法保持高效和简洁，而 `fullTryAcquireShared`方法则处理更复杂的情况，如重试和重入读取。这样的分离使得整体代码更加清晰，同时也提高了代码的可维护性和可读性。

```java
final int fullTryAcquireShared(Thread current) {
            /*
             * This code is in part redundant with that in
             * tryAcquireShared but is simpler overall by not
             * complicating tryAcquireShared with interactions between
             * retries and lazily reading hold counts.
             */
            HoldCounter rh = null;
            for (;;) {
                int c = getState();
                if (exclusiveCount(c) != 0) {
                    if (getExclusiveOwnerThread() != current)
                        return -1;
                    // else we hold the exclusive lock; blocking here
                    // would cause deadlock.
                } else if (readerShouldBlock()) {
                    // Make sure we're not acquiring read lock reentrantly
                    if (firstReader == current) {
                        // assert firstReaderHoldCount > 0;
                    } else {
                        if (rh == null) {
                            rh = cachedHoldCounter;
                            if (rh == null || rh.tid != getThreadId(current)) {
                                rh = readHolds.get();
                                if (rh.count == 0)
                                    readHolds.remove();
                            }
                        }
                        if (rh.count == 0)
                            return -1;
                    }
                }
                if (sharedCount(c) == MAX_COUNT)
                    throw new Error("Maximum lock count exceeded");
                if (compareAndSetState(c, c + SHARED_UNIT)) {
                    if (sharedCount(c) == 0) {
                        firstReader = current;
                        firstReaderHoldCount = 1;
                    } else if (firstReader == current) {
                        firstReaderHoldCount++;
                    } else {
                        if (rh == null)
                            rh = cachedHoldCounter;
                        if (rh == null || rh.tid != getThreadId(current))
                            rh = readHolds.get();
                        else if (rh.count == 0)
                            readHolds.set(rh);
                        rh.count++;
                        cachedHoldCounter = rh; // cache for release
                    }
                    return 1;
                }
            }
        }
```

## tryReleaseShared

ReentrantReadWriteLock 使用 `firstReader` 缓存了第一个获取读锁的线程，用 `firstReaderHoldCount` 缓存了第一个获取锁的线程锁重入次数。使用 `cachedHoldCounter` 缓存了最后一个获取读锁的线程及其重入次数。使用 `readHolds` 存储了当前所有获取读锁的线程及其重入次数。

当线程调用 `tryReleaseShared` 时，会减少该线程对应的计数，以及减少读锁总重入次数的计数。当所有读锁都归 0 时。返回 true，这时 AQS 会触发唤醒后续等待节点。

```java
protected final boolean tryReleaseShared(int unused) {
    Thread current = Thread.currentThread();
    if (firstReader == current) {
        // assert firstReaderHoldCount > 0;
        if (firstReaderHoldCount == 1)
            firstReader = null;
        else
            firstReaderHoldCount--;
    } else {
        HoldCounter rh = cachedHoldCounter;
        if (rh == null || rh.tid != getThreadId(current))
            rh = readHolds.get();
        int count = rh.count;
        if (count <= 1) {
            readHolds.remove();
            if (count <= 0)
                throw unmatchedUnlockException();
        }
        --rh.count;
    }
    for (;;) {
        int c = getState();
        int nextc = c - SHARED_UNIT;
        if (compareAndSetState(c, nextc))
            // Releasing the read lock has no effect on readers,
            // but it may allow waiting writers to proceed if
            // both read and write locks are now free.
            return nextc == 0;
    }
}
```

# ReentractLock

ReentractLock 相对简单，获取锁的时候如果当前锁没有被持有就直接更新 `state`，如果锁被当前线程持有就增加 `state` 计数。公平锁会判断锁队列不空的话就等待，非公平锁就直接设置 `state`。

释放锁会减少 `state` 计数，如果计数归零就删除锁中记录的线程。

# StampedLock

这个锁是一个单独的实现，没有使用 AQS，也没有实现 Lock 接口。JDK 1.5 引入的 AQS 和 ReentrantReadWriteLock ，而在 JDK 1.8 引入的此类。旨在一些小众特殊场景进行使用。

这个锁的特点是读锁可以支持乐观锁，以及锁可以读锁和写锁之间进行升降级。这样的好处是在明显的读多写少的情况，可以避免锁抢占和阻塞造成的线程上下文切换，但是其乐观锁由于不加锁，而是通过校验锁标记判断资源是否发生改变，也存在大面积读最后都失效的影响，数据一致性要求极高的场景下需要谨慎使用，因为在读取过程中数据可能被修改。
