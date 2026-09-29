const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('Smart_School_Project_Report.pdf');

// Custom pager to split text by page
let pageNum = 1;
function render_page(pageData) {
    let render_options = {
        normalizeWhitespace: false,
        disableCombineTextItems: false
    }

    return pageData.getTextContent(render_options)
        .then(function(textContent) {
            let lastY, text = '';
            for (let item of textContent.items) {
                text += item.str + ' ';
            }
            console.log(`Page ${pageNum++}: Length=${text.trim().length} | "${text.trim().substring(0, 50)}"`);
            return text;
        });
}

let options = {
    pagerender: render_page
}

pdf(dataBuffer, options).then(function(data) {
    console.log('Total pages according to pdf-parse:', data.numpages);
}).catch(err => console.error(err));
