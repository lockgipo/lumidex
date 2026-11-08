const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { cards: catalog } = require('../data.json');

const { validateSnapshot } = require('../market-snapshot.js');

function saveSnapshot(snapshot, directory) {
  fs.mkdirSync(directory, { recursive: true });
  const filename = snapshot.finishedAt.replaceAll(':', '-') + '_' + snapshot.region.replace(' ', '-') + '.json';
  const target = path.join(directory, filename);
  const pending = path.join(directory, '.' + randomUUID() + '.tmp');
  const content = JSON.stringify(snapshot, null, 2) + '\n';

  const file = fs.openSync(pending, 'wx');
  try {
    try {
      fs.writeFileSync(file, content);
    } finally {
      fs.closeSync(file);
    }

    // Publish the completed file without replacing an existing snapshot.
    try {
      fs.linkSync(pending, target);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      if (fs.readFileSync(target, 'utf8') !== content) {
        throw new Error('同區域同結束時間已有不同批次，既有紀錄已保留');
      }
    }
  } finally {
    fs.unlinkSync(pending);
  }
  return target;
}

try {
  const args = process.argv.slice(2);
  if (args.length !== 2) throw new Error('用法：node scripts/record-market-snapshot.cjs <批次 JSON> <本機歷史資料夾>');
  const [inputFile, directory] = args;
  const text = fs.readFileSync(inputFile, 'utf8').replace(/^\uFEFF/, '');
  let input;
  try {
    input = JSON.parse(text);
  } catch {
    throw new Error('批次檔案須為有效的 UTF-8 JSON');
  }
  const snapshot = validateSnapshot(input, catalog);
  const target = saveSnapshot(snapshot, path.resolve(directory));
  const { priced, noListings, unobserved, total } = snapshot.coverage;
  console.log(snapshot.region + ' 已查核 ' + (priced + noListings) + '/' + total +
    ' 張（有價 ' + priced + '、無掛單 ' + noListings + '、未查 ' + unobserved + '）');
  console.log(target);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
