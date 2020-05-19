---
title: Kafka权威指南摘要
categories:
- ZooKeeper
- JAVA
- 分布式
description: Kafka权威指南摘要
permalink: "/posts/kafka-the-definitive-guide"
excerpt: 内容全部源自《Kafka权威指南》，取自里面的重点内容摘要。包括为什么选择kafka、控制器、存储等。
---

# 初识Kafka

## 发布与订阅消息系统

数据（消息）的发送者不会直接把消息发送给接收者。发布者以某种方式对消息进行分类，接收者订阅他们以便接收特定类型的消息。发布与订阅系统一般会有一个broker，也就是发布消息的中心点。

如果每个发布者都直接与订阅者通信，当项目复杂之后将形成一张庞大的不可维护的通信网络。这时就需要独立的队列系统。

### 主题和分区

Kafka 的消息通过主题进⾏分类。主题可以被分 为若⼲个分区，⼀个分区就是⼀个提交⽇志。消息以追加的⽅式写⼊分区。⽆法在整个主题范围内保证消息的顺序，但可以保证消息在单个分区内的顺序。Kafka 通过分区来实现数据冗余和伸缩性。分区可以分布在不同的服务器上，也就是说，⼀个主题可以横跨多个服务器，以此来提供⽐单个服务器更强⼤的性能。

![包含多个分区的主题表⽰](/assets/images/b7022229-6a90-4d5a-8a99-551634c32e50.png)

### 生产者和消费者

kafka贡献给apache之前包名以kafka.开头。贡献给apache之后包名以org.apahce.kafka.开头

Kafka 的客户端就是 Kafka 系统的⽤户，它们被分为两种基本类型：⽣产者和消费者。除此之外，还有其他⾼级客户端 API——⽤于数据集成的 Kafka Connect API 和⽤于流式处理的 Kafka Streams。

⽣产者创建消息。⽣产者在默认情况下把消息均衡地分布到主题的所有分区上，在某些情况下，⽣产者会把消息直接写到指定的分区。这通常是通过消息键和分区器来实现的，分区器为键⽣成⼀个散列值，并将其映射到指定的分区上。这样可以保证包含同⼀个键的消息会被写到同⼀个分区上。⽣产者也可以使⽤⾃定义的分区器，根据不同的业务规则将消息映射到分区。

消费者读取消息。消费者订阅⼀个或多个主题，并按照消息⽣成的顺序读取它们。消费者通过检查消息的偏移量来区分已经读取过的消息。偏移量是另⼀种元数据，它是⼀个不断递增的整数值，在创建消息时，Kafka会把它添加到消息⾥。在给定的分区⾥，每个消息的偏移量都是唯⼀的。消费者把每个分区最后读取的消息偏移量保存在 Zookeeper 或 Kafka 上，如果消费者关闭或重启，它的读取状态不会丢失。

消费者是消费者群组的⼀部分，也就是说，会有⼀个或多个消费者共同读取⼀个主题。群组保证每个 分区只能被⼀个消费者使⽤。消费者与分区之间的映射通常被称为消费者对分区的所有权关系。

![消费者群组从主题读取消息](/assets/images/761ba8b8-440a-4837-8c9a-48d024543f93.png)

### broker和集群

⼀个独⽴的 Kafka 服务器被称为 broker。broker 接收来⾃⽣产者的消息，为消息设置偏移量，并提交消息到磁盘保存。broker 为消费者提供服务，对读取分区的请求作出响应，返回已经提交到磁盘上的消息。

每个集群都有⼀个 broker 同时充当了集群控制器的⾓⾊（⾃动从集群的活跃成员中选举出来）。控制器负责管理⼯作，包括将分区分配给 broker 和监控 broker。在集群中，⼀个分区从属于⼀个 broker，该 broker 被称为分区的⾸领。⼀个分区可以分配给多个 broker， 这个时候会发⽣分区复制。这种复制机制为分区提供了消息冗余，如果有⼀个 broker 失效，其他 broker 可以接管领导权。不过，相关的消费者和⽣产者都要重新连接到新的⾸领。

![集群里的分区复制](/assets/images/865cd464-1e80-4ccb-a94c-7eb4440d5dd6.png)

Kafka broker 默认的消息过期删除策略可以按时间或大小。Kafka的多集群复制不完善。

## 为什么选择Kafka

1. 可以支持多个生产者
2. 支持多个消费者且互不影响
3. 基于磁盘的数据存储，允许消息回溯和积压
4. 灵活的可伸缩性
5. 通过横向扩展拥有高性能

# Kafka配置

## broker

### broker.id

每个 broker 都需要有⼀个标识符，使⽤ broker.id 来表⽰。它的默认值是 0，也可以被设置成其他任意整数。这个值在整个 Kafka 集群⾥必须是唯⼀的。

