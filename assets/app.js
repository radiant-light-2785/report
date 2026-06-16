const state = {
  closed: [],
  positions: []
};

const $ = (id) => document.getElementById(id);

function n(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const cleaned = String(value).replace(/,/g, '').replace(/[–—]/g, '-').trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function fmt(value, decimals = 2) {
  const num = n(value);
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtPlain(value, decimals = 2) {
  const num = n(value);
  return num.toFixed(decimals);
}

function moneyClass(value) {
  const num = n(value);
  if (num > 0) return 'profit';
  if (num < 0) return 'loss';
  return '';
}

function productFromCode(code) {
  const c = String(code || '').toUpperCase();
  if (c.includes('LALZ') || c.includes('AHDD') || c.includes('AL')) return 'Nhôm';
  if (c.includes('LZHZ') || c.includes('ZDSD') || c.startsWith('ZS') || c.includes('ZN')) return 'Kẽm';
  if (c.includes('LDKZ') || c.includes('CAD') || c.includes('COP') || c.includes('CU')) return 'Đồng';
  return '';
}

function maturityFromCode(code) {
  const c = String(code || '').toUpperCase();
  if (['LALZ', 'LZHZ', 'LDKZ'].some(x => c.includes(x))) return '90d Fwd';
  if (c.includes('N26')) return 'Tháng 7/2026';
  if (c.includes('Q26')) return 'Tháng 8/2026';
  if (c.includes('U26')) return 'Tháng 9/2026';
  if (c.includes('V26')) return 'Tháng 10/2026';
  if (c.includes('X26')) return 'Tháng 11/2026';
  if (c.includes('Z26')) return 'Tháng 12/2026';
  return $('maturityDate').value || '';
}

function sideToPosition(side) {
  const s = String(side || '').toLowerCase();
  if (s.includes('sell') || s.includes('bán') || s === 's' || s === 'short') return 'Short';
  return 'Long';
}

function settings() {
  return {
    openDate: $('openDate').value.trim(),
    settleDate: $('settleDate').value.trim(),
    maturityDate: $('maturityDate').value.trim(),
    tonsPerLot: n($('tonsPerLot').value, 25),
    feePerMt: n($('feePerMt').value, 0.616)
  };
}

function computeClosed(row) {
  const s = settings();
  const lot = n(row.lot, 1);
  const tons = lot * s.tonsPerLot;
  const open = n(row.openPrice);
  const close = n(row.closePrice);
  const position = row.position || 'Long';
  const before = position === 'Short'
    ? (open - close) * s.tonsPerLot * lot
    : (close - open) * s.tonsPerLot * lot;
  const feeTotal = tons * s.feePerMt * 2;
  return {
    tons,
    feePerMt: s.feePerMt,
    feeTotal,
    beforeFee: before,
    afterFee: before - feeTotal
  };
}

function addClosedRow(row = {}) {
  const s = settings();
  state.closed.push({
    openDate: row.openDate || s.openDate,
    settleDate: row.settleDate || s.settleDate,
    maturityDate: row.maturityDate || s.maturityDate,
    code: row.code || '',
    product: row.product || productFromCode(row.code) || '',
    position: row.position || 'Long',
    openPrice: row.openPrice || '',
    closePrice: row.closePrice || '',
    lot: row.lot || 1,
    carry: row.carry || ''
  });
  renderAll();
}

function addPositionRow(row = {}) {
  state.positions.push({
    product: row.product || productFromCode(row.code) || '',
    maturity: row.maturity || maturityFromCode(row.code) || '',
    code: row.code || '',
    buyPrice: row.buyPrice || '',
    buyLot: row.buyLot || '',
    sellPrice: row.sellPrice || '',
    sellLot: row.sellLot || '',
    ote: row.ote || '',
    note: row.note || ''
  });
  renderAll();
}

function cellInput(value, path, type = 'text', extraClass = '') {
  return `<input class="table-input ${extraClass}" type="${type}" value="${value ?? ''}" data-path="${path}">`;
}

function selectPosition(value, path) {
  return `<select class="table-input" data-path="${path}">
    <option value="Long" ${value === 'Long' ? 'selected' : ''}>Long</option>
    <option value="Short" ${value === 'Short' ? 'selected' : ''}>Short</option>
  </select>`;
}

function renderClosed() {
  const tbody = $('closedTable').querySelector('tbody');
  const tfoot = $('closedTable').querySelector('tfoot');
  tbody.innerHTML = '';
  let totalLot = 0, totalTons = 0, totalFee = 0, totalBefore = 0, totalAfter = 0;

  state.closed.forEach((row, i) => {
    const c = computeClosed(row);
    totalLot += n(row.lot);
    totalTons += c.tons;
    totalFee += c.feeTotal;
    totalBefore += c.beforeFee;
    totalAfter += c.afterFee;
    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${cellInput(row.openDate, `closed.${i}.openDate`)}</td>
        <td>${cellInput(row.settleDate, `closed.${i}.settleDate`)}</td>
        <td>${cellInput(row.maturityDate, `closed.${i}.maturityDate`)}</td>
        <td>${cellInput(row.code, `closed.${i}.code`)}</td>
        <td>${cellInput(row.product, `closed.${i}.product`)}</td>
        <td>${selectPosition(row.position, `closed.${i}.position`)}</td>
        <td>${cellInput(row.openPrice, `closed.${i}.openPrice`, 'number', 'number')}</td>
        <td>${cellInput(row.closePrice, `closed.${i}.closePrice`, 'number', 'number')}</td>
        <td>${cellInput(row.lot, `closed.${i}.lot`, 'number', 'number')}</td>
        <td class="number">${fmt(c.tons)}</td>
        <td class="number">${fmt(c.feePerMt, 3)}</td>
        <td class="number">${fmt(c.feeTotal)}</td>
        <td>${cellInput(row.carry, `closed.${i}.carry`, 'number', 'number')}</td>
        <td class="number ${moneyClass(c.beforeFee)}">${fmt(c.beforeFee)}</td>
        <td class="number ${moneyClass(c.afterFee)}">${fmt(c.afterFee)}</td>
        <td><button class="small-btn" data-delete="closed.${i}">Xóa</button></td>
      </tr>`);
  });

  tfoot.innerHTML = `<tr>
    <td><strong>Tổng</strong></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
    <td class="number">${fmt(totalLot, 0)}</td>
    <td class="number">${fmt(totalTons)}</td>
    <td></td>
    <td class="number">${fmt(totalFee)}</td>
    <td></td>
    <td class="number ${moneyClass(totalBefore)}">${fmt(totalBefore)}</td>
    <td class="number ${moneyClass(totalAfter)}">${fmt(totalAfter)}</td>
    <td></td>
  </tr>`;
}

function renderPositions() {
  const tbody = $('positionTable').querySelector('tbody');
  const tfoot = $('positionTable').querySelector('tfoot');
  tbody.innerHTML = '';
  let buyLot = 0, sellLot = 0, totalOte = 0;

  state.positions.forEach((row, i) => {
    buyLot += n(row.buyLot);
    sellLot += n(row.sellLot);
    totalOte += n(row.ote);
    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${cellInput(row.product, `positions.${i}.product`)}</td>
        <td>${cellInput(row.maturity, `positions.${i}.maturity`)}</td>
        <td>${cellInput(row.code, `positions.${i}.code`)}</td>
        <td>${cellInput(row.buyPrice, `positions.${i}.buyPrice`, 'number', 'number')}</td>
        <td>${cellInput(row.buyLot, `positions.${i}.buyLot`, 'number', 'number')}</td>
        <td>${cellInput(row.sellPrice, `positions.${i}.sellPrice`, 'number', 'number')}</td>
        <td>${cellInput(row.sellLot, `positions.${i}.sellLot`, 'number', 'number')}</td>
        <td>${cellInput(row.ote, `positions.${i}.ote`, 'number', `number ${moneyClass(row.ote)}`)}</td>
        <td>${cellInput(row.note, `positions.${i}.note`)}</td>
        <td><button class="small-btn" data-delete="positions.${i}">Xóa</button></td>
      </tr>`);
  });

  tfoot.innerHTML = `<tr>
    <td><strong>Tổng lãi/lỗ đang mở OTE</strong></td><td></td><td></td><td></td>
    <td class="number">${fmt(buyLot, 0)}</td><td></td>
    <td class="number">${fmt(sellLot, 0)}</td>
    <td class="number ${moneyClass(totalOte)}">${fmt(totalOte)}</td><td></td><td></td>
  </tr>`;
}

function renderSummary() {
  const closedBefore = state.closed.reduce((sum, r) => sum + computeClosed(r).beforeFee, 0);
  const closedFee = state.closed.reduce((sum, r) => sum + computeClosed(r).feeTotal, 0);
  const closedAfter = state.closed.reduce((sum, r) => sum + computeClosed(r).afterFee, 0);
  const totalOte = state.positions.reduce((sum, r) => sum + n(r.ote), 0);
  const total = closedAfter + totalOte;
  $('summary').innerHTML = `
    <div class="summary-card"><div class="label">LN đã tất toán trước phí</div><div class="value ${moneyClass(closedBefore)}">${fmt(closedBefore)}</div></div>
    <div class="summary-card"><div class="label">Tổng phí giao dịch</div><div class="value loss">-${fmt(closedFee)}</div></div>
    <div class="summary-card"><div class="label">LN đã tất toán sau phí</div><div class="value ${moneyClass(closedAfter)}">${fmt(closedAfter)}</div></div>
    <div class="summary-card"><div class="label">OTE đang mở</div><div class="value ${moneyClass(totalOte)}">${fmt(totalOte)}</div></div>
    <div class="summary-card"><div class="label">Tổng tạm tính</div><div class="value ${moneyClass(total)}">${fmt(total)}</div></div>
  `;
}

function renderAll() {
  renderClosed();
  renderPositions();
  renderSummary();
}

function updateFromPath(path, value) {
  const [table, idx, key] = path.split('.');
  if (!state[table] || !state[table][idx]) return;
  state[table][idx][key] = value;
  if (key === 'code') {
    const row = state[table][idx];
    if (!row.product) row.product = productFromCode(value);
    if (table === 'positions' && !row.maturity) row.maturity = maturityFromCode(value);
  }
}

document.addEventListener('input', (e) => {
  const path = e.target?.dataset?.path;
  if (!path) return;
  updateFromPath(path, e.target.value);
  renderAll();
});

document.addEventListener('change', (e) => {
  const path = e.target?.dataset?.path;
  if (!path) return;
  updateFromPath(path, e.target.value);
  renderAll();
});

document.addEventListener('click', (e) => {
  const del = e.target?.dataset?.delete;
  if (!del) return;
  const [table, idx] = del.split('.');
  state[table].splice(Number(idx), 1);
  renderAll();
});

function extractPrices(line) {
  const matches = line.match(/-?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})|-?\d{4,5}(?:\.\d{1,2})/g) || [];
  return matches
    .map(x => n(x))
    .filter(x => Math.abs(x) >= 1000 && Math.abs(x) <= 20000);
}

