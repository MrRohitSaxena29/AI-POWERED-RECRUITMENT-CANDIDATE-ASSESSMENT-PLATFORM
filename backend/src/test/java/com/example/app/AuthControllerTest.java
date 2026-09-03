package com.example.app;

import com.example.app.dto.LoginRequest;
import com.example.app.dto.RegisterRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testSeededAdminLoginSuccess() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin@recruitment.com", "admin123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("admin"))
                .andExpect(jsonPath("$.email").value("admin@recruitment.com"))
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void testLoginInvalidCredentials() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin@recruitment.com", "wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testRegisterNewCandidate() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(
                "Alex Developer",
                "alex." + System.currentTimeMillis() + "@example.com",
                "password123",
                "candidate"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("candidate"))
                .andExpect(jsonPath("$.token").isNotEmpty());
    }
}
