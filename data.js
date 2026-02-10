window.blogPosts = [
  {
    "title": "聊聊哈希表和C#的Dictionary底层",
    "date": "2026-02-10",
    "excerpt": "<span style=\"font-size: 24px; font-weight: bold;\">前言</span>  这篇文章的初衷在于分析C的Dictionary(下文简称为Dic)的底层...",
    "fullContent": "<span style=\"font-size: 24px; font-weight: bold;\">前言</span>\n\n  这篇文章的初衷在于分析C#的Dictionary(下文简称为Dic)的底层实现。而Dic的底层是一个哈希结构的数组，我们便不可避免的要先学习所谓哈希究竟是怎样的概念。所以本文会从哈希表入手，逐步解析C#Dic的底层实现逻辑。\n\n<span style=\"font-size: 24px; font-weight: bold;\">Hash</span>\n\n  如果你在之前有在算法中接触过HashSet的话，就会知道这个数据结构不会存入重复的数据对象，同时如果再做一些HashSet的总结，就会发现这个数据结构通常会被用来获取是否包含某元素的这一bool结果。作为一个集合，其在单纯的查找这一行为的作用明显大于遍历。原因便在于HashSet是个形式简单的<mark>**哈希结构**</mark>。哈希结构的作用就体现在其<mark>查找的速度极快</mark>。如果要在一个数组中要查找某个指定的元素，我们能做的几乎只有遍历这个数组，一个个的去比对，最多优化检索算法，但始终是对遍历的优化。而哈希结构却能做到只要你的目标明确，它便能长驱直入，直接找到目标对象。那么，如此高效的Find效果是如何实现的呢？\n\n<span style=\"font-size: 24px; font-weight: bold;\">哈希算法</span>\n\n  哈希算法的唯一目的，就是将你提供的键经过哈希算法的运算变为一个哈希值(HashCode)。这个过程是<mark>确定的，不可逆的</mark>。\n\n即：\n\n**1、if key1 = key2**\n\n**then H(key1) = H(key2)**\n\n**2、key -> H(key)**\n\n**H(key) !-> key**\n\n同时还存在:\n\nif(key1 != key2)\n\nH(key1) may be = H(key2)\n\n也就是说哈希算法的计算，存在<mark>哈希冲突</mark>，哈希冲突的处理方案也是实现哈希结构的重要步骤，我们后面会详细了解。\n\n![997046-20190126232145973-1148017578.png](images/997046-20190126232145973-1148017578.png)\n\n现在就先着眼于哈希算法的实现。\n\n  哈希算法是一系列算法的统称，这些算法的共同点就是实现了对key确定的，不可逆的转换为HashCode。\n\n常见的哈希算法有以下几种\n\n1. 直接寻址法：取key或key的某个线性函数值为散列地址。即H(key)=key或H(key) = a•key + b，当中a和b为常数（这样的散列函数叫做自身函数）。\n\n2. 数字分析法：分析一组数据，比方一组员工的出生年月日，这时我们发现出生年月日的前几位数字大体同样，这种话，出现冲突的几率就会非常大，可是我们发现年月日的后几位表示月份和详细日期的数字区别非常大，假设用后面的数字来构成散列地址，则冲突的几率会明显减少。因此数字分析法就是找出数字的规律，尽可能利用这些数据来构造冲突几率较低的散列地址。\n\n3. 平方取中法：取key平方后的中间几位作为散列地址。\n\n4. 折叠法：将key切割成位数同样的几部分，最后一部分位数能够不同，然后取这几部分的叠加和（去除进位）作为散列地址。\n\n5. 随机数法：选择一随机函数，取key的随机值作为散列地址，通经常使用于key长度不同的场合。\n\n6. 除留余数法：取key被某个不大于散列表表长m的数p除后所得的余数为散列地址。即 H(key) = key MOD p, p<=m。不仅能够对key直接取模，也可在折叠、平方取中等运算之后取模。对p的选择非常重要，一般取素数或m，若p选的不好，容易产生碰撞。\n\n",
    "category": "数据结构"
  },
  {
    "title": "数据分离测试",
    "date": "2026-02-10",
    "excerpt": "![屏幕截图_2025-12-18_174716.png](images/屏幕截图_2025-12-18_174716.png)...",
    "fullContent": "![屏幕截图_2025-12-18_174716.png](images/屏幕截图_2025-12-18_174716.png)",
    "category": "测试"
  },
  {
    "title": "测试标题",
    "date": "2026-02-10",
    "excerpt": "测试代码块    public void InitHeroBlindBox()        {            var btnCoin = transform.Find(\"g-C...",
    "fullContent": "测试代码块\n```\n    public void InitHeroBlindBox()\n        {\n            var btnCoin = transform.Find(\"g-Coin\").GetComponent<Button>();\n            btnCoin.onClick.RemoveAllListeners();\n            btnCoin.onClick.AddListener(() => { ShowHeroCoinRechargePanel(); });\n        }\n```\n测试图片\n![屏幕截图_2025-12-18_161605.png](images/屏幕截图_2025-12-18_161605.png)\n图片穿插测试\n\n*斜体*\n\n**加粗**\n\n***斜体加粗***\n\n<mark>强调</mark>\n\n<mark>***斜体加粗强调***</mark>\n\n<span style=\"color:#3498db\">改色</span>\n\n测试结束",
    "category": "测试"
  }
];