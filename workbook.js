"use strict";

const recordFields = [
  { label: "Heading", value: task => task.heading, width: 27 },
  { label: "Task", value: task => task.text, width: 50 },
  { label: "Status", value: task => taskStatus(task), width: 16 },
  { label: "Date Added", value: task => task.added, type: "timestamp" },
  { label: "Date Completed", value: task => task.completed, type: "timestamp" },
  { label: "Due date", value: task => task.due, type: "day" },
  { label: "Waiting for", value: task => task.waitingFor, width: 30 },
  { label: "Follow-up date", value: task => task.followUp, type: "day" },
  { label: "Notes", value: task => task.notes, width: 48 },
  { label: "Reference link", value: task => task.link, width: 40 },
  { label: "Archive status", value: task => task.archived ? "Archived" : "Active" }
];
const recordColumns = recordFields.map(field => field.label);
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

async function makeWorkbook(records, type = "blob", summary = false) {
  const zip = new JSZip();
  const fields = summary ? [
    { label: "Summary section", value: task => task.summaryGroup, width: 27 },
    { label: "Week starting", value: task => task.weekStart, type: "day" },
    { label: "Week ending", value: task => task.weekEnd, type: "day" },
    ...recordFields
  ] : recordFields;
  const rows = [fields.map(field => field.label), ...records.map(record => fields.map(field => field.value(record)))];
  const sheetName = summary ? "Weekly Summary" : "Tasks";
  const columns = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const range = `A1:${columns[fields.length - 1]}${rows.length}`;
  const cells = rows.map((row, index) => {
    const rowNumber = index + 1;
    return `<row r="${rowNumber}">${row.map((value, column) => {
      const address = `${columns[column]}${rowNumber}`;
      const dateType = fields[column].type;
      if (index && dateType) {
        if (!value) return "";
        const dayOnly = dateType === "day";
        const number = dayOnly ? Date.parse(`${value}T00:00:00Z`) / 86400000 + 25569 : excelDate(value);
        return `<c r="${address}" s="${dayOnly ? 3 : 2}"><v>${number}</v></c>`;
      }
      return `<c r="${address}" t="inlineStr"${index === 0 ? ' s="1"' : ""}><is><t xml:space="preserve">${escapeXml(value ?? "")}</t></is></c>`;
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
  zip.file("xl/workbook.xml", `<workbook xmlns="${sheetNamespace}" xmlns:r="${relNamespace}"><sheets><sheet name="${sheetName}" sheetId="1" r:id="rId1"/></sheets></workbook>`);
  zip.file("xl/_rels/workbook.xml.rels", `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="${relNamespace}/worksheet" Target="worksheets/sheet1.xml"/>
    <Relationship Id="rId2" Type="${relNamespace}/styles" Target="styles.xml"/>
  </Relationships>`);
  zip.file("xl/styles.xml", `<styleSheet xmlns="${sheetNamespace}">
    <numFmts count="2"><numFmt numFmtId="164" formatCode="yyyy-mm-dd hh:mm"/><numFmt numFmtId="165" formatCode="yyyy-mm-dd"/></numFmts>
    <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
    <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
    <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
    <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
    <cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>
    <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
  </styleSheet>`);
  zip.file("xl/worksheets/sheet1.xml", `<worksheet xmlns="${sheetNamespace}">
    <dimension ref="${range}"/>
    <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
    <cols>${fields.map((field, index) => `<col min="${index + 1}" max="${index + 1}" width="${field.width ?? 23}" customWidth="1"/>`).join("")}</cols>
    <sheetData>${cells}</sheetData><autoFilter ref="${range}"/>
  </worksheet>`);
  return zip.generateAsync({
    type, compression: "DEFLATE",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
}
