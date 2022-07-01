const assert = require("assert").strict;
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
const CMAP_URL = "./node_modules/pdfjs-dist/cmaps/";
const STANDARD_FONT_DATA_URL = "./node_modules/pdfjs-dist/standard_fonts/";
const fs = require("fs");
const CMAP_PACKED = true;
const pdfPath = process.argv[2] || "./input.pdf";
const data = new Uint8Array(fs.readFileSync(pdfPath));

// Load the PDF file.
const loadingTask = pdfjsLib.getDocument({
    data,
    cMapUrl: CMAP_URL,
    cMapPacked: CMAP_PACKED,
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
});

function getPageText(pageNum, PDFDocumentInstance) {
    return new Promise(function (resolve, reject) {
        PDFDocumentInstance.getPage(pageNum).then(function (pdfPage) {
            let viewport = pdfPage.getViewport({scale: 1});

            pdfPage.getTextContent().then(function (textContent) {
                let listItem =[];
                textContent.items.forEach(function (textItem) {
                    let tx = pdfjsLib.Util.transform(
                        pdfjsLib.Util.transform(viewport.transform, textItem.transform),
                        [1, 0, 0, -1, 0, 0]
                    );
                    let style = textContent.styles[textItem.fontName];

                    // adjust for font ascent/descent
                    let fontSize = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));

                    if (style.ascent) {
                        tx[5] -= fontSize * style.ascent;
                    } else if (style.descent) {
                        tx[5] -= fontSize * (1 + style.descent);
                    } else {
                        tx[5] -= fontSize / 2;
                    }

                    var result = {};
                    result.textContent = textItem.str;
                    result.direction = textItem.dir;
                    result.fontFamily = style.fontFamily;
                    result.transform = 'matrix(' + tx.join(',') + ')';
                    result.fontSize = fontSize + 'px';
                    result.left = tx[4] + 'px';
                    result.top = tx[5] + 'px';
                    listItem.push(result);
                });
                resolve(listItem);
            });
        });
    });
}

(async function () {
    try {
        const pdfDocument = await loadingTask.promise;
        console.log("# PDF document loaded.");
        // Get the first page.

        const page = await getPageText(10, pdfDocument);
        console.log(page);
    } catch (reason) {
        console.log(reason);
    }
})();