### port

默认9092

###  zookeeper.connect

⽤于保存 broker 元数据的 Zookeeper 地址是通过 zookeeper.connect 来指定的。

### log.dirs

Kafka 把所有消息都保存在磁盘上，存放这些⽇志⽚段的⽬录是通过 log.dirs 指定的。它是⼀组⽤逗号分隔的本地⽂件系统路径。如果指定了多个路径，那么 broker 会根据“最少使⽤”原则， 把同⼀个分区的⽇志⽚段保存到同⼀个路径下。要注意，broker 会往拥有最少数⽬分区的路径新增分区，⽽不是往拥有最⼩磁盘空间的路径新增分区。

### num.recovery.threads.per.data.dir

对于如下 3 种情况，Kafka 会使⽤可配置的线程池来处理⽇志⽚段： 

+ 服务器正常启动，⽤于打开每个分区的⽇志⽚段； 
+ 服务器崩溃后重启，⽤于检查和截短每个分区的⽇志⽚段； 
+ 服务器正常关闭，⽤于关闭⽇志⽚段。 

默认情况下，每个⽇志⽬录只使⽤⼀个线程。因为这些线程只是在服务器启动和关闭时会⽤到， 所以完全可以设置⼤量的线程来达到并⾏操作的⽬的。特别是对于包含⼤量分区的服务器来说， ⼀旦发⽣崩溃，在进⾏恢复时使⽤并⾏操作可能会省下数⼩时的时间。设置此参数时需要注意， 所配置的数字对应的是 log.dirs 指定的单个⽇志⽬录。也就是说，如果
num.recovery.threads.per.data.dir 被设为 8，并且 log.dir 指定了 3 个路径，那么 总共需要 24 个线程。

### auto.create.topics.enable

默认情况下，Kafka 会在如下⼏种情形下⾃动创建主题： 

+ 当⼀个⽣产者开始往主题写⼊消息时； 
+ 当⼀个消费者开始从主题读取消息时； 
+ 当任意⼀个客户端向主题发送元数据请求时。 

很多时候，这些⾏为都是⾮预期的。⽽且，根据 Kafka 协议，如果⼀个主题不先被创建，根本⽆法知道它是否已经存在。如果显式地创建主题，不管是⼿动创建还是通过其他配置系统来创建， 都可以把 auto.create.topics.enable 设为 false。

### num.partitions

num.partitions 参数指定了新创建的主题将包含多少个分区。如果启⽤了主题⾃动创建功能，主题分区的个数就是该参数指定的值。该参数的默认值是 1。要注意， 我们可以增加主题分区的个数，但不能减少分区的个数。所以，如果要让⼀个主题的分区个数少于 num.partitions 指定的值，需要⼿动创建该主题。

### log.retention.ms

Kafka 通常根据时间来决定数据可以被保留多久。默认使⽤ log.retention.hours 参数来配置时间，默认值为 168 ⼩时，也就是⼀周。除此以外，还有其他两个参数 log.retention.minutes 和 log.retention.ms。这 3 个参数的作⽤是⼀样的，都是决定消息多久以后会被删除，不过还是推荐使⽤ log.retention.ms。如果指定了不⽌⼀个参数， Kafka 会优先使⽤具有最⼩值的那个参数。

根据时间保留数据是通过检查磁盘上⽇志⽚段⽂件的最后修改时间来实现的。⼀般来说，最 后修改时间指的就是⽇志⽚段的关闭时间，也就是⽂件⾥最后⼀个消息的时间戳。不过，如 果使⽤管理⼯具在服务器间移动分区，最后修改时间就不准确了。时间误差可能导致这些分 区过多地保留数据。

### log.retention.bytes

另⼀种⽅式是通过保留的消息字节数来判断消息是否过期。它的值通过参数 log.retention.bytes 来指定，作⽤在每⼀个分区上。也就是说，如果有⼀个包含 8 个分区 的主题，并且 log.retention.bytes 被设为 1GB，那么这个主题最多可以保留 8GB 的数 据。所以，当主题的分区个数增加时，整个主题可以保留的数据也随之增加。

如果同时指定了 log.retention.bytes 和 log.retention.ms（或者另⼀个时间参数），只要任意⼀个条件得到满⾜，消息就会被删除。

### log.segment.bytes

以上的设置都作⽤在⽇志⽚段上，⽽不是作⽤在单个消息上。当消息到达 broker 时，它们被追加到分区的当前⽇志⽚段上。当⽇志⽚段⼤⼩达到 log.segment.bytes 指定的上限（默认是 1GB）时，当前⽇志⽚段就会被关闭，⼀个新的⽇志⽚段被打开。如果⼀个⽇志⽚段被关闭，就 开始等待过期。这个参数的值越⼩，就会越频繁地关闭和分配新⽂件，从⽽降低磁盘写⼊的整体效率。

