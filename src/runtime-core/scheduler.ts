const queue: any[] = []
let isFlushPending = false
const p = Promise.resolve()
export function nextTick(fn?) {
  return fn ? p.then(fn) : p
}

export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job)
  }
  queueFlush()
}

function queueFlush() {
  if (isFlushPending) return
  isFlushPending = true
  Promise.resolve().then(() => {
    // 如果在这里有 log 的话会发现 then 执行了 循环的次数
    // 是因为微任务队列塞进了 循环次数 的 promise
    // 第一次 queue 有内容, 但是后面的 queue 是空
    // 所以创建如此多的 promise 是没有必要的

    // 开关重新初始化
    isFlushPending = false
    let job
    while ((job = queue.shift())) {
      job && job()
    }
  })
}
