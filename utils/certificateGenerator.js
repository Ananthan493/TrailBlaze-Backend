import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateCertificate = async (studentName, courseName, completionDate) => {
  console.log('Starting certificate generation:', { studentName, courseName, completionDate });

  const dirs = {
    uploads: path.join(__dirname, '..', 'uploads'),
    certificates: path.join(__dirname, '..', 'uploads', 'certificates'),
    public: path.join(__dirname, '..', 'public')
  };

  // Ensure directories exist
  Object.entries(dirs).forEach(([name, dir]) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created ${name} directory:`, dir);
    }
  });

  // Generate safe filename
  const safeFilename = `${Date.now()}_${studentName.replace(/[^a-z0-9]/gi, '_')}.pdf`;
  const pdfPath = path.join(dirs.certificates, safeFilename);
  
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document with error handling
      const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
        margin: 0,
        info: {
          Title: `Certificate - ${courseName}`,
          Author: 'TrailBlaze LMS',
          Subject: 'Course Completion Certificate'
        }
      });

      const stream = fs.createWriteStream(pdfPath);
      
      stream.on('error', (error) => {
        console.error('Stream error:', error);
        reject(new Error('Failed to write certificate file'));
      });

      doc.pipe(stream);

      // Add certificate content
      // Add background color
      doc.rect(0, 0, doc.page.width, doc.page.height)
         .fill('#f8f9fa');

      // Add decorative border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
         .lineWidth(3)
         .strokeColor('#1e40af');
      
      // Add inner border
      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
         .stroke();

      // Add certificate heading
      doc.font('Helvetica-Bold')
         .fontSize(50)
         .fillColor('#1e40af')
         .text('Certificate of Completion', 0, 100, {
           align: 'center'
         });

      // Add decorative line
      doc.moveTo(doc.page.width / 4, 180)
         .lineTo((doc.page.width / 4) * 3, 180)
         .stroke();

      // Add certificate text
      doc.font('Helvetica')
         .fontSize(24)
         .fillColor('#374151')
         .text('This is to certify that', 0, 220, {
           align: 'center'
         });

      // Add student name
      doc.font('Helvetica-Bold')
         .fontSize(40)
         .fillColor('#111827')
         .text(studentName, 0, 280, {
           align: 'center'
         });

      // Add course completion text
      doc.font('Helvetica')
         .fontSize(24)
         .fillColor('#374151')
         .text('has successfully completed the course', 0, 350, {
           align: 'center'
         });

      // Add course name
      doc.font('Helvetica-Bold')
         .fontSize(32)
         .fillColor('#1e40af')
         .text(courseName, 0, 400, {
           align: 'center'
         });

      // Add completion date
      doc.font('Helvetica')
         .fontSize(18)
         .fillColor('#374151')
         .text(`Completed on ${completionDate}`, 0, 480, {
           align: 'center'
         });

      // Add platform signature
      doc.font('Helvetica-Bold')
         .fontSize(24)
         .fillColor('#1e40af')
         .text('TrailBlaze LMS', 0, 520, {
           align: 'center'
         });

      // Add decorative elements
      doc.image(path.join(__dirname, '..', 'public', 'certificate-seal.png'), 
        doc.page.width - 150, doc.page.height - 150, 
        { width: 100 });

      // Add error handler for doc
      doc.on('error', (error) => {
        console.error('PDF generation error:', error);
        reject(new Error('Failed to generate PDF'));
      });

      // Finalize document
      doc.end();

      stream.on('finish', () => {
        const relativePath = `/uploads/certificates/${safeFilename}`;
        console.log('Certificate generated:', {
          path: relativePath,
          exists: fs.existsSync(pdfPath),
          size: fs.statSync(pdfPath).size
        });
        resolve(relativePath);
      });

    } catch (error) {
      console.error('Certificate generation failed:', error);
      reject(error);
    }
  });
};

export default generateCertificate;