如果⼀个主题每天只接收 100MB 的消息，⽽ log.segment.bytes 使⽤默认设置，那么需要 10 天时间才能填满⼀个⽇志⽚段。因为在⽇志⽚段被关闭之前消息是不会过期的，所以如果过期时间设置为7天，那么⽇志⽚段最多需要 17 天才 会过期。 这是因为关闭⽇志⽚段需要 10 天的时间，⽽根据配置的过期时间，还需要再保留 7 天时间（要 等到⽇志⽚段⾥的最后⼀个消息过期才能被删除）。

在使⽤时间戳获取⽇志偏移量时，Kafka 会检查分区⾥最后修改时间⼤于指定时间戳的⽇志⽚段（已经被关闭的），该⽇志⽚段的前⼀个⽂件的最后修改时间⼩于指定时间戳。然后，Kafka 返回该⽇志⽚段（也就是⽂件名）开头的偏移量。对于使⽤时间戳获取偏移量的操作来说，⽇志⽚段越⼩，结果越准确。

### log.segment.ms

另⼀个可以控制⽇志⽚段关闭时间的参数是 log.segment.ms，它指定了多⻓时间之后⽇志⽚段会被关闭。

### message.max.bytes

broker 通过设置 message.max.bytes 参数来限制单个消息的⼤⼩，默认值是 1 000 000，也就是1MB。如果⽣产者尝试发送的消息超过这个⼤⼩，不仅消息不会被接收，还会收到 broker 返回的错误信息。

消费者客户端设置的 fetch.message.max.bytes 必须与服务器端设置的消息⼤⼩进⾏协 调。如果这个值⽐ message.max.bytes ⼩，那么消费者就⽆法读取⽐较⼤的消息，导致出现消费者被阻塞的情况。在为集群⾥的 broker 配置 replica.fetch.max.bytes 参数时，也遵循同样的原则。

## Kafka集群

![⼀个简单的 Kafka 集群](/assets/images/cbd05564-f9f2-4517-8473-edc78b47c811.png)

# 生产者

## 概览

![Kafka生产者组件图](/assets/images/1dc4b5db-7a4d-4ab5-9088-b6e25e310173.png)

我们从创建⼀个 ProducerRecord 对象开始，ProducerRecord 对象需要包含⽬标主题和要发送的内容。我们还可以指定键或分区。在发送 ProducerRecord 对象时，⽣产者要先把键和值对象序列化 成字节数组，这样它们才能够在⽹络上传输。 

接下来，数据被传给分区器。如果之前在 ProducerRecord 对象⾥指定了分区，那么分区器就不会再做任何事情，直接把指定的分区返回。如果没有指定分区，那么分区器会根据 ProducerRecord 对象的键来选择⼀个分区。选好分区以后，⽣产者就知道该往哪个主题和分区发送这条记录了。紧接着， 这条记录被添加到⼀个记录批次⾥，这个批次⾥的所有消息会被发送到相同的主题和分区上。有⼀个
独⽴的线程负责把这些记录批次发送到相应的 broker 上。 

服务器在收到这些消息时会返回⼀个响应。如果消息成功写⼊ Kafka，就返回⼀个 RecordMetaData 对象，它包含了主题和分区信息，以及记录在分区⾥的偏移量。如果写⼊失败， 则会返回⼀个错误。⽣产者在收到错误之后会尝试重新发送消息，⼏次之后如果还是失败，就返回错 误信息。

## 创建生产者

### bootstrap.servers

该属性指定 broker 的地址清单，地址的格式为 host:port。清单⾥不需要包含所有的 broker 地址，⽣产者会从给定的 broker ⾥查找到其他 broker 的信息。

### key.serializer

broker 希望接收到的消息的键和值都是字节数组。⽣产者接⼝允许使⽤参数化类型，因此可以把 Java 对象作为键和值发送给 broker。key.serializer 必须被设置为⼀个实现了 org.apache.kafka.common.serialization.Serializer 接⼝的类，⽣产者会使⽤这个类把键对象序列化成字节数组。Kafka 客户端默认提供了 ByteArraySerializer、StringSerializer 和 IntegerSerializer，因此，如果你只使⽤常⻅的⼏种 Java 对象类型，那么就没必要实现⾃⼰的序列化器。要注意，key.serializer 是必须设置的，就算你打算只发送值内容。

### value.serializer

与 key.serializer ⼀样，value.serializer 指定的类会将值序列化。如果键和值都是字 符串，可以使⽤与 key.serializer ⼀样的序列化器。如果键是整数类型⽽值是字符串，那么需要 使⽤不同的序列化器。

