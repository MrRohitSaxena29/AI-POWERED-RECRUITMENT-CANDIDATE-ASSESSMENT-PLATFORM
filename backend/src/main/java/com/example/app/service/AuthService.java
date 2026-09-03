package com.example.app.service;

import com.example.app.dto.LoginRequest;
import com.example.app.dto.LoginResponse;
import com.example.app.dto.RegisterRequest;
import com.example.app.dto.UserResponse;
import com.example.app.model.User;
import com.example.app.model.Candidate;
import com.example.app.model.Recruiter;
import com.example.app.repository.CandidateRepository;
import com.example.app.repository.RecruiterRepository;
import com.example.app.repository.UserRepository;
import com.example.app.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final CandidateRepository candidateRepository;
    private final RecruiterRepository recruiterRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UserRepository userRepository,
            CandidateRepository candidateRepository,
            RecruiterRepository recruiterRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager
    ) {
        this.userRepository = userRepository;
        this.candidateRepository = candidateRepository;
        this.recruiterRepository = recruiterRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        String displayName = user.getName();
        String token = jwtService.generateToken(user.getEmail(), user.getRole(), displayName, user.getId());

        return new LoginResponse(user.getId(), displayName, user.getEmail(), user.getRole(), token);
    }

    @Transactional
    public LoginResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());
        }

        String normalizedRole = request.getRole().toLowerCase().trim();
        if (!normalizedRole.equals("candidate") && !normalizedRole.equals("recruiter") && !normalizedRole.equals("admin")) {
            normalizedRole = "candidate";
        }

        User user = new User(
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                normalizedRole
        );

        User savedUser = userRepository.save(user);

        if ("candidate".equals(normalizedRole)) {
            Candidate candidate = new Candidate(savedUser, request.getName(), null);
            candidateRepository.save(candidate);
            savedUser.setCandidate(candidate);
        } else if ("recruiter".equals(normalizedRole)) {
            Recruiter recruiter = new Recruiter(savedUser, null, request.getName(), null);
            recruiterRepository.save(recruiter);
            savedUser.setRecruiter(recruiter);
        }

        String displayName = savedUser.getName();
        String token = jwtService.generateToken(savedUser.getEmail(), savedUser.getRole(), displayName, savedUser.getId());

        return new LoginResponse(savedUser.getId(), displayName, savedUser.getEmail(), savedUser.getRole(), token);
    }

    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
        return UserResponse.fromUser(user);
    }
}
