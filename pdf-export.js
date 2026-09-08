/**
 * Shared PDF export for «Мой дорогой дневник»
 * Requires html2canvas and jsPDF (loaded via CDN before this file).
 */
(function (global) {
  'use strict';

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function dateStamp() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function ensureButton() {
    let btn = document.getElementById('pdfDownloadBtn');
    if (btn) return btn;

    btn = document.createElement('button');
    btn.id = 'pdfDownloadBtn';
    btn.type = 'button';
    btn.className = 'pdf-download-btn';
    btn.setAttribute('aria-label', 'Скачать в PDF');
    btn.innerHTML = '<span class="pdf-icon">📄</span><span class="pdf-label">Скачать в PDF</span>';
    btn.hidden = true;
    document.body.appendChild(btn);
    return btn;
  }

  function injectStyles() {
    if (document.getElementById('pdf-export-styles')) return;
    const style = document.createElement('style');
    style.id = 'pdf-export-styles';
    style.textContent = `
      .pdf-download-btn {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 90;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 18px;
        border: none;
        border-radius: 14px;
        background: linear-gradient(135deg, #1e4fd6, #2bb673);
        color: #fff;
        font-family: inherit;
        font-size: 0.92rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(30, 79, 214, 0.35);
        transition: transform 0.15s, box-shadow 0.15s, opacity 0.2s;
      }
      .pdf-download-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 28px rgba(30, 79, 214, 0.45);
      }
      .pdf-download-btn:active { transform: scale(0.97); }
      .pdf-download-btn:disabled {
        opacity: 0.7;
        cursor: wait;
        transform: none;
      }
      .pdf-download-btn[hidden] { display: none !important; }
      .pdf-icon { font-size: 1.1rem; line-height: 1; }
      @media (max-width: 600px) {
        .pdf-download-btn {
          right: 12px;
          bottom: 12px;
          padding: 11px 14px;
          font-size: 0.85rem;
        }
        .pdf-label { display: none; }
        .pdf-download-btn { border-radius: 50%; width: 52px; height: 52px; justify-content: center; padding: 0; }
        .pdf-icon { font-size: 1.35rem; }
      }

      /* Export-only chrome */
      .pdf-export-root {
        position: fixed;
        left: -9999px;
        top: 0;
        width: 800px;
        background: #ffffff;
        color: #1a1a2e;
        font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
        padding: 32px 28px 40px;
        box-sizing: border-box;
        z-index: -1;
      }
      .pdf-export-root h1 {
        font-size: 22px;
        font-weight: 800;
        margin: 0 0 6px;
        color: #1A3B5C;
      }
      .pdf-export-root .pdf-date {
        font-size: 12px;
        color: #5a6280;
        margin-bottom: 22px;
      }
      .pdf-export-root h2 {
        font-size: 15px;
        font-weight: 700;
        color: #1e4fd6;
        margin: 18px 0 8px;
      }
      .pdf-export-root p, .pdf-export-root li {
        font-size: 13px;
        line-height: 1.45;
        margin: 0 0 6px;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .pdf-export-root .pdf-block {
        border: 1px solid #e6eaf0;
        border-radius: 12px;
        padding: 14px 16px;
        margin-bottom: 12px;
        background: #fafbfd;
      }
      .pdf-export-root .pdf-muted { color: #8a93a8; font-style: italic; }
      .pdf-export-root .pdf-row {
        display: flex;
        gap: 16px;
        align-items: flex-start;
        flex-wrap: wrap;
      }
      .pdf-export-root .pdf-avatar {
        width: 72px;
        height: 96px;
        object-fit: contain;
      }
      .pdf-export-root .pdf-columns {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 12px;
      }
      .pdf-export-root .pdf-col-title {
        font-size: 13px;
        font-weight: 800;
        color: #1e4fd6;
        margin-bottom: 8px;
      }
    `;
    document.head.appendChild(style);
  }

  async function canvasToPdf(canvas, filename) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const usableW = pageW - margin * 2;
    const usableH = pageH - margin * 2;

    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const imgW = usableW;
    const imgH = (canvas.height * imgW) / canvas.width;

    let heightLeft = imgH;
    let y = margin;

    pdf.addImage(imgData, 'JPEG', margin, y, imgW, imgH);
    heightLeft -= usableH;

    while (heightLeft > 2) {
      y = margin - (imgH - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, y, imgW, imgH);
      heightLeft -= usableH;
    }

    pdf.save(filename);
  }

  async function exportElement(el, filename) {
    if (!window.html2canvas || !window.jspdf) {
      alert('Библиотеки для PDF ещё загружаются. Попробуй через секунду.');
      return;
    }
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight
    });
    await canvasToPdf(canvas, filename);
  }

  async function exportBuiltHtml(html, filename) {
    const root = document.createElement('div');
    root.className = 'pdf-export-root';
    root.innerHTML = html;
    document.body.appendChild(root);
    try {
      await exportElement(root, filename);
    } finally {
      root.remove();
    }
  }

  /**
   * @param {Object} opts
   * @param {string} opts.filenamePrefix - e.g. 'Resursnyy_krug'
   * @param {() => boolean} opts.hasData
   * @param {() => (HTMLElement|string|Promise<HTMLElement|string>)} opts.build
   *        return DOM element to capture OR HTML string for structured export
   * @param {number} [opts.pollMs=800]
   */
  function initPdfExport(opts) {
    injectStyles();
    const btn = ensureButton();
    const prefix = opts.filenamePrefix || 'Moy_dnevnik';

    function refresh() {
      try {
        btn.hidden = !opts.hasData();
      } catch (e) {
        btn.hidden = true;
      }
    }

    btn.addEventListener('click', async () => {
      if (btn.disabled) return;
      btn.disabled = true;
      const prev = btn.innerHTML;
      btn.innerHTML = '<span class="pdf-icon">⏳</span><span class="pdf-label">Создаём PDF…</span>';
      try {
        const built = await Promise.resolve(opts.build());
        const filename = prefix + '_' + dateStamp() + '.pdf';
        if (typeof built === 'string') {
          await exportBuiltHtml(built, filename);
        } else if (built instanceof HTMLElement) {
          await exportElement(built, filename);
        } else {
          throw new Error('Нечего экспортировать');
        }
      } catch (err) {
        console.error(err);
        alert('Не удалось создать PDF. Попробуй ещё раз.');
      } finally {
        btn.disabled = false;
        btn.innerHTML = prev;
        refresh();
      }
    });

    refresh();
    setInterval(refresh, opts.pollMs || 1000);

    // Also refresh on storage / input
    document.addEventListener('input', refresh);
    window.addEventListener('storage', refresh);

    return { refresh, button: btn };
  }

  global.DiaryPdf = {
    init: initPdfExport,
    dateStamp: dateStamp,
    escape: function (s) {
      const d = document.createElement('div');
      d.textContent = s == null ? '' : String(s);
      return d.innerHTML;
    }
  };
})(window);