function extractSmallIntegers(line) {
  const matches = line.match(/\b\d{1,2}\b/g) || [];
  return matches.map(Number).filter(x => x > 0 && x <= 50);
}

function extractCode(line) {
  const u = line.toUpperCase().replace(/\s+/g, ' ');
  const known = u.match(/\b(LALZ|LZHZ|LDKZ)\b/);
  if (known) return known[1];
  const contract = u.match(/\b(?:AHDD|ZDSD|ZSDS|CAD|CA|CU)[A-Z0-9]{2,8}\b/);
  if (contract) return contract[0].replace('ZSDS', 'ZDSD');
  return '';
}

function extractOte(line) {
  const nums = line.match(/-?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})|-?\d{4,6}(?:\.\d{1,2})/g) || [];
  const parsed = nums.map(x => n(x));
  const candidates = parsed.filter(x => Math.abs(x) >= 50 && Math.abs(x) <= 100000);
  return candidates.length ? candidates[candidates.length - 1] : '';
}

function sideFromLine(line) {
  const l = line.toLowerCase();
  if (/\b(short|sell|sold|bán|ban|s)\b/.test(l)) return 'Short';
  if (/\b(long|buy|bought|mua|m)\b/.test(l)) return 'Long';
  return 'Long';
}

function looksLikePosition(line) {
  const u = line.toUpperCase();
  return /OTE|OPEN|POSITION|TRẠNG|TRANG|AHDD|ZDSD|LALZ|LZHZ|LDKZ/.test(u) && extractCode(line);
}

