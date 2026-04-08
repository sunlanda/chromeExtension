'use strict';

(function () {
  // ─── HELPERS ────────────────────────────────────────────────────────────────

  function $(id) { return document.getElementById(id); }
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }

  function toast(msg, duration = 2000) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), duration);
  }

  function debounce(fn, delay) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  }

  function svgToBlob(svgStr) {
    return new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  }

  // Export canvas as PNG blob
  function canvasToBlob(canvas, filename) {
    return new Promise(resolve => {
      canvas.toBlob(blob => { downloadBlob(blob, filename); resolve(); }, 'image/png');
    });
  }

  // Export canvas as JPG blob
  function canvasToJpgBlob(canvas, filename) {
    return new Promise(resolve => {
      canvas.toBlob(blob => { downloadBlob(blob, filename); resolve(); }, 'image/jpeg', 0.95);
    });
  }

  // Copy canvas to clipboard
  async function copyCanvasToClipboard(canvas) {
    try {
      const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      toast('已复制到剪贴板 ✓');
    } catch {
      toast('复制失败，请手动截图', 3000);
    }
  }

  // ─── QR CODE ENGINE ─────────────────────────────────────────────────────────

  let currentQRText = '';

  function buildQRCanvas(text, options) {
    const canvas = $('qrCanvas');
    const ctx = canvas.getContext('2d');
    const size = options.size || 180;

    canvas.width = size;
    canvas.height = size;

    // Background with rounded corners
    if (options.bgColor) {
      const r = Math.min(options.radius || 0, size / 2);
      ctx.beginPath();
      roundedRect(ctx, 0, 0, size, size, r);
      ctx.fillStyle = options.bgColor;
      ctx.fill();
    }

    // Build QR matrix using davidshimjs/qrcodejs
    // This library uses b (QRCode) constructor and r() to determine type number
    const ecLevelMap = { L: QRCode.CorrectLevel.L, M: QRCode.CorrectLevel.M, Q: QRCode.CorrectLevel.Q, H: QRCode.CorrectLevel.H };
    const ecLevel = ecLevelMap[options.ecLevel] ?? QRCode.CorrectLevel.M;

    const tmpContainer = document.createElement('div');
    tmpContainer.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;';
    document.body.appendChild(tmpContainer);

    const qr = new QRCode(tmpContainer, {
      text: text,
      width: size,
      height: size,
      colorDark: options.fgColor || '#000000',
      colorLight: options.bgColor || '#ffffff',
      correctLevel: ecLevel
    });

    // Extract the rendered canvas from inside the temp container
    const renderedCanvas = tmpContainer.querySelector('canvas');

    if (renderedCanvas) {
      // qrcodejs creates a canvas sized exactly to (width x height) = (size x size)
      // Draw it scaled to fill our canvas
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(renderedCanvas, 0, 0, size, size);
    } else {
      // Fallback: render from 2D modules array if canvas not available (e.g. old browser)
      const modCount = qr._oQRCode ? qr._oQRCode.getModuleCount() : 25;
      const padding = 8;
      const cellSize = (size - padding * 2) / modCount;
      ctx.fillStyle = options.fgColor || '#000000';
      for (let row = 0; row < modCount; row++) {
        for (let col = 0; col < modCount; col++) {
          if (qr._oQRCode.isDark(row, col)) {
            ctx.fillRect(col * cellSize + padding, row * cellSize + padding, cellSize, cellSize);
          }
        }
      }
    }

    document.body.removeChild(tmpContainer);

    // Draw logo area if enabled
    if (options.logo && options.size >= 120) {
      const logoSize = Math.round(size * 0.2);
      const lx = (size - logoSize) / 2;
      const ly = (size - logoSize) / 2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      roundedRect(ctx, lx, ly, logoSize, logoSize, 4);
      ctx.fill();
      ctx.strokeStyle = '#d0d0d0';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#0A7EA5';
      const iconSize = logoSize * 0.5;
      const ix = (size - iconSize) / 2;
      const iy = (size - iconSize) / 2;
      ctx.fillRect(Math.round(ix), Math.round(iy), iconSize, iconSize);
    }
  }

  function roundedRect(ctx, x, y, w, h, r) {
    if (r <= 0) { ctx.rect(x, y, w, h); return; }
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
  }

  function getExportFilename(ext) {
    const text = currentQRText.slice(0, 20).replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_') || 'qrcode';
    return `qr_${text}_${Date.now()}.${ext}`;
  }

  function getBCExportFilename(ext) {
    const text = $('bcText').value.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_') || 'barcode';
    return `barcode_${text}_${Date.now()}.${ext}`;
  }

  function getQRExportOptions() {
    return {
      size: parseInt($('qrSize').value) || 180,
      fgColor: $('qrFgColor').value || '#000000',
      bgColor: $('qrBgColor').value || '#ffffff',
      ecLevel: $('qrEcLevel').value || 'M',
      radius: parseInt($('qrRadius').value) || 0,
      logo: $('qrLogoToggle').checked
    };
  }

  function renderQR() {
    const text = $('qrText').value.trim();
    currentQRText = text;
    $('charCount').textContent = text.length;

    if (!text) {
      $('qrCanvas').style.display = 'none';
      $('qrEmpty').style.display = '';
      return;
    }

    const opts = getQRExportOptions();
    buildQRCanvas(text, opts);

    $('qrCanvas').style.display = '';
    $('qrEmpty').style.display = 'none';

    // Apply CSS border-radius to canvas wrapper via clip
    applyQRRadius(opts.radius);
    saveState();
  }

  function applyQRRadius(r) {
    const canvas = $('qrCanvas');
    if (r <= 0) {
      canvas.style.borderRadius = '0';
      return;
    }
    const size = parseInt($('qrSize').value) || 180;
    canvas.style.borderRadius = r + 'px';
  }

  // ─── BARCODE ENGINE ──────────────────────────────────────────────────────────

  let currentBcType = 'CODE128';
  let currentBcText = '';

  const BC_TYPE_HINTS = {
    CODE128: '支持任意ASCII字符',
    CODE39: '支持大写字母、数字、-. $/+%',
    EAN13: '必须为12或13位数字',
    EAN8: '必须为7或8位数字',
    UPC: '必须为11或12位数字',
    ITF14: '必须为13或14位数字',
    CODABAR: '支持数字、$/:+.和ABCD',
    PHARMACODE: '必须为1-131070之间的整数'
  };

  function validateBcText(type, text) {
    switch (type) {
      case 'EAN13':
        if (!/^\d{12,13}$/.test(text)) return 'EAN-13 需要12或13位数字';
        break;
      case 'EAN8':
        if (!/^\d{7,8}$/.test(text)) return 'EAN-8 需要7或8位数字';
        break;
      case 'UPC':
        if (!/^\d{11,12}$/.test(text)) return 'UPC-A 需要11或12位数字';
        break;
      case 'ITF14':
        if (!/^\d{13,14}$/.test(text)) return 'ITF-14 需要13或14位数字';
        break;
      case 'PHARMACODE':
        if (!/^\d+$/.test(text) || parseInt(text) < 1 || parseInt(text) > 131070)
          return 'Pharmacode 需为1-131070的整数';
        break;
    }
    return null;
  }

  function renderBarcode() {
    const text = $('bcText').value.trim();
    currentBcText = text;
    $('bcCharCount').textContent = text.length;

    if (!text) {
      $('bcSvg').style.display = 'none';
      $('bcEmpty').style.display = '';
      return;
    }

    const err = validateBcText(currentBcType, text);
    if (err) {
      $('bcSvg').style.display = 'none';
      $('bcEmpty').style.display = '';
      toast(err, 2500);
      return;
    }

    const fg = $('bcFgColor').value || '#000000';
    const bg = $('bcBgColor').value || '#ffffff';
    const height = parseInt($('bcHeight').value) || 80;
    const barWidth = parseInt($('bcBarWidth').value) || 2;
    const showText = $('bcShowText').checked;
    const transparent = $('bcTransparent').checked;
    const radius = parseInt($('bcRadius').value) || 0;

    try {
      const svg = $('bcSvg');
      const width = barWidth * text.length * 10 + 40;
      svg.setAttribute('width', width);
      svg.setAttribute('height', height + (showText ? 24 : 0));
      svg.setAttribute('viewBox', `0 0 ${width} ${height + (showText ? 24 : 0)}`);
      svg.style.display = '';
      svg.style.borderRadius = radius > 0 ? radius + 'px' : '';

      // Use JsBarcode to render to SVG
      JsBarcode(svg, text, {
        format: currentBcType,
        width: barWidth,
        height: height,
        displayValue: showText,
        fontSize: 14,
        fontOptions: 'bold',
        font: 'JetBrains Mono, monospace',
        textMargin: 4,
        margin: 8,
        background: transparent ? '#00000000' : bg,
        lineColor: fg
      });

      $('bcEmpty').style.display = 'none';
      saveState();
    } catch (e) {
      $('bcSvg').style.display = 'none';
      $('bcEmpty').style.display = '';
      toast('条码生成失败: ' + e.message, 3000);
    }
  }

  // ─── EXPORT ─────────────────────────────────────────────────────────────────

  async function exportQRCanvasAsPng() {
    const canvas = $('qrCanvas');
    if (!canvas || canvas.style.display === 'none') { toast('先生成二维码'); return; }
    const filename = getExportFilename('png');
    await canvasToBlob(canvas, filename);
    toast('PNG 已下载 ✓');
  }

  async function exportQRCanvasAsJpg() {
    const canvas = $('qrCanvas');
    if (!canvas || canvas.style.display === 'none') { toast('先生成二维码'); return; }

    // Draw onto a white canvas for JPG
    const size = canvas.width;
    const offscreen = document.createElement('canvas');
    offscreen.width = size; offscreen.height = size;
    const ctx = offscreen.getContext('2d');
    ctx.fillStyle = $('qrBgColor').value || '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(canvas, 0, 0);

    const filename = getExportFilename('jpg');
    await canvasToJpgBlob(offscreen, filename);
    toast('JPG 已下载 ✓');
  }

  function exportQRSvg() {
    const canvas = $('qrCanvas');
    if (!canvas || canvas.style.display === 'none') { toast('先生成二维码'); return; }

    const size = canvas.width;
    const fg = $('qrFgColor').value || '#000000';
    const bg = $('qrBgColor').value || '#ffffff';
    const radius = parseInt($('qrRadius').value) || 0;

    // Re-render with size metadata for SVG export
    const text = $('qrText').value.trim();
    const opts = getQRExportOptions();

    // Build SVG from QRCode matrix using davidshimjs/qrcodejs
    const ecLevelMap = { L: QRCode.CorrectLevel.L, M: QRCode.CorrectLevel.M, Q: QRCode.CorrectLevel.Q, H: QRCode.CorrectLevel.H };
    const ecLevel = ecLevelMap[opts.ecLevel] ?? QRCode.CorrectLevel.M;

    const tmpContainer = document.createElement('div');
    tmpContainer.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;';
    document.body.appendChild(tmpContainer);

    const qr = new QRCode(tmpContainer, {
      text: text,
      width: size,
      height: size,
      colorDark: fg,
      colorLight: bg,
      correctLevel: ecLevel
    });

    const modCount = qr._oQRCode.getModuleCount();
    const padding = 8;
    const cellSize = (size - padding * 2) / modCount;

    let rects = '';
    for (let row = 0; row < modCount; row++) {
      for (let col = 0; col < modCount; col++) {
        if (qr._oQRCode.isDark(row, col)) {
          const x = col * cellSize + padding;
          const y = row * cellSize + padding;
          rects += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" fill="${fg}"/>`;
        }
      }
    }

    document.body.removeChild(tmpContainer);

    const bgRect = `<rect width="${size}" height="${size}" fill="${bg}" rx="${radius}" ry="${radius}"/>`;
    const svgStr = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
${bgRect}
${rects}
</svg>`;

    downloadBlob(svgToBlob(svgStr), getExportFilename('svg'));
    toast('SVG 已下载 ✓');
  }

  async function exportBcPng() {
    const svg = $('bcSvg');
    if (!svg || svg.style.display === 'none') { toast('先生成条形码'); return; }
    const blob = await svgToPngBlob(svg);
    downloadBlob(blob, getBCExportFilename('png'));
    toast('PNG 已下载 ✓');
  }

  function exportBcSvg() {
    const svg = $('bcSvg');
    if (!svg || svg.style.display === 'none') { toast('先生成条形码'); return; }
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    downloadBlob(svgToBlob(svgStr), getBCExportFilename('svg'));
    toast('SVG 已下载 ✓');
  }

  async function copyBcSvg() {
    const svg = $('bcSvg');
    if (!svg || svg.style.display === 'none') { toast('先生成条形码'); return; }
    try {
      const blob = await svgToPngBlob(svg);
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast('已复制到剪贴板 ✓');
    } catch {
      toast('复制失败', 2000);
    }
  }

  // Convert SVG element to PNG blob
  function svgToPngBlob(svgEl) {
    return new Promise((resolve, reject) => {
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svgEl);
      const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = $('bcBgColor').value || '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas to blob failed'));
        }, 'image/png');
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
      img.src = url;
    });
  }

  // ─── STATE PERSISTENCE ───────────────────────────────────────────────────────

  const STORAGE_KEY = 'bigqr_state_v1';

  function saveState() {
    if (!$('rememberText').checked) return;
    const state = {
      qrText: $('qrText').value,
      bcText: $('bcText').value,
      qrFgColor: $('qrFgColor').value,
      qrBgColor: $('qrBgColor').value,
      qrSize: $('qrSize').value,
      qrEcLevel: $('qrEcLevel').value,
      qrRadius: $('qrRadius').value,
      qrLogoToggle: $('qrLogoToggle').checked,
      bcFgColor: $('bcFgColor').value,
      bcBgColor: $('bcBgColor').value,
      bcHeight: $('bcHeight').value,
      bcBarWidth: $('bcBarWidth').value,
      bcRadius: $('bcRadius').value,
      bcShowText: $('bcShowText').checked,
      bcTransparent: $('bcTransparent').checked,
      currentBcType: currentBcType,
      showBorder: $('showBorder').checked,
      translucentMode: $('translucentMode').checked,
      autoUrl: $('autoUrl').checked,
      defaultFormat: $('defaultFormat').value,
      defaultSize: $('defaultSize').value,
      showDataCard: $('showDataCard').checked,
      dataCardBorder: $('dataCardBorder').checked,
      dataCardRadius: $('dataCardRadius').value,
      dataCardFontSize: $('dataCardFontSize').value
    };
    chrome.storage.local.set({ [STORAGE_KEY]: state });
  }

  function loadState() {
    chrome.storage.local.get(STORAGE_KEY, result => {
      const s = result[STORAGE_KEY];
      if (!s) return;

      $('qrText').value = s.qrText || '';
      $('bcText').value = s.bcText || '';

      // After restoring state, render both codes immediately
      setTimeout(() => {
        renderQR();
        renderBarcode();
      }, 0);
      $('qrFgColor').value = s.qrFgColor || '#000000';
      $('qrBgColor').value = s.qrBgColor || '#ffffff';
      $('qrSize').value = s.qrSize || '180';
      $('qrEcLevel').value = s.qrEcLevel || 'M';
      $('qrRadius').value = s.qrRadius || '0';
      $('qrLogoToggle').checked = !!s.qrLogoToggle;
      $('bcFgColor').value = s.bcFgColor || '#000000';
      $('bcBgColor').value = s.bcBgColor || '#ffffff';
      $('bcHeight').value = s.bcHeight || '80';
      $('bcBarWidth').value = s.bcBarWidth || '2';
      $('bcRadius').value = s.bcRadius || '0';
      $('bcShowText').checked = s.bcShowText !== false;
      $('bcTransparent').checked = !!s.bcTransparent;
      $('showBorder').checked = !!s.showBorder;
      $('translucentMode').checked = !!s.translucentMode;
      $('autoUrl').checked = s.autoUrl !== false;
      $('defaultFormat').value = s.defaultFormat || 'png';
      $('defaultSize').value = s.defaultSize || '300';
      $('showDataCard').checked = !!s.showDataCard;
      $('dataCardBorder').checked = !!s.dataCardBorder;
      $('dataCardRadius').value = s.dataCardRadius || '8';
      $('dataCardFontSize').value = s.dataCardFontSize || '12';

      if (s.currentBcType) {
        currentBcType = s.currentBcType;
        updateBcTypeButtons(currentBcType);
      }

      applyGlobalSettings();
    });
  }

  function resetSettings() {
    const defaults = {
      qrFgColor: '#000000', qrBgColor: '#ffffff', qrSize: '180',
      qrEcLevel: 'M', qrRadius: '0', qrLogoToggle: false,
      bcFgColor: '#000000', bcBgColor: '#ffffff', bcHeight: '80',
      bcBarWidth: '2', bcRadius: '0', bcShowText: true, bcTransparent: false,
      showBorder: false, translucentMode: false, autoUrl: true,
      defaultFormat: 'png', defaultSize: '300', showDataCard: false,
      dataCardBorder: false, dataCardRadius: '8', dataCardFontSize: '12'
    };
    Object.entries(defaults).forEach(([k, v]) => {
      const el = $(k);
      if (el) {
        if (el.type === 'checkbox') el.checked = v;
        else el.value = v;
      }
    });
    applyGlobalSettings();
    saveState();
    toast('已恢复默认设置 ✓');
  }

  // ─── GLOBAL SETTINGS ────────────────────────────────────────────────────────

  function applyGlobalSettings() {
    // Translucent mode
    const body = document.body;
    if ($('translucentMode').checked) {
      body.style.opacity = '0.92';
      body.style.background = 'rgba(240,244,248,0.95)';
      body.style.backdropFilter = 'blur(8px)';
    } else {
      body.style.opacity = '';
      body.style.background = '';
      body.style.backdropFilter = '';
    }

    // Border indicator
    const qrWrap = $('qrPreviewWrap');
    if ($('showBorder').checked) {
      qrWrap.classList.add('border-visible');
    } else {
      qrWrap.classList.remove('border-visible');
    }
  }

  // ─── TAB SWITCHING ───────────────────────────────────────────────────────────

  function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const panel = document.getElementById('tab-' + btn.dataset.tab);
        if (panel) panel.classList.add('active');
      });
    });
  }

  // ─── URL FETCHING ────────────────────────────────────────────────────────────

  function fetchCurrentUrl() {
    if (!$('autoUrl').checked) return;
    if ($('qrText').value.trim()) return; // Don't override if user has typed

    chrome.tabs?.query({ active: true, currentWindow: true }, tabs => {
      if (tabs && tabs[0] && tabs[0].url) {
        $('qrText').value = tabs[0].url;
        renderQR();
      }
    });
  }

  // ─── BARCODE TYPE SELECTION ─────────────────────────────────────────────────

  function updateBcTypeButtons(activeType) {
    document.querySelectorAll('.barcode-type-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.type === activeType);
    });
  }

  function initBarcodeTypes() {
    document.querySelectorAll('.barcode-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentBcType = btn.dataset.type;
        updateBcTypeButtons(currentBcType);
        renderBarcode();
      });
    });
  }

  // ─── SLIDER VALUE DISPLAY ───────────────────────────────────────────────────

  function initSliders() {
    function bindSlider(sliderId, valId, suffix, cb) {
      const slider = $(sliderId);
      const valEl = $(valId);
      if (!slider || !valEl) return;
      const update = () => {
        valEl.textContent = slider.value + suffix;
        if (cb) cb(parseInt(slider.value));
        saveState();
      };
      slider.addEventListener('input', update);
      update();
    }

    bindSlider('qrRadius', 'qrRadiusVal', 'px');
    bindSlider('bcRadius', 'bcRadiusVal', 'px');
    bindSlider('defaultSize', 'defaultSizeVal', 'px');
    bindSlider('dataCardRadius', 'dataCardRadiusVal', 'px');
    bindSlider('dataCardFontSize', 'dataCardFontSizeVal', 'px');
  }

  // ─── INPUT ACTIONS ───────────────────────────────────────────────────────────

  function initInputActions() {
    // Paste
    $('pasteBtn').addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        $('qrText').value = text;
        renderQR();
        toast('已粘贴 ✓');
      } catch {
        toast('粘贴失败，请手动粘贴', 2000);
      }
    });

    // Clear
    $('clearBtn').addEventListener('click', () => {
      $('qrText').value = '';
      renderQR();
    });

    // Copy text
    $('copyBtn').addEventListener('click', () => {
      const text = $('qrText').value;
      if (!text) { toast('无内容可复制'); return; }
      navigator.clipboard.writeText(text).then(() => toast('已复制 ✓')).catch(() => toast('复制失败'));
    });

    // Use current URL
    $('useUrlBtn').addEventListener('click', () => {
      chrome.tabs?.query({ active: true, currentWindow: true }, tabs => {
        if (tabs && tabs[0] && tabs[0].url) {
          $('qrText').value = tabs[0].url;
          renderQR();
          toast('已填入当前网址 ✓');
        } else {
          toast('无法获取当前网址', 2000);
        }
      });
    });
  }

  // ─── EXPORT BUTTONS ─────────────────────────────────────────────────────────

  function initExportButtons() {
    $('dlPng').addEventListener('click', exportQRCanvasAsPng);
    $('dlJpg').addEventListener('click', exportQRCanvasAsJpg);
    $('dlSvg').addEventListener('click', exportQRSvg);
    $('bcPng').addEventListener('click', exportBcPng);
    $('bcSvgBtn').addEventListener('click', exportBcSvg);
    $('bcCopy').addEventListener('click', copyBcSvg);
    $('resetSettings').addEventListener('click', resetSettings);
  }

  // ─── COPY ON PREVIEW CLICK ──────────────────────────────────────────────────

  function initPreviewClick() {
    $('qrPreviewWrap').addEventListener('click', () => {
      const canvas = $('qrCanvas');
      if (!canvas || canvas.style.display === 'none') return;
      copyCanvasToClipboard(canvas);
    });

    $('bcPreviewWrap').addEventListener('click', async () => {
      const svg = $('bcSvg');
      if (!svg || svg.style.display === 'none') return;
      try {
        const blob = await svgToPngBlob(svg);
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        toast('已复制到剪贴板 ✓');
      } catch {
        toast('复制失败', 2000);
      }
    });
  }

  // ─── SETTINGS AUTOSAVE ──────────────────────────────────────────────────────

  function initSettingsAutosave() {
    const inputs = document.querySelectorAll('#tab-settings input, #tab-settings select');
    inputs.forEach(el => {
      if (el.type === 'checkbox') {
        el.addEventListener('change', () => { applyGlobalSettings(); saveState(); });
      } else {
        el.addEventListener('change', saveState);
      }
    });
  }

  // ─── QR SETTINGS AUTOSAVE ───────────────────────────────────────────────────

  function initQRSettings() {
    ['qrFgColor', 'qrBgColor', 'qrSize', 'qrEcLevel', 'qrLogoToggle'].forEach(id => {
      const el = $(id);
      if (!el) return;
      if (el.type === 'checkbox') el.addEventListener('change', renderQR);
      else el.addEventListener('change', renderQR);
    });
    $('qrRadius').addEventListener('input', () => {
      $('qrRadiusVal').textContent = $('qrRadius').value + 'px';
      renderQR();
    });
  }

  // ─── BC SETTINGS AUTOSAVE ───────────────────────────────────────────────────

  function initBCSettings() {
    ['bcFgColor', 'bcBgColor', 'bcHeight', 'bcBarWidth', 'bcShowText', 'bcTransparent'].forEach(id => {
      const el = $(id);
      if (!el) return;
      if (el.type === 'checkbox') el.addEventListener('change', renderBarcode);
      else el.addEventListener('change', renderBarcode);
    });
    $('bcRadius').addEventListener('input', () => {
      $('bcRadiusVal').textContent = $('bcRadius').value + 'px';
      renderBarcode();
    });
  }

  // ─── KEYBOARD SHORTCUTS ─────────────────────────────────────────────────────

  function initKeyboardShortcuts() {
    // Ctrl+Enter to generate (focus textarea)
    $('qrText').addEventListener('keydown', e => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        exportQRCanvasAsPng();
      }
      if (e.key === 'Escape') {
        $('qrText').blur();
      }
    });

    $('bcText').addEventListener('keydown', e => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        exportBcPng();
      }
      if (e.key === 'Escape') {
        $('bcText').blur();
      }
    });
  }

  // ─── DATA CARD RENDERING ───────────────────────────────────────────────────

  function initDataCard() {
    const observer = new MutationObserver(debounce(() => {
      if ($('showDataCard').checked) renderDataCard();
    }, 300));
    observer.observe($('qrText'), { characterData: true, childList: true, subtree: true });
    $('showDataCard').addEventListener('change', () => {
      if ($('showDataCard').checked) renderDataCard();
      else removeDataCard();
    });
    ['dataCardBorder', 'dataCardRadius', 'dataCardFontSize'].forEach(id => {
      $(id).addEventListener('change', renderDataCard);
    });
  }

  function renderDataCard() {
    removeDataCard();
    const text = $('qrText').value.trim();
    if (!text) return;
    const card = document.createElement('div');
    const radius = $('dataCardRadius').value + 'px';
    const fontSize = $('dataCardFontSize').value + 'px';
    const border = $('dataCardBorder').checked ? '1.5px solid var(--border)' : 'none';
    card.style.cssText = `
      margin-top: 8px;
      padding: 8px 10px;
      background: var(--surface);
      border: ${border};
      border-radius: ${radius};
      font-family: 'JetBrains Mono', monospace;
      font-size: ${fontSize};
      color: var(--text);
      word-break: break-all;
      line-height: 1.4;
      max-height: 60px;
      overflow: hidden;
      position: relative;
    `;
    // Truncate with ellipsis
    card.textContent = text.length > 200 ? text.slice(0, 200) + '...' : text;
    if (text.length > 200) {
      card.title = text; // full text on hover
    }
    $('qrPreviewWrap').parentNode.insertBefore(card, $('qrPreviewWrap').nextSibling);
  }

  function removeDataCard() {
    const existing = document.querySelector('.data-card');
    if (existing) existing.remove();
  }

  // ─── INIT ───────────────────────────────────────────────────────────────────

  function init() {
    initTabs();
    initSliders();
    initInputActions();
    initExportButtons();
    initPreviewClick();
    initSettingsAutosave();
    initQRSettings();
    initBCSettings();
    initKeyboardShortcuts();
    initBarcodeTypes();
    initDataCard();

    // QR code text → live render
    $('qrText').addEventListener('input', debounce(renderQR, 150));
    $('qrText').addEventListener('keyup', debounce(renderQR, 150));

    // Barcode text → live render
    $('bcText').addEventListener('input', debounce(renderBarcode, 300));
    $('bcText').addEventListener('keyup', debounce(renderBarcode, 300));

    // Load saved state
    loadState();

    // Fetch current URL after state is loaded
    setTimeout(fetchCurrentUrl, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
