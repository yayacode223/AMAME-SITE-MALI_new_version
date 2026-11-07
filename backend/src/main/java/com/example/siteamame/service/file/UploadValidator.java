package com.example.siteamame.service.file;

import com.example.siteamame.enumeration.FileType;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

/**
 * Valide un fichier uploadé d'après son contenu (octets de signature), jamais d'après le
 * Content-Type ni l'extension annoncés par le client. Le type et l'extension enregistrés
 * sont ceux du format détecté.
 *
 * Formats acceptés : JPEG, PNG, GIF, WebP, PDF, DOCX, XLSX, DOC, XLS. Le SVG reste refusé
 * (il peut embarquer du script).
 */
@Component
public class UploadValidator {

    /** Même limite que spring.servlet.multipart.max-file-size. */
    static final long MAX_SIZE = 10L * 1024 * 1024;

    private static final String DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    private static final String XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    /** Au-delà, l'archive n'a rien d'un document Office : on arrête de chercher. */
    private static final int MAX_ZIP_ENTRIES = 2000;

    public ValidatedFile validate(MultipartFile file, FileType expected) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new InvalidUploadException("Fichier vide");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new InvalidUploadException("Fichier trop volumineux (10 Mo au maximum)");
        }
        byte[] bytes;
        // Un seul tableau, à la taille exacte, lu par petits blocs (voir StorageIo)
        try (InputStream in = file.getInputStream()) {
            bytes = StorageIo.readExactly(in, file.getSize());
        }
        Detected detected = detect(bytes, file.getOriginalFilename());
        if (detected == null) {
            throw new InvalidUploadException(
                    "Format de fichier non pris en charge (formats acceptés : JPEG, PNG, GIF, WebP, PDF, Word, Excel)");
        }
        if (expected == FileType.IMAGE && !detected.image()) {
            throw new InvalidUploadException("Une image est attendue (JPEG, PNG, GIF ou WebP)");
        }
        return new ValidatedFile(bytes, detected.mimeType(), detected.extension());
    }

    private record Detected(String mimeType, String extension, boolean image) {}

    private static Detected detect(byte[] b, String originalName) {
        if (starts(b, 0xFF, 0xD8, 0xFF)) return new Detected("image/jpeg", "jpg", true);
        if (starts(b, 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A)) return new Detected("image/png", "png", true);
        if (starts(b, 'G', 'I', 'F', '8', '7', 'a') || starts(b, 'G', 'I', 'F', '8', '9', 'a')) {
            return new Detected("image/gif", "gif", true);
        }
        if (starts(b, 'R', 'I', 'F', 'F') && matches(b, 8, 'W', 'E', 'B', 'P')) {
            return new Detected("image/webp", "webp", true);
        }
        if (starts(b, '%', 'P', 'D', 'F', '-')) return new Detected("application/pdf", "pdf", false);
        if (starts(b, 'P', 'K', 0x03, 0x04)) return detectOfficeOpenXml(b);
        if (starts(b, 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1)) return detectLegacyOffice(originalName);
        return null;
    }

    /**
     * DOCX et XLSX sont des archives ZIP : on les distingue par leur document principal, lu dans
     * le répertoire central de l'archive (noms seulement, rien n'est décompressé). Une archive
     * ZIP quelconque est refusée.
     */
    private static Detected detectOfficeOpenXml(byte[] b) {
        int eocd = lastIndexOf(b, 'P', 'K', 0x05, 0x06);
        if (eocd < 0 || eocd + 22 > b.length) return null;
        int entries = u16(b, eocd + 10);
        int offset = (int) u32(b, eocd + 16);
        for (int i = 0; i < Math.min(entries, MAX_ZIP_ENTRIES); i++) {
            if (offset < 0 || offset + 46 > b.length || !matches(b, offset, 'P', 'K', 0x01, 0x02)) return null;
            int nameLength = u16(b, offset + 28);
            int next = offset + 46 + nameLength + u16(b, offset + 30) + u16(b, offset + 32);
            if (offset + 46 + nameLength > b.length) return null;
            String name = new String(b, offset + 46, nameLength, StandardCharsets.UTF_8);
            if (name.equals("word/document.xml")) return new Detected(DOCX, "docx", false);
            if (name.equals("xl/workbook.xml")) return new Detected(XLSX, "xlsx", false);
            offset = next;
        }
        return null;
    }

    /**
     * DOC et XLS partagent la même signature (conteneur OLE2) : seule l'extension d'origine les
     * distingue. Tout autre fichier OLE2 (installeur, message…) est refusé.
     */
    private static Detected detectLegacyOffice(String originalName) {
        String name = originalName == null ? "" : originalName.toLowerCase(Locale.ROOT);
        if (name.endsWith(".doc")) return new Detected("application/msword", "doc", false);
        if (name.endsWith(".xls")) return new Detected("application/vnd.ms-excel", "xls", false);
        return null;
    }

    private static boolean starts(byte[] b, int... signature) {
        return matches(b, 0, signature);
    }

    private static boolean matches(byte[] b, int offset, int... signature) {
        if (offset < 0 || b.length < offset + signature.length) return false;
        for (int i = 0; i < signature.length; i++) {
            if ((b[offset + i] & 0xFF) != signature[i]) return false;
        }
        return true;
    }

    private static int lastIndexOf(byte[] b, int... signature) {
        for (int i = b.length - signature.length; i >= 0; i--) {
            if (matches(b, i, signature)) return i;
        }
        return -1;
    }

    private static int u16(byte[] b, int offset) {
        return (b[offset] & 0xFF) | (b[offset + 1] & 0xFF) << 8;
    }

    private static long u32(byte[] b, int offset) {
        return (b[offset] & 0xFFL) | (b[offset + 1] & 0xFFL) << 8
                | (b[offset + 2] & 0xFFL) << 16 | (b[offset + 3] & 0xFFL) << 24;
    }
}