function parseTextToRows(text) {
  const lines = text
    .replace(/[|]/g, ' ')
    .split(/\n+/)
    .map(x => x.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const closed = [];
  const positions = [];

  for (const line of lines) {
    const code = extractCode(line);
    if (!code) continue;
    const prices = extractPrices(line);
    const lower = line.toLowerCase();
    const hasTradeWords = /(buy|sell|bought|sold|mua|bán|ban|long|short)/i.test(line);
    const hasClosedSignal = /(purchase|sales|p\/s|closed|tất toán|tat toan|profit|l\/s|p\/l)/i.test(line) || prices.length >= 2;

    if (hasTradeWords && hasClosedSignal && prices.length >= 2) {
      const pos = sideFromLine(line);
      let lot = 1;
      const small = extractSmallIntegers(line);
      if (small.length) lot = small[small.length - 1];
      closed.push({
        openDate: $('openDate').value.trim(),
        settleDate: $('settleDate').value.trim(),
        maturityDate: $('maturityDate').value.trim(),
        code,
        product: productFromCode(code),
        position: pos,
        openPrice: prices[0],
        closePrice: prices[1],
        lot,
        carry: ''
      });
      continue;
    }

    if (looksLikePosition(line) || prices.length >= 1) {
      const pos = sideFromLine(line);
      const small = extractSmallIntegers(line);
      let lot = 1;
      if (small.length) lot = small[small.length - 1];
      const price = prices[0] || '';
      const ote = extractOte(line);
      const row = {
        product: productFromCode(code),
        maturity: maturityFromCode(code),
        code,
        buyPrice: '',
        buyLot: '',
        sellPrice: '',
        sellLot: '',
        ote,
        note: 'OCR'
      };
      if (pos === 'Short') {
        row.sellPrice = price;
        row.sellLot = lot;
      } else {
        row.buyPrice = price;
        row.buyLot = lot;
      }
      positions.push(row);
    }
  }

  return { closed, positions };
}

function preprocessImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => { img.src = reader.result; };
    img.onerror = reject;
    img.onload = () => {
      const scale = Math.min(3, Math.max(1.5, 1800 / Math.max(img.width, img.height)));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
        const boosted = gray < 170 ? Math.max(0, gray - 35) : Math.min(255, gray + 35);
        data[i] = data[i+1] = data[i+2] = boosted;
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    reader.readAsDataURL(file);
  });
}