### acks

acks 参数指定了必须要有多少个分区副本收到消息，⽣产者才会认为消息写⼊是成功的。

如果 acks=0，⽣产者在成功写⼊消息之前不会等待任何来⾃服务器的响应。 

如果 acks=1，只要集群的⾸领节点收到消息，⽣产者就会收到⼀个来⾃服务器的成功响应。如果消息⽆法到达⾸领节点，⽣产者会收到⼀个错误响应。

如果 acks=all，只有当所有参与复制的节点全部收到消息时，⽣产者才会收到⼀个来⾃服务器的成功响应。

###  buffer.memory

该参数⽤来设置⽣产者内存缓冲区的⼤⼩，⽣产者⽤它缓冲要发送到服务器的消息。如果应⽤程序发送消息的速度超过发送到服务器的速度，会导致⽣产者空间不⾜。这个时候， send() ⽅法 调⽤要么被阻塞，要么抛出异常，取决于如何设置 block.on.buffer.full 参数（在 0.9.0.0 版本⾥被替换成了 max.block.ms，表⽰在抛出异常之前可以阻塞⼀段时间）。

### compression.type

默认情况下，消息发送时不会被压缩。该参数可以设置为 snappy、gzip 或 lz4，它指定了消息 被发送给 broker 之前使⽤哪⼀种压缩算法进⾏压缩。

### retries

retries 参数的值决定了⽣产者可以重发消息的次数，如果达到这个次数，⽣产者会放弃重试并返回错误。默认情况下，⽣产者会在每次重试之间等待 100ms，不过可以通过
retry.backoff.ms 参数来改变这个时间间隔。

### batch.size

当有多个消息需要被发送到同⼀个分区时，⽣产者会把它们放在同⼀个批次⾥。该参数指定了⼀个批次可以使⽤的内存⼤⼩，按照字节数计算。当批次被填满，批次⾥的所有消息会被发送出去。不过⽣产者并不⼀定都会等到批次被填满才发送，半满的批次，甚⾄只包含⼀个消息的批次也有可能被发送。所以就算把批次⼤⼩设置得很⼤，也不会造成延迟，只是会占⽤更多的内存⽽已。但如果设置得太⼩，因为⽣产者需要更频繁地发送消息，会增加⼀些额外的开销。

### linger.ms

该参数指定了⽣产者在发送批次之前等待更多消息加⼊批次的时间。KafkaProducer 会在批次 填满或 linger.ms 达到上限时把批次发送出去。

### client.id

该参数可以是任意的字符串，服务器会⽤它来识别消息的来源，还可以⽤在⽇志和配额指标⾥。

### max.in.flight.requests.per.connection

该参数指定了⽣产者在收到服务器响应之前可以发送多少个消息。它的值越⾼，就会占⽤越多的 内存，不过也会提升吞吐量。把它设为 1 可以保证消息是按照发送的顺序写⼊服务器的，即使发 ⽣了重试。

### timeout.ms、request.timeout.ms 和 metadata.fetch.timeout.ms

request.timeout.ms 指定了⽣产者在发送数据时等待服务器返回响应的时间，metadata.fetch.timeout.ms 指定了⽣产者在获取元数据（⽐如⽬标分区的⾸领是谁）时等待服务器返回响应的时间。如果等待响应超时，那么⽣产者要么重试发送数据，要么返回⼀个错误（抛出异常或执⾏回调）。timeout.ms 指定了 broker 等待同步副本返回消息确认的时间， 与 asks 的配置相匹配——如果在指定时间内没有收到同步副本的确认，那么 broker 就会返回⼀个错误。

### max.block.ms

该参数指定了在调⽤ send() ⽅法或使⽤ partitionsFor() ⽅法获取元数据时⽣产者的阻塞时间。当⽣产者的发送缓冲区已满，或者没有可⽤的元数据时，这些⽅法就会阻塞。在阻塞时间达到 max.block.ms 时，⽣产者会抛出超时异常。

### max.request.size

该参数⽤于控制⽣产者发送的请求⼤⼩。它可以指能发送的单个消息的最⼤值，也可以指单个请 求⾥所有消息总的⼤⼩。例如，假设这个值为 1MB，那么可以发送的单个最⼤消息为 1MB，或 者⽣产者可以在单个请求⾥发送⼀个批次，该批次包含了 1000 个消息，每个消息⼤⼩为 1KB。 另外，broker 对可接收的消息最⼤值也有⾃⼰的限制（message.max.bytes），所以两边的 配置最好可以匹配，避免⽣产者发送的消息被 broker 拒绝。

###  receive.buffer.bytes 和 send.buffer.bytes

