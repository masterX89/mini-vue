# 问题

手撕最长递增子序列以及 vue3 里的实现

# 前言

此处不讨论到 vue3 的 快速 diff 算法，只要记住三个步骤，顺着思路展开细节即可：

1. 双端预处理

2. 理想状态（新旧节点序列总有一个被处理掉）
   - 根据剩下的那个序列做 *新增* 或 *移除*

3. 非理想状态（中间对比），只要记住两点：
   - 如何*找到*需要移动的节点以及如何*移动*
   - *找到*需要被添加或移除的节点并做对应操作

具体的设计思路可以去参考 HCY 的书籍，这里不做过多阐述。

但是很可能有人需要考验你的代码及算法功底，此时就会让你手撕一个 LIS（最长递增子序列）。

因此我这里对 LIS 的算法做一个补充笔记。

# dp 算法

## 问题简化

我们先进行问题简化，不要求出 LIS，而是求出 LIS 的*长度*，可以参考 leetcode 的 [300 题](https://leetcode-cn.com/problems/longest-increasing-subsequence/)

后面的实现可以丢到 leetcode 中进行测试

## 算法

这里定义 `dp[i]` 为考虑前 `i` 个元素，以第 `i` 个数字结尾的 LIS 的长度，因此动转方程也就很好写了

dp[i] = max(dp[j]) + 1, `j` 区间是 [0, i) 且 nums[j] < nums[i]

```js
var lengthOfLIS = function(nums) {
    let dp = new Array(nums.length).fill(1)
    for (let i = 0; i < nums.length; i++) {
        for (let j = 0; j < i; j++) {
            if (nums[j] < nums[i]) {
                dp[i] = Math.max(dp[i],dp[j]+1)
            }
        }
    }
    return Math.max(...dp)
};
```

但是这个和 vue3 的 LIS 算法还相差甚远，而且它还是 O(n^2) 的肯定不能让人满意

# 贪心算法

## 前言

在想办法降低时间复杂度前，我们先想想能不能换个思路，用 贪心 来解决这个问题

贪心思路就是，如果我们要使 LIS 尽可能的长，那么就要让序列上升得尽可能慢，因此希望每次在子序列的末尾数字要尽可能小。

所以这里维护一个数组 `d[i]`，保存 `nums` 中的数字。 `i` 索引表示，在 `i + 1` 长度时候的 LIS 的末尾*最小值*

看不懂这个解释没关系，只需要记住一点，贪心算法中的数组，并没有保存*完整的* LIS 序列，它只关心某个长度下末尾的最小值。具体可以看下面的例子理解

## 例子

以数组 ` [0,8,4,12,2]` 为例，贪心会得到一个序列 `[0, 2, 12]`

d 序列存储的并非是最长递增子序列，而是对应 len 的末尾最小值，如果约束：

- 最长递增子序列的 len 为 1 时，找到对应的 0 索引：`[0,2,12]` -> d[0] = 0，即如果 LIS 最长只能为 1，那么它的末尾元素一定为 0。对应的 LIS 为 `[0]`
- 最长递增子序列的 len 为 2 时，找到对应的 1 索引：`[0,2,12]` -> d[1] = 2，即如果 LIS 最长只能为 2，那么它的末尾元素一定为 2。对应的 LIS 为 `[0,2]`
- 最长递增子序列的 len 为 3 时，找到对应的 2 索引：`[0,2,12]` -> d[2] = 12，即如果 LIS 最长只能为 3，那么它的末尾元素一定为 12。对应的 LIS 为 `[0,4,12]`

即贪心算法没有保留子序列，它只是保留了对应长度的最后一个数字

## 算法

算法的思路就是遍历 nums：

- 如果 nums[i] 大于 d的末尾元素，那么直接将 nums[i] push 进来
- 反之 nums[i] 一定可以替换掉 d 里的一个数字，找到那个数字并做替换

```js
var lengthOfLIS = function(nums) {
    if (!nums.length) return 0
    let d = [nums[0]]
    for (let i = 1; i < nums.length; i++) {
        const numsI = nums[i]
        if (numsI > d[d.length - 1]) {
            // 塞进 d 末尾
            d.push(numsI)
        } else {
            let j
            for (j = 0; j < d.length; j++) {
                if (numsI <= d[j]) {
                    // 找到可以替换的值
                    break
                }
            }
            d[j] = numsI
        }
    }
    return d.length
};
```

但是此时贪心算法的时间复杂度还是 O(n^2) 并没有减少，别急，这时候我们看看有没有可以优化的点。我们发现在 d 序列中找可以替换的值时候，用了一个循环遍历了 d 序列，但是在之前例子中我们可以隐约感觉到 d 是 *单调递增* 的。

没错，d 确实是单调递增的，下个小节我给一个数学证明，不想看的跳过即可。利用 d 的 *单调递增* 性质可以使用 二分 找到想要替换的值。

## 数学证明

证明当 j < i 时, d[j] < d[i]

证明：

题设为 d[i] 表示一个长度为 i 的 LIS 的末尾**最小**元素

假设存在 j < i 时，d[j] >= d[i]

此时创造一个长度为 j 的 LIS 命名为序列 B，

该序列 B 由长度为 i 的 LIS 从末尾删除 i-j 个元素所构成

并设序列 B 的末尾元素为 x

由 LIS 特性可知: x < d[i]

又由假设可知: x < d[i] <= d[j] 即 x < d[j]

因此存在一个长度为 j 的序列 B, 其末尾元素 x < d[j]

与题设相矛盾, 得证 d[i] 具有单调性

# 贪心+二分

## 前言

这个算法中，我们仅仅是将贪心中 对 `j` 索引的搜索从遍历变成了二分，因此时间复杂度最终会变成 O(nlogn)。

但是注意一点，这次我将不再使用 d 数组来存储 nums 的值，而是使用 d 数组存储 nums 对应的 index 值，方便后续把 LIS 还原出来。思考一个问题，此时的 d[i] 将不再具备 *单调递增* 的性质，那还可以用二分搜索么？其实是没有问题的，第二层搜索的时候，实际变成了对 nums[d[i]] 的搜索，而 nums[d[i]] 依旧具备 *单调递增* 性质

## 算法

```js
var lengthOfLIS = function (nums) {
  if (!nums.length) return 0
  let d = [0]
  for (let i = 1; i < nums.length; i++) {
    const numsI = nums[i]
    if (numsI > nums[d[d.length - 1]]) {
      d.push(i)
    } else {
      // 将搜索换成二分
      // 选一个自己喜欢的二分即可
      let l = 0
      let r = d.length - 1
      while (l <= r) {
        let mid = (l + r) >> 1
        if (numsI > nums[d[mid]]) {
          l = mid + 1
        } else {
          r = mid - 1
        }
      }
      d[l] = i
    }
  }
  return d.length
}
```

# 贪心+二分+路径回溯

## 前言

由于*贪心*算法只会保留当前长度的 LIS 下的末尾*最小*元素，因此我们需要使用一个 path 辅助数组

`path[i]` 存放了到达当前的 `numsI` 的 `prevIndex`

并且此时的实现，需要用 ts 来写，之后丢到 vue3 源码中使用尤大的测试来检验

## 实现

```typescript
function getSequence(nums: number[]): number[] {
  const path = nums.slice()
  let d = [0]
  for (let i = 1; i < nums.length; i++) {
    const numsI = nums[i]
    if (numsI > nums[d[d.length - 1]]) {
      // 记录路径
      // 是由当前的 d 末尾索引指向的元素到达的 numsI
      path[i] = d[d.length - 1]
      d.push(i)
    } else {
      let l = 0
      let r = d.length - 1
      while (l <= r) {
        let mid = (l + r) >> 1
        if (numsI > nums[d[mid]]) {
          l = mid + 1
        } else {
          r = mid - 1
        }
      }
      // 记录路径
      // 使用 i 覆盖 d[l]
      // 因此记录 path[i] 上一个索引为 d[l - 1]
      path[i] = d[l - 1]
      d[l] = i
    }
  }
  // 反向恢复出正确的 LIS 索引数组
  let prev = d[d.length - 1]
  for (let i = d.length - 1; i >= 0; i--) {
    d[i] = prev
    // 通过 path 返回上一个 index
    prev = path[prev]
  }
  return d
}
```

## edge case

到这里 `getSequence` 已经算实现的差不多了，我们回顾一下最开始的问题：

手撕最长递增子序列以及 vue3 里的实现

手撕已经完成了，但是 vue3 的实现和我们的手撕有什么区别么？可以看下面这个例子：

`[2,0,1,3,4,5]` 的 LIS 应该是 `[0,1,3,4,5]` 而对应的 index 结果应该为 `[1,2,3,4,5]`

但是如果你使用 vue3 的源码来执行上面的例子，就会发现结果为 `[2,3,4,5]`

```typescript
function getSequence(arr: number[]): number[] {
  const p = arr.slice()
  // 凡事总有例外
  // 由于 result 初始化会把 index 为 0 塞进去
  // 如果 arr[0] === 0 的话会照样进入 result
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    // 但是除了第一个元素为 0 的情况
    // arr 中的 其他 0 是不参与 result 的构造的
    if (arrI !== 0) {
      // 省略构造 result 代码
    }
  }
  // 省略恢复 result 数组代码
  return result
}
```

为什么构造 LIS 的时候不考虑 0 的情况呢？我们看下调用 `getSequence` 的情况在哪里

```typescript
// moved 标记了存在需要移动的节点
// 如果存在那么就从 newIndexToOldIndexMap 中生成 LIS
// newIndexToOldIndexMap 是 新节点序列 index 和 旧节点序列 index 的索引
const increasingNewIndexSequence = moved
	? getSequence(newIndexToOldIndexMap)
	: EMPTY_ARR
```

参考尤大的注释可以得知，0 是一种特殊的标记，标记了新增的节点

同时由于 offset +1 的存在，后面的代码也都会带有这个 offset，可以参见[这一行](https://github.com/vuejs/core/blob/0683a022ec83694e29636f64aaf3c04012e9a7f0/packages/runtime-core/src/renderer.ts#L1931)


```typescript
// works as Map<newIndex, oldIndex>
// Note that oldIndex is offset by +1
// and oldIndex = 0 is a special value indicating the new node has
// no corresponding old node.
// used for determining longest stable subsequence
const newIndexToOldIndexMap = new Array(toBePatched)
for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0
```

我们求出 LIS 的目的是为了找到哪些节点无需移动，而新增的节点根本不在节点移动的讨论范畴之内。

因此在 LIS 算法中，也无需考虑 0 的情况了。

