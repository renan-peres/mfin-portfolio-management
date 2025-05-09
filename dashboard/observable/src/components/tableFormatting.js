import * as XLSX from "npm:xlsx";
import * as d3 from "d3";
import * as htl from "htl";

const DEFAULT_CONFIG = {
  rows: 15,
  datasetName: "data",
  dateColumns: ['Date', 'date', 'created_date', 'updated_date', 'date_of_birth', 'time', 'pickup', 
              'dropoff', 'birthday', 'First Inauguration Date', 'last_updated', 'retrieved_time'],
  dateFormat: d3.timeFormat("%Y-%m-%d"),
  decimalColumns: [],
  formatSpecifiers: {},
  additionalFormatting: {
    url: (x) => x ? htl.html`<a href="${/^https?:\/\//.test(x) ? x : 'https://' + x}" target="_blank">${x}</a>` : '',
    URL: (x) => x ? htl.html`<a href="${/^https?:\/\//.test(x) ? x : 'https://' + x}" target="_blank">${x}</a>` : '',
    website: (x) => x ? htl.html`<a href="${/^https?:\/\//.test(x) ? x : 'https://' + x}" target="_blank">${x}</a>` : '',
    image: (x) => x ? htl.html`<a href="${/^https?:\/\//.test(x) ? x : 'https://' + x}" target="_blank">${x}</a>` : '',
    link: (x) => x ? htl.html`<a href="${/^https?:\/\//.test(x) ? x : 'https://' + x}" target="_blank">${x}</a>` : '',
    final_link: (x) => x ? htl.html`<a href="${/^https?:\/\//.test(x) ? x : 'https://' + x}" target="_blank">${x}</a>` : '',
    'Portrait URL': (x) => x ? htl.html`<a href="${/^https?:\/\//.test(x) ? x : 'https://' + x}" target="_blank">${x}</a>` : ''
  }
};

const createButton = (text, styles, onClick) => {
  const button = document.createElement("button");
  button.textContent = text;
  Object.assign(button.style, styles);
  if (onClick) button.onclick = onClick;
  return button;
};

const parseDate = (value, dateFormat) => {
  if (!value) return '';
  const date = d3.isoParse(value) || new Date(value);
  return dateFormat(date);
};

const formatDecimal = value => parseFloat(value).toFixed(2);

const convertToArray = data => {
  if (data.toArray) return data.toArray().map(row => Object.fromEntries(row));
  if (Array.isArray(data)) return data;
  return Array.from(data);
};

const createDownloadButton = (text, dataArray, datasetName, format, formatSpecifiers) => 
  createButton(text, { marginRight: "10px" }, () => {
    try {
      const formattedDataArray = dataArray.map(item => ({
        ...item,
        ...Object.fromEntries(
          Object.entries(item).map(([key, value]) => [key, (formatSpecifiers[key] || (v => v))(value)])
        )
      }));
      const worksheet = XLSX.utils.json_to_sheet(formattedDataArray);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, datasetName);
      XLSX.writeFile(workbook, `${datasetName}.${format}`);
    } catch (error) {
      console.error(`Error creating ${format.toUpperCase()} file:`, error);
    }
  });

export const getTableFormat = (data, options = {}) => {
  const { rows, datasetName, dateColumns, dateFormat, decimalColumns, formatSpecifiers } = { ...DEFAULT_CONFIG, ...options };

  let dataArray = convertToArray(data);
  
  dataArray = dataArray.map(item => ({
    ...item,
    ...Object.fromEntries(
      Object.entries(item)
        .filter(([key, value]) => value && dateColumns.includes(key))
        .map(([key, value]) => [key, parseDate(value, dateFormat)])
    ),
    ...Object.fromEntries(
      Object.entries(item)
        .filter(([key, value]) => value && decimalColumns.includes(key))
        .map(([key, value]) => [key, formatDecimal(value)])
    )
  }));

  const xlsxButton = createDownloadButton(`Download ${datasetName}.xlsx`, dataArray, datasetName, 'xlsx', formatSpecifiers);
  const csvButton = createDownloadButton(`Download ${datasetName}.csv`, dataArray, datasetName, 'csv', formatSpecifiers);

  const container = document.createElement("div");
  const buttonContainer = document.createElement("div");
  const dataContainer = document.createElement("div");
  const tableContainer = document.createElement("div");
  
  buttonContainer.style.marginBottom = "10px";
  dataContainer.style.display = "none";
  tableContainer.style.display = "none";
  
  const jsonToggleButton = createButton("Show JSON", { marginRight: "10px", background: "rgb(65, 96, 182)", "border-radius": "4px", padding: "4px 9px", color: "white", border: "none"}, () => {
    const isHidden = dataContainer.style.display === 'none';
    dataContainer.style.display = isHidden ? 'block' : 'none';
    jsonToggleButton.textContent = isHidden ? 'Hide JSON' : 'Show JSON';
  });

  const dataDisplay = document.createElement("pre");
  dataDisplay.style.maxHeight = "400px";
  dataDisplay.style.overflow = "auto";
  dataDisplay.textContent = JSON.stringify(dataArray, null, 2);
  
  dataContainer.appendChild(dataDisplay);
  buttonContainer.append(jsonToggleButton, xlsxButton, csvButton);
  container.append(buttonContainer, dataContainer, tableContainer);

  const format = Object.fromEntries(
    dateColumns.map(colName => [colName, value => parseDate(value, dateFormat)])
  );

  return { container, format, rows, dataArray };
};

export const getCustomTableFormat = (data, options = {}) => {
  const { additionalFormatting = {}, ...baseOptions } = { ...DEFAULT_CONFIG, ...options };
  const baseConfig = getTableFormat(data, baseOptions);
  
  return {
    ...baseConfig,
    format: { ...baseConfig.format, ...additionalFormatting }
  };
};

export const createCollapsibleSection = (content, buttonText = "Show Data", defaultState = "hide") => {
  const isCollapsed = defaultState === "hide";
  return htl.html`
    <div>
      <button 
        style="margin-bottom: 10px; padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;"
        onclick=${(e) => {
          const dataSection = e.target.nextElementSibling;
          const isHidden = dataSection.style.display === 'none';
          
          dataSection.style.display = isHidden ? 'block' : 'none';
          e.target.textContent = isHidden ? 'Hide Data' : buttonText;
        }}
      >
        ${isCollapsed ? buttonText : 'Hide Data'}
      </button>
      
      <div style="display: ${isCollapsed ? 'none' : 'block'};">
        ${content}
      </div>
    </div>
  `;
};