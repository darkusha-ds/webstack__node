import { Pool, db } from '#import';

async function getAllFontGroups(callback) {
  try {
    const res = await db.query(`SELECT * FROM fonts_groups ORDER BY LOWER(name)`);
    callback(res.rows);
  } catch (err) {
    console.error('❌ Ошибка при получении групп шрифтов:', err);
    callback([]);
  }
}

async function getVariantsByGroupName(groupName, callback) {
  try {
    const res = await db.query(
      `SELECT * FROM fonts_variants WHERE group_name = $1 ORDER BY weight, italic`,
      [groupName]
    );
    callback(res.rows);
  } catch (err) {
    console.error('❌ Ошибка при получении вариаций шрифта:', err);
    callback([]);
  }
}

module.exports = {
  getAllFontGroups,
  getVariantsByGroupName
};