这两个参数分别指定了 TCP socket 接收和发送数据包的缓冲区⼤⼩。如果它们被设为 -1，就使 ⽤操作系统的默认值。如果⽣产者或消费者与 broker 处于不同的数据中⼼，那么可以适当增⼤ 这些值，因为跨数据中⼼的⽹络⼀般都有⽐较⾼的延迟和⽐较低的带宽。

### 发送

发送消息主要有以下 3 种⽅式。 

#### 发送并忘记（fire-and-forget） 

我们把消息发送给服务器，但并不关⼼它是否正常到达。⼤多数情况下，消息会正常到达，因为 Kafka 是⾼可⽤的，⽽且⽣产者会⾃动尝试重发。不过，使⽤这种⽅式有时候也会丢失⼀些消息。 

#### 同步发送

我们使⽤ send() ⽅法发送消息，它会返回⼀个 Future 对象，调⽤ get() ⽅法进⾏等待，就可以知道消息是否发送成功。 

#### 异步发送

我们调⽤ send() ⽅法，并指定⼀个回调函数，服务器在返回响应时调⽤该函数。 在下⾯的⼏个例⼦中，我们会介绍如何使⽤上述⼏种⽅式来发送消息，以及如何处理可能发⽣的异常情况。

## 分区

如果键值为 null，并且使⽤了默认的分区器，那么记录将被随机地发送到主题内各个可⽤的分区上。分区器使⽤轮询（Round Robin）算法将消息均衡地分布到各个分区上。如果有特殊需求可以自定义分区方式。

# 消费者

## KafkaConsumer概念

### 消费者和消费者群组

Kafka 消费者从属于消费者群组。⼀个群组⾥的消费者订阅的是同⼀个主题，每个消费者接收主题⼀部 分分区的消息。

如果消费者组只有一个消费者，那它将收到订阅topic下的所有分区的消息。

![1 个消费者收到 4 个分区的消息](/assets/images/5e60a54a-3382-439b-af1f-5d4bf5371820.png)

如果消费者比topic下分区数少，那一个消费者可能会收到topic下多个分区的消息。

![2 个消费者收到 4 个分区的消息](/assets/images/6df42659-f261-42ce-8ef2-7fedd0ad1115.png)

如果消费者和topic下分区数一致，那每个消费者都可以收到一个分区的消息。

![4 个消费者收到 4 个分区的消息](/assets/images/9b230319-8c58-4aab-87d3-1990d3ca2a75.png)

如果消费者比topic下分区数多，那么将有消费者收不到分区消息。

![5 个消费者收到 4 个分区的消息](/assets/images/09ac4cb8-dd05-4d01-8478-514fb7317674.png)

多个消费者组订阅同一topic，它们之间互不影响。

![两个消费者群组对应⼀个主题](/assets/images/9f4b70e4-0100-484b-a8e7-80656ec0b14c.png)

### 消费者群组和分区再均衡

分区的所有权从⼀个消费者转移到另⼀个消费者，这样的⾏为被称为再均衡。消费者通过向被指派为群组协调器的 broker（不同的群组可以有不同的协调器）发送⼼跳来维持它们 和群组的从属关系以及它们对分区的所有权关系。消费者会在轮询消息（为了获取消息）或提交偏移量时发送⼼跳。如果消费者停⽌发送⼼跳的时间⾜够⻓，会话就会过期，群组协调器认为它已经死亡，就会触发⼀次再均衡。

在 0.10.1 版本⾥，Kafka 社区引⼊了⼀个独⽴的⼼跳线程，可以在轮询消息的空档发送⼼跳。

#### 分区分配过程

当消费者要加⼊群组时，它会向群组协调器发送⼀个 JoinGroup 请求。第⼀个加⼊群组的消费者 将成为“群主”。群主从协调器那⾥获得群组的成员列表（列表中包含了所有最近发送过⼼跳的消费者，它们被认为是活跃的），并负责给每⼀个消费者分配分区。它使⽤⼀个实现了 PartitionAssignor 接⼝的类来决定哪些分区应该被分配给哪个消费者。 Kafka 内置了两种分配策略，分配完毕之后，群主把分配情况列表发送给群组协调器，协调器再把这些信息发送给所有消费者。每个消费者只能看到⾃⼰的分配信息，只有群主知道群组⾥所有消费者的分配信息。这个过程会在每次再均衡时重复发⽣。

## 创建消费者

需要必要的属性：bootstrap.servers、 key.deserializer、value.deserializer 和 group.id。

### fetch.min.bytes

该属性指定了消费者从服务器获取记录的最⼩字节数。

### fetch.max.wait.ms

