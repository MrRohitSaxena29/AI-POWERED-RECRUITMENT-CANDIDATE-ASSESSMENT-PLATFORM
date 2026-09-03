package com.example.app.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path storageDirectory;

    public FileStorageService() {
        this.storageDirectory = Paths.get("uploads", "resumes").toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.storageDirectory);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create directory for uploaded resumes.", ex);
        }
    }

    public String storeFile(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String storedFileName = UUID.randomUUID() + extension;
        try {
            Path targetLocation = this.storageDirectory.resolve(storedFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return storedFileName;
        } catch (IOException ex) {
            throw new RuntimeException("Failed to store file " + storedFileName, ex);
        }
    }

    public Path loadFile(String fileName) {
        return this.storageDirectory.resolve(fileName).normalize();
    }
}
