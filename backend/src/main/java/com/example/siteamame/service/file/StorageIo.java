package com.example.siteamame.service.file;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * Lecture d'un fichier entier en mémoire, par petits blocs.
 *
 * Lire plusieurs Mo d'un seul appel coûte bien plus que le tableau obtenu : la JVM passe alors
 * par un tampon natif de la taille demandée, qu'elle garde ensuite en réserve pour chaque thread
 * (Files.readAllBytes), ou par une allocation native de cette taille (FileInputStream). Avec des
 * fichiers de 10 Mo et une dizaine de threads, ce sont des dizaines de Mo hors du tas, invisibles
 * dans les mesures de la JVM, dans un conteneur limité à 512 Mo. Par blocs de 8 Ko, rien de tout cela.
 */
final class StorageIo {

    private static final int CHUNK = 8192;

    private StorageIo() {}

    /** Lit exactement {@code size} octets ; échoue si le flux en contient moins ou davantage. */
    static byte[] readExactly(InputStream in, long size) throws IOException {
        if (size < 0 || size > Integer.MAX_VALUE - 8) {
            throw new IOException("Taille de fichier invalide : " + size);
        }
        byte[] bytes = new byte[(int) size];
        int offset = 0;
        while (offset < bytes.length) {
            int read = in.read(bytes, offset, Math.min(CHUNK, bytes.length - offset));
            if (read < 0) break;
            offset += read;
        }
        if (offset != bytes.length || in.read() != -1) {
            throw new IOException("Taille du fichier incohérente avec son contenu");
        }
        return bytes;
    }

    /** Lit le flux entier, de taille inconnue d'avance ; échoue au-delà de {@code max} octets. */
    static byte[] readAtMost(InputStream in, long max) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] chunk = new byte[CHUNK];
        long total = 0;
        int read;
        while ((read = in.read(chunk)) != -1) {
            total += read;
            if (total > max) {
                throw new IOException("Fichier plus volumineux que " + max + " octets");
            }
            out.write(chunk, 0, read);
        }
        return out.toByteArray();
    }
}