async function runOcr() {
  const files = Array.from($('imageInput').files || []);
  if (!files.length) {
    alert('Bạn cần chọn ít nhất 1 ảnh.');
    return;
  }

  $('progressBox').classList.remove('hidden');
  $('progressFill').style.width = '0%';
  $('progressText').textContent = 'Chuẩn bị OCR...';

  let allText = '';
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    $('progressText').textContent = `Đang xử lý ảnh ${i + 1}/${files.length}: ${file.name}`;
    const image = await preprocessImage(file);
    const result = await Tesseract.recognize(image, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          const pct = Math.round(((i + m.progress) / files.length) * 100);
          $('progressFill').style.width = `${pct}%`;
          $('progressText').textContent = `OCR ${file.name}: ${pct}%`;
        }
      }
    });
    allText += `\n--- ${file.name} ---\n${result.data.text}\n`;
  }
  $('rawText').value = allText.trim();
  $('progressFill').style.width = '100%';
  $('progressText').textContent = 'OCR xong. Đang parse bảng...';
  parseRawText();
  setTimeout(() => $('progressBox').classList.add('hidden'), 800);
}

function parseRawText() {
  const text = $('rawText').value || '';
  const rows = parseTextToRows(text);
  if (rows.closed.length) state.closed.push(...rows.closed);
  if (rows.positions.length) state.positions.push(...rows.positions);
  renderAll();
  if (!rows.closed.length && !rows.positions.length) {
    alert('Chưa parse được dòng nào. Bạn có thể sửa Raw OCR text cho rõ mã/giá/lot rồi bấm Parse lại, hoặc thêm dòng thủ công.');
  }
}

