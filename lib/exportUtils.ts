import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Generates and downloads a PDF from an element ID
 */
export async function downloadAsPDF(elementId: string, fileName: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${fileName}.pdf`);
  } catch (err) {
    console.error('Error generating PDF:', err);
    throw err;
  }
}

/**
 * Generates and downloads a Word file based on data
 */
export async function downloadAsWord(data: { title: string, sections: { title: string, content: any[] }[] }, fileName: string) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: data.title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          ...data.sections.flatMap(section => [
            new Paragraph({
              text: section.title,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 }
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                // Header row
                new TableRow({
                  children: Object.keys(section.content[0] || {}).map(key => 
                    new TableCell({
                      children: [new Paragraph({ text: key.charAt(0).toUpperCase() + key.slice(1), bold: true })],
                      shading: { fill: "f3f4f6" }
                    })
                  )
                }),
                // Data rows
                ...section.content.map(item => 
                  new TableRow({
                    children: Object.values(item).map(val => 
                      new TableCell({
                        children: [new Paragraph({ text: String(val || '') })]
                      })
                    )
                  })
                )
              ]
            }),
            new Paragraph({ text: "", spacing: { after: 200 } })
          ])
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileName}.docx`);
}
