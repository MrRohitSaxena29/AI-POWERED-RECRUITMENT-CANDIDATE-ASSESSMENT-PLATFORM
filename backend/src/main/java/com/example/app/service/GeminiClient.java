package com.example.app.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class GeminiClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiClient.class);

    private final String apiKey;
    private final String model;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public GeminiClient(
            @Value("${gemini.api.key:}") String apiKey,
            @Value("${gemini.model:gemini-2.5-flash}") String model,
            ObjectMapper objectMapper
    ) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.model = (model != null && !model.isBlank()) ? model.trim() : "gemini-2.5-flash";
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    public boolean isConfigured() {
        return !apiKey.isBlank();
    }

    /**
     * Sends a prompt to Gemini asking for JSON structured output.
     * Returns the raw text response (usually JSON string) or null on failure.
     */
    public String generateJson(String prompt) {
        if (!isConfigured()) {
            log.debug("Gemini API key is not configured. Skipping external LLM call.");
            return null;
        }

        try {
            String url = String.format(
                    "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                    model, apiKey
            );

            Map<String, Object> part = Map.of("text", prompt);
            Map<String, Object> content = Map.of("parts", List.of(part));
            Map<String, Object> generationConfig = Map.of(
                    "temperature", 0.2,
                    "responseMimeType", "application/json"
            );

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", List.of(content));
            requestBody.put("generationConfig", generationConfig);

            String requestJson = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode candidates = root.path("candidates");
                if (candidates.isArray() && !candidates.isEmpty()) {
                    JsonNode textNode = candidates.get(0)
                            .path("content")
                            .path("parts")
                            .get(0)
                            .path("text");
                    if (!textNode.isMissingNode()) {
                        return textNode.asText();
                    }
                }
                log.warn("Gemini response did not contain candidates text: {}", response.body());
                return null;
            } else {
                log.warn("Gemini API returned HTTP {}: {}", response.statusCode(), response.body());
                return null;
            }
        } catch (Exception e) {
            log.warn("Error calling Gemini API: {}", e.getMessage());
            return null;
        }
    }
}