我们通过 fetch.min.bytes 告诉 Kafka，等到有⾜够的数据时才把它返回给消费者。⽽ feth.max.wait.ms 则⽤于指定 broker 的等待时间，默认是 500ms。

### max.partition.fetch.bytes

该属性指定了服务器从每个分区⾥返回给消费者的最⼤字节数。它的默认值是 1MB。

### session.timeout.ms

该属性指定了消费者在被认为死亡之前可以与服务器断开连接的时间，默认是 3s。heartbeat.interval.ms 指定了 poll() ⽅法向协调器发送⼼跳的频率。session.timeout.ms 则指定了消费者可以多久不发送⼼跳。所以，⼀ 般需要同时修改这两个属性，heartbeat.interval.ms 必须⽐ session.timeout.ms ⼩， ⼀般是 session.timeout.ms 的三分之⼀。

### auto.offset.reset

该属性指定了消费者在读取⼀个没有偏移量的分区或者偏移量⽆效的情况下该作何处理。

### enable.auto.commit

该属性指定了消费者是否⾃动提交偏移量，默认值是 true。通过配置 auto.commit.interval.ms 属性来控制提交的频率。

### partition.assignment.strategy

默认使⽤的是 org.apache.kafka.clients.consumer.RangeAssignor(该策略会把主题的若⼲个连续的分区分配给消费者)，这个类实现了 Range 策略， 不过也可以把它改成 org.apache.kafka.clients.consumer.RoundRobinAssignor(该策略把主题的所有分区逐个分配给消费者)。我们还可以使⽤⾃定义策略，在这种情况下，partition.assignment.strategy 属性的值就 是⾃定义类的名字。

### client.id

该属性可以是任意字符串，broker ⽤它来标识从客户端发送过来的消息，通常被⽤在⽇志、度量 指标和配额⾥。

### max.poll.records

该属性⽤于控制单次调⽤ call() ⽅法能够返回的记录数量，可以帮你控制在轮询⾥需要处理的数据量。

### receive.buffer.bytes 和 send.buffer.bytes

socket 在读写数据时⽤到的 TCP 缓冲区也可以设置⼤⼩。如果它们被设为 -1，就使⽤操作系统的默认值。如果⽣产者或消费者与 broker 处于不同的数据中⼼内，可以适当增⼤这些值，因为跨数据中⼼的⽹络⼀般都有⽐较⾼的延迟和⽐较低的带宽。

## 订阅

支持正则表达式订阅多个主题

## 轮询

通过⼀个简单的轮询向服务器请求数据。⼀旦消费者订阅了主题，轮 询就会处理所有的细节，包括群组协调、分区再均衡、发送⼼跳和获取数据。

轮询不只是获取数据那么简单。在第⼀次调⽤新消费者的 poll() ⽅法时，它会负责查找 GroupCoordinator，然后加⼊群组，接受分配的分区。如果发⽣了再均衡，整个过程也是在轮询期间进⾏的。当然，⼼跳也是从轮询⾥发送出去的。所以，我们要确保在轮询期间所做的任何处理⼯作都应该尽快完成。

### 线程安全

在同⼀个群组⾥，我们⽆法让⼀个线程运⾏多个消费者，也⽆法让多个线程安全地共享⼀个消费者。按照规则，⼀个消费者使⽤⼀个线程。如果要在同⼀个消费者群组⾥运⾏多个消费者，需要让每个消费者运⾏在⾃⼰的线程⾥。

## 提交和偏移量

我们把更新分区当前位置的操作叫作提交。消费者往⼀个叫作 _consumer_offset 的特殊主题发送消息， 消息⾥包含每个分区的偏移量。如果消费者⼀直处于运⾏状态，那么偏移量就没有什么⽤处。不过， 如果消费者发⽣崩溃或者有新的消费者加⼊群组，就会触发再均衡，完成再均衡之后，每个消费者可能分配到新的分区，⽽不是之前处理的那个。为了能够继续之前的⼯作，消费者需要读取每个分区最后⼀次提交的偏移量，然后从偏移量指定的地⽅继续处理。

![提交的偏移量⼩于客户端处理的最后⼀个消息的偏移量重复处理](/assets/images/72249544-7f0b-45d9-8bff-645a52cb923e.png)

![提交的偏移量⼤于客户端处理的最后⼀个消息的偏移量跳过处理](/assets/images/f9a985cb-ea43-49aa-b1c5-5ffe481214a0.png)

自动提交、同步提交、异步提交、同步异步组合提交、提交特定偏移量。从特定偏移量开始处理。

## 独⽴消费者——为什么以及怎样使⽤没有群组的消费者

⼀个消费者可以订阅主题（并 加⼊消费者群组），或者为⾃⼰分配分区，但不能同时做这两件事情。

# 深入Kafka

## 集群成员关系

