import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generatePDF() {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new'
    });

    const page = await browser.newPage();
    const htmlPath = join(__dirname, '../coverage/lcov-report/index.html');
    
    // Cargar el archivo HTML local
    await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Generar PDF
    const pdfPath = join(__dirname, '../coverage/coverage-report.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      printBackground: true
    });

    console.log(`✓ PDF generado exitosamente en: ${pdfPath}`);

  } catch (error) {
    console.error('Error al generar PDF:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

generatePDF();
