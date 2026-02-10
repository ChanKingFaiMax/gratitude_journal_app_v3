/**
 * 收藏的智者卡片数据结构
 */
export interface SavedWisdom {
  id: string; // 唯一ID
  masterId: 'jesus' | 'plato' | 'laozi' | 'buddha'; // 智者ID
  masterName: string; // 智者名称
  masterIcon: string; // 智者图标
  content: string; // 智者的完整话语
  entryId: string; // 来源日记ID
  entryTitle: string; // 来源日记标题
  entryDate: string; // 日记日期（YYYY-MM-DD）
  savedAt: number; // 收藏时间戳
  type: 'guidance' | 'summary'; // 类型：启示 or 总结
}
