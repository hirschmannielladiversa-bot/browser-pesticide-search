/**
 * 文字列正規化ユーティリティ
 * - 半角カナ → 全角カナ
 * - ひらがな → カタカナ
 * - 大文字統一
 * - 全角英数 → 半角
 */

function hiraToKata(str) {
  return str.replace(/[ぁ-ゖ]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60)
  );
}

export function normalize(str) {
  if (!str) return "";
  let s = String(str).normalize("NFKC");
  s = hiraToKata(s);
  s = s.toUpperCase();
  s = s.replace(/\s+/g, "");
  return s;
}

/** 登録番号の正規化: "第12345号" → 12345, "12345" → 12345 */
export function parseRegNo(str) {
  if (!str) return null;
  const m = String(str).match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

/** RACコードの正規化: "IRAC 4A", "4A", "irac4a" → "4A" */
export function normalizeRacQuery(str) {
  if (!str) return "";
  const s = String(str).toUpperCase().replace(/\s+/g, "");
  return s.replace(/^(IRAC|FRAC|HRAC)/, "");
}

/**
 * 作物名を検索インデックス用に展開する。
 * "(○○を除く)" / "（○○を除く）" を含む場合は括弧手前のメイン作物名のみ返す
 * (除外指定された作物は検索ヒットさせない)。
 * 例: "かんきつ(みかんを除く)" → ["かんきつ"]
 *     "ねぎ(根深ねぎ)"        → ["ねぎ(根深ねぎ)"]  (「除く」無しは原文)
 */
export function expandSearchableCrops(crop) {
  if (!crop) return [];
  const s = String(crop);
  const m = s.match(/^(.*?)[（(]([^（()）]*)[)）]\s*$/);
  if (m && /(除く|のぞく)/.test(m[2])) {
    const base = m[1].trim();
    return base ? [base] : [];
  }
  return [s];
}

/**
 * RACコード文字列を IRAC / FRAC / HRAC 別に分類。
 * - 複合表記: "UN(I*), M2(F*)" のように (I*)/(F*)/(H*) タグ付き → タグで振り分け
 * - 単独コード: categories から推定 (殺虫剤→I, 殺菌剤→F, 除草剤→H)
 */
export function splitRacCode(racCode, categories) {
  const out = { I: [], F: [], H: [] };
  if (!racCode) return out;
  const s = String(racCode);
  const cats = Array.isArray(categories) ? categories : [];

  if (/\((I|F|H)\*\)/.test(s)) {
    const parts = s.split(/[,、]/);
    for (const part of parts) {
      const m = part.match(/^\s*(.+?)\s*\((I|F|H)\*\)\s*$/);
      if (m) {
        const code = m[1].trim();
        if (code) out[m[2]].push(code);
      }
    }
    return out;
  }

  const code = s.trim();
  if (!code) return out;
  const joined = cats.join("");
  if (joined.includes("殺虫")) out.I.push(code);
  if (joined.includes("殺菌")) out.F.push(code);
  if (joined.includes("除草")) out.H.push(code);
  return out;
}
