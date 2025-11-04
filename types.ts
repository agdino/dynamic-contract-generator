
export interface Template {
  id: string;
  name: string;
  content: string;
}

export interface FormData {
  [key: string]: string | ProductCombo[];
  '立約人': string;
  '平台': string;
  // FIX: Changed type from literal 'string' to type string.
  '頻道': string;
  '推廣產品': string;
  '提供產品': string;
  '遊戲主題': string;
  '合約期間_起': string;
  '合約期間_迄': string;
  '合約費用合計': string;
  '合約製作日期': string;
  '影片製作_數量': string;
  '影片插片_數量': string;
  '影片費用': string;
  '授權影片': string;
  '授權期間': string;
  '授權範圍': string;
  '授權費用': string;
  '分潤期間': string;
  '分潤比例': string;
  '分潤保底': string;
  '免單期間': string;
  '免單抽獎數量': string;
  '免單單筆上限': string;
  '產品組合': ProductCombo[];
  '已有商品': string;
  '備註': string;
  '乙方電話': string;
  '乙方地址': string;
  '乙方身份證字號': string;
}

export interface ProductCombo {
  id: string;
  name: string;
  price: string;
}

export interface Section {
  id: string;
  label: string;
  fields: string[];
}