function tableToMarkdown(type) {
  if (type === 'closed') {
    const headers = ['Ngày mở lệnh','Ngày tất toán','Ngày đáo hạn','Mã hợp đồng','Mặt hàng','Vị thế','Giá mở','Giá đóng','Khối lượng quy đổi lot','Khối lượng quy đổi tấn','Phí giao dịch usd/mt','Tổng phí/lệnh','Giá carry usd/mt','Lợi nhuận chưa phí giao dịch','Lợi nhuận sau phí giao dịch'];
    const rows = state.closed.map(r => {
      const c = computeClosed(r);
      return [r.openDate,r.settleDate,r.maturityDate,r.code,r.product,r.position,fmt(r.openPrice),fmt(r.closePrice),fmt(n(r.lot),0),fmt(c.tons),fmt(c.feePerMt,3),fmt(c.feeTotal),r.carry || '',fmt(c.beforeFee),fmt(c.afterFee)];
    });
    const totals = state.closed.reduce((acc, r) => {
      const c = computeClosed(r);
      acc.lot += n(r.lot); acc.tons += c.tons; acc.fee += c.feeTotal; acc.before += c.beforeFee; acc.after += c.afterFee;
      return acc;
    }, {lot:0,tons:0,fee:0,before:0,after:0});
    rows.push(['**Tổng**','','','','','','','',`**${fmt(totals.lot,0)}**`,`**${fmt(totals.tons)}**`,'',`**${fmt(totals.fee)}**`,'',`**${fmt(totals.before)}**`,`**${fmt(totals.after)}**`]);
    return markdownTable(headers, rows);
  }

  const headers = ['Sản phẩm','Tháng đáo hạn','Mã','Mua - Giá','Mua - Lot','Bán - Giá','Bán - Lot','OTE tạm tính USD','Ghi chú'];
  const rows = state.positions.map(r => [r.product,r.maturity,r.code,r.buyPrice ? fmt(r.buyPrice) : '',r.buyLot || '',r.sellPrice ? fmt(r.sellPrice) : '',r.sellLot || '',r.ote !== '' ? fmt(r.ote) : '',r.note || '']);
  const totals = state.positions.reduce((acc, r) => { acc.buy += n(r.buyLot); acc.sell += n(r.sellLot); acc.ote += n(r.ote); return acc; }, {buy:0,sell:0,ote:0});
  rows.push(['**Tổng lãi/lỗ đang mở OTE**','','','',`**${fmt(totals.buy,0)}**`,'',`**${fmt(totals.sell,0)}**`,`**${fmt(totals.ote)}**`,'']);
  return markdownTable(headers, rows);
}

