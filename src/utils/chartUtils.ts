// utils/chartUtils.ts
export class ChartUtils {
  static generateColors(count: number): string[] {
    const baseColors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ];
    
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  }

  static processDataForChart(data: any[], xKey: string, yKey: string): any[] {
    return data.map(item => ({
      [xKey]: item[xKey],
      [yKey]: typeof item[yKey] === 'number' ? item[yKey] : parseFloat(item[yKey]) || 0
    }));
  }

  static aggregateDataByKey(data: any[], groupKey: string, valueKey: string): any[] {
    const grouped = data.reduce((acc, item) => {
      const key = item[groupKey];
      if (!acc[key]) {
        acc[key] = { [groupKey]: key, [valueKey]: 0, count: 0 };
      }
      acc[key][valueKey] += item[valueKey] || 0;
      acc[key].count += 1;
      return acc;
    }, {});

    return Object.values(grouped);
  }
}