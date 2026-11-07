package com.example.siteamame.service.file;

import com.example.siteamame.enumeration.FileType;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Le type d'un fichier se lit dans ses octets, jamais dans ce que le client annonce. */
class UploadValidatorTest {

    private static final byte[] JPEG = bytes(0xFF, 0xD8, 0xFF, 0xE0, 0, 0x10, 'J', 'F', 'I', 'F');
    private static final byte[] PNG = bytes(0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0x0D);
    private static final byte[] GIF = "GIF89a-contenu".getBytes(StandardCharsets.US_ASCII);
    private static final byte[] WEBP = bytes('R', 'I', 'F', 'F', 0x24, 0, 0, 0, 'W', 'E', 'B', 'P', 'V', 'P', '8', ' ');
    private static final byte[] PDF = "%PDF-1.7\n%contenu".getBytes(StandardCharsets.US_ASCII);
    private static final byte[] OLE2 = bytes(0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1, 0, 0, 0, 0);

    private final UploadValidator validator = new UploadValidator();

    @Test
    void imagesAreRecognisedFromTheirContent() throws IOException {
        assertDetected(JPEG, "photo.jpeg", FileType.IMAGE, "image/jpeg", "jpg");
        assertDetected(PNG, "photo.png", FileType.IMAGE, "image/png", "png");
        assertDetected(GIF, "photo.gif", FileType.IMAGE, "image/gif", "gif");
    }

    @Test
    void webpIsAccepted() throws IOException {
        assertDetected(WEBP, "photo.webp", FileType.IMAGE, "image/webp", "webp");
    }

    @Test
    void theStoredExtensionIsTheDetectedOneNotTheClientOne() throws IOException {
        ValidatedFile valid = validator.validate(
                new MockMultipartFile("file", "rapport.pdf", "application/pdf", PNG), FileType.DOCUMENT);

        assertThat(valid.mimeType()).isEqualTo("image/png");
        assertThat(valid.extension()).isEqualTo("png");
    }

    @Test
    void aDocumentSentWhereAnImageIsExpectedIsRefused() {
        assertRefused(new MockMultipartFile("file", "photo.png", "image/png", PDF), FileType.IMAGE,
                "Une image est attendue");
    }

    @Test
    void documentsAreRecognisedFromTheirContent() throws IOException {
        assertDetected(PDF, "cv.pdf", FileType.DOCUMENT, "application/pdf", "pdf");
        assertDetected(zip("[Content_Types].xml", "word/document.xml"), "cv.docx", FileType.DOCUMENT,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx");
        assertDetected(zip("[Content_Types].xml", "xl/workbook.xml"), "notes.xlsx", FileType.DOCUMENT,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx");
        assertDetected(OLE2, "cv.doc", FileType.DOCUMENT, "application/msword", "doc");
        assertDetected(OLE2, "notes.XLS", FileType.DOCUMENT, "application/vnd.ms-excel", "xls");
    }

    @Test
    void anOfficeDocumentIsRecognisedWhateverItsName() throws IOException {
        // Renommer un classeur en .docx ne change pas ce qu'il est
        assertDetected(zip("xl/workbook.xml"), "faux.docx", FileType.DOCUMENT,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx");
    }

    @Test
    void anOrdinaryZipArchiveIsRefused() throws IOException {
        assertRefused(new MockMultipartFile("file", "archive.docx", "application/zip", zip("programme.exe")),
                FileType.DOCUMENT, "Format de fichier non pris en charge");
    }

    @Test
    void anOle2FileThatIsNeitherDocNorXlsIsRefused() {
        assertRefused(new MockMultipartFile("file", "installeur.msi", "application/octet-stream", OLE2),
                FileType.DOCUMENT, "Format de fichier non pris en charge");
    }

    @Test
    void unknownContentIsRefusedEvenWithATrustedLookingNameAndType() {
        byte[] html = "<html><script>alert(1)</script></html>".getBytes(StandardCharsets.UTF_8);
        assertRefused(new MockMultipartFile("file", "photo.jpg", "image/jpeg", html), FileType.IMAGE,
                "Format de fichier non pris en charge");

        byte[] svg = "<svg xmlns=\"http://www.w3.org/2000/svg\"/>".getBytes(StandardCharsets.UTF_8);
        assertRefused(new MockMultipartFile("file", "logo.svg", "image/svg+xml", svg), FileType.IMAGE,
                "Format de fichier non pris en charge");
    }

    @Test
    void anEmptyFileIsRefused() {
        assertRefused(new MockMultipartFile("file", "vide.png", "image/png", new byte[0]), FileType.IMAGE,
                "Fichier vide");
    }

    @Test
    void aFileOverTheSizeLimitIsRefused() {
        byte[] big = new byte[(int) UploadValidator.MAX_SIZE + 1];
        System.arraycopy(PNG, 0, big, 0, PNG.length);
        assertRefused(new MockMultipartFile("file", "enorme.png", "image/png", big), FileType.IMAGE,
                "Fichier trop volumineux");
    }

    @Test
    void aTruncatedArchiveIsRefusedWithoutError() {
        assertRefused(new MockMultipartFile("file", "tronque.docx", "application/zip", bytes('P', 'K', 0x03, 0x04)),
                FileType.DOCUMENT, "Format de fichier non pris en charge");
    }

    private void assertDetected(byte[] content, String name, FileType expected, String mimeType, String extension)
            throws IOException {
        // Le Content-Type annoncé est volontairement faux : il ne doit jouer aucun rôle
        ValidatedFile valid = validator.validate(
                new MockMultipartFile("file", name, "application/octet-stream", content), expected);

        assertThat(valid.mimeType()).isEqualTo(mimeType);
        assertThat(valid.extension()).isEqualTo(extension);
        assertThat(valid.content()).isEqualTo(content);
    }

    private void assertRefused(MockMultipartFile file, FileType expected, String message) {
        assertThatThrownBy(() -> validator.validate(file, expected))
                .isInstanceOf(InvalidUploadException.class)
                .hasMessageContaining(message);
    }

    private static byte[] bytes(int... values) {
        byte[] result = new byte[values.length];
        for (int i = 0; i < values.length; i++) {
            result[i] = (byte) values[i];
        }
        return result;
    }

    private static byte[] zip(String... entryNames) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(out)) {
            for (String name : entryNames) {
                zip.putNextEntry(new ZipEntry(name));
                zip.write("contenu".getBytes(StandardCharsets.UTF_8));
                zip.closeEntry();
            }
        }
        return out.toByteArray();
    }
}