function markdownTable(headers, rows) {
  const align = headers.map(() => '---');
  const body = [headers, align, ...rows].map(row => `| ${row.join(' | ')} |`).join('\n');
  return body;
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => alert('Đã copy.'));
}

function rowsToCsv(type) {
  let headers, rows;
  if (type === 'closed') {
    headers = ['Ngay mo lenh','Ngay tat toan','Ngay dao han','Ma hop dong','Mat hang','Vi the','Gia mo','Gia dong','Lot','Tan','Phi USD/mt','Tong phi','Gia carry','LN chua phi','LN sau phi'];
    rows = state.closed.map(r => {
      const c = computeClosed(r);
      return [r.openDate,r.settleDate,r.maturityDate,r.code,r.product,r.position,fmtPlain(r.openPrice),fmtPlain(r.closePrice),fmtPlain(r.lot,0),fmtPlain(c.tons),fmtPlain(c.feePerMt,3),fmtPlain(c.feeTotal),r.carry || '',fmtPlain(c.beforeFee),fmtPlain(c.afterFee)];
    });
  } else {
    headers = ['San pham','Thang dao han','Ma','Mua Gia','Mua Lot','Ban Gia','Ban Lot','OTE','Ghi chu'];
    rows = state.positions.map(r => [r.product,r.maturity,r.code,r.buyPrice,r.buyLot,r.sellPrice,r.sellLot,r.ote,r.note]);
  }
  return [headers, ...rows].map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
}

function download(name, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function allMarkdown() {
  const account = $('accountName').value || 'Tài khoản';
  const closedAfter = state.closed.reduce((sum, r) => sum + computeClosed(r).afterFee, 0);
  const totalOte = state.positions.reduce((sum, r) => sum + n(r.ote), 0);
  return `## ${account}\n\n## 1. HẠCH TOÁN LỢI NHUẬN GIAO DỊCH\n\n${tableToMarkdown('closed')}\n\n## 2. VỊ THẾ ĐANG CÓ\n\n${tableToMarkdown('positions')}\n\n## Tổng hợp\n\n| Khoản mục | USD |\n|---|---:|\n| Lệnh đã tất toán sau phí | ${fmt(closedAfter)} |\n| Vị thế đang mở OTE | ${fmt(totalOte)} |\n| **Tổng tạm tính** | **${fmt(closedAfter + totalOte)}** |`;
}

$('runOcrBtn').addEventListener('click', () => runOcr().catch(err => {
  console.error(err);
  $('progressBox').classList.add('hidden');
  alert('OCR bị lỗi: ' + (err.message || err));
}));
$('parseTextBtn').addEventListener('click', parseRawText);
$('clearBtn').addEventListener('click', () => { state.closed = []; state.positions = []; $('rawText').value = ''; renderAll(); });
$('addClosedRowBtn').addEventListener('click', () => addClosedRow());
$('addPositionRowBtn').addEventListener('click', () => addPositionRow());
$('copyClosedMarkdownBtn').addEventListener('click', () => copyText(tableToMarkdown('closed')));
$('copyPositionMarkdownBtn').addEventListener('click', () => copyText(tableToMarkdown('positions')));
$('copyAllMarkdownBtn').addEventListener('click', () => copyText(allMarkdown()));
$('downloadClosedCsvBtn').addEventListener('click', () => download('hach_toan_loi_nhuan.csv', rowsToCsv('closed'), 'text/csv;charset=utf-8'));
$('downloadPositionCsvBtn').addEventListener('click', () => download('vi_the_dang_co.csv', rowsToCsv('positions'), 'text/csv;charset=utf-8'));
$('downloadJsonBtn').addEventListener('click', () => download('lme_data.json', JSON.stringify(state, null, 2), 'application/json;charset=utf-8'));

['tonsPerLot','feePerMt'].forEach(id => $(id).addEventListener('input', renderAll));

const dropZone = $('dropZone');
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  $('imageInput').files = e.dataTransfer.files;
});

renderAll();
