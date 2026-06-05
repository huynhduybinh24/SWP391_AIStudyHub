package com.lumiedu.ai.service.impl;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.lumiedu.ai.entity.*;
import com.lumiedu.ai.repository.*;
import com.lumiedu.ai.service.AiAssistantService;
import com.lumiedu.ai.service.AiLimitService;
import com.lumiedu.ai.service.DocumentChunkingService;
import com.lumiedu.ai.service.OpenAiService;
import com.lumiedu.ai.service.OpenAiService.ChatMessageDto;
import com.lumiedu.ai.service.OpenAiService.OpenAiResponse;
import com.lumiedu.document.entity.Document;
import com.lumiedu.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class AiAssistantServiceImpl implements AiAssistantService {

    private final AiSummaryRepository aiSummaryRepository;
    private final AiChatSessionRepository aiChatSessionRepository;
    private final AiChatMessageRepository aiChatMessageRepository;
    private final FlashcardRepository flashcardRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final DocumentRepository documentRepository;

    private final DocumentChunkRepository documentChunkRepository;
    private final AiUsageLogRepository aiUsageLogRepository;
    private final StudyPlanRepository studyPlanRepository;

    private final OpenAiService openAiService;
    private final DocumentChunkingService documentChunkingService;
    private final AiLimitService aiLimitService;

    private final Gson gson = new Gson();

    @Override
    public AiSummary generateSummary(Long documentId, String language) {
        String lang = (language == null || language.trim().isEmpty()) ? "vi" : language.trim();

        // 1. Check cache
        Optional<AiSummary> existing = aiSummaryRepository.findByDocumentIdAndLanguage(documentId, lang);
        if (existing.isPresent()) {
            return existing.get();
        }

        Document doc = documentRepository.findById(documentId).orElse(null);
        if (doc == null) {
            throw new IllegalArgumentException("Document not found.");
        }

        // 2. Ensure chunks exist
        List<DocumentChunk> chunks = documentChunkRepository.findByDocumentId(documentId);
        if (chunks.isEmpty()) {
            documentChunkingService.chunkAndIndexDocument(documentId);
            chunks = documentChunkRepository.findByDocumentId(documentId);
        }

        // 3. Build summary context from first few chunks
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(chunks.size(), 3); i++) {
            sb.append(chunks.get(i).getContent()).append("\n");
        }
        String context = sb.toString();

        // 4. Construct prompt
        List<ChatMessageDto> messages = new ArrayList<>();
        messages.add(ChatMessageDto.builder()
                .role("system")
                .content("You are a helpful educational AI assistant. Summarize the user's document in the requested language: " + lang + ". "
                        + "You must respond with a JSON object containing exactly two fields: "
                        + "'summaryText' (a paragraph summary of the document) and "
                        + "'summaryBullets' (a JSON array of key bullet points, max 5 bullets).")
                .build());
        messages.add(ChatMessageDto.builder()
                .role("user")
                .content("Document Subject: " + doc.getSubject() + "\nDocument Title: " + doc.getTitle() + "\n\nContent:\n" + context)
                .build());

        // 5. Call OpenAI
        OpenAiResponse response = openAiService.chat(messages, true);

        // 6. Log usage
        Long userId = doc.getUserId() != null ? doc.getUserId() : 1L;
        saveUsageLog(userId, "SUMMARY", response);

        // 7. Parse response
        String summaryText = "";
        String summaryBulletsJson = "";
        try {
            JsonObject jsonObj = gson.fromJson(response.getContent(), JsonObject.class);
            summaryText = jsonObj.get("summaryText").getAsString();
            JsonElement bulletsElem = jsonObj.get("summaryBullets");
            if (bulletsElem.isJsonArray()) {
                summaryBulletsJson = gson.toJson(bulletsElem.getAsJsonArray());
            } else {
                summaryBulletsJson = bulletsElem.getAsString();
            }
        } catch (Exception e) {
            System.err.println("Failed to parse summary JSON response: " + e.getMessage());
            // Fallback
            summaryText = response.getContent();
            summaryBulletsJson = gson.toJson(Arrays.asList("Tổng quan kiến thức cốt lõi.", "Chi tiết phương pháp và bài học."));
        }

        AiSummary summary = AiSummary.builder()
                .documentId(documentId)
                .language(lang)
                .summaryText(summaryText)
                .summaryBullets(summaryBulletsJson)
                .build();

        return aiSummaryRepository.save(summary);
    }

    @Override
    public AiSummary getSummary(Long documentId, String language) {
        String lang = (language == null || language.trim().isEmpty()) ? "vi" : language.trim();
        return aiSummaryRepository.findByDocumentIdAndLanguage(documentId, lang)
                .orElseGet(() -> generateSummary(documentId, lang));
    }

    @Override
    public AiChatSession createOrGetChatSession(Long documentId, Long userId) {
        List<AiChatSession> sessions = aiChatSessionRepository.findByDocumentIdAndUserId(documentId, userId);
        if (!sessions.isEmpty()) {
            return sessions.get(0);
        }
        
        String title = "Thảo luận tài liệu";
        if (documentId != null) {
            Document doc = documentRepository.findById(documentId).orElse(null);
            if (doc != null) {
                title = doc.getTitle();
            }
        }
        AiChatSession session = AiChatSession.builder()
                .documentId(documentId)
                .userId(userId)
                .title(title)
                .build();
        return aiChatSessionRepository.save(session);
    }

    @Override
    public List<AiChatMessage> getChatHistory(Long sessionId) {
        return aiChatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
    }

    @Override
    public AiChatMessage sendMessage(Long sessionId, String messageText, boolean thinkingMode) {
        AiChatSession session = aiChatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Chat session not found."));

        // 1. Check billing limit
        if (!aiLimitService.isWithinDailyLimit(session.getUserId(), "CHAT")) {
            throw new RuntimeException("Bạn đã vượt quá hạn mức sử dụng AI Chat hàng ngày của gói dịch vụ hiện tại.");
        }

        // Save User Message
        AiChatMessage userMessage = AiChatMessage.builder()
                .sessionId(sessionId)
                .sender("USER")
                .messageText(messageText)
                .build();
        aiChatMessageRepository.save(userMessage);

        // 2. Perform simple RAG search if session is bound to a document
        String ragContext = "";
        if (session.getDocumentId() != null) {
            ragContext = performRagSearch(session.getDocumentId(), messageText);
        }

        // 3. Gather chat history (last 10 messages)
        List<AiChatMessage> history = aiChatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
        if (history.size() > 10) {
            history = history.subList(history.size() - 10, history.size());
        }

        // 4. Construct messages for OpenAI
        List<ChatMessageDto> promptMsgs = new ArrayList<>();
        String systemInstruction = "You are a friendly AI study assistant. Help the student understand their materials. ";
        if (thinkingMode) {
            systemInstruction += "You must think step-by-step and write down your reasoning/thought process inside a <thought>...</thought> tag FIRST, and then write the response for the user.";
        }
        if (!ragContext.isEmpty()) {
            systemInstruction += "\n\nHere is relevant context extracted from the document to help you answer:\n" + ragContext;
        }

        promptMsgs.add(ChatMessageDto.builder().role("system").content(systemInstruction).build());

        for (AiChatMessage msg : history) {
            String role = "USER".equalsIgnoreCase(msg.getSender()) ? "user" : "assistant";
            String content = msg.getMessageText();
            if ("assistant".equals(role) && msg.getThought() != null && !msg.getThought().trim().isEmpty()) {
                content = "<thought>\n" + msg.getThought() + "\n</thought>\n" + content;
            }
            promptMsgs.add(ChatMessageDto.builder().role(role).content(content).build());
        }

        // 5. Call OpenAI
        OpenAiResponse response = openAiService.chat(promptMsgs, false);

        // 6. Log usage
        saveUsageLog(session.getUserId(), "CHAT", response);

        // 7. Save and return AI Message
        AiChatMessage aiMessage = AiChatMessage.builder()
                .sessionId(sessionId)
                .sender("AI")
                .messageText(response.getContent())
                .thought(response.getThought())
                .build();

        return aiChatMessageRepository.save(aiMessage);
    }

    @Override
    public List<Flashcard> generateFlashcards(Long documentId) {
        flashcardRepository.deleteByDocumentId(documentId);

        Document doc = documentRepository.findById(documentId).orElse(null);
        if (doc == null) {
            throw new IllegalArgumentException("Document not found.");
        }

        List<DocumentChunk> chunks = documentChunkRepository.findByDocumentId(documentId);
        if (chunks.isEmpty()) {
            documentChunkingService.chunkAndIndexDocument(documentId);
            chunks = documentChunkRepository.findByDocumentId(documentId);
        }

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(chunks.size(), 3); i++) {
            sb.append(chunks.get(i).getContent()).append("\n");
        }
        String context = sb.toString();

        List<ChatMessageDto> messages = new ArrayList<>();
        messages.add(ChatMessageDto.builder()
                .role("system")
                .content("You are an educational AI assistant. Create 5 useful study flashcards based on the document text. "
                        + "You must respond with a JSON object containing a 'flashcards' array. "
                        + "Each flashcard must have two fields: 'front' (question or term) and 'back' (definition or explanation).")
                .build());
        messages.add(ChatMessageDto.builder()
                .role("user")
                .content("Create flashcards based on this text:\n\n" + context)
                .build());

        OpenAiResponse response = openAiService.chat(messages, true);
        saveUsageLog(doc.getUserId() != null ? doc.getUserId() : 1L, "FLASHCARD", response);

        List<Flashcard> list = new ArrayList<>();
        try {
            JsonObject jsonObj = gson.fromJson(response.getContent(), JsonObject.class);
            JsonArray arr = jsonObj.getAsJsonArray("flashcards");
            for (int i = 0; i < arr.size(); i++) {
                JsonObject item = arr.get(i).getAsJsonObject();
                list.add(Flashcard.builder()
                        .documentId(documentId)
                        .question(item.get("front").getAsString())
                        .answer(item.get("back").getAsString())
                        .build());
            }
        } catch (Exception e) {
            System.err.println("Failed to parse flashcards JSON response: " + e.getMessage());
            list.add(new Flashcard(null, documentId, "Mẫu thiết kế Singleton dùng để làm gì?", "Đảm bảo một lớp chỉ có duy nhất một thực thể."));
            list.add(new Flashcard(null, documentId, "Mẫu thiết kế Observer hoạt động theo cơ chế nào?", "Mối quan hệ phụ thuộc một-nhiều giữa các đối tượng."));
        }

        return flashcardRepository.saveAll(list);
    }

    @Override
    public List<QuizQuestion> generateQuiz(Long documentId, String difficulty, int count, String customPrompt) {
        Document doc = documentRepository.findById(documentId).orElse(null);
        if (doc == null) {
            throw new IllegalArgumentException("Document not found.");
        }

        Long userId = doc.getUserId() != null ? doc.getUserId() : 1L;
        // 1. Check billing limit
        if (!aiLimitService.isWithinDailyLimit(userId, "QUIZ")) {
            throw new RuntimeException("Bạn đã vượt quá hạn mức sử dụng AI Quiz hàng ngày của gói dịch vụ hiện tại.");
        }

        // Delete existing quiz
        quizQuestionRepository.deleteByDocumentId(documentId);

        List<DocumentChunk> chunks = documentChunkRepository.findByDocumentId(documentId);
        if (chunks.isEmpty()) {
            documentChunkingService.chunkAndIndexDocument(documentId);
            chunks = documentChunkRepository.findByDocumentId(documentId);
        }

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(chunks.size(), 4); i++) {
            sb.append(chunks.get(i).getContent()).append("\n");
        }
        String context = sb.toString();

        List<ChatMessageDto> messages = new ArrayList<>();
        messages.add(ChatMessageDto.builder()
                .role("system")
                .content("You are an educational AI assistant. Create a quiz with exactly " + count + " multiple choice questions based on the document. "
                        + "The difficulty level should be: " + difficulty + ". "
                        + "Custom request: " + customPrompt + ". "
                        + "You must respond with a JSON object containing a 'questions' array. "
                        + "Each question must contain: "
                        + "'q' (question string), "
                        + "'options' (JSON array of 4 option strings), "
                        + "'answer' (index of the correct option: 0, 1, 2, or 3), "
                        + "'explain' (detailed explanation string).")
                .build());
        messages.add(ChatMessageDto.builder()
                .role("user")
                .content("Create quiz for this document text:\n\n" + context)
                .build());

        OpenAiResponse response = openAiService.chat(messages, true);
        saveUsageLog(userId, "QUIZ", response);

        List<QuizQuestion> questions = new ArrayList<>();
        try {
            JsonObject jsonObj = gson.fromJson(response.getContent(), JsonObject.class);
            JsonArray arr = jsonObj.getAsJsonArray("questions");
            for (int i = 0; i < arr.size(); i++) {
                JsonObject item = arr.get(i).getAsJsonObject();
                JsonArray optsArr = item.getAsJsonArray("options");
                List<String> options = new ArrayList<>();
                for (int j = 0; j < optsArr.size(); j++) {
                    options.add(optsArr.get(j).getAsString());
                }

                questions.add(QuizQuestion.builder()
                        .documentId(documentId)
                        .q(item.get("q").getAsString())
                        .options(gson.toJson(options))
                        .answer(item.get("answer").getAsInt())
                        .explain(item.get("explain").getAsString())
                        .build());
            }
        } catch (Exception e) {
            System.err.println("Failed to parse quiz JSON response: " + e.getMessage());
            // Fallback
            questions.add(QuizQuestion.builder()
                    .documentId(documentId)
                    .q("Câu hỏi trắc nghiệm ôn tập về " + doc.getSubject())
                    .options(gson.toJson(Arrays.asList("Đáp án A", "Đáp án B (Đúng)", "Đáp án C", "Đáp án D")))
                    .answer(1)
                    .explain("Đây là giải thích đáp án mẫu vì lỗi phân tích dữ liệu AI.")
                    .build());
        }

        return quizQuestionRepository.saveAll(questions);
    }

    @Override
    public List<QuizQuestion> modifyQuizWithAi(Long documentId, String prompt) {
        List<QuizQuestion> existing = quizQuestionRepository.findByDocumentId(documentId);
        if (existing.isEmpty()) {
            existing = generateQuiz(documentId, "medium", 5, "");
        }

        Document doc = documentRepository.findById(documentId).orElse(null);
        Long userId = doc != null ? doc.getUserId() : 1L;

        // Ask AI to modify the quiz questions based on the prompt
        String existingQuizJson = gson.toJson(existing);

        List<ChatMessageDto> messages = new ArrayList<>();
        messages.add(ChatMessageDto.builder()
                .role("system")
                .content("You are an educational AI assistant. Modify the following quiz questions based on the user's instructions. "
                        + "User instructions: " + prompt + ". "
                        + "You must respond with a JSON object containing a 'questions' array with the modified questions. "
                        + "Each question must contain: "
                        + "'q' (question string), "
                        + "'options' (JSON array of 4 option strings), "
                        + "'answer' (index of the correct option: 0, 1, 2, or 3), "
                        + "'explain' (explanation string).")
                .build());
        messages.add(ChatMessageDto.builder()
                .role("user")
                .content("Existing Quiz questions:\n\n" + existingQuizJson)
                .build());

        OpenAiResponse response = openAiService.chat(messages, true);
        saveUsageLog(userId, "QUIZ_MODIFY", response);

        List<QuizQuestion> modified = new ArrayList<>();
        try {
            JsonObject jsonObj = gson.fromJson(response.getContent(), JsonObject.class);
            JsonArray arr = jsonObj.getAsJsonArray("questions");
            for (int i = 0; i < arr.size(); i++) {
                JsonObject item = arr.get(i).getAsJsonObject();
                JsonArray optsArr = item.getAsJsonArray("options");
                List<String> options = new ArrayList<>();
                for (int j = 0; j < optsArr.size(); j++) {
                    options.add(optsArr.get(j).getAsString());
                }

                modified.add(QuizQuestion.builder()
                        .documentId(documentId)
                        .q(item.get("q").getAsString())
                        .options(gson.toJson(options))
                        .answer(item.get("answer").getAsInt())
                        .explain(item.get("explain").getAsString())
                        .build());
            }
        } catch (Exception e) {
            System.err.println("Failed to parse modified quiz JSON: " + e.getMessage());
            return existing;
        }

        quizQuestionRepository.deleteByDocumentId(documentId);
        return quizQuestionRepository.saveAll(modified);
    }

    @Override
    public List<QuizQuestion> getQuiz(Long documentId) {
        List<QuizQuestion> questions = quizQuestionRepository.findByDocumentId(documentId);
        if (questions.isEmpty()) {
            return generateQuiz(documentId, "medium", 5, "");
        }
        return questions;
    }

    @Override
    public StudyPlan generateStudyPlan(Long userId, String subject, String goal, int durationWeeks, Long documentId) {
        String docContext = "";
        if (documentId != null) {
            List<DocumentChunk> chunks = documentChunkRepository.findByDocumentId(documentId);
            if (chunks.isEmpty()) {
                documentChunkingService.chunkAndIndexDocument(documentId);
                chunks = documentChunkRepository.findByDocumentId(documentId);
            }
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < Math.min(chunks.size(), 3); i++) {
                sb.append(chunks.get(i).getContent()).append("\n");
            }
            docContext = sb.toString();
        }

        List<ChatMessageDto> messages = new ArrayList<>();
        messages.add(ChatMessageDto.builder()
                .role("system")
                .content("You are an expert academic counselor. Generate a structured week-by-week study plan roadmap in markdown. "
                        + "You must respond with a JSON object containing: "
                        + "'title' (a concise name for the plan), "
                        + "'subject' (the academic subject), "
                        + "'planText' (the markdown roadmap text, including weekly goals and active recall milestones).")
                .build());

        String userQuery = "Subject: " + subject + "\nGoal: " + goal + "\nDuration: " + durationWeeks + " weeks.";
        if (!docContext.isEmpty()) {
            userQuery += "\n\nReference Material:\n" + docContext;
        }
        messages.add(ChatMessageDto.builder().role("user").content(userQuery).build());

        OpenAiResponse response = openAiService.chat(messages, true);
        saveUsageLog(userId, "STUDY_PLAN", response);

        String title = "Kế hoạch học tập " + subject;
        String planText = response.getContent();

        try {
            JsonObject jsonObj = gson.fromJson(response.getContent(), JsonObject.class);
            title = jsonObj.get("title").getAsString();
            planText = jsonObj.get("planText").getAsString();
        } catch (Exception e) {
            System.err.println("Failed to parse study plan JSON: " + e.getMessage());
        }

        StudyPlan plan = StudyPlan.builder()
                .userId(userId)
                .title(title)
                .subject(subject)
                .planText(planText)
                .documentId(documentId)
                .build();

        return studyPlanRepository.save(plan);
    }

    @Override
    public List<StudyPlan> getStudyPlans(Long userId) {
        return studyPlanRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    // --- Helpers ---

    private void saveUsageLog(Long userId, String featureType, OpenAiResponse response) {
        try {
            AiUsageLog log = AiUsageLog.builder()
                    .userId(userId)
                    .featureType(featureType)
                    .model("gpt-4o-mini")
                    .promptTokens(response.getPromptTokens())
                    .completionTokens(response.getCompletionTokens())
                    .costEstimate(response.getCostEstimate() != null ? response.getCostEstimate() : BigDecimal.ZERO)
                    .usageDate(LocalDate.now())
                    .build();
            aiUsageLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("Failed to save AI Usage Log: " + e.getMessage());
        }
    }

    private String performRagSearch(Long documentId, String query) {
        List<DocumentChunk> chunks = documentChunkRepository.findByDocumentId(documentId);
        if (chunks.isEmpty()) {
            return "";
        }

        // Java keyword-matching scoring
        String[] keywords = query.toLowerCase().split("\\s+");
        DocumentChunk bestChunk = null;
        int maxScore = 0;

        for (DocumentChunk chunk : chunks) {
            int score = 0;
            String contentLower = chunk.getContent().toLowerCase();
            for (String kw : keywords) {
                if (kw.length() > 2 && contentLower.contains(kw)) {
                    score++;
                }
            }
            if (score > maxScore) {
                maxScore = score;
                bestChunk = chunk;
            }
        }

        // If no match found, use the first chunk as context
        if (bestChunk == null) {
            return chunks.get(0).getContent();
        }

        return bestChunk.getContent();
    }
}
