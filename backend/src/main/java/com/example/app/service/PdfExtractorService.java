package com.example.app.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class PdfExtractorService {

    private static final Logger log = LoggerFactory.getLogger(PdfExtractorService.class);

    /**
     * Extracts text from an uploaded file (PDF, TXT, or fallback).
     */
    public String extractText(Path filePath) {
        if (filePath == null || !Files.exists(filePath)) {
            return "";
        }

        String fileName = filePath.getFileName().toString().toLowerCase();

        if (fileName.endsWith(".pdf")) {
            return extractTextFromPdf(filePath.toFile());
        } else if (fileName.endsWith(".txt") || fileName.endsWith(".md") || fileName.endsWith(".csv")) {
            try {
                return Files.readString(filePath, StandardCharsets.UTF_8);
            } catch (IOException e) {
                log.error("Failed to read text file: {}", filePath, e);
                return "";
            }
        }

        // Fallback: attempt PDF extraction anyway if content might be PDF
        return extractTextFromPdf(filePath.toFile());
    }

    private String extractTextFromPdf(File file) {
        try (PDDocument document = Loader.loadPDF(file)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String text = stripper.getText(document);
            return text != null ? text.trim() : "";
        } catch (Exception e) {
            log.warn("Could not extract PDF text from {}: {}", file.getName(), e.getMessage());
            return "";
        }
    }
}