Kafka使用Zookeeper管理broker。

## 控制器

控制器也是一个broker，负责分区首领的选举。集群里第一个注册的broker成为控制器。如果控制器被关闭或者与 Zookeeper 断开连接，Zookeeper 上的临时节点就会消失。集群⾥的其 他 broker 通过 watch 对象得到控制器节点消失的通知，它们会尝试让⾃⼰成为新的控制器。每个新选出的控制器通过 Zookeeper的条件递增操作获得⼀个全新的、数值更⼤的 controller epoch。其他 broker 在知道当前controller epoch 后，如果收到由控制器发出的包含较旧 epoch 的消息，就会忽略它们。

当控制器发现⼀个 broker 已经离开集群（通过观察相关的 Zookeeper 路径），它就知道，那些失 去⾸领的分区需要⼀个新⾸领（这些分区的⾸领刚好是在这个 broker 上）。控制器遍历这些分区， 并确定谁应该成为新⾸领，然后向所有包含新⾸领或 现有跟随者的 broker 发送请求。该请求消息包含了谁是新⾸领以及谁是分区跟随者的信息。随后， 新⾸领开始处理来⾃⽣产者和消费者的请求，⽽跟随者开始从新⾸领那⾥复制消息。 

当控制器发现⼀个 broker 加⼊集群时，它会使⽤ broker ID 来检查新加⼊的 broker 是否包含现有分区的副本。如果有，控制器就把变更通知发送给新加⼊的 broker 和其他 broker，新 broker 上的 副本开始从⾸领那⾥复制消息。

## 复制

Kafka 使⽤主题来组织数据，每个主题被分为若⼲个分区，每个分区有多个副本。那些副本被保存在 broker 上，每个 broker 可以保存成百上千个属于不同主题和分区的副本。

### ⾸领副本

每个分区都有⼀个⾸领副本。为了保证⼀致性，所有⽣产者请求和消费者请求都会经过这个副本。

### 跟随者副本

⾸领以外的副本都是跟随者副本。跟随者副本不处理来⾃客户端的请求，它们唯⼀的任务就是从⾸领那⾥复制消息，保持与⾸领⼀致的状态。如果⾸领发⽣崩溃，其中的⼀个跟随者会被提升为新⾸领。跟随者向首领请求消息，如果10s内没有请求它会被认为是不同步的，只有同步的副本才能被选举为新首领。

## 处理请求

Kafka 提供了⼀个⼆进制协议（基于 TCP），指定了请求消息的格式以及 broker 如何对请求作出响应

![Kafka处理请求](/assets/images/70de761b-80ba-4312-a260-a2ac90feaa3c.png)

如果 broker 收到⼀个针对特定分区的请求，⽽该分区的⾸领在另⼀个 broker 上，那么发送请求的客户端会收到⼀个“⾮分区⾸领”的错误响应。然后客户端请求元数据。

![客户端路由](/assets/images/a1bb2a8a-d191-496b-b90a-5c8874a9d4e1.png)

### 生产请求

包含⾸领副本的 broker 在收到⽣产请求时，会对请求做⼀些验证。 

* 发送数据的⽤户是否有主题写⼊权限？ 
* 请求⾥包含的 acks 值是否有效（只允许出现 0、1 或 all）？ 
* *如果 acks=all，是否有⾜够多的同步副本保证消息已经被安全写⼊？ 

之后，消息被写⼊本地磁盘。在 Linux 系统上，消息会被写到⽂件系统缓存⾥，并不保证它们何时会被刷新到磁盘上。Kafka 不会⼀直等待数据被写到磁盘上——它依赖复制功能来保证消息的持久性。如果 acks 被设为 all，那么请求会被保存在⼀个缓冲区⾥， 直到⾸领发现所有跟随者副本都复制了消息，响应才会被返回给客户端。

### 获取请求

客户端发送请求，向 broker 请求主题分区⾥具有特定偏移量的消息。broker 将按照客户端指定的数量上限从分区⾥读取消息，再把消息返回给客户端。Kafka 使⽤零复制技术向客户端发送消息——也就是说，Kafka 直接把消息从⽂件（或者更确 切地说是 Linux ⽂件系统缓存）⾥发送到⽹络通道，⽽不需要经过任何中间缓冲区。客户端只会收到已经全部同步完成的消息。

![客户端能收到的消息](/assets/images/283ea0e4-1027-4553-9cea-c239f7e150f5.png)

## 物理存储

### 分区分配

kafka会尽量的把分区平均分配在所有broker上，并且把同一个分区的副本分配在不同的broker。

在为分区分配目录时，往拥有分区最少的目录里添加。（只考虑数量）

### 文件管理

