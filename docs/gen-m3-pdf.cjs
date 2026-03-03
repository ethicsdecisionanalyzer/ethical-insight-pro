const puppeteer = require("puppeteer");
const path = require("path");

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  const htmlPath = path.resolve(__dirname, "milestone3-status-report.html");
  await page.goto("file:///" + htmlPath.replace(/\\/g, "/"), { waitUntil: "networkidle0" });
  await page.pdf({
    path: path.resolve(__dirname, "Milestone3_Status_Report.pdf"),
    format: "A4",
    printBackground: true,
    margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
  });
  console.log("PDF generated: Milestone3_Status_Report.pdf");
  await browser.close();
})();
