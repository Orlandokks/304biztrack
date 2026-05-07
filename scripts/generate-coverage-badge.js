const fs = require("fs");
const path = require("path");

const summaryPath = path.join(process.cwd(), "coverage", "coverage-summary.json");
const outputPath = path.join(
  process.cwd(),
  "deployment",
  "evidence",
  "coverage-badge.svg"
);

function getBadgeColor(percent) {
  if (percent >= 90) return "#249672";
  if (percent >= 80) return "#247BA0";
  if (percent >= 60) return "#dfb317";
  return "#e05d44";
}

function escapeXML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

if (!fs.existsSync(summaryPath)) {
  throw new Error("coverage/coverage-summary.json was not found. Run npm run coverage first.");
}

const coverageSummary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
const lineCoverage = Number(coverageSummary.total.lines.pct.toFixed(1));
const message = `${lineCoverage}%`;
const color = getBadgeColor(lineCoverage);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="158" height="28" role="img" aria-label="Istanbul coverage: ${escapeXML(message)}">
  <title>Istanbul coverage: ${escapeXML(message)}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="158" height="28" rx="4" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="108" height="28" fill="#555"/>
    <rect x="108" width="50" height="28" fill="${color}"/>
    <rect width="158" height="28" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text x="54" y="18" fill="#010101" fill-opacity=".3">Istanbul coverage</text>
    <text x="54" y="17">Istanbul coverage</text>
    <text x="132" y="18" fill="#010101" fill-opacity=".3">${escapeXML(message)}</text>
    <text x="132" y="17">${escapeXML(message)}</text>
  </g>
</svg>
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, svg, "utf8");
console.log(`Coverage badge written to ${outputPath}`);