kafka把每个分区分成若干片段。每个片段是一个文件。当写入达到时间或者大小要求后，打开新的片段。正在被写入的片段叫活跃片段，活跃片段不会被删除。

### 文件格式

 Kafka 的消息和偏移量保存在⽂件⾥。保存在磁盘上的数据格式与从⽣产者发送过来或者发送给消费者的消息格式是⼀样的。这样可以避免需要对文件进行额外处理，因此可以通过zero copy直接传递。

### 索引

Kafka 为每个分区维护了⼀个索引。索引把偏移量映射到⽚段⽂件和偏移量在⽂件⾥的位置。 索引也被分成⽚段，所以在删除消息时，也可以删除相应的索引。Kafka 不维护索引的校验和。如果索引出现损坏，Kafka 会通过重新读取消息并录制偏移量和位置来重新⽣成索引。可以删除索引，Kafka 会⾃动重新⽣成这些索引。

### 清理

Kafka支持两种清理策略，一种是删除，一种是压缩。压缩会把过期的数据中重复的键取最新，通过内存中的Map存储然后过滤。

# 可靠的消息传递

##  可靠性保证

+ Kafka 可以保证同一个生产者、同一个分区消息的顺序。
+ 只有当消息被写⼊分区的所有同步副本时（但不⼀定要写⼊磁盘），它才被认为是“已提交”的。 ⽣产者可以选择接收不同类型的确认，⽐如在消息被完全提交时的确认，或者在消息被写⼊⾸领 副本时的确认，或者在消息被发送到⽹络时的确认。 
+ 只要还有⼀个副本是活跃的，那么已经提交的消息就不会丢失。 
+ 消费者只能读取已经提交的消息。

Kafka 通过配置允许在极端情况下选取未同步完全的为首领。也可以通过配置可以设置最少多少副本存在时才允许写入。

Kafka需要生产者维护消息的重试处理。

消费者需要处理偏移量提交，以及恢复后重试开始位置。最好把接受和处理线程分开以避免处理时间过长导致心跳超时。

# 使用Kafka构建数据管道

## Kafka具备数据管道的特性

+ 及时性，Kafka作为缓冲区角色可以支持上游或下游灵活的写入和读取时延
+ 可靠性
+ 高吞吐量和动态吞吐量
+ 灵活的数据格式，Kafka和Connect API与数据格式无关
+ 转换（ETL和ELT两种转换方式）
+ 安全性，Kafka支持加密和认证
+ 故障处理能力，Kafka支持回溯
+ 耦合性和灵活性，（帮助解耦数据源和数据池）

客户端API有侵入性，而Connect API对数据源和数据池没有侵入性

连接器决定需要运行多少个任务，按照任务拆分数据复制，传递给worker进程启动和配置任务。worker 进程是连接器和任务的“容器”。转换器用来在源和目标连接器转换数据格式。源连接器会向Kafak发送源端的偏移。

# 跨集群数据镜像

Kafka内置跨集群复制工具MirrorMaker

## 多集群架构

![Hub和Spoke架构](/assets/images/c2850715-14a8-47be-b78b-b936de9a4a4c.png)

![⼀个⾸领对应⼀个跟随者](/assets/images/0d70d915-1fe1-4ec3-89e9-3ff886778c4b.png)

![双活架构](/assets/images/912ccb14-8f41-4e10-864a-224a239b62a3.png)

![主备架构](/assets/images/5555e53e-80a5-4974-a037-e3b0e90d8696.png)

## 其他镜像方案

uReplicator和Replicator

# 管理Kafka

Topic操作，分区操作，消费者组操作，偏移量管理，动态配置变更，消费和生产，客户端ACL访问控制

# 流式处理

Kafka ⼀般被认为是⼀个强⼤的消息总线，可以传递事件流，但没有处理和转换事件的能⼒。Kafka 可靠的传递能⼒让它成为流式处理系统完美的数据来源。从 0.10.0 版本开始，Kafka 不仅为每⼀个流⾏的流式处理框架提供了可靠的数据来源，还提供了⼀个强⼤的流式处理类库，并将其作为客户端类库的⼀部分。

流的特性：

+ 没有边界
+ 有序
+ 数据记录不可变
+ 可重播
  
流式处理是指处理事件流，介于同步请求响应与批处理之间，比请求响应及时性低比批处理及时性高。

流式处理有几个概念

时间：分为事件时间、日志追加时间和处理时间

状态：内部状态（存储在本地）和外部状态（存储在外部）

流和表的二元性：表是数据的集合，而流包含了事件的变更

时间窗口：包括窗口的大小，窗口的移动频率，窗口的可更新有效期。分类有滑动窗口和跳跃窗口

Kafka有两个基于流的API，一个是底层的Processor API，一个是高级的Streams DSL