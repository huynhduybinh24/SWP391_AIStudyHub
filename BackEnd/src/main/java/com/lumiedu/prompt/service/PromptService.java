package com.lumiedu.prompt.service;

import com.lumiedu.prompt.dto.request.CreatePromptRequest;
import com.lumiedu.prompt.dto.request.UpdatePromptRequest;
import com.lumiedu.prompt.dto.response.PromptResponse;
import com.lumiedu.user.entity.User;

import java.util.List;

public interface PromptService {
    List<PromptResponse> getAllPrompts();
    PromptResponse getPromptById(Long id);
    PromptResponse getPromptByCode(String code);
    PromptResponse createPrompt(CreatePromptRequest request, User currentUser);
    PromptResponse updatePrompt(Long id, UpdatePromptRequest request, User currentUser);
    PromptResponse togglePromptStatus(Long id, User currentUser);
}
