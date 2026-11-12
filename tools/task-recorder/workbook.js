"use strict";

const recordColumns = ["Heading", "Task", "Status", "Date Added", "Date Completed"];
const sheetNamespace = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const relNamespace = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const localDate = new Intl.DateTimeFormat(undefined, {
  year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
});

function escapeXml(value) {
  return String(value)
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll("\r", "&#13;");
}

function excelDate(iso) {
  const date = new Date(iso);
  return (date.getTime() - date.getTimezoneOffset() * 60000) / 86400000 + 25569;
}

async function makeWorkbook(records, type = "blob") {
  const zip = new JSZip();
  const rows = [recordColumns, ...records.map(record => [
    record.heading, record.text, record.completed ? "Completed" : "Pending", record.added, record.completed
  ])];
  const cells = rows.map((row, index) => {
    const rowNumber = index + 1;
    return `<row r="${rowNumber}">${row.map((value, column) => {
      const address = `${"ABCDE"[column]}${rowNumber}`;
      if (index && column >= 3) {
        return value ? `<c r="${address}" s="2"><v>${excelDate(value)}</v></c>` : "";
      }
      return `<c r="${address}" t="inlineStr"${index === 0 ? ' s="1"' : ""}><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
    }).join("")}</row>`;
  }).join("");
  zip.file("[Content_Types].xml", `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
    <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
    <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  </Types>`);
  zip.file("_rels/.rels", `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="${relNamespace}/officeDocument" Target="xl/workbook.xml"/>
  </Relationships>`);
  zip.file("xl/workbook.xml", `<workbook xmlns="${sheetNamespace}" xmlns:r="${relNamespace}"><sheets><sheet name="Tasks" sheetId="1" r:id="rId1"/></sheets></workbook>`);
  zip.file("xl/_rels/workbook.xml.rels", `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="${relNamespace}/worksheet" Target="worksheets/sheet1.xml"/>
    <Relationship Id="rId2" Type="${relNamespace}/styles" Target="styles.xml"/>
  </Relationships>`);
  zip.file("xl/styles.xml", `<styleSheet xmlns="${sheetNamespace}">
    <numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy-mm-dd hh:mm"/></numFmts>
    <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
    <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
    <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
    <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
    <cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>
    <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
  </styleSheet>`);
  zip.file("xl/worksheets/sheet1.xml", `<worksheet xmlns="${sheetNamespace}">
    <dimension ref="A1:E${rows.length}"/>
    <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
    <cols><col min="1" max="1" width="27" customWidth="1"/><col min="2" max="2" width="50" customWidth="1"/><col min="3" max="3" width="16" customWidth="1"/><col min="4" max="5" width="23" customWidth="1"/></cols>
    <sheetData>${cells}</sheetData><autoFilter ref="A1:E${rows.length}"/>
  </worksheet>`);
  return zip.generateAsync({
    type, compression: "DEFLATE",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
